# Hyperliquid Phase 6 - EIP-712 Signing Implementation Plan

## Overview

Phase 6 will implement the cryptographic signing required to execute orders on Hyperliquid. This phase bridges the validation framework (Phase 5) with actual order placement via the `/exchange` endpoint.

## Architecture

```
Phase 5 (Complete)          Phase 6 (In Progress)        Phase 7+ (Future)
┌──────────────────┐       ┌──────────────────┐        ┌──────────────────┐
│ Order Validation │  -->  │ Signing & Submit │  -->   │ Position Mgmt    │
│ + Framework      │       │ to Exchange      │        │ + Advanced Types │
└──────────────────┘       └──────────────────┘        └──────────────────┘
                                    │
                                    ├─ EIP-712 Signing
                                    ├─ Phantom Agent
                                    ├─ Msgpack Serialization
                                    └─ /exchange Endpoint
```

## Components

### 1. New Module: hyperliquid-signing.ts ✅ (Created)

**Status:** Framework implemented, placeholders for full signing

**Features:**
- ✅ EIP-712 domain creation
- ✅ Signature component verification
- ✅ Signing framework with ethers.js
- ✅ L1 action signing interface
- ✅ Signature formatting for API
- 🚧 Phantom agent construction (TODO)
- 🚧 Msgpack serialization (TODO)

**Key Functions:**
```typescript
createHyperliquidDomain()          // EIP-712 domain
signEIP712Message()                 // Generic EIP-712 signing
signL1Action()                      // L1 action signing
verifySignatureComponents()         // Validate signature
formatSignatureForAPI()             // Format for submission
createOrderAction()                 // Convert order to L1 action
validateSignatureForExchange()      // Pre-submission check
```

### 2. Updated: hyperliquid-exchange.ts ✅ (Enhanced)

**Status:** placeOrder function enhanced with Phase 6 framework

**Changes:**
- ✅ Order validation integration
- ✅ Asset index lookup framework
- ✅ Order action creation
- 🚧 Signing integration (TODO)
- 🚧 Exchange submission (TODO)

### 3. Updated: hyperliquid.ts ✅ (Integrated)

**Status:** Imports signing module types

**Changes:**
- ✅ Import placeOrder function
- ✅ Import SignatureComponents type
- 🚧 Use signing in order handlers (TODO)

## Implementation Roadmap

### Step 1: Msgpack Serialization
**Status:** TODO
**Requirement:** Add msgpack library to package.json
```bash
bun add msgpack
```

**Implementation:**
```typescript
// Serialize action for signing
function serializeActionForSigning(
  action: Record<string, unknown>,
  nonce: number,
  vaultAddress: string
): Buffer {
  // Serialize action with msgpack
  // Append nonce and vault address
  // Return serialized data
}
```

### Step 2: Phantom Agent Construction
**Status:** TODO
**Implementation:**

```typescript
function createPhantomAgent(
  actionHash: string
): Record<string, unknown> {
  return {
    connectionId: actionHash,
    agentAddress: wallet.address,
    // ... other fields
  };
}
```

### Step 3: Complete L1 Action Signing
**Status:** TODO
**Implementation:**

```typescript
async function signL1ActionFull(
  action: Record<string, unknown>,
  nonce: number,
  vaultAddress: string,
  wallet: Wallet
): Promise<SignatureComponents> {
  // 1. Serialize with msgpack
  const serialized = serializeActionForSigning(action, nonce, vaultAddress);
  
  // 2. Hash with keccak256
  const hash = ethers.utils.keccak256(serialized);
  
  // 3. Create phantom agent
  const phantom = createPhantomAgent(hash);
  
  // 4. Sign phantom agent with EIP-712
  // 5. Return signature components
}
```

### Step 4: Asset Index Lookup
**Status:** TODO
**Implementation:**

```typescript
async function getAssetIndexFull(symbol: string): Promise<number> {
  // Call /info endpoint with "meta" type
  // Search for symbol
  // Return asset index
}
```

### Step 5: Exchange Endpoint Integration
**Status:** TODO
**Implementation:**

```typescript
async function submitOrderToExchange(
  action: Record<string, unknown>,
  nonce: number,
  signature: SignatureComponents,
  signer: Wallet
): Promise<ExchangeResponse> {
  // 1. Format request body
  // 2. Add signature
  // 3. POST to /exchange
  // 4. Parse response
  // 5. Return order ID or error
}
```

## Testing Strategy

### Unit Tests to Add

```typescript
// Test signature component validation
test("validateSignatureComponents - valid signature", () => {
  const sig = { r: "0x...", s: "0x...", v: 27 };
  expect(verifySignatureComponents(sig)).toBe(true);
});

// Test domain creation
test("createHyperliquidDomain - correct structure", () => {
  const domain = createHyperliquidDomain();
  expect(domain.chainId).toBe(1337);
  expect(domain.name).toBe("Exchange");
});

// Test action formatting
test("createOrderAction - formats buy order", () => {
  const action = createOrderAction("BTC", "buy", 0.1, 75000);
  expect(action.orders[0].b).toBe(true);
  expect(action.orders[0].s).toBe("0.1");
});
```

