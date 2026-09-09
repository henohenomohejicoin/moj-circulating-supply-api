export default async function handler(req, res) {
  const mint =
    "5EcYAi9ETKWMw5F5GuocR2ZBqfN4tGUv4LCdZZVJpump";

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false });
  }

  try {
    const rpcResponse = await fetch(
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
              limit: 5,
              commitment: "confirmed"
            }
          ]
        })
      }
    );

    const rpcData = await rpcResponse.json();

    return res.status(200).json({
      ok: true,
      mint,
      signatures: rpcData.result || []
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      error: "Solana RPC error"
    });
  }
}
