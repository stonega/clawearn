---
name: hyperliquid-trading
description: "Trade perpetual futures on Hyperliquid using the clawearn CLI. Use when working with Hyperliquid trading, managing positions, deposits, or withdrawals on Arbitrum."
---

# Hyperliquid Trading Skill

Trade perpetual futures on Hyperliquid directly from the clawearn CLI. Supports market data, order management, account info, and Arbitrum deposits/withdrawals.

## Setup

Ensure clawearn is installed and a wallet exists:

```bash
clawearn wallet create
```

## Core Commands

### Account & Balance

Check your account status and USDC balance:

```bash
clawearn hyperliquid account          # Show wallet address
clawearn hyperliquid balance          # View balance and open positions
clawearn hl balance                   # Shorthand alias
```

### Market Data

List available coins and check prices:

```bash
clawearn hyperliquid market list      # List all available coins with max leverage
clawearn hyperliquid market info --coin ETH  # Get order book for a coin
clawearn hyperliquid price --coin BTC # Get current bid/ask/mid prices
```

### Trading - Place Orders

Place buy or sell orders on any perpetual:

```bash
# Buy 0.1 ETH at 3000 USDC
clawearn hyperliquid order buy --coin ETH --price 3000 --size 0.1

# Sell 0.05 BTC at 45000 USDC
clawearn hyperliquid order sell --coin BTC --price 45000 --size 0.05

# List open orders
clawearn hyperliquid order list-open
```

**Parameters:**
- `--coin`: Coin name (ETH, BTC, SOL, etc.)
- `--price`: Price per unit (decimal)
- `--size`: Amount to trade

### Positions

View and manage open positions:

```bash
clawearn hyperliquid position         # View all open positions with entry price and leverage
```

### Deposits

Deposit USDC to your Hyperliquid account via Arbitrum:

```bash
# Deposit 100 USDC
clawearn hyperliquid deposit --amount 100

# Deposit from different wallet (with private key)
clawearn hyperliquid deposit --amount 50 --private-key 0x...
```

**Requirements:**
- Minimum 5 USDC deposit
- Requires USDC on Arbitrum
- Uses native USDC (0xaf88d065...)

### Withdrawals

Withdraw USDC back to your Arbitrum wallet:

```bash
# Withdraw 100 USDC to your wallet
clawearn hyperliquid withdraw --amount 100

# Withdraw to a specific address
clawearn hyperliquid withdraw --amount 50 --recipient 0x...

# Withdraw from different wallet (with private key)
clawearn hyperliquid withdraw --amount 100 --private-key 0x...
```

**Requirements:**
- Minimum 5 USDC withdrawal
- Withdraws to Arbitrum network only

## Common Workflows

### 1. Find and Trade a Coin

```bash
# List all available coins
clawearn hyperliquid market list

# Check price for a coin
clawearn hyperliquid price --coin ETH

# Place a buy order
clawearn hyperliquid order buy --coin ETH --price 2000 --size 0.1

# Check your position
clawearn hyperliquid position
```

### 2. Deposit and Start Trading

```bash
# Deposit 100 USDC
clawearn hyperliquid deposit --amount 100

# Check balance
clawearn hyperliquid balance

# Place first trade
clawearn hyperliquid order buy --coin SOL --price 200 --size 0.5
```

### 3. Close and Withdraw

```bash
# View open positions
clawearn hyperliquid position

# Sell (close) your position
clawearn hyperliquid order sell --coin SOL --price 200 --size 0.5

# Check balance
clawearn hyperliquid balance

# Withdraw remaining USDC
clawearn hyperliquid withdraw --amount 50
```

## Key Details

### Network
- **Deposits:** Arbitrum only
- **Withdrawals:** Arbitrum only
- **Trading:** Hyperliquid perpetual futures (not on-chain)

### USDC
- Native USDC on Arbitrum: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`
- Hyperliquid Vault: `0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7`
- Decimals: 6

### Limits
- Minimum deposit: 5 USDC
- Minimum withdrawal: 5 USDC
- Deposit time: 1-2 minutes
- Orders: GTC (Good-till-Cancelled) limit orders

### Leverage

Max leverage varies by coin:
- BTC, ETH: Up to 40x, 25x
- Most altcoins: 5x-20x
- Some coins: 3x (GMX, SNX)

Check `clawearn hyperliquid market list` for max leverage per coin.

## Aliases

Use shorthand `hl` instead of `hyperliquid`:

```bash
clawearn hl market list
clawearn hl order buy --coin ETH --price 3000 --size 0.1
clawearn hl balance
```

## Help

View full command help:

```bash
clawearn hyperliquid help
clawearn hyperliquid order help      # Order-specific help
clawearn hl help                      # Shorthand
```

## Troubleshooting

### "No wallet found"
Create a wallet with: `clawearn wallet create`

### Deposit failing
- Ensure you have USDC on Arbitrum
- Check minimum 5 USDC requirement
- Verify wallet address with: `clawearn wallet show`

### Order rejected
- Insufficient margin (check balance)
- Invalid coin name (run `clawearn hyperliquid market list`)
- Price/size may be invalid for the pair

### Slow transactions
Try again - Arbitrum typically confirms in 30 seconds
