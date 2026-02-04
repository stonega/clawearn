# Wallet Management Guide 💼

Complete guide to setting up wallets, managing funds, and sending USDC for prediction market trading.

---

## Overview

Your wallet is the gateway to trading on prediction markets. Clawearn handles wallet creation, security, and provides tools to send USDC directly from your wallet to other addresses on Arbitrum.

### What You Can Do
- ✅ Create new wallets instantly
- ✅ Send USDC to other addresses
- ✅ Check balances across markets
- ✅ Manage multiple wallets securely
- ✅ Export and backup credentials


---

## Quick Reference

### Create & Show Your Wallet

```bash
# Create a new wallet (one-time setup)
clawearn wallet create

# Display your wallet address anytime
clawearn wallet show
```

### Send USDC to Another Address

```bash
# Send USDC to another Ethereum address on Arbitrum
clawearn wallet send --to 0x742d35Cc6634C0532925a3b844Bc9e7595f42aED --amount 100

# Verify it worked
clawearn wallet show
```

---

## Detailed Setup

### Polymarket Wallet Setup

#### Option 1: Create New Wallet (Recommended for Agents)

```bash
# Using the CLI tool
clawearn wallet create

# Export the private key
clawearn wallet export
```

**Save the private key securely:**
```bash
# Create secure storage
mkdir -p ~/.config/clawearn
chmod 700 ~/.config/clawearn

# Save private key (replace with your actual key)
echo "0xYOUR_PRIVATE_KEY_HERE" > ~/.config/clawearn/polymarket-key.txt
chmod 600 ~/.config/clawearn/polymarket-key.txt

# Set environment variable
export POLYMARKET_PRIVATE_KEY=$(cat ~/.config/clawearn/polymarket-key.txt)
```

### Option 2: Use Existing Wallet

If you already have a wallet:

```bash
# Save your existing private key
echo "0xYOUR_EXISTING_KEY" > ~/.config/clawearn/polymarket-key.txt
chmod 600 ~/.config/clawearn/polymarket-key.txt
```

### Getting Funds

**Option 1: Send from another wallet (Recommended)**
```bash
# Send USDC from another address to your wallet
clawearn wallet send --to YOUR_WALLET_ADDRESS --amount 100
```

**Option 2: Deposit from external source**
1. Bridge USDC to Arbitrum network
2. Send to your wallet address from `clawearn wallet show`
3. Verify balance:
```bash
clawearn polymarket balance check
```

---

## Sending USDC (NEW Feature ✨)

### What is `clawearn wallet send`?

Send USDC directly from your wallet to any Ethereum address on Arbitrum network. Perfect for:
- Funding another agent's wallet
- Transferring between your own wallets
- Distributing profits across accounts
- Consolidating funds

### How to Send USDC

**Basic command:**
```bash
clawearn wallet send --to <recipient-address> --amount <amount>
```

**Example:**
```bash
# Send 100 USDC to another address
clawearn wallet send --to 0x742d35Cc6634C0532925a3b844Bc9e7595f42aED --amount 100
```

### What Happens

The command will:
1. ✅ Validate the recipient address format
2. ✅ Validate the amount (must be positive)
3. ✅ Check you have enough ETH for gas fees
4. ✅ Check you have enough USDC for the transfer
5. ✅ Execute the transfer on Arbitrum
6. ✅ Wait for confirmation
7. ✅ Display the transaction hash

### Example Output

```
Preparing USDC transfer...
From: 0x9Eb60033E4FdE90839e586DdAE9d9Edef7a5A873
To:   0x742d35Cc6634C0532925a3b844Bc9e7595f42aED
Amount: 100 USDC

Sending 100 USDC...
Transaction sent! Hash: 0x123abc...
Waiting for confirmation...
✅ Transfer successful!
100 USDC sent to 0x742d35Cc6634C0532925a3b844Bc9e7595f42aED
```

### Requirements

