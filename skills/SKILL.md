---
name: clawearn
version: 1.2.0
description: Modular prediction market trading platform for OpenClaw bots. Trade on Polymarket and Hyperliquid, manage wallets, transfer USDC, and automate trading strategies.
homepage: https://clawearn.xyz
documentation: https://docs.clawearn.xyz
repository: https://github.com/stonega/moltearn
support: https://discord.gg/clawearn
metadata: 
  category: trading
  type: prediction-markets
  platforms: ["polymarket"]
  features: ["wallet-management", "market-trading", "usdc-transfers", "multi-market", "modular"]
  requires: ["bun", "ethers.js"]
---

# Clawearn - Modular Trading Platform for OpenClaw 🎯

**Trade prediction markets directly from your OpenClaw bot.**

Clawearn enables your AI agent to:
- 🎯 Trade on Polymarket prediction markets
- 💼 Create and manage crypto wallets
- 💸 Send USDC to any Ethereum address on Arbitrum
- 📊 Monitor balances and positions across markets
- 🤖 Execute trading strategies autonomously

---

## Quick Start (3 steps)

### Step 1: Install clawearn CLI

```bash
curl -fsSL https://clawearn.xyz/install.sh | bash
# or: bun link (if in repo)
```

### Step 2: Create your first wallet

```bash
clawearn wallet create
```

You'll see your wallet address. Save it — you'll need to fund it next.

### Step 3: Fund your wallet and start trading

**Option A: Send USDC from another wallet**
```bash
clawearn wallet send --to YOUR_AGENT_ADDRESS --amount 100
```

**Option B: Bridge USDC to Arbitrum yourself**
- Send USDC to Arbitrum network
- Send to the address from `clawearn wallet show`

**Then search for markets:**
```bash
clawearn polymarket market search --query "bitcoin price 2025"
```

---

## Set Up Your Heartbeat 💓

Keep your trading bot running smoothly with periodic checks.

Add Clawearn to your agent's heartbeat routine so you don't forget to monitor positions and update market data.

### Step 1: Add to your heartbeat file

Add this to your `HEARTBEAT.md` (or equivalent periodic task list):

```markdown
## Clawearn Trading Checks (every 5 minutes)
If 5 minutes since last Clawearn check:
1. Check wallet balance: `clawearn polymarket balance check`
2. Monitor open orders: `clawearn polymarket order list-open`
3. Review active positions on Polymarket
4. Update lastClawEarnCheck timestamp in memory
5. Alert on critical thresholds (low balance, pending fills, etc.)
```

---

## Installation for OpenClaw Bots

### Install all skill files

```bash
# Create skill directory
mkdir -p ~/.openclaw/skills/clawearn

# Install main files
curl -s https://clawearn.xyz/skills/SKILL.md > ~/.openclaw/skills/clawearn/SKILL.md
curl -s https://clawearn.xyz/skills/HEARTBEAT.md > ~/.openclaw/skills/clawearn/HEARTBEAT.md

# Install core skills
mkdir -p ~/.openclaw/skills/clawearn/core/{wallet,security}
curl -s https://clawearn.xyz/skills/core/wallet/SKILL.md > ~/.openclaw/skills/clawearn/core/wallet/SKILL.md
curl -s https://clawearn.xyz/skills/core/security/SKILL.md > ~/.openclaw/skills/clawearn/core/security/SKILL.md

# Install market skills
mkdir -p ~/.openclaw/skills/clawearn/markets/polymarket
curl -s https://clawearn.xyz/skills/markets/polymarket/SKILL.md > ~/.openclaw/skills/clawearn/markets/polymarket/SKILL.md
curl -s https://clawearn.xyz/skills/markets/polymarket/HEARTBEAT.md > ~/.openclaw/skills/clawearn/markets/polymarket/HEARTBEAT.md

# Install market skills for futures
mkdir -p ~/.openclaw/skills/clawearn/markets/hyperliquid
curl -s https://clawearn.xyz/skills/markets/hyperliquid/SKILL.md > ~/.openclaw/skills/clawearn/markets/hyperliquid/SKILL.md
```

## Supported Markets

| Market | Status | Features | Installation |
|--------|--------|----------|--------------|
| **Polymarket** | ✅ Production | Full trading, order management, market discovery | See above |
| **Hyperliquid** | ✅ Production | Perpetual futures trading, deposits, withdrawals, position management | See above |

---


## Core Commands

### Wallet Management

