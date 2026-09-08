export default async function handler(req, res) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return res.status(500).json({
      ok: false,
      error: "Bot token is missing"
    });
  }

  // GET: Webhookを設定
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

  // POST: TelegramからのWebhook
  if (req.method === "POST") {
    const update = req.body;
    const message = update?.message;

    if (!message?.chat?.id) {
      return res.status(200).json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text || "";

    // /test
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
            text:
              "🗿 MOJ Bot is online.\n\nTelegram webhook connected successfully."
          })
        }
      );
    }

    // /supply
    if (text === "/supply") {
      try {
        const host = req.headers.host;

        const response = await fetch(
          `https://${host}/api/circulating-supply`
        );

        const data = await response.json();

        await fetch(
          `https://api.telegram.org/bot${token}/sendMessage`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              chat_id: chatId,
              text:
                `🗿 MOJ SUPPLY\n\n` +
                `Circulating Supply:\n${data.circulatingSupply ?? "N/A"} MOJ`
            })
          }
        );
      } catch (error) {
        console.error("Supply error:", error);

        await fetch(
          `https://api.telegram.org/bot${token}/sendMessage`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              chat_id: chatId,
              text: "⚠️ MOJ supply data could not be retrieved."
            })
          }
        );
      }
    }
 // /price
    if (text === "/price") {
      try {
        const host = req.headers.host;

        const response = await fetch(
          `https://${host}/api/price`
        );

        const data = await response.json();

        await fetch(
          `https://api.telegram.org/bot${token}/sendMessage`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
           body: JSON.stringify({
  chat_id: chatId,
  parse_mode: "Markdown",
  text:
    `🗿 *MOJ MARKET*\n\n` +
    `━━━━━━━━━━━━━━\n\n` +
    `💰 *PRICE*\n` +
    `$${data.priceUsd ?? "N/A"}\n\n` +
    `📊 *MARKET CAP*\n` +
    `$${data.marketCap ?? "N/A"}\n\n` +
    `📈 *24H VOLUME*\n` +
    `$${data.volume24h ?? "N/A"}\n\n` +
    `🔄 *24H CHANGE*\n` +
    `${data.priceChange24h ?? "N/A"}%\n\n` +
    `━━━━━━━━━━━━━━\n\n` +
    `*MOJ • OFFICIAL MARKET DATA*`
})
          }
        );
      } catch (error) {
        console.error("Price error:", error);

        await fetch(
          `https://api.telegram.org/bot${token}/sendMessage`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              chat_id: chatId,
              text: "⚠️ MOJ price data could not be retrieved."
            })
          }
        );
      }
    }
    return res.status(200).json({ ok: true });
  }

  return res.status(200).json({ ok: true });
}
