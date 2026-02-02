# Polymarket Trading Skill for OpenClaw

Complete CLI tool and agent skill enabling OpenClaw to trade prediction markets on Polymarket.

## Overview

This skill provides a full-featured CLI interface to the Polymarket trading ecosystem, including:

- **Account Management**: Create wallets, manage private keys
- **Market Discovery**: Search, filter, and explore active markets
- **Price Monitoring**: Real-time market prices and order book depth
- **Trading**: Buy/sell orders, order management, portfolio tracking
- **Funding**: Request testnet funds, check balances

## Installation

Install dependencies:

```bash
bun install
```

## Quick Start

### 1. Create an Account

```bash
bun ../polymarket-cli.ts account create --email myagent@openclaw.io --password secure
```

Save the private key securely (environment variable or key manager).

### 2. Request Testnet Funds

```bash
bun ../polymarket-cli.ts balance pocket-money --amount 100
```

For production, deposit via Polymarket.com interface.

### 3. Discover Markets

List active markets:

```bash
bun ../polymarket-cli.ts market list --limit 10
```

Search for specific topics:

```bash
bun ../polymarket-cli.ts market search --query "bitcoin price 2025"
```

### 4. Check Market Prices

```bash
bun ../polymarket-cli.ts price get --token-id <TOKEN_ID> --side buy
```

View order book:

```bash
bun ../polymarket-cli.ts price book --token-id <TOKEN_ID>
```

### 5. Place a Trade

Buy shares:

```bash
bun ../polymarket-cli.ts order buy \
  --token-id <TOKEN_ID> \
  --price 0.50 \
  --size 10 \
  --private-key $PRIVATE_KEY \
  --signature-type 0
```

Sell shares:

```bash
bun ../polymarket-cli.ts order sell \
  --token-id <TOKEN_ID> \
  --price 0.75 \
  --size 5 \
  --private-key $PRIVATE_KEY
```

## CLI Commands

### Account Commands

```bash
# Create a new account
account create --email <email> --password <password>

# Export your private key
account export-key --private-key <key>
```

### Balance Commands

```bash
# Check wallet balance and API credentials
balance check --private-key <key>

# Request testnet pocket money
balance pocket-money --amount <amount>
```

### Market Commands

```bash
# Search markets by keyword
market search --query <query>

# List active markets (optionally filtered by tag)
market list [--tag <tag>] [--limit <n>]

# Get details for a specific market
market info --market-id <id>
```

### Price Commands

```bash
# Get current price for a token
price get --token-id <id> [--side buy|sell]

# View order book depth
price book --token-id <id>
```

### Order Commands

```bash
# Buy shares
order buy \
  --token-id <id> \
  --price <price> \
  --size <size> \
  --private-key <key> \
  [--signature-type <0|1|2>] \
  [--funder <address>]

# Sell shares
order sell \
  --token-id <id> \
  --price <price> \
  --size <size> \
  --private-key <key> \
  [--signature-type <0|1|2>] \
  [--funder <address>]

# List open orders
order list-open --private-key <key>

# Cancel an order
order cancel --order-id <id> --private-key <key>
```

## Signature Types

| Type | Use Case | Funder Address |
|------|----------|----------------|
| `0` (EOA) | Standalone wallet, you pay gas | Your wallet address |
| `1` (POLY_PROXY) | Polymarket.com account (email/Google) | Your proxy wallet |
| `2` (GNOSIS_SAFE) | Polymarket.com account (wallet) | Your proxy wallet |

### Finding Your Signature Type and Funder

1. **EOA Wallet**: Use type `0`. Your funder is your wallet address.
2. **Polymarket.com Account**: 
   - Create account at polymarket.com
   - Check profile dropdown for proxy wallet address
   - Use type `1` (email/Google) or `2` (wallet connection)
   - Your funder is the proxy wallet address shown there

## Environment Setup

Store credentials securely:

```bash
export POLYMARKET_PRIVATE_KEY="0x..."
export POLYMARKET_SIGNATURE_TYPE="0"
export POLYMARKET_FUNDER="0x..."
```

Then use in commands:

```bash
bun ../polymarket-cli.ts order buy \
  --token-id <id> \
  --price 0.50 \
  --size 10 \
  --private-key $POLYMARKET_PRIVATE_KEY \
  --signature-type $POLYMARKET_SIGNATURE_TYPE
```

## API Endpoints

The CLI uses these Polymarket APIs:

