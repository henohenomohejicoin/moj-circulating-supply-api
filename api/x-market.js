import { TwitterApi } from "twitter-api-v2";

const MINT = "5EcYAi9ETKWMw5F5GuocR2ZBqfN4tGUv4LCdZZVJpump";

export default async function handler(req, res) {
  try {
    const response = await fetch(
      `https://api.dexscreener.com/tokens/v1/solana/${MINT}`
    );

    if (!response.ok) {
      throw new Error(`DexScreener API error: ${response.status}`);
    }

    const data = await response.json();
    const pair = data?.[0];

    if (!pair) {
      throw new Error("MOJ market data not found");
    }

    const price = Number(pair.priceUsd || 0);
    const marketCap = Number(pair.marketCap || 0);
    const volume24h = Number(pair.volume?.h24 || 0);
    const change24h = pair.priceChange?.h24;

    const formatPrice = price
      ? `$${price.toFixed(12).replace(/0+$/, "").replace(/\.$/, "")}`
      : "N/A";

    const formatUsd = (value) =>
      `$${Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    const changeText =
      typeof change24h === "number"
        ? `${change24h.toFixed(2)}%`
        : "N/A%";

    const tweet = `🟢 MOJ MARKET
━━━━━━━━━━━━━━
💰 PRICE: ${formatPrice}
📊 MARKET CAP: ${formatUsd(marketCap)}
📈 24H VOLUME: ${formatUsd(volume24h)}
🔄 24H CHANGE: ${changeText}
━━━━━━━━━━━━━━
MOJ • OFFICIAL MARKET DATA`;

    const client = new TwitterApi({
      appKey: process.env.X_API_KEY,
      appSecret: process.env.X_API_SECRET,
      accessToken: process.env.X_ACCESS_TOKEN,
      accessSecret: process.env.X_ACCESS_SECRET,
    });

    const result = await client.v2.tweet(tweet);

    return res.status(200).json({
      success: true,
      tweetId: result.data.id,
      tweet,
    });
  } catch (error) {
    console.error("X MARKET POST ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
