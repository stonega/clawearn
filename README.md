# clawearn

Prediction market trading CLI for Polymarket with integrated wallet management.

## Installation

```bash
bun install
bun link
```

## Quick Start

### 1. Create a Wallet

```bash
clawearn wallet create
```

This creates a new wallet stored at `~/.config/clawearn/wallet.json` and displays your wallet address.

### 2. Fund Your Wallet

Send USDC to your wallet address on Arbitrum network.

### 3. Start Trading

```bash
# Search for markets
clawearn polymarket market search --query "bitcoin 2025"

# Place a buy order (automatically uses your stored wallet)
clawearn polymarket order buy \
  --token-id 0x... \
  --price 0.50 \
  --size 10
```

## Wallet Integration

Your wallet created with `clawearn wallet create` is automatically integrated with all Polymarket trading commands:

- **Storage**: Stored securely at `~/.config/clawearn/wallet.json`
- **Auto-detection**: All trading commands automatically use your stored wallet
- **Manual override**: Use `--private-key <key>` to use a different wallet temporarily

## Available Commands

### Wallet Management
```bash
clawearn wallet create                                  # Create new wallet
clawearn wallet show                                   # Display wallet address
clawearn wallet send --to <addr> --amount <amount>     # Send USDC to address
```

### Market Operations
```bash
clawearn polymarket market search --query "query"      # Search markets
clawearn polymarket market list --limit 10             # List active markets
clawearn polymarket market info --market-id <id>       # Get market details
```

### Trading
```bash
# Buy shares (uses stored wallet automatically)
clawearn polymarket order buy \
  --token-id <token-id> \
  --price <price> \
  --size <size>

# Sell shares
clawearn polymarket order sell \
  --token-id <token-id> \
  --price <price> \
  --size <size>

# List open orders
clawearn polymarket order list-open

# Cancel order
clawearn polymarket order cancel --order-id <id>
```

### Pricing & Balance
```bash
clawearn polymarket price get --token-id <id>         # Get current price
clawearn polymarket price book --token-id <id>        # Get order book
clawearn polymarket balance check                      # Check API connection
```

## Examples

### Send USDC to another wallet
```bash
# Send 100 USDC to another address on Arbitrum
clawearn wallet send --to 0x742d35Cc6634C0532925a3b844Bc9e7595f42aED --amount 100
```

The command will:
1. Check your USDC balance on Arbitrum
2. Verify you have enough ETH for gas fees
3. Execute the transfer
4. Display the transaction hash and confirmation

## Development

This project was created using `bun init` in bun v1.2.19. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

To run tests:
```bash
bun test
```