```bash
# Create a new wallet
clawearn wallet create

# Show your wallet address
clawearn wallet show

# Send USDC to another address (on Arbitrum)
clawearn wallet send --to 0x... --amount 100
```

### Polymarket Trading

```bash
# Search for markets
clawearn polymarket market search --query "bitcoin price 2025"

# Get market details
clawearn polymarket market info --market-id MARKET_ID

# Check your balance
clawearn polymarket balance check

# Place a buy order
clawearn polymarket order buy --token-id TOKEN_ID --price 0.50 --size 10

# View open orders
clawearn polymarket order list-open

# Cancel an order
clawearn polymarket order cancel --order-id ORDER_ID
```

### Hyperliquid Perpetual Futures Trading

```bash
# List available coins
clawearn hyperliquid market list

# Check market price
clawearn hyperliquid price --coin ETH

# Check your balance and positions
clawearn hyperliquid balance

# Place a buy order
clawearn hyperliquid order buy --coin ETH --price 3000 --size 0.1

# View open orders
clawearn hyperliquid order list-open

# Deposit USDC to trading account
clawearn hyperliquid deposit --amount 100

# Withdraw USDC from trading account
clawearn hyperliquid withdraw --amount 50
```

## Configuration

Create an optional config file to track settings:

**`~/.clawearn/config.json`** (optional)
```json
{
  "version": "1.1.0",
  "enabled_markets": ["polymarket"],
  "default_network": "arbitrum",
  "wallet": {
    "network": "arbitrum",
    "auto_fund_threshold": 50
  },
  "trading": {
    "signature_type": 0,
    "default_slippage_pct": 0.5
  },
  "risk_limits": {
    "max_position_size_pct": 20,
    "max_total_exposure_pct": 50,
    "min_balance_alert": 10,
    "daily_loss_limit": 100
  }
}
```

---

## Quick Reference

### Check installed markets
```bash
ls ~/.clawearn/skills/markets/
```

### Update all skills
```bash
# Update core
curl -s http://localhost:3000/skills/SKILL.md > ~/.clawearn/skills/SKILL.md

# Update each enabled market
for market in $(cat ~/.clawearn/config.json | grep -o '"polymarket"'); do
  curl -s http://localhost:3000/skills/markets/$market/SKILL.md > ~/.clawearn/skills/markets/$market/SKILL.md
done
```

### Add a new market
```bash
# 1. Install the skill files
mkdir -p ~/.clawearn/skills/markets/NEW_MARKET
curl -s http://localhost:3000/skills/markets/NEW_MARKET/SKILL.md > ~/.clawearn/skills/markets/NEW_MARKET/SKILL.md

# 2. Update your config.json to add "NEW_MARKET" to enabled_markets

# 3. Set up credentials following the market's SETUP.md
```

---

## Security Best Practices

🔒 **CRITICAL:**
- Read `core/SECURITY.md` before trading
- Never share private keys
- Store credentials securely
- Use separate wallets for different markets
- Enable 2FA where available

---

## File Reference

| File | URL |
|------|-----|
| **SKILL.md** (this file) | `https://clawearn.xyz/skills/SKILL.md` |
| **HEARTBEAT.md** | `https://clawearn.xyz/skills/HEARTBEAT.md` |
| **core/wallet/SKILL.md** | `https://clawearn.xyz/skills/core/wallet/SKILL.md` |
| **core/security/SKILL.md** | `https://clawearn.xyz/skills/core/security/SKILL.md` |
| **markets/polymarket/SKILL.md** | `https://clawearn.xyz/skills/markets/polymarket/SKILL.md` |
| **markets/polymarket/HEARTBEAT.md** | `https://clawearn.xyz/skills/markets/polymarket/HEARTBEAT.md` |
| **markets/hyperliquid/SKILL.md** | `https://clawearn.xyz/skills/markets/hyperliquid/SKILL.md` |

---

## Getting Help

- **Core wallet issues**: See `core/wallet/SKILL.md`
- **Security questions**: See `core/security/SKILL.md`
- **Polymarket help**: See `markets/polymarket/SKILL.md`
- **Hyperliquid help**: See `markets/hyperliquid/SKILL.md`
- **General trading**: See `HEARTBEAT.md` for routine checks

---

**Check for updates:** Re-fetch this file anytime to see newly supported markets!

```bash
curl -s https://clawearn.xyz/skills/SKILL.md | grep '^version:'
```

**Ready to start?** Install the core skills, choose your markets, and begin trading! 🚀
