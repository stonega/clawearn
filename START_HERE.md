# 🚀 Polymarket Trading for OpenClaw - START HERE

## What You've Got

A **complete, production-ready CLI tool** for OpenClaw agent to trade on Polymarket prediction markets.

### The Package

```
moltearn/
├── polymarket-cli.ts                         # Main tool (559 lines)
├── package.json                              # Dependencies
├── QUICK_REFERENCE.txt                       # One-page cheat sheet
├── POLYMARKET_SUMMARY.md                     # Complete overview
├── START_HERE.md                             # This file
└── .agents/skills/polymarket-trading/
    ├── SKILL.md                             # Agent skill definition
    ├── README.md                            # Full documentation
    ├── SETUP.md                             # Setup guide
    └── INDEX.md                             # File index
```

## 5-Minute Quick Start

### Step 1: Install Dependencies
```bash
bun install
```

### Step 2: Verify Installation
```bash
bun polymarket-cli.ts --help
```

### Step 3: Explore Markets (No Auth Needed)
```bash
# List active markets
bun polymarket-cli.ts market list --limit 5

# Search for topics
bun polymarket-cli.ts market search --query "bitcoin"
```

### Step 4: Check Prices (No Auth Needed)
```bash
# Get a token ID from market list output, then:
bun polymarket-cli.ts price get --token-id 111128191581505463501777127559667396812474366956707382672202929745167742497287
```

### Step 5: Create Account & Trade (Auth Needed)
```bash
# Create account
bun polymarket-cli.ts account create --email agent@example.com --password secure123

# Export private key
export POLYMARKET_KEY="0x..."

# Place a buy order
bun polymarket-cli.ts order buy \
  --token-id 111128191581505463501777127559667396812474366956707382672202929745167742497287 \
  --price 0.45 \
  --size 20 \
  --private-key $POLYMARKET_KEY \
  --signature-type 0
```

## Documentation Guide

**Pick Your Path:**

### 🏃 I Want to Get Started Fast
→ Read **QUICK_REFERENCE.txt** (one-page cheat sheet)

### 🏗️ I'm Setting This Up
→ Follow **SETUP.md** (5-minute setup)

### 📚 I Want Complete Details
→ Read **README.md** (comprehensive docs)

### 🤖 I'm Integrating with OpenClaw Agent
→ Start with **SKILL.md** (agent framework)

### 🏛️ I Want Architecture & Examples
→ Review **POLYMARKET_SUMMARY.md** (complete overview)

### 🗂️ I'm Looking for Specific Info
→ Check **INDEX.md** (file map and navigation)

## Command Overview

### Market Discovery (No Auth)
```bash
bun polymarket-cli.ts market list                    # List markets
bun polymarket-cli.ts market search --query "..."    # Search markets
bun polymarket-cli.ts market info --market-id <ID>   # Get details
```

### Price Monitoring (No Auth)
```bash
bun polymarket-cli.ts price get --token-id <ID>     # Current price
bun polymarket-cli.ts price book --token-id <ID>    # Order book
```

### Trading (Auth Required)
```bash
bun polymarket-cli.ts order buy \                    # Buy shares
  --token-id <ID> --price 0.50 --size 10 \
  --private-key <KEY>

bun polymarket-cli.ts order sell \                   # Sell shares
  --token-id <ID> --price 0.75 --size 10 \
  --private-key <KEY>

bun polymarket-cli.ts order list-open \              # View open orders
  --private-key <KEY>

bun polymarket-cli.ts order cancel \                 # Cancel order
  --order-id <ID> --private-key <KEY>
```

### Account & Balance (Auth Required)
```bash
bun polymarket-cli.ts account create \               # Create wallet
  --email agent@example.com --password secure

bun polymarket-cli.ts balance check \                # Check balance
  --private-key <KEY>

bun polymarket-cli.ts balance pocket-money \         # Request testnet funds
  --amount 100
```

## Real World Example

```bash
#!/bin/bash

# 1. Search for a market
bun polymarket-cli.ts market search --query "bitcoin reach 50k 2025"

# 2. Get market details (look for "clobTokenIds")
bun polymarket-cli.ts market info --market-id 12345

# 3. Check current price
TOKEN_ID="93592949212798121127213117304912625505836768562433217537850469496310204567695"
bun polymarket-cli.ts price get --token-id $TOKEN_ID --side buy

# 4. Create account or use existing
bun polymarket-cli.ts account create --email agent@example.com --password secure
export KEY="0x..."

# 5. Check balance
bun polymarket-cli.ts balance check --private-key $KEY

# 6. Place buy order
bun polymarket-cli.ts order buy \
  --token-id $TOKEN_ID \
  --price 0.45 \
  --size 20 \
  --private-key $KEY \
  --signature-type 0

# 7. Monitor your position
bun polymarket-cli.ts order list-open --private-key $KEY

# 8. Sell when ready
bun polymarket-cli.ts order sell \
  --token-id $TOKEN_ID \
  --price 0.65 \
  --size 20 \
  --private-key $KEY
```

