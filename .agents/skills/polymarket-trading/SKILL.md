---
name: polymarket-trading
description: "CLI tool for OpenClaw agent to trade on Polymarket. Features account creation, deposit management, market discovery, price fetching, and order placement. Use when the agent needs to execute trades, check market prices, or manage Polymarket positions."
---

# Polymarket Trading Skill

Complete CLI tool enabling OpenClaw agent to trade prediction markets on Polymarket.

## Quick Start

```bash
bun polymarket-cli.ts --help
```

## Core Features

### 1. Account Management

**Create a new account:**
```bash
bun polymarket-cli.ts account create --email user@example.com --password yourpassword
```

**Export private key:**
```bash
bun polymarket-cli.ts account export-key --email user@example.com --password yourpassword
```

### 2. Funding & Balances

**Request pocket money (for testing/dev):**
```bash
bun polymarket-cli.ts balance pocket-money --amount 100
```

**Check balance:**
```bash
bun polymarket-cli.ts balance check --private-key $YOUR_PRIVATE_KEY
```

### 3. Market Discovery

**Search markets by keyword:**
```bash
bun polymarket-cli.ts market search --query "bitcoin price 2025"
```

**Get active markets by category:**
```bash
bun polymarket-cli.ts market list --tag politics --limit 10
```

**Get market details:**
```bash
bun polymarket-cli.ts market info --market-id MARKET_ID
```

### 4. Price Data

**Get current market price:**
```bash
bun polymarket-cli.ts price get --token-id TOKEN_ID --side buy
```

**View order book depth:**
```bash
bun polymarket-cli.ts price book --token-id TOKEN_ID
```

### 5. Trading

**Place a buy order:**
```bash
bun polymarket-cli.ts order buy \
  --token-id TOKEN_ID \
  --price 0.50 \
  --size 10 \
  --private-key $YOUR_PRIVATE_KEY \
  --signature-type 0
```

**Place a sell order:**
```bash
bun polymarket-cli.ts order sell \
  --token-id TOKEN_ID \
  --price 0.75 \
  --size 5 \
  --private-key $YOUR_PRIVATE_KEY \
  --signature-type 0
```

**View open orders:**
```bash
bun polymarket-cli.ts order list-open --private-key $YOUR_PRIVATE_KEY
```

**Cancel an order:**
```bash
bun polymarket-cli.ts order cancel \
  --order-id ORDER_ID \
  --private-key $YOUR_PRIVATE_KEY
```

## Authentication

The tool supports three signature types:

| Type | Use Case | Funder |
|------|----------|--------|
| `0` (EOA) | Standalone wallet. You pay gas fees. | Your wallet address |
| `1` (POLY_PROXY) | Polymarket.com account (email/Google). | Your proxy wallet address |
| `2` (GNOSIS_SAFE) | Polymarket.com account (wallet connection). | Your proxy wallet address |

Determine your signature type and funder address before placing orders.

## API Integration

The tool uses these Polymarket APIs:

- **Gamma API** (`https://gamma-api.polymarket.com`) - Market discovery, metadata
- **CLOB API** (`https://clob.polymarket.com`) - Prices, order books, trading
- **Data API** (`https://data-api.polymarket.com`) - User positions, trade history

All requests are handled via the internal client — you just use CLI commands.

## Error Handling

Common errors and solutions:

```
Error: Geographic restrictions apply
→ Polymarket is not available in your jurisdiction

Error: Insufficient balance
→ Request pocket money or deposit funds

Error: Invalid token ID
→ Market may have expired or token ID was incorrect

Error: Order failed (negRisk)
→ Multi-outcome event requires negRisk flag handling
```

## Examples

**Workflow: Find and trade a market**

```bash
# 1. Search for a market
bun polymarket-cli.ts market search --query "Biden approval rating"

# 2. Get market details (find token ID)
bun polymarket-cli.ts market info --market-id 0x...

# 3. Check current price
bun polymarket-cli.ts price get --token-id 0x... --side buy

# 4. Place an order
bun polymarket-cli.ts order buy \
  --token-id 0x... \
  --price 0.45 \
  --size 20 \
  --private-key $KEY \
  --signature-type 0
```

**Workflow: Create account and get funding**

```bash
# 1. Create new account
bun polymarket-cli.ts account create --email agent@openclaw.io --password secure123

# 2. Request testnet funds
bun polymarket-cli.ts balance pocket-money --amount 50

# 3. Check balance
bun polymarket-cli.ts balance check --private-key <exported-key>
```

## Files

- `polymarket-cli.ts` - Main CLI entry point
- `src/client.ts` - Polymarket API client wrapper
- `src/commands.ts` - Command handlers
- `src/types.ts` - TypeScript types

## Documentation

See Polymarket docs: https://docs.polymarket.com/developers/CLOB/introduction

For market maker guides: https://docs.polymarket.com/developers/market-makers/introduction
