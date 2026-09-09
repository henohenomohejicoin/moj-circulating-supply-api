export default async function handler(request, response) {
  const mint = "5EcYAi9ETKWMw5F5GuocR2ZBqfN4tGUv4LCdZZVJpump";

  try {
    const apiResponse = await fetch(
      `https://api.dexscreener.com/tokens/v1/solana/${mint}`
    );

    const data = await apiResponse.json();

    if (!Array.isArray(data) || data.length === 0) {
      return response.status(404).json({
        error: "MOJ data not found"
      });
    }

    const pair = data[0];

    return response.status(200).json({
      priceUsd: pair.priceUsd ?? null,
      marketCap: pair.marketCap ?? null,
      fdv: pair.fdv ?? null,
      liquidityUsd: pair.liquidity?.usd ?? null,
      volume24h: pair.volume?.h24 ?? null,
      priceChange24h: pair.priceChange?.h24 ?? null
    });

  } catch (error) {
    return response.status(500).json({
      error: "Failed to fetch MOJ data"
    });
  }
}
