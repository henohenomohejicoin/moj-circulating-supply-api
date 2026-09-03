export default async function handler(request, response) {
  const mint = "5EcYAi9ETKWMw5F5GuocR2ZBqfN4tGUv4LCdZZVJpump";

  try {
    const rpcResponse = await fetch("https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenSupply",
        params: [mint]
      })
    });

    const data = await rpcResponse.json();

    if (!data.result || !data.result.value) {
      return response.status(500).json({
        error: "Failed to get token supply"
      });
    }

    const supply = Number(data.result.value.amount);

    return response.status(200).json({
      circulatingSupply: supply
    });

  } catch (error) {
    return response.status(500).json({
      error: "Failed to fetch supply"
    });
  }
}
