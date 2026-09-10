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

    const signaturesData =
      await signaturesResponse.json();

    if (signaturesData.error) {
      throw new Error(
        signaturesData.error.message ||
        "Solana RPC error"
      );
    }

    const signatures =
      signaturesData.result || [];

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

      const txData =
        await txResponse.json();

      const tx = txData.result;

      if (!tx?.meta || !tx?.transaction) {
        continue;
      }

      // --------------------------------------------------
      // 3. トランザクションの署名者を取得
      // --------------------------------------------------

      const accountKeys =
        tx.transaction.message.accountKeys || [];

      let signerIndex = -1;
      let buyer = "";

      for (let i = 0; i < accountKeys.length; i++) {
        const key = accountKeys[i];

        const address =
          typeof key === "string"
            ? key
            : key.pubkey;

        const isSigner =
          typeof key === "object"
            ? key.signer === true
            : false;

        if (isSigner && signerIndex === -1) {
          signerIndex = i;
          buyer = address;
        }
      }

      if (signerIndex < 0 || !buyer) {
        continue;
      }

      // --------------------------------------------------
      // 4. 署名者のMOJ残高変化だけを見る
      // --------------------------------------------------

      const preTokenBalances =
        tx.meta.preTokenBalances || [];

      const postTokenBalances =
        tx.meta.postTokenBalances || [];

      let preMoj = 0;
      let postMoj = 0;

      for (const balance of preTokenBalances) {
        if (balance.mint !== mint) continue;
        if (balance.owner !== buyer) continue;

        preMoj += Number(
          balance.uiTokenAmount?.uiAmountString || 0
        );
      }

      for (const balance of postTokenBalances) {
        if (balance.mint !== mint) continue;
        if (balance.owner !== buyer) continue;

        postMoj += Number(
          balance.uiTokenAmount?.uiAmountString || 0
        );
      }

      const got = postMoj - preMoj;

      // MOJが増えていない場合はBuyではない
      if (got <= 0) {
        continue;
      }

      // --------------------------------------------------
      // 5. 署名者のSOL残高変化
      // --------------------------------------------------

      const preSolBalances =
        tx.meta.preBalances || [];

      const postSolBalances =
        tx.meta.postBalances || [];

      if (
        preSolBalances[signerIndex] === undefined ||
        postSolBalances[signerIndex] === undefined
      ) {
        continue;
      }

      const solDelta =
        preSolBalances[signerIndex] -
        postSolBalances[signerIndex];

      const spentSol =
        solDelta / 1_000_000_000;

      // SOLを十分に支払っていない場合はBuyではない
      if (spentSol < 0.0005) {
        continue;
      }

      // --------------------------------------------------
      // 6. 新規Holder判定
      // --------------------------------------------------

      const newHolder =
        preMoj <= 0 && postMoj > 0;

      // --------------------------------------------------
      // 7. Buyとして追加
      // --------------------------------------------------

      buys.push({
        signature: sigInfo.signature,
        slot: sigInfo.slot,
        blockTime: sigInfo.blockTime,
        buyer,
        got,
        spentSol,
        newHolder
      });
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
    console.error(
      "Buy monitor error:",
      error
    );

    return res.status(500).json({
      ok: false,
      error: "Buy monitor error"
    });
  }
}
