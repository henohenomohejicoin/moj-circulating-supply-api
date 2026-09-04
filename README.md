# henohenomoheji (MOJ) — Circulating Supply API

Official circulating supply API for **henohenomoheji (MOJ)** on the Solana blockchain.

## About MOJ

**henohenomoheji (MOJ)** is a digital token inspired by the timeless Japanese creative expression known as Henohenomoheji.

Henohenomoheji is a distinctive human face created through the arrangement of hiragana characters. Traditionally associated with the image of a scarecrow, it represents protection, familiarity, simplicity, and creativity.

MOJ respectfully reimagines this enduring concept for the Web3 era, combining a recognizable cultural symbol with blockchain technology and a global digital community.

## Token Information

| Property     | Value                                          |
| ------------ | ---------------------------------------------- |
| Token        | henohenomoheji                                 |
| Symbol       | MOJ                                            |
| Network      | Solana                                         |
| Mint Address | `5EcYAi9ETKWMw5F5GuocR2ZBqfN4tGUv4LCdZZVJpump` |

## Circulating Supply API

This repository provides the API implementation used to retrieve the current MOJ token supply directly from the Solana blockchain.

The API queries the Solana `getTokenSupply` RPC method using the official MOJ mint address.

On-chain supply changes, including token burns, are reflected automatically when the API is queried.

### API Endpoint

https://project-ymv8n.vercel.app/api/circulating-supply

### Response Format

The endpoint returns JSON in the following format:

```json
{
  "circulatingSupply": 1000000000
}
```

The returned value is provided as a numeric value and reflects the current on-chain token supply reported by the Solana network.

## Repository Structure

```text
moj-circulating-supply-api/
├── api/
│   └── circulating-supply.js
└── README.md
```

## Official Project Resources

* **Website:** https://henohenomoheji.tok.best/
* **X:** https://x.com/henoheno_xyz
* **Telegram:** https://t.me/henohenomohejicoin

## Verification & Documentation

* **Jupiter Developer Documentation:** https://developers.jup.ag/
* **Solana Documentation:** https://solana.com/docs

## Purpose

This repository is maintained to provide transparent and programmatic access to MOJ's on-chain supply information.

The token mint address and API implementation are publicly available for verification.
