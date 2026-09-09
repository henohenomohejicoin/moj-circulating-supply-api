export default async function handler(req, res) {
  // --------------------------------------------------
  // Cron Secret
  // --------------------------------------------------

  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const auth = req.headers.authorization;

    if (auth !== `Bearer ${cronSecret}`) {
      return res.status(401).json({
        ok: false,
        error: "Unauthorized"
      });
    }
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "GET only"
    });
  }

  try {
    const host =
      process.env.VERCEL_URL ||
      req.headers.host;

    const baseUrl = `https://${host}`;

    // --------------------------------------------------
    // 1. Buy monitor
    // --------------------------------------------------

    const monitorResponse = await fetch(
      `${baseUrl}/api/buy-monitor`
    );

    if (!monitorResponse.ok) {
      throw new Error("Buy monitor HTTP error");
    }

    const monitorData =
      await monitorResponse.json();

    if (!monitorData.ok) {
      return res.status(500).json({
        ok: false,
        error: "Buy monitor failed"
      });
    }

    const buys = monitorData.buys || [];

    // --------------------------------------------------
    // Buyなし
    // --------------------------------------------------

    if (buys.length === 0) {
      return res.status(200).json({
        ok: true,
        detected: 0,
        message: "No new buys detected"
      });
    }

    // --------------------------------------------------
    // 2. 最新価格取得
    // --------------------------------------------------

    let priceData = {};

    try {
      const priceResponse = await fetch(
        `${baseUrl}/api/price`
      );

      if (priceResponse.ok) {
        priceData = await priceResponse.json();
      }
    } catch (error) {
      console.error("Price API error:", error);
    }

    // --------------------------------------------------
    // 3. BuyをTelegramへ送信
    // --------------------------------------------------

    const results = [];

    for (const buy of buys) {
      try {
        const buyResponse = await fetch(
          `${baseUrl}/api/buy`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              spent:
                buy.spentSol !== undefined
                  ? `${buy.spentSol} SOL`
                  : "N/A",

              got: buy.got ?? "N/A",

              buyer:
                buy.buyer ?? "N/A",

              newHolder:
                buy.newHolder === true,

              price:
                priceData.priceUsd ?? "N/A",

              marketCap:
                priceData.marketCap ?? "N/A",

              signature:
                buy.signature ?? null
            })
          }
        );

        const buyData =
          await buyResponse.json();

        results.push({
          signature: buy.signature,
          ok: buyData.ok === true
        });

      } catch (error) {
        console.error(
          "Buy notification error:",
          error
        );

        results.push({
          signature: buy.signature,
          ok: false
        });
      }
    }

    // --------------------------------------------------
    // 4. 結果
    // --------------------------------------------------

    return res.status(200).json({
      ok: true,
      detected: buys.length,
      results
    });

  } catch (error) {
    console.error(
      "Buy cron error:",
      error
    );

    return res.status(500).json({
      ok: false,
      error: "Buy cron error"
    });
  }
}
