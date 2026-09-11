export default async function handler(req, res) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({
      ok: false,
      error: "Telegram settings are missing"
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "POST only"
    });
  }

  try {
    const tx = req.body || {};

    const buyer = tx.buyer ?? "";
    const signature = tx.signature ?? "";

    // SpentからSOL表記を除去して数値化
    const spentSol = Number(
      String(tx.spent ?? "").replace(/[^0-9.]/g, "")
    ) || 0;

// 0.001 SOL = 🫶 1個（最大100個）
const heartCount = Math.min(
  100,
  Math.max(
    1,
    Math.round(spentSol / 0.001)
  )
);

    const hearts = Array.from(
      { length: heartCount },
      () =>
        '<tg-emoji emoji-id="6073460614154426231">🫶</tg-emoji>'
    ).join("");

    const caption =
      "🎭 Henohenomoheji Buy!\n\n" +

      hearts +

      "\n\n" +

      `🔀 Spent: ${spentSol} SOL\n` +
      `🔀 Got: ${tx.got ?? "N/A"} MOJ\n` +

      `👤 <a href="https://solscan.io/account/${buyer}">Buyer</a>` +
      (
        signature
          ? ` / <a href="https://solscan.io/tx/${signature}">TX</a>`
          : ""
      ) +

      "\n" +

      `🪙 ${tx.newHolder ? "New Holder" : "Holder"}\n` +

      `🏷 Price: $${tx.price ?? "N/A"}\n` +

      `💸 Market Cap: $${tx.marketCap ?? "N/A"}\n\n` +

      "<a href=\"https://henohenomoheji.tok.best/\">WEB</a>｜" +
      "<a href=\"https://x.com/henoheno_xyz\">X</a>｜" +
      "<a href=\"https://t.me/henohenomohejicoin\">TG</a>\n" +

      "MOJ • OFFICIAL BUY";

    const videoUrl =
      "https://raw.githubusercontent.com/henohenomohejicoin/moj-circulating-supply-api/main/v2_awv-70c5583e14afed18.mp4";

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${token}/sendVideo`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          video: videoUrl,
          caption,
          parse_mode: "HTML"
        })
      }
    );

    const telegramData = await telegramResponse.json();

    return res.status(200).json({
      ok: telegramResponse.ok,
      telegram: telegramData
    });

  } catch (error) {
    console.error("Buy notification error:", error);

    return res.status(500).json({
      ok: false,
      error: "Telegram notification failed"
    });
  }
}
