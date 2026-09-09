export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "POST only"
    });
  }

  return res.status(200).json({
    ok: true,
    message: "MOJ buy monitor is ready"
  });
}