| API | Purpose | Endpoint |
|-----|---------|----------|
| Gamma API | Market discovery, metadata | https://gamma-api.polymarket.com |
| CLOB API | Prices, order books, trading | https://clob.polymarket.com |
| Data API | User positions, trade history | https://data-api.polymarket.com |

All authenticated requests use your derived API credentials (from private key).

## Workflow Examples

### Find and Trade a Market

```bash
# 1. Search for a market
bun ../polymarket-cli.ts market search --query "US election"

# 2. Get market details (find token IDs)
bun ../polymarket-cli.ts market info --market-id 0x...

# 3. Check current prices
bun ../polymarket-cli.ts price get --token-id 0x... --side buy

# 4. Check order book depth
bun ../polymarket-cli.ts price book --token-id 0x...

# 5. Place an order
bun ../polymarket-cli.ts order buy \
  --token-id 0x... \
  --price 0.45 \
  --size 20 \
  --private-key $KEY

# 6. View your open orders
bun ../polymarket-cli.ts order list-open --private-key $KEY

# 7. Sell if needed
bun ../polymarket-cli.ts order sell \
  --token-id 0x... \
  --price 0.60 \
  --size 10 \
  --private-key $KEY
```

### Market Making / High-Frequency Trading

```bash
# Get order book
bun ../polymarket-cli.ts price book --token-id <id>

# Place limit orders on both sides
bun ../polymarket-cli.ts order buy --token-id <id> --price 0.48 --size 100 --private-key $KEY
bun ../polymarket-cli.ts order sell --token-id <id> --price 0.52 --size 100 --private-key $KEY

# Monitor positions
bun ../polymarket-cli.ts order list-open --private-key $KEY
```

## Error Messages & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Geographic restrictions apply` | Location not supported | Use VPN or check polymarket.com availability |
| `Insufficient balance` | Not enough USDC | Request pocket money or deposit funds |
| `Invalid token ID` | Token doesn't exist or expired | Use `market list` to find valid markets |
| `Order failed (negRisk)` | Multi-outcome market | This market requires special handling |
| `Cannot find module` | Missing dependencies | Run `bun install` |

## Architecture

```
polymarket-cli.ts          # Main CLI entry point
├── account commands       # Wallet/auth management
├── balance commands       # Funding and balance checking
├── market commands        # Discovery via Gamma API
├── price commands         # Real-time data via CLOB API
└── order commands         # Trading via CLOB + Auth
```

The CLI wraps the official Polymarket TypeScript SDK (@polymarket/clob-client) with a user-friendly command interface. All operations are built on the Polygon mainnet (chain ID 137).

## Advanced Usage

### Using with OpenClaw Agent

The OpenClaw agent can call the CLI directly:

```typescript
// In your agent code
const result = await Bun.spawnSync([
  "bun",
  "polymarket-cli.ts",
  "market",
  "list",
  "--limit",
  "5"
]);
```

### Monitoring Markets in Real-Time

For continuous monitoring, combine with polling:

```bash
#!/bin/bash
while true; do
  bun ../polymarket-cli.ts price get --token-id <ID> --side buy
  sleep 60
done
```

### Building Trading Bots

```typescript
// Example: Simple arbitrage bot
const markets = await getActiveMarkets();
for (const market of markets) {
  const ask = await getBestAsk(market.id);
  const bid = await getBestBid(market.id);
  
  if (bid > ask + 0.02) {
    // Profit opportunity
    await placeOrder("sell", ask, 10);
    await placeOrder("buy", bid, 10);
  }
}
```

## Security

⚠️ **Critical Security Guidelines**

1. **Never hardcode private keys** in code or scripts
2. **Use environment variables** for secrets
3. **Rotate API credentials** regularly
4. **Only use official Polymarket endpoints** (https://clob.polymarket.com, https://gamma-api.polymarket.com)
5. **Verify SSL certificates** in production
6. **Back up your recovery phrase** if using wallet-based auth

## Documentation

- [Polymarket Developer Docs](https://docs.polymarket.com/developers/CLOB/introduction)
- [CLOB API Reference](https://docs.polymarket.com/developers/CLOB/introduction)
- [Gamma API Reference](https://docs.polymarket.com/developers/gamma-markets-api/overview)
- [Market Makers Guide](https://docs.polymarket.com/developers/market-makers/introduction)
- [TypeScript CLOB Client](https://github.com/Polymarket/clob-client)

## Support

For issues:

1. Check [Polymarket Discord](https://discord.gg/polymarket) #devs channel
2. Review [API documentation](https://docs.polymarket.com)
3. Check error messages and solutions above
4. Verify your API credentials and signature type

## License

This skill is part of the OpenClaw project. See main repository for license.
