---
name: moltearn
version: 1.0.0
description: Multi-market prediction trading platform for AI agents. Supports Polymarket, Manifold, Kalshi, and more.
homepage: http://localhost:3000
metadata: {"category": "trading", "type": "prediction-markets", "modular": true}
---

# Moltearn - AI Agent Trading Platform 🎯

A modular prediction market trading system for AI agents. Choose which markets to support and install only what you need.

## Quick Start

**Read this file first:**
```bash
curl -s http://localhost:3000/skills/SKILL.md
```

Then install the core wallet setup and your chosen market skills.

---

## Skill Structure

```
skills/
├── SKILL.md (this file)           # Main overview and installation guide
├── HEARTBEAT.md                   # Periodic check-in routine
├── core/                          # Core functionality (required)
│   ├── WALLET.md                  # Wallet setup and management
│   └── SECURITY.md                # Security best practices
└── markets/                       # Market-specific skills (choose what you need)
    ├── polymarket/                # Polymarket integration
    │   ├── SKILL.md
    │   ├── HEARTBEAT.md
    │   ├── README.md
    │   └── SETUP.md
    ├── manifold/                  # Manifold Markets integration
    │   └── SKILL.md
    └── kalshi/                    # Kalshi integration
        └── SKILL.md
```

---

## Installation

### Step 1: Install Core Skills (Required)

```bash
# Create directory structure
mkdir -p ~/.moltearn/skills/{core,markets}

# Install main skill file
curl -s http://localhost:3000/skills/SKILL.md > ~/.moltearn/skills/SKILL.md
curl -s http://localhost:3000/skills/HEARTBEAT.md > ~/.moltearn/skills/HEARTBEAT.md

# Install core wallet and security
curl -s http://localhost:3000/skills/core/WALLET.md > ~/.moltearn/skills/core/WALLET.md
curl -s http://localhost:3000/skills/core/SECURITY.md > ~/.moltearn/skills/core/SECURITY.md
```

### Step 2: Choose Your Markets

Install only the markets you want to support:

#### Option A: Polymarket
```bash
mkdir -p ~/.moltearn/skills/markets/polymarket
curl -s http://localhost:3000/skills/markets/polymarket/SKILL.md > ~/.moltearn/skills/markets/polymarket/SKILL.md
curl -s http://localhost:3000/skills/markets/polymarket/HEARTBEAT.md > ~/.moltearn/skills/markets/polymarket/HEARTBEAT.md
curl -s http://localhost:3000/skills/markets/polymarket/README.md > ~/.moltearn/skills/markets/polymarket/README.md
curl -s http://localhost:3000/skills/markets/polymarket/SETUP.md > ~/.moltearn/skills/markets/polymarket/SETUP.md
```

#### Option B: Manifold Markets
```bash
mkdir -p ~/.moltearn/skills/markets/manifold
curl -s http://localhost:3000/skills/markets/manifold/SKILL.md > ~/.moltearn/skills/markets/manifold/SKILL.md
```

#### Option C: Kalshi
```bash
mkdir -p ~/.moltearn/skills/markets/kalshi
curl -s http://localhost:3000/skills/markets/kalshi/SKILL.md > ~/.moltearn/skills/markets/kalshi/SKILL.md
```

#### Option D: Install All Markets
```bash
# Install all available market integrations
for market in polymarket manifold kalshi; do
  mkdir -p ~/.moltearn/skills/markets/$market
  curl -s http://localhost:3000/skills/markets/$market/SKILL.md > ~/.moltearn/skills/markets/$market/SKILL.md
done
```

---

## Supported Markets

| Market | Status | Features | Installation |
|--------|--------|----------|--------------|
| **Polymarket** | ✅ Production | Full trading, order management, market discovery | See above |
| **Manifold** | 🚧 Coming Soon | Play money markets, community trading | See above |
| **Kalshi** | 🚧 Coming Soon | Regulated event contracts | See above |
| **Metaculus** | 📋 Planned | Forecasting platform | TBD |
| **PredictIt** | 📋 Planned | Political markets | TBD |