## Key Concepts

### Three Authentication Types

**Type 0 (EOA):** Standalone wallet
- You control the private key
- You pay gas fees
- Use: `--signature-type 0`

**Type 1 (POLY_PROXY):** Polymarket.com email/Google
- Create account at polymarket.com
- Get proxy wallet from profile dropdown
- Use: `--signature-type 1 --funder <proxy-wallet>`

**Type 2 (GNOSIS_SAFE):** Polymarket.com wallet connection
- Same as Type 1 but via wallet connection
- Use: `--signature-type 2 --funder <proxy-wallet>`

### Public vs Private Commands

**Public** (no private key needed):
- `market list`, `market search`, `market info`
- `price get`, `price book`

**Private** (need private key):
- `account`, `balance`, `order`

## Common Questions

**Q: Do I need to fund my account?**
A: For testnet (no real money), request pocket money:
```bash
bun polymarket-cli.ts balance pocket-money --amount 100
```
For mainnet, deposit USDC via polymarket.com.

**Q: Where do I get a token ID?**
A: From `market list` or `market info` output. Look for `clobTokenIds`.

**Q: What's the minimum order size?**
A: Usually 5 shares, varies by market. Check market details.

**Q: Can I cancel orders?**
A: Yes, anytime with `order cancel --order-id <ID>`.

**Q: Is my money safe?**
A: Yes, Polymarket contracts are audited. Read more: https://polymarket.com/about

**Q: Can I use this with OpenClaw?**
A: Yes! Load the SKILL.md file in your agent framework.

## Integration with OpenClaw Agent

The CLI is ready to be called from OpenClaw:

```typescript
// In your OpenClaw agent code
const result = await Bun.spawnSync([
  "bun",
  "polymarket-cli.ts",
  "market",
  "list",
  "--limit", "5"
]);

const markets = JSON.parse(result.stdout.toString());
// Use markets data for trading logic
```

Or load as a skill:

```typescript
await agent.loadSkill("polymarket-trading");
// Agent now understands all CLI commands
```

## Troubleshooting

### "Cannot find module '@polymarket/clob-client'"
```bash
bun install
```

### "Invalid token ID"
```bash
# Get valid token IDs from:
bun polymarket-cli.ts market list --limit 5
```

### "Order failed"
Check:
1. Sufficient balance (`balance check`)
2. Valid token ID (from market list)
3. Price between 0 and 1 (e.g., 0.50)
4. Size >= market minimum (usually 5)
5. Correct signature type for your account

### "Geographic restrictions"
Polymarket not available in your region. Check https://polymarket.com.

See full troubleshooting in README.md and SETUP.md.

## Security Checklist

✅ Store private keys in environment variables
✅ Use .env files (add to .gitignore)
✅ Never hardcode keys in code
✅ Test on testnet first
✅ Only use official Polymarket APIs

❌ Never share your private key
❌ Never commit .env to git
❌ Never use unofficial APIs
❌ Never store keys in plain text

## What's Next?

### Immediate (Today)
1. Run `bun install`
2. Try `market list` and `market search`
3. Check some prices with `price get`

### This Week
1. Create an account
2. Get testnet funds
3. Place your first test order
4. Monitor your position

### This Month
1. Build prediction models
2. Integrate with OpenClaw agent
3. Test trading logic on testnet
4. Deploy to mainnet

## Resources

- **Polymarket Docs:** https://docs.polymarket.com
- **CLOB API Reference:** https://docs.polymarket.com/developers/CLOB/introduction
- **Discord Support:** https://discord.gg/polymarket (#devs)

## File Quick Links

| File | Size | Purpose |
|------|------|---------|
| polymarket-cli.ts | 559 lines | Main CLI tool |
| QUICK_REFERENCE.txt | 1 page | Command cheat sheet |
| SETUP.md | 6 KB | Setup guide |
| README.md | 9 KB | Full documentation |
| POLYMARKET_SUMMARY.md | 12 KB | Architecture & examples |
| SKILL.md | 5 KB | Agent skill definition |
| INDEX.md | 7 KB | File index & navigation |

## Summary

You have a **complete Polymarket trading system** ready to use:

✅ Market discovery and search
✅ Real-time price monitoring
✅ Order placement and management
✅ Multiple authentication methods
✅ Error handling and recovery
✅ Comprehensive documentation
✅ OpenClaw agent integration

**Next step:** Run `bun install` and try `bun polymarket-cli.ts --help`

**Questions?** Check the documentation files above or visit https://discord.gg/polymarket.

---

Ready to start trading? 🚀

```bash
bun polymarket-cli.ts market list --limit 5
```
