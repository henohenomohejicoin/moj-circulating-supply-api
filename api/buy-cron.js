import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const auth = req.headers.authorization;

    if (auth !== `Bearer ${cronSecret}`) {
      return res.status(401).json({
        ok: false,
        error: "Unauthorized"
      });
    }
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "GET only"
    });
  }

  try {
    const baseUrl =
      "https://project-ymv8n.vercel.app";

    // Buy monitor
    const monitorResponse = await fetch(
      `${baseUrl}/api/buy-monitor`,
      {
        headers: {
          Accept: "application/json"
        }
      }
    );

    const monitorText =
      await monitorResponse.text();

    if (!monitorResponse.ok) {
      console.error(
        "Buy monitor HTTP error:",
        monitorResponse.status,
        monitorText
      );

      throw new Error(
        `Buy monitor HTTP ${monitorResponse.status}`
      );
    }

    let monitorData;

    try {
      monitorData =
        JSON.parse(monitorText);
    } catch (error) {
      console.error(
        "Buy monitor returned non-JSON:",
        monitorText.slice(0, 500)
      );

      throw new Error(
        "Buy monitor returned invalid JSON"
      );
    }

    if (!monitorData.ok) {
      throw new Error(
        "Buy monitor failed"
      );
    }

    const buys =
      monitorData.buys || [];

    if (buys.length === 0) {
      return res.status(200).json({
        ok: true,
        detected: 0,
        processed: 0,
        skipped: 0,
        message: "No buys detected"
      });
    }

    // Price
    let priceData = {};

    try {
      const priceResponse =
        await fetch(
          `${baseUrl}/api/price`
        );

      if (priceResponse.ok) {
        const priceText =
          await priceResponse.text();

        priceData =
          JSON.parse(priceText);
      }
    } catch (error) {
      console.error(
        "Price API error:",
        error
      );
    }

    const results = [];

    let processedCount = 0;
    let skippedCount = 0;

    // Process buys
    for (const buy of buys) {
      try {
        const signature =
          buy.signature;

        if (!signature) {
          console.error(
            "Buy has no signature:",
            buy
          );

          results.push({
            signature: null,
            ok: false,
            skipped: true,
            reason: "No signature"
          });

          skippedCount++;
          continue;
        }

        // Redis duplicate check
        const redisKey =
          `moj:buy:processed:${signature}`;

        const alreadyProcessed =
          await redis.get(redisKey);

        if (alreadyProcessed) {
          console.log(
            "Skipping duplicate buy:",
            signature
          );

          results.push({
            signature,
            ok: true,
            skipped: true,
            reason: "Already processed"
          });

          skippedCount++;
          continue;
        }

        // Send Telegram notification
        const buyResponse =
          await fetch(
            `${baseUrl}/api/buy`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                spent:
                  buy.spentSol !== undefined
                    ? `${buy.spentSol} SOL`
                    : "N/A",

                got:
                  buy.got ?? "N/A",

                buyer:
                  buy.buyer ?? "N/A",

                newHolder:
                  buy.newHolder === true,

                price:
                  priceData.priceUsd ??
                  "N/A",

                marketCap:
                  priceData.marketCap ??
                  "N/A",

                signature
              })
            }
          );

        const buyText =
          await buyResponse.text();

        let buyData = {};

        try {
          buyData =
            JSON.parse(buyText);
        } catch (error) {
          console.error(
            "Buy API returned non-JSON:",
            buyText.slice(0, 500)
          );
        }

        // Only mark as processed after successful notification
        if (
          buyResponse.ok &&
          buyData.ok === true
        ) {
          await redis.set(
            redisKey,
            "processed"
          );

          console.log(
            "Buy processed:",
            signature
          );

          results.push({
            signature,
            ok: true,
            skipped: false
          });

          processedCount++;
        } else {
          console.error(
            "Buy API failed:",
            signature,
            buyResponse.status,
            buyText
          );

          results.push({
            signature,
            ok: false,
            skipped: false
          });
        }

      } catch (error) {
        console.error(
          "Buy notification error:",
          error
        );

        results.push({
          signature:
            buy.signature ?? null,
          ok: false,
          skipped: false
        });
      }
    }

    return res.status(200).json({
      ok: true,
      detected: buys.length,
      processed: processedCount,
      skipped: skippedCount,
      results
    });

  } catch (error) {
    console.error(
      "Buy cron error:",
      error
    );

    return res.status(500).json({
      ok: false,
      error: "Buy cron error",
      detail: error.message
    });
  }
}