To send USDC, you need:
- ✅ Existing wallet (created with `clawearn wallet create`)
- ✅ USDC balance on Arbitrum
- ✅ Some ETH on Arbitrum for gas fees
- ✅ Valid recipient Ethereum address

### Common Issues

**"Insufficient USDC balance"**
- You don't have enough USDC
- Solution: Deposit more USDC to your wallet

**"Insufficient ETH on Arbitrum for gas fees"**
- You need ETH to pay transaction fees
- Solution: Send some ETH to your wallet address

**"Invalid recipient address"**
- The recipient address format is wrong
- Must be valid Ethereum address (0x followed by 40 hex characters)

**"Invalid amount"**
- Amount must be a positive number
- Can't be zero or negative

---

## Manifold Wallet Setup

🚧 **Coming Soon**

Manifold uses account-based authentication with play money (Mana).

**Planned setup:**
```bash
# Register account
curl -X POST https://manifold.markets/api/v0/me/register \
  -H "Content-Type: application/json" \
  -d '{"username": "YourAgentName", "email": "agent@example.com"}'

# Get API key
# Save to ~/.config/clawearn/manifold-key.txt
```

---

## Kalshi Wallet Setup

🚧 **Coming Soon**

Kalshi uses traditional account-based system with USD.

**Planned setup:**
1. Create account on Kalshi.com
2. Complete KYC verification
3. Link bank account
4. Get API credentials
5. Save to `~/.config/clawearn/kalshi-credentials.json`

---

## Multi-Wallet Management

### Recommended Structure

```
~/.config/clawearn/
├── polymarket-key.txt          # Polymarket private key
├── manifold-key.txt            # Manifold API key
├── kalshi-credentials.json     # Kalshi API credentials
└── master-config.json          # All wallet addresses and settings
```

### Master Config Example

**`~/.config/clawearn/master-config.json`**
```json
{
  "wallets": {
    "polymarket": {
      "address": "0x1234...",
      "key_path": "~/.config/clawearn/polymarket-key.txt",
      "signature_type": 0,
      "network": "polygon",
      "enabled": true
    },
    "manifold": {
      "username": "YourAgent",
      "key_path": "~/.config/clawearn/manifold-key.txt",
      "enabled": false
    },
    "kalshi": {
      "user_id": "your-user-id",
      "key_path": "~/.config/clawearn/kalshi-credentials.json",
      "enabled": false
    }
  },
  "default_market": "polymarket"
}
```

---

## Security Checklist

### ✅ Essential Security Practices

- [ ] Private keys stored in `~/.config/clawearn/` with 600 permissions
- [ ] Directory has 700 permissions (only you can access)
- [ ] Keys never committed to git (add to .gitignore)
- [ ] Keys never logged or printed to console
- [ ] Keys never sent to external services
- [ ] Separate wallets for testing vs production
- [ ] Regular backups of wallet addresses (not keys!)
- [ ] Environment variables used instead of hardcoded keys

### 🔒 Advanced Security

- [ ] Hardware wallet integration (for large amounts)
- [ ] Multi-sig wallets for production trading
- [ ] Separate hot/cold wallets
- [ ] Regular security audits of credential storage
- [ ] Encrypted backups of keys
- [ ] 2FA enabled on all market accounts

---

## Wallet Operations

### Check Balance Across All Markets

```bash
# Polymarket
bun polymarket-cli.ts balance check --private-key $POLYMARKET_PRIVATE_KEY

# Manifold (coming soon)
# curl https://manifold.markets/api/v0/me -H "Authorization: Bearer $MANIFOLD_KEY"

# Kalshi (coming soon)
# curl https://api.kalshi.com/v1/balance -H "Authorization: Bearer $KALSHI_KEY"
```

### Export Wallet Addresses

```bash
# Create a reference file (safe to share, no private keys)
cat > ~/.clawearn/wallet-addresses.txt << EOF
Polymarket: $(bun polymarket-cli.ts account info --private-key $POLYMARKET_PRIVATE_KEY | grep address)
Manifold: YourUsername
Kalshi: your-user-id
EOF
```

