export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "GET only"
    });
  }

  try {
    const host = req.headers.host;

    // --------------------------------------------------
    // Buy monitor
    // --------------------------------------------------

    const monitorResponse = await fetch(
      `https://${host}/api/buy-monitor`
    );

    const monitorData = await monitorResponse.json();

    if (!monitorData.ok) {
      return res.status(500).json({
        ok: false,
        error: "Buy monitor failed"
      });
    }

    const buys = monitorData.buys || [];

    // --------------------------------------------------
    // 最新BuyをTelegramへ送信
    // --------------------------------------------------

    const results = [];

    for (const buy of buys) {
      const buyResponse = await fetch(
        `https://${host}/api/buy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            spent: "Detected",
            got: buy.got,
            buyer: buy.buyer,
            newHolder: false,
            price: "N/A",
            marketCap: "N/A",
            signature: buy.signature
          })
        }
      );

      const buyData = await buyResponse.json();

      results.push({
        signature: buy.signature,
        ok: buyData.ok
      });
    }

    return res.status(200).json({
      ok: true,
      detected: buys.length,
      results
    });

  } catch (error) {
    console.error("Buy cron error:", error);

    return res.status(500).json({
      ok: false,
      error: "Buy cron error"
    });
  }
}
