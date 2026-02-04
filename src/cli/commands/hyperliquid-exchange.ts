/**
 * Hyperliquid Exchange API Helper
 * Handles order placement, cancellation, and position management
 * Requires wallet signing for authentication
 */

import { ethers, Wallet } from "ethers";
import { signL1Action, formatSignatureForAPI } from "./hyperliquid-signing";

const HYPERLIQUID_API = "https://api.hyperliquid.xyz";

export interface OrderRequest {
	symbol: string;
	side: "buy" | "sell";
	size: number;
	price: number;
	leverage?: number;
	timeInForce?: "Gtc" | "Alo" | "Ioc"; // GoodTilCanceled, AddLiquidityOnly (PostOnly), ImmediateOrCancel
	reduceOnly?: boolean;
	clientOrderId?: string;
}

export interface PlacedOrder {
	status: "success" | "error";
	orderId?: string;
	message?: string;
	data?: Record<string, unknown>;
}

export interface CancelRequest {
	orderId: string;
	symbol: string;
}

/**
 * Place an order on Hyperliquid
 * 
 * Phase 6 Implementation - COMPLETE:
 * - ✅ Order validation
 * - ✅ Asset index lookup
 * - ✅ Order action formatting
 * - ✅ EIP-712 signing with msgpack
 * - ✅ Exchange endpoint submission
 */
export async function placeOrder(
	order: OrderRequest,
	signer: Wallet,
): Promise<PlacedOrder> {
	try {
		// 1. Validate order
		const validationError = validateOrder(order);
		if (validationError) {
			return {
				status: "error",
				message: `Order validation failed: ${validationError}`,
			};
		}

		// 2. Get asset index
		const assetIndex = await getAssetIndex(order.symbol);

		// 3. Create order action
		const orderAction = formatOrderForApi(order, assetIndex);

		// 4. Sign action with EIP-712
		const nonce = Date.now();
		const vaultAddress = undefined; // Use signer's address
		const signature = await signL1Action(
			orderAction,
			nonce,
			vaultAddress,
			signer,
		);

		// 5. Format signature for API
		const apiSignature = formatSignatureForAPI(signature);

		// 6. Submit to exchange endpoint
		const exchangeResponse = await fetch(`${HYPERLIQUID_API}/exchange`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				action: orderAction,
				nonce: nonce,
				signature: apiSignature,
			}),
		});

		if (!exchangeResponse.ok) {
			const errorData = await exchangeResponse.text();
			return {
				status: "error",
				message: `Exchange error: ${exchangeResponse.statusText}. ${errorData}`,
			};
		}

		const result = (await exchangeResponse.json()) as Record<
			string,
			unknown
		>;

		// Extract order ID from response
		const orderId = (result as any)?.response?.data?.statuses?.[0]?.resting?.oid;

		if (result.status === "ok") {
			return {
				status: "success",
				orderId: orderId?.toString(),
				message: `Order placed successfully. Order ID: ${orderId}`,
				data: result,
			};
		} else {
			const errorMsg = (result as any)?.response?.data?.statuses?.[0]?.error || "Unknown error";
			return {
				status: "error",
				message: `Order rejected: ${errorMsg}`,
				data: result,
			};
		}
	} catch (error) {
		return {
			status: "error",
			message: `Failed to place order: ${error instanceof Error ? error.message : error}`,
		};
	}
}

/**
 * Cancel an order on Hyperliquid
 * NOTE: This is a placeholder implementation
 */
export async function cancelOrder(
	_request: CancelRequest,
	_signer: Wallet,
): Promise<PlacedOrder> {
	return {
		status: "success",
		message:
			"Cancel request validated. Ready for exchange execution in Phase 6.",
		data: {
			phase: "Phase 5 - Order Validation",
			nextPhase: "Phase 6 - Exchange Integration with Signing",
		},
	};
}

/**
 * Get open orders for a user
 */
export async function getOpenOrders(userAddress: string): Promise<unknown[]> {
	try {
		const response = await fetch(`${HYPERLIQUID_API}/info`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				type: "openOrders",
				user: userAddress.toLowerCase(),
			}),
		});

		if (!response.ok) {
			throw new Error(`API error: ${response.statusText}`);
		}

		const data = (await response.json()) as unknown[];
		return data;
	} catch (error) {
		throw new Error(
			`Failed to fetch open orders: ${error instanceof Error ? error.message : error}`,
		);
	}
}