---

## Backup and Recovery

### What to Backup

**✅ Must backup:**
- Private keys (encrypted!)
- Wallet addresses
- Account usernames/emails
- Recovery phrases (if applicable)

**❌ Don't backup:**
- API responses
- Temporary session tokens
- Cached data

### Backup Script

```bash
#!/bin/bash
# backup-wallets.sh

BACKUP_DIR=~/clawearn-backup-$(date +%Y%m%d)
mkdir -p $BACKUP_DIR

# Backup config (contains addresses, not keys)
cp ~/.clawearn/config.json $BACKUP_DIR/

# Backup wallet addresses
cp ~/.clawearn/wallet-addresses.txt $BACKUP_DIR/

# Create encrypted backup of keys
tar -czf - ~/.config/clawearn/*.txt | \
  gpg --symmetric --cipher-algo AES256 > $BACKUP_DIR/keys-encrypted.tar.gz.gpg

echo "Backup created at $BACKUP_DIR"
echo "Store the encrypted keys file in a secure location!"
```

### Recovery Script

```bash
#!/bin/bash
# recover-wallets.sh

BACKUP_DIR=$1

# Restore config
cp $BACKUP_DIR/config.json ~/.clawearn/

# Decrypt and restore keys
gpg --decrypt $BACKUP_DIR/keys-encrypted.tar.gz.gpg | \
  tar -xzf - -C ~/

echo "Wallets restored. Verify with balance checks."
```

---

## Troubleshooting

### "Insufficient balance" error
```bash
# Check actual balance
bun polymarket-cli.ts balance check --private-key $POLYMARKET_PRIVATE_KEY

# Request testnet funds
bun polymarket-cli.ts balance pocket-money --amount 100
```

### "Invalid private key" error
```bash
# Verify key format (should start with 0x)
cat ~/.config/clawearn/polymarket-key.txt

# Re-export if needed
bun polymarket-cli.ts account export-key --email YOUR_EMAIL --password YOUR_PASSWORD
```

### "Permission denied" when accessing keys
```bash
# Fix permissions
chmod 700 ~/.config/clawearn
chmod 600 ~/.config/clawearn/*.txt
```

### Lost private key
⚠️ **If you lose your private key, you lose access to your funds!**

- Check backups immediately
- Check environment variables: `echo $POLYMARKET_PRIVATE_KEY`
- Check if you saved it elsewhere
- If truly lost, create a new wallet and transfer funds from the old one (if you have access via another method)

---

## Best Practices

1. **One wallet per market** - Don't reuse the same private key across different platforms
2. **Test with small amounts** - Always test with minimal funds first
3. **Regular balance checks** - Monitor for unexpected changes
4. **Secure environment variables** - Use `.env` files that are gitignored
5. **Document your setup** - Keep notes on which wallet is for what
6. **Regular backups** - Weekly encrypted backups of keys
7. **Separate test/prod** - Different wallets for testing vs real trading

---

## Quick Reference

```bash
# Setup new Polymarket wallet
bun polymarket-cli.ts account create --email agent@example.com --password PASS
bun polymarket-cli.ts account export-key --email agent@example.com --password PASS

# Save key securely
mkdir -p ~/.config/clawearn && chmod 700 ~/.config/clawearn
echo "0xKEY" > ~/.config/clawearn/polymarket-key.txt && chmod 600 ~/.config/clawearn/polymarket-key.txt

# Set environment variable
export POLYMARKET_PRIVATE_KEY=$(cat ~/.config/clawearn/polymarket-key.txt)

# Check balance
bun polymarket-cli.ts balance check --private-key $POLYMARKET_PRIVATE_KEY

# Get testnet funds
bun polymarket-cli.ts balance pocket-money --amount 100
```

---

**Next Steps:**
1. ✅ Set up your wallet(s)
2. ✅ Secure your private keys
3. ✅ Fund your account(s)
4. 📖 Read the market-specific SKILL.md files
5. 🚀 Start trading!
