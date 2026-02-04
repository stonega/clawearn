# Wallet Send Feature

## Overview

The `clawearn wallet send` command enables users to send USDC directly from their wallet to any address on the Arbitrum network.

## Command Syntax

```bash
clawearn wallet send --to <address> --amount <amount>
```

## Parameters

- `--to <address>`: Recipient Ethereum address (required)
- `--amount <amount>`: Amount of USDC to send (required, must be positive number)

## Features

### Validation
- ✅ Validates recipient address format (must be valid Ethereum address)
- ✅ Validates amount (must be numeric and positive)
- ✅ Checks sender has sufficient USDC balance
- ✅ Checks sender has sufficient ETH for gas fees
- ✅ Confirms wallet file exists before attempting transfer

### Automatic Checks
1. **ETH Balance Check**: Ensures sufficient ETH for gas fees
2. **USDC Balance Check**: Ensures sufficient USDC for transfer
3. **Address Validation**: Validates recipient address format
4. **Amount Validation**: Ensures amount is valid and positive

### Transaction Details
- Automatically formats amounts to USDC decimals (6)
- Uses Arbitrum native USDC token (`0xaf88d065e77c8cC2239327C5EDb3A432268e5831`)
- Waits for transaction confirmation before reporting success
- Displays transaction hash for verification

## Usage Examples

### Basic Transfer
```bash
# Send 100 USDC to another address
clawearn wallet send --to 0x742d35Cc6634C0532925a3b844Bc9e7595f42aED --amount 100
```

Output:
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

### Transfer Failure Cases

**Insufficient USDC**
```bash
$ clawearn wallet send --to 0x742d... --amount 1000

Preparing USDC transfer...
From: 0x9Eb60...
To:   0x742d...
Amount: 1000 USDC

❌ Insufficient USDC balance on Arbitrum
   Required: 1000
   Available: 50
```

**Insufficient ETH for Gas**
```bash
$ clawearn wallet send --to 0x742d... --amount 100

Preparing USDC transfer...
From: 0x9Eb60...
To:   0x742d...
Amount: 100 USDC

❌ Insufficient ETH on Arbitrum for gas fees
Please send some ETH to your wallet for gas.
```

**Invalid Address**
```bash
$ clawearn wallet send --to invalid-address --amount 100

❌ Invalid recipient address: invalid-address
```

**Invalid Amount**
```bash
$ clawearn wallet send --to 0x742d... --amount -50

❌ Invalid amount: -50
```

## Network Details

- **Network**: Arbitrum One (Chain ID: 42161)
- **RPC Endpoint**: `https://arb1.arbitrum.io/rpc`
- **USDC Token**: Native USDC (`0xaf88d065e77c8cC2239327C5EDb3A432268e5831`)
- **USDC Decimals**: 6

## Requirements

1. **Wallet**: Must have a wallet created with `clawearn wallet create`
2. **USDC**: Must have USDC balance on Arbitrum
3. **ETH**: Must have ETH on Arbitrum for gas fees
4. **Network**: Must have internet connection to Arbitrum RPC

## Implementation Details

### File Structure
- **Function**: `handleSend(args: string[])` in `src/cli/commands/wallet.ts`
- **Tests**: `src/cli/commands/wallet.test.ts`

### Validation Steps
1. Parse and validate `--to` and `--amount` arguments
2. Validate Ethereum address format
3. Validate amount is numeric and positive
4. Load wallet from `~/.config/clawearn/wallet.json`
5. Connect to Arbitrum RPC
6. Check ETH balance for gas
7. Get USDC contract instance
8. Check USDC balance
9. Execute transfer
10. Wait for confirmation

### Error Handling
- Clear error messages for each failure case
- No execution if validation fails
- Safe exit on errors (exit code 1)

## Security Considerations

1. **Private Key**: Uses stored private key from wallet file
2. **Network**: Uses public Arbitrum RPC (no private data transmitted)
3. **Validation**: Validates all inputs before execution
4. **Gas**: Automatically calculated by ethers.js

## Testing

### Unit Tests (7 tests)
- ✅ Missing required arguments
- ✅ Invalid recipient address
- ✅ Invalid amount (non-numeric)
- ✅ Negative amount
- ✅ Zero amount

### Integration Tests
- ✅ Validates against real Arbitrum network
- ✅ Checks actual USDC and ETH balances
- ✅ Executes real transactions (with sufficient funds)

Run tests:
```bash
bun test src/cli/commands/wallet.test.ts
```

## Future Enhancements

- [ ] Confirmation prompt before sending large amounts
- [ ] Support for custom gas prices
- [ ] Support for sending other tokens
- [ ] Batch transfers
- [ ] Transaction history
- [ ] ENS domain support
