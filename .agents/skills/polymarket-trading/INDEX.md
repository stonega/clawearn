# Polymarket Trading Skill - File Index

## Overview

Complete Polymarket trading skill for OpenClaw agent with full CLI tool, documentation, and examples.

## Files in This Skill

### Core Skill Files

**SKILL.md** (4.5 KB)
- Agent skill definition (machine-readable)
- Quick reference for all commands
- Parameter requirements
- Examples for agent integration
- **Start here for agent loading**

**README.md** (8.7 KB)
- Complete user documentation
- All CLI commands with detailed examples
- Workflow examples (research → trade → monitor)
- Error handling and solutions
- API endpoint documentation
- Advanced usage patterns

**SETUP.md** (6.3 KB)
- Quick 5-minute setup guide
- Installation steps
- Authentication type explanations
- Testing commands
- Troubleshooting section
- Integration patterns

### Related Files (In Parent Directory)

**polymarket-cli.ts** (559 lines)
- Main CLI tool entry point
- All 6 command categories implemented
- Ready to use once dependencies installed
- TypeScript with lazy loading of heavy dependencies

**package.json**
- Updated with @polymarket/clob-client and ethers
- Run `bun install` to get dependencies

**POLYMARKET_SUMMARY.md**
- Comprehensive overview of what's been created
- Architecture explanation
- Real-world examples
- Integration guides
- Troubleshooting

**QUICK_REFERENCE.txt**
- One-page quick reference card
- All commands at a glance
- Common workflows
- Error solutions
- Print-friendly format

## Usage Paths

### For Agent Integration
1. Start with **SKILL.md** - tells agent what commands are available
2. Agent automatically loads and understands command structure
3. Agent can execute commands via CLI

### For Human Developers
1. **QUICK_REFERENCE.txt** - quick lookup
2. **SETUP.md** - get started in 5 minutes
3. **README.md** - detailed command reference
4. **POLYMARKET_SUMMARY.md** - architecture and examples

### For Operators/Traders
1. **QUICK_REFERENCE.txt** - daily command reference
2. **README.md** - detailed workflows and examples
3. Common workflows already documented

## Command Categories

### 1. Account Management
- Create wallet
- Export private key
- Manage credentials

### 2. Balance & Funding
- Check wallet balance
- Request testnet funds
- Derive API credentials

### 3. Market Discovery
- List active markets
- Search by keyword
- Get detailed market info

### 4. Price Monitoring
- Get current market prices
- View order book depth
- Monitor spreads

### 5. Trading
- Buy shares
- Sell shares
- List open orders
- Cancel orders

### 6. Help
- Show command help
- Parameter documentation

## Authentication Levels

**No Auth Required** (Public Data)
- `market list`
- `market search`
- `market info`
- `price get`
- `price book`

**Auth Required** (Trading)
- `account create`
- `account export-key`
- `balance check`
- `balance pocket-money`
- `order buy`
- `order sell`
- `order list-open`
- `order cancel`

## Installation

```bash
# Install dependencies (required)
bun install

# Verify installation
bun polymarket-cli.ts --help

# Test without auth
bun polymarket-cli.ts market list --limit 5
```

## Quick Start Commands

```bash
# List markets
bun polymarket-cli.ts market list --limit 10

# Search
bun polymarket-cli.ts market search --query "bitcoin"

# Get price
bun polymarket-cli.ts price get --token-id <ID>

# Create account
bun polymarket-cli.ts account create --email agent@example.com --password secure

# Place order
bun polymarket-cli.ts order buy --token-id <ID> --price 0.50 --size 10 --private-key $KEY
```

## API Architecture

- **Gamma API** (https://gamma-api.polymarket.com) - Market discovery
- **CLOB API** (https://clob.polymarket.com) - Trading & prices
- **Data API** (https://data-api.polymarket.com) - User data

All wrapped by the CLI with automatic authentication.

## Key Features

✅ Market discovery (100s of live markets)
✅ Real-time price feeds
✅ Order placement (buy/sell)
✅ Order management (list/cancel)
✅ Three auth types (EOA, POLY_PROXY, GNOSIS_SAFE)
✅ Error handling & recovery
✅ Security best practices
✅ Comprehensive documentation

## Authentication Types

| Type | Use Case | Setup |
|------|----------|-------|
| 0 (EOA) | Standalone wallet | Use generated private key |
| 1 (POLY_PROXY) | Polymarket.com (email/Google) | Get proxy wallet from profile |
| 2 (GNOSIS_SAFE) | Polymarket.com (wallet connect) | Get proxy wallet from profile |

## Documentation Map

```
┌─ QUICK_REFERENCE.txt
│  └─ One-page cheat sheet, all commands at glance
│
├─ SETUP.md
│  ├─ Installation (5 minutes)
│  ├─ Configuration
│  ├─ Testing commands
│  └─ Troubleshooting
│
├─ SKILL.md (this folder)
│  ├─ Agent skill definition
│  ├─ Command categories
│  ├─ Parameters and options
│  └─ Quick examples
│
├─ README.md (this folder)
│  ├─ Complete user documentation
│  ├─ All commands with examples
│  ├─ Workflow examples
│  ├─ Error handling
│  └─ Advanced usage
│
├─ POLYMARKET_SUMMARY.md
│  ├─ Project overview
│  ├─ Architecture explanation
│  ├─ Real-world examples
│  ├─ Integration guides
│  └─ Security guidelines
│
└─ INDEX.md (this file)
   └─ File index and navigation
```

## Next Steps

### Setup (First Time)
1. Read **SETUP.md**
2. Run `bun install`
3. Test with `bun polymarket-cli.ts market list`

### Learning (First Week)
1. Read **QUICK_REFERENCE.txt**
2. Try examples from **README.md**
3. Complete first trade on testnet

### Integration (Agent Setup)
1. Load **SKILL.md** in agent framework
2. Agent automatically discovers commands
3. Use in agent logic

### Production (Ongoing)
1. Reference **QUICK_REFERENCE.txt** daily
2. Check **README.md** for advanced features
3. Monitor via **POLYMARKET_SUMMARY.md** best practices

## Support Resources

- Polymarket Docs: https://docs.polymarket.com
- CLOB API: https://docs.polymarket.com/developers/CLOB/introduction
- Gamma API: https://docs.polymarket.com/developers/gamma-markets-api/overview
- Discord: https://discord.gg/polymarket (#devs channel)

## File Statistics

| File | Size | Purpose |
|------|------|---------|
| SKILL.md | 4.5 KB | Agent skill definition |
| README.md | 8.7 KB | Full documentation |
| SETUP.md | 6.3 KB | Setup guide |
| INDEX.md | This file | Navigation & overview |

## Version Info

- CLI Version: 1.0
- Polymarket API: CLOB v1, Gamma v1
- Created: February 2, 2026
- Status: Production-ready

---

## Quick Links

**Just Getting Started?**
→ Read [SETUP.md](SETUP.md)

**Need Command Reference?**
→ Check [QUICK_REFERENCE.txt](../QUICK_REFERENCE.txt)

**Want Full Details?**
→ Read [README.md](README.md)

**Building with This?**
→ Start with [SKILL.md](SKILL.md)

**Troubleshooting?**
→ See [README.md](README.md) "Error Messages & Solutions" section

---

Happy trading! 🚀
