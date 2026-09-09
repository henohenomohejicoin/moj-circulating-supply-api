export default async function handler(req, res) {
  const mint =
    "5EcYAi9ETKWMw5F5GuocR2ZBqfN4tGUv4LCdZZVJpump";

  const rpc =
    process.env.SOLANA_RPC_URL ||
    "https://api.mainnet-beta.solana.com";

  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "GET only"
    });
  }

  try {
    // --------------------------------------------------
    // 1. 最新トランザクション取得
    // --------------------------------------------------

    const signaturesResponse = await fetch(rpc, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getSignaturesForAddress",
        params: [
          mint,
          {
            limit: 100,
            commitment: "confirmed"
          }
        ]
      })
    });

    const signaturesData = await signaturesResponse.json();

    if (signaturesData.error) {
      throw new Error(
        signaturesData.error.message || "Solana RPC error"
      );
    }

    const signatures = signaturesData.result || [];

    const buys = [];

    // --------------------------------------------------
    // 2. 各トランザクションを解析
    // --------------------------------------------------

    for (const sigInfo of signatures) {
      if (!sigInfo.signature) continue;
      if (sigInfo.err) continue;

      const txResponse = await fetch(rpc, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getTransaction",
          params: [
            sigInfo.signature,
            {
              encoding: "jsonParsed",
              commitment: "confirmed",
              maxSupportedTransactionVersion: 0
            }
          ]
        })
      });

      const txData = await txResponse.json();
      const tx = txData.result;

      if (!tx?.meta || !tx?.transaction) continue;

      // --------------------------------------------------
      // 3. MOJ残高の変化を確認
      // --------------------------------------------------

      const preTokenBalances =
        tx.meta.preTokenBalances || [];

      const postTokenBalances =
        tx.meta.postTokenBalances || [];

      const owners = new Map();

      // Before
      for (const balance of preTokenBalances) {
        if (balance.mint !== mint) continue;

        const owner =
          balance.owner ||
          `account-${balance.accountIndex}`;

        const amount =
          Number(
            balance.uiTokenAmount?.uiAmountString || 0
          );

        owners.set(owner, {
          pre: amount,
          post: 0,
          accountIndex: balance.accountIndex
        });
      }

      // After
      for (const balance of postTokenBalances) {
        if (balance.mint !== mint) continue;

        const owner =
          balance.owner ||
          `account-${balance.accountIndex}`;

        const amount =
          Number(
            balance.uiTokenAmount?.uiAmountString || 0
          );

        const current =
          owners.get(owner) || {
            pre: 0,
            post: 0,
            accountIndex: balance.accountIndex
          };

        current.post = amount;

        owners.set(owner, current);
      }

      // --------------------------------------------------
      // 4. SOL残高を確認
      // --------------------------------------------------

      const accountKeys =
        tx.transaction.message.accountKeys || [];

      const preSolBalances =
        tx.meta.preBalances || [];

      const postSolBalances =
        tx.meta.postBalances || [];

      // --------------------------------------------------
      // 5. MOJ増加 + SOL減少を探す
      // --------------------------------------------------

      for (const [owner, data] of owners.entries()) {
        const got = data.post - data.pre;

        if (got <= 0) continue;

        // Buyer候補のaccount indexを探す
        let buyerIndex = -1;

        for (let i = 0; i < accountKeys.length; i++) {
          const key = accountKeys[i];

          const address =
            typeof key === "string"
              ? key
              : key.pubkey;

          if (address === owner) {
            buyerIndex = i;
            break;
          }
        }

        // ------------------------------------------------
        // BuyerのSOL変化
        // ------------------------------------------------

        let spentSol = 0;

        if (
          buyerIndex >= 0 &&
          preSolBalances[buyerIndex] !== undefined &&
          postSolBalances[buyerIndex] !== undefined
        ) {
          const solDelta =
            preSolBalances[buyerIndex] -
            postSolBalances[buyerIndex];

          spentSol = solDelta / 1_000_000_000;
        }

        // ------------------------------------------------
        // SOLを実際に支払っているか
        //
        // 手数料だけの減少をBuyと誤認しないため
        // 0.0005 SOL以上を支払い条件にする
        // ------------------------------------------------

        if (spentSol < 0.0005) {
          continue;
        }

        // ------------------------------------------------
        // 新規Holder判定
        // ------------------------------------------------

        const newHolder = data.pre <= 0;

        buys.push({
          signature: sigInfo.signature,
          slot: sigInfo.slot,
          blockTime: sigInfo.blockTime,
          buyer: owner,
          got,
          spentSol,
          newHolder
        });
      }
    }

    // --------------------------------------------------
    // 結果
    // --------------------------------------------------

    return res.status(200).json({
      ok: true,
      mint,
      checked: signatures.length,
      buys
    });

  } catch (error) {
    console.error("Buy monitor error:", error);

    return res.status(500).json({
      ok: false,
      error: "Buy monitor error"
    });
  }
}
