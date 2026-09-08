export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true });
  }

  const update = req.body;
  const message = update?.message;

  if (!message?.chat?.id) {
    return res.status(200).json({ ok: true });
  }

  const chatId = message.chat.id;
  const text = message.text || "";

  if (text === "/test") {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: "🗿 MOJ Bot is online.\n\nTelegram webhook connected successfully."
      })
    });
  }

  return res.status(200).json({ ok: true });
}