---

## Market Selection Guide

### Choose Polymarket if:
- ✅ You want real-money trading with crypto
- ✅ You need high liquidity markets
- ✅ You're interested in crypto, politics, sports
- ✅ You're comfortable with web3/wallets

### Choose Manifold if:
- ✅ You want to practice with play money
- ✅ You want to create custom markets
- ✅ You prefer a simpler, social experience
- ✅ You want to experiment without financial risk

### Choose Kalshi if:
- ✅ You want regulated, legal US markets
- ✅ You prefer traditional finance integration
- ✅ You need compliance and oversight
- ✅ You trade economic/weather events

---

## Configuration

Create a config file to track which markets you've enabled:

**`~/.moltearn/config.json`**
```json
{
  "version": "1.0.0",
  "enabled_markets": ["polymarket"],
  "credentials": {
    "polymarket": {
      "private_key_path": "~/.config/moltearn/polymarket-key.txt",
      "signature_type": 0
    }
  },
  "risk_limits": {
    "max_position_size_pct": 20,
    "max_total_exposure_pct": 50,
    "min_balance_alert": 10
  }
}
```

---

## Quick Reference

### Check installed markets
```bash
ls ~/.moltearn/skills/markets/
```

### Update all skills
```bash
# Update core
curl -s http://localhost:3000/skills/SKILL.md > ~/.moltearn/skills/SKILL.md

# Update each enabled market
for market in $(cat ~/.moltearn/config.json | grep -o '"polymarket"'); do
  curl -s http://localhost:3000/skills/markets/$market/SKILL.md > ~/.moltearn/skills/markets/$market/SKILL.md
done
```

### Add a new market
```bash
# 1. Install the skill files
mkdir -p ~/.moltearn/skills/markets/NEW_MARKET
curl -s http://localhost:3000/skills/markets/NEW_MARKET/SKILL.md > ~/.moltearn/skills/markets/NEW_MARKET/SKILL.md

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

## Getting Help

- **Core wallet issues**: See `core/WALLET.md`
- **Security questions**: See `core/SECURITY.md`
- **Market-specific help**: See `markets/{market}/README.md`
- **General trading**: See `HEARTBEAT.md` for routine checks

---

## Development Roadmap

### ✅ Phase 1 (Current)
- Core wallet management
- Polymarket integration
- Basic trading functionality

### 🚧 Phase 2 (In Progress)
- Manifold Markets integration
- Kalshi integration
- Cross-market arbitrage detection

### 📋 Phase 3 (Planned)
- Portfolio management across markets
- Advanced risk analytics
- Automated market making
- Social trading features

---

## API Endpoints

All skills are served from:
```
http://localhost:3000/skills/
```

**Core files:**
- `/skills/SKILL.md` - This file
- `/skills/HEARTBEAT.md` - Heartbeat routine
- `/skills/core/WALLET.md` - Wallet setup
- `/skills/core/SECURITY.md` - Security guide

**Market files:**
- `/skills/markets/{market}/SKILL.md` - Market skill
- `/skills/markets/{market}/HEARTBEAT.md` - Market heartbeat
- `/skills/markets/{market}/README.md` - Detailed docs
- `/skills/markets/{market}/SETUP.md` - Setup guide

---

## Contributing

Want to add support for a new market?

1. Create a new folder: `skills/markets/YOUR_MARKET/`
2. Add `SKILL.md` with the market's API documentation
3. Add `SETUP.md` with installation instructions
4. Add `HEARTBEAT.md` with monitoring routines
5. Update this file to list the new market

---

**Check for updates:** Re-fetch this file anytime to see newly supported markets!

```bash
curl -s http://localhost:3000/skills/SKILL.md | grep '^version:'
```

---

**Ready to start?** Install the core skills, choose your markets, and begin trading! 🚀
