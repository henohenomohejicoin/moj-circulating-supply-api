export default async function handler(req, res) {
  const mint =
    "5EcYAi9ETKWMw5F5GuocR2ZBqfN4tGUv4LCdZZVJpump";

  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "GET only"
    });
  }

  try {
    // --------------------------------------------------
    // 1. 最新のSolanaトランザクションを取得
    // --------------------------------------------------

    const signaturesResponse = await fetch(
      "https://api.mainnet-beta.solana.com",
      {
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
              limit: 10,
              commitment: "confirmed"
            }
          ]
        })
      }
    );

    const signaturesData = await signaturesResponse.json();

    const signatures = signaturesData.result || [];

    // --------------------------------------------------
    // 2. 各トランザクションを解析
    // --------------------------------------------------

    const buys = [];

    for (const sigInfo of signatures) {
      if (!sigInfo.signature) continue;
      if (sigInfo.err) continue;

      const txResponse = await fetch(
        "https://api.mainnet-beta.solana.com",
        {
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
        }
      );

      const txData = await txResponse.json();
      const tx = txData.result;

      if (!tx?.meta) continue;

      const preBalances = tx.meta.preTokenBalances || [];
      const postBalances = tx.meta.postTokenBalances || [];

      // --------------------------------------------------
      // MOJの残高増加を探す
      // --------------------------------------------------

      const owners = new Map();

      for (const balance of preBalances) {
        if (balance.mint !== mint) continue;

        const owner =
          balance.owner ||
          `account-${balance.accountIndex}`;

        owners.set(owner, {
          pre: Number(balance.uiTokenAmount?.uiAmount || 0),
          post: 0,
          accountIndex: balance.accountIndex
        });
      }

      for (const balance of postBalances) {
        if (balance.mint !== mint) continue;

        const owner =
          balance.owner ||
          `account-${balance.accountIndex}`;

        const current = owners.get(owner) || {
          pre: 0,
          post: 0,
          accountIndex: balance.accountIndex
        };

        current.post =
          Number(balance.uiTokenAmount?.uiAmount || 0);

        owners.set(owner, current);
      }

      // --------------------------------------------------
      // MOJ増加 = MOJ受取
      // --------------------------------------------------

      for (const [owner, data] of owners.entries()) {
        const got = data.post - data.pre;

        if (got <= 0) continue;

        buys.push({
          signature: sigInfo.signature,
          slot: sigInfo.slot,
          blockTime: sigInfo.blockTime,
          buyer: owner,
          got
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
