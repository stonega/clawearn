# Polymarket Trading Skill - Setup & Getting Started

## What You've Just Created

A complete CLI tool + Agent Skill for OpenClaw to trade on Polymarket prediction markets.

### Files Created

1. **polymarket-cli.ts** - Main CLI entry point (1000+ lines)
   - Account management (create wallet, export keys)
   - Market discovery (search, list, get details)
   - Price monitoring (real-time quotes, order books)
   - Order management (buy, sell, cancel, list)
   - Balance checking (wallet balance, testnet funding)

2. **.agents/skills/polymarket-trading/SKILL.md** - Agent skill definition
   - Agent can load this skill automatically
   - Commands mapped for agent to understand usage
   - Integration with OpenClaw agent workflow

3. **README.md** - Comprehensive documentation
   - All CLI commands with examples
   - Workflow examples (search → trade)
   - Error handling and solutions
   - Security guidelines

## Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
bun install
```

### 2. Create a Test Account
```bash
bun polymarket-cli.ts account create \
  --email agent@openclaw.io \
  --password secure123
```

Save the private key:
```bash
export POLYMARKET_KEY="0x..."
```

### 3. Test Market Discovery
```bash
# List active markets
bun polymarket-cli.ts market list --limit 5

# Search for specific topic
bun polymarket-cli.ts market search --query "bitcoin"
```

### 4. Test Price Queries
```bash
# Get a token ID from market list, then:
bun polymarket-cli.ts price get \
  --token-id 111128191581505463501777127559667396812474366956707382672202929745167742497287 \
  --side buy
```

## Integration with OpenClaw

The agent can use this skill in two ways:

### Method 1: Direct CLI Calls
```typescript
const result = await Bun.spawnSync([
  "bun",
  "polymarket-cli.ts",
  "market",
  "list"
]);
```

### Method 2: Agent Skill System
OpenClaw will automatically load the SKILL.md and understand:
- Available commands
- Required parameters
- Output format
- Error handling

## Authentication Setup

Three authentication types supported:

### Type 0: EOA Wallet (Standalone)
```bash
# You control the private key, you pay gas
bun polymarket-cli.ts order buy \
  --token-id <id> \
  --price 0.50 \
  --size 10 \
  --private-key $KEY \
  --signature-type 0
```

### Type 1: Polymarket.com (Email/Google)
1. Create account at polymarket.com (email or Google)
2. Check profile dropdown → see proxy wallet address
3. Use that as funder:
```bash
bun polymarket-cli.ts order buy \
  --token-id <id> \
  --price 0.50 \
  --size 10 \
  --private-key $KEY \
  --signature-type 1 \
  --funder 0x<proxy-wallet-address>
```

### Type 2: Polymarket.com (Wallet Connection)
Same as Type 1 but use wallet connection method instead of email.

## Common Workflows

### Workflow 1: Research a Market
```bash
# Search
bun polymarket-cli.ts market search --query "election"

# Get details
bun polymarket-cli.ts market info --market-id 0x...

# Check current price
bun polymarket-cli.ts price get --token-id 0x...

# View order book
bun polymarket-cli.ts price book --token-id 0x...
```

### Workflow 2: Place a Trade
```bash
# Find market and token ID (from workflow 1)

# Buy
bun polymarket-cli.ts order buy \
  --token-id 0x... \
  --price 0.45 \
  --size 20 \
  --private-key $KEY

# Later: Check open orders
bun polymarket-cli.ts order list-open --private-key $KEY

# Later: Sell to lock in profits
bun polymarket-cli.ts order sell \
  --token-id 0x... \
  --price 0.60 \
  --size 20 \
  --private-key $KEY
```

### Workflow 3: Automated Trading (Agent Example)
```typescript
async function agentTradingLogic() {
  // 1. Find markets
  const markets = await cliCommand("market", "list", "--limit", "10");
  
  // 2. Check price of interesting market
  const price = await cliCommand("price", "get", "--token-id", tokenId);
  
  // 3. If opportunity exists, place order
  if (price < 0.40 && confidence > 0.7) {
    const order = await cliCommand("order", "buy",
      "--token-id", tokenId,
      "--price", "0.40",
      "--size", "50",
      "--private-key", process.env.POLYMARKET_KEY
    );
    console.log("Order placed:", order);
  }
}
```

## Testing Commands

Run these to verify everything works:

```bash
# Help
bun polymarket-cli.ts --help

# List markets (no auth needed)
bun polymarket-cli.ts market list --limit 3

# Search markets (no auth needed)
bun polymarket-cli.ts market search --query "bitcoin"

# Get price (no auth needed)
# Use a real token ID from market list output
bun polymarket-cli.ts price get --token-id <TOKEN_ID>

# View order book (no auth needed)
bun polymarket-cli.ts price book --token-id <TOKEN_ID>

# Create account (generates new wallet)
bun polymarket-cli.ts account create --email test@example.com --password test123
```

## Next Steps

1. **Funding**: Request testnet money or deposit real USDC
   ```bash
   bun polymarket-cli.ts balance pocket-money --amount 100
   ```

2. **Integrate with Agent**: Load the SKILL.md in your agent framework

3. **Build Trading Logic**: Create custom agent logic that uses these commands

4. **Monitor & Adjust**: Track performance, refine prediction models

## Troubleshooting

### "Cannot find module @polymarket/clob-client"
```bash
bun install
```

### "Invalid token ID"
Use `market list` to find active markets and their token IDs.

### "Geographic restrictions apply"
Polymarket doesn't support all countries. Check their website.

### "Insufficient balance"
You need USDC. Request testnet funds or deposit:
```bash
bun polymarket-cli.ts balance pocket-money --amount 100
```

### Order fails
Check:
1. Sufficient balance
2. Valid token ID
3. Price between 0.00 and 1.00
4. Size >= minimum (usually 5 shares)
5. Correct signature type for your account

## API Reference Quick Links

- Polymarket Docs: https://docs.polymarket.com
- CLOB API: https://docs.polymarket.com/developers/CLOB/introduction
- Gamma API: https://docs.polymarket.com/developers/gamma-markets-api/overview
- TypeScript SDK: https://github.com/Polymarket/clob-client

## Security Reminders

✅ DO:
- Store keys in environment variables
- Use .env files (gitignored)
- Rotate credentials regularly
- Test on testnet first

❌ DON'T:
- Hardcode private keys in scripts
- Share your private key
- Commit .env to git
- Use unverified APIs

---

You're ready to go! Start with `bun polymarket-cli.ts --help` and explore.
