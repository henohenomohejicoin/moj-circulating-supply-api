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

    const text =
      "🎭 Henohenomoheji Buy!\n\n" +
      "🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢\n\n" +
      `🔀 Spent: ${tx.spent ?? "N/A"}\n` +
      `🔀 Got: ${tx.got ?? "N/A"} MOJ\n` +
      `👤 Buyer: ${tx.buyer ?? "N/A"}\n` +
      `🪙 ${tx.newHolder ? "New Holder" : "Holder"}\n` +
      `🏷 Price: $${tx.price ?? "N/A"}\n` +
      `💸 Market Cap: $${tx.marketCap ?? "N/A"}\n\n` +
      "MOJ • OFFICIAL BUY";

    // 🟢部分をカスタム絵文字に置き換える
    const greenLineStart =
      "🎭 Henohenomoheji Buy!\n\n";

    const greenLineEnd =
      "\n\n" +
      `🔀 Spent: ${tx.spent ?? "N/A"}\n` +
      `🔀 Got: ${tx.got ?? "N/A"} MOJ\n` +
      `👤 Buyer: ${tx.buyer ?? "N/A"}\n` +
      `🪙 ${tx.newHolder ? "New Holder" : "Holder"}\n` +
      `🏷 Price: $${tx.price ?? "N/A"}\n` +
      `💸 Market Cap: $${tx.marketCap ?? "N/A"}\n\n` +
      "MOJ • OFFICIAL BUY";

    const customEmoji =
      "🫶";

    const finalText =
      greenLineStart +
      customEmoji +
      greenLineEnd;

    const entities = [
      {
        type: "custom_emoji",
        offset: 24,
        length: 20,
        custom_emoji_id: "6073460614154426231"
      }
    ];

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: finalText,
          entities
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