### Integration Tests to Add

```typescript
// Test full signing flow (requires msgpack)
test("signL1Action - produces valid signature", async () => {
  const action = createOrderAction("BTC", "buy", 0.1, 75000);
  const nonce = Date.now();
  const sig = await signL1Action(action, nonce, wallet.address, wallet);
  expect(sig.r).toBeDefined();
  expect(sig.s).toBeDefined();
  expect(sig.v).toBe(27 || 28);
});

// Test exchange submission (requires mock)
test("submitOrderToExchange - returns order ID", async () => {
  // Mock exchange response
  const orderId = await submitOrderToExchange(...);
  expect(orderId).toMatch(/^\d+$/);
});
```

## Dependencies

### New Dependencies Needed
```json
{
  "msgpack": "^1.1.12"  // For action serialization
}
```

### Existing Dependencies Used
- `ethers.js` - For signing and wallet operations
- `bun` - Runtime environment

## API Integration Details

### /exchange Endpoint Request Format

**Successful Order:**
```json
{
  "action": {
    "type": "order",
    "orders": [
      {
        "a": 0,
        "b": true,
        "p": "75000",
        "s": "0.1",
        "r": false,
        "t": { "limit": { "tif": "Gtc" } }
      }
    ],
    "grouping": "na"
  },
  "nonce": 1707000000000,
  "signature": {
    "r": "0x...",
    "s": "0x...",
    "v": 27
  }
}
```

**Expected Response:**
```json
{
  "status": "ok",
  "response": {
    "type": "order",
    "data": {
      "statuses": [
        {
          "resting": {
            "oid": 123456789
          }
        }
      ]
    }
  }
}
```

## Error Handling

### Common Signing Errors

1. **Invalid Nonce**
   - Error: "Nonce already used"
   - Solution: Use current timestamp, ensure uniqueness per request

2. **Wrong Chain ID**
   - Error: "Chain ID mismatch"
   - Solution: Use 1337 for L1 actions (not 42161 for Arbitrum)

3. **Invalid Signature**
   - Error: "Invalid signature"
   - Solution: Verify r, s, v components; check action serialization

4. **Missing Action Fields**
   - Error: "Invalid action format"
   - Solution: Ensure all required fields present (a, b, p, s, etc.)

## Security Considerations

### During Signing
- ✅ Private key never exposed
- ✅ Message verified before signing
- ✅ Nonce checked for replay prevention
- ✅ Chain ID validated

### After Signing
- ✅ Signature components verified (27 ≤ v ≤ 28)
- ✅ Action immutability ensured
- ✅ Rate limits respected
- ✅ Transaction monitoring

## Timeline

**Phase 6 Implementation Phases:**

1. **Week 1: Setup & Dependencies**
   - Add msgpack library
   - Set up test suite for signing
   - Create test fixtures

2. **Week 2: Core Signing**
   - Implement msgpack serialization
   - Implement phantom agent construction
   - Complete L1 action signing

3. **Week 3: Integration**
   - Complete asset index lookup
   - Integrate with placeOrder
   - Add exchange endpoint submission

4. **Week 4: Testing & Polish**
   - Full integration tests
   - Error handling & edge cases
   - Documentation updates

## Current Status

**Already Completed:**
- ✅ Phase 5: Order validation framework
- ✅ Signing module created with framework
- ✅ EIP-712 domain setup
- ✅ Signature verification framework

**In Progress:**
- 🚧 Msgpack integration
- 🚧 Phantom agent construction
- 🚧 Full L1 action signing
- 🚧 Asset index lookup
- 🚧 Exchange submission

**Not Yet Started:**
- ❌ Order cancellation signing
- ❌ Advanced order types (triggers, TWAP)
- ❌ Position management

## References

- [Hyperliquid Signing Docs](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/signing)
- [EIP-712 Standard](https://eips.ethereum.org/EIPS/eip-712)
- [Exchange Endpoint](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint)
- [Asset IDs](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/asset-ids)

## Next Steps

1. ✅ Review this plan
2. 🚧 Add msgpack dependency
3. 🚧 Implement msgpack serialization
4. 🚧 Implement phantom agent construction
5. 🚧 Complete L1 action signing
6. 🚧 Implement asset index lookup
7. 🚧 Test all signing flows
8. 🚧 Integrate with CLI
9. ✅ Document changes
10. 🚧 Deploy to testnet

## Questions & Issues

- **Q: Do we need to handle rate limits?**
  - A: Yes, implement backoff strategy in exchange submission

- **Q: How do we test without real funds?**
  - A: Use testnet: https://api.hyperliquid-testnet.xyz

- **Q: What about transaction confirmation?**
  - A: Poll /info orderStatus endpoint or use WebSocket

---

**Status:** Phase 6 - Framework ready, signing implementation TODO
**Date:** February 4, 2026
**Next Review:** After msgpack integration