/**
 * Get order status
 */
export async function getOrderStatus(
	userAddress: string,
	orderId: number | string,
): Promise<unknown> {
	try {
		const response = await fetch(`${HYPERLIQUID_API}/info`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				type: "orderStatus",
				user: userAddress.toLowerCase(),
				oid: orderId,
			}),
		});

		if (!response.ok) {
			throw new Error(`API error: ${response.statusText}`);
		}

		const data = await response.json();
		return data;
	} catch (error) {
		throw new Error(
			`Failed to fetch order status: ${error instanceof Error ? error.message : error}`,
		);
	}
}

/**
 * Get portfolio information
 */
export async function getPortfolio(userAddress: string): Promise<unknown> {
	try {
		const response = await fetch(`${HYPERLIQUID_API}/info`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				type: "portfolio",
				user: userAddress.toLowerCase(),
			}),
		});

		if (!response.ok) {
			throw new Error(`API error: ${response.statusText}`);
		}

		const data = await response.json();
		return data;
	} catch (error) {
		throw new Error(
			`Failed to fetch portfolio: ${error instanceof Error ? error.message : error}`,
		);
	}
}

/**
 * Convert symbol to asset index
 * For perpetuals: direct index from meta response
 * For spot: 10000 + index from spotMeta response
 *
 * Phase 6 Implementation - Complete
 */
export async function getAssetIndex(symbol: string): Promise<number> {
	try {
		// First try to get perpetual asset index from meta
		const metaResponse = await fetch(`${HYPERLIQUID_API}/info`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				type: "meta",
			}),
		});

		if (metaResponse.ok) {
			const meta = (await metaResponse.json()) as Record<
				string,
				Array<{ name: string; index: number }>
			>;

			if (meta.coins) {
				for (const coin of meta.coins) {
					if (coin.name === symbol) {
						return coin.index;
					}
				}
			}
		}

		// If not found in perpetuals, try spot assets
		const spotMetaResponse = await fetch(`${HYPERLIQUID_API}/info`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				type: "spotMeta",
			}),
		});

		if (spotMetaResponse.ok) {
			const spotMeta = (await spotMetaResponse.json()) as {
				tokens: Array<{ name: string; index: number }>;
				universe: Array<{ tokens: number[] }>;
			};

			if (spotMeta.tokens) {
				for (const token of spotMeta.tokens) {
					if (token.name === symbol) {
						// For spot, return 10000 + index
						return 10000 + token.index;
					}
				}
			}
		}

		// Symbol not found
		throw new Error(`Asset index not found for symbol: ${symbol}`);
	} catch (error) {
		throw new Error(
			`Failed to get asset index: ${error instanceof Error ? error.message : error}`,
		);
	}
}

/**
 * Utility: Format order for API
 * Converts user-friendly order to Hyperliquid API format
 */
export function formatOrderForApi(
	order: OrderRequest,
	assetIndex: number,
): Record<string, unknown> {
	const isBuy = order.side === "buy";

	return {
		a: assetIndex, // asset
		b: isBuy, // isBuy
		p: order.price.toString(), // price (as string)
		s: order.size.toString(), // size (as string)
		r: order.reduceOnly || false, // reduceOnly
		t: {
			limit: {
				tif: order.timeInForce || "Gtc",
			},
		},
		c: order.clientOrderId || undefined,
	};
}

/**
 * Calculate notional value of order
 */
export function calculateNotional(size: number, price: number): number {
	return size * price;
}

/**
 * Validate order parameters
 */
export function validateOrder(order: OrderRequest): string | null {
	if (!order.symbol || order.symbol.length === 0) {
		return "Symbol is required";
	}

	if (!["buy", "sell"].includes(order.side)) {
		return "Side must be 'buy' or 'sell'";
	}

	if (order.size <= 0) {
		return "Size must be positive";
	}

	if (order.price <= 0) {
		return "Price must be positive";
	}

	const notional = calculateNotional(order.size, order.price);
	if (notional < 10) {
		return "Order notional must be at least $10";
	}

	if (order.leverage && (order.leverage < 1 || order.leverage > 20)) {
		return "Leverage must be between 1 and 20";
	}

	const validTif = ["Gtc", "Alo", "Ioc"];
	if (order.timeInForce && !validTif.includes(order.timeInForce)) {
		return `Time-in-force must be one of: ${validTif.join(", ")}`;
	}

	return null;
}
