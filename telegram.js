export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true });
  }

  const update = req.body;

  console.log("Telegram update:", JSON.stringify(update));

  return res.status(200).json({
    ok: true,
    chat_id: update?.message?.chat?.id ?? null,
    chat_type: update?.message?.chat?.type ?? null,
  });
}
