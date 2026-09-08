export default async function handler(req, res) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return res.status(500).json({ ok: false, error: "Bot token is missing" });
  }

  // ブラウザで開いたとき、Telegram webhookを自動設定
  if (req.method === "GET") {
    const host = req.headers.host;
    const webhookUrl = `https://${host}/api/telegram`;

    const response = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: webhookUrl
        })
      }
    );

    const data = await response.json();

    return res.status(200).json({
      webhook: webhookUrl,
      telegram: data
    });
  }

  // TelegramからのWebhook
  if (req.method === "POST") {
    const update = req.body;
    const message = update?.message;

    if (message?.chat?.id) {
      const chatId = message.chat.id;
      const text = message.text || "";

      if (text === "/test") {
        await fetch(
          `https://api.telegram.org/bot${token}/sendMessage`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              chat_id: chatId,
              text: "🗿 MOJ Bot is online.\n\nTelegram webhook connected successfully."
            })
          }
        );
      }
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(200).json({ ok: true });
}
