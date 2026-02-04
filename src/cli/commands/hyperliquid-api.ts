/**
 * Hyperliquid API Helper
 * Handles all communication with Hyperliquid REST API
 */

const HYPERLIQUID_API = "https://api.hyperliquid.xyz";

export interface HyperliquidPrice {
	symbol: string;
	price: number;
	bid: number;
	ask: number;
	timestamp: number;
}

export interface HyperliquidPosition {
	symbol: string;
	side: "long" | "short";
	size: number;
	entryPrice: number;
	currentPrice: number;
	pnl: number;
	pnlPercent: number;
	leverage: number;
}

export interface HyperliquidOrder {
	orderId: string;
	symbol: string;
	side: "buy" | "sell";
	size: number;
	price: number;
	status: "open" | "filled" | "cancelled";
	createdAt: number;
}

/**
 * Fetch current market price for a symbol
 */
export async function getPrice(symbol: string): Promise<HyperliquidPrice> {
	try {
		// allMids returns all prices including bid/ask spread info
		// For now, we'll use allMids and estimate bid/ask from mid price
		const response = await fetch(`${HYPERLIQUID_API}/info`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				type: "allMids",
				dex: "", // empty string = first perp dex (default)
			}),
		});

		if (!response.ok) {
			throw new Error(`API error: ${response.statusText}`);
		}

		const mids = (await response.json()) as Record<string, string>;

		// Look for the symbol (could be "BTC", "ETH", etc.)
		const priceStr = mids[symbol];
		if (!priceStr) {
			throw new Error(`Symbol ${symbol} not found`);
		}

		const mid = parseFloat(priceStr);
		// Estimate bid/ask with small spread (0.1% spread)
		const spread = mid * 0.001;
		const bid = mid - spread / 2;
		const ask = mid + spread / 2;

		return {
			symbol,
			price: mid,
			bid,
			ask,
			timestamp: Date.now(),
		};
	} catch (error) {
		throw new Error(
			`Failed to fetch price: ${error instanceof Error ? error.message : error}`,
		);
	}
}

/**
 * Fetch all open positions for an account
 * Note: In real implementation, would need user authentication
 */
export async function getPositions(
	_walletAddress: string,
): Promise<HyperliquidPosition[]> {
	// This is a placeholder - real implementation would need:
	// 1. User authentication token
	// 2. Account-specific API call
	// 3. Parsing of position data

	// For now, return empty array to show structure
	return [];
}

/**
 * Get list of available symbols (perpetual futures)
 */
export async function getSymbols(): Promise<string[]> {
	try {
		const response = await fetch(`${HYPERLIQUID_API}/info`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				type: "allMids",
				dex: "", // empty string = first perp dex (default)
			}),
		});

		if (!response.ok) {
			throw new Error(`API error: ${response.statusText}`);
		}

		const mids = (await response.json()) as Record<string, string>;
		// Filter out index keys like "@142" and return only human-readable symbols
		return Object.keys(mids).filter((key) => !key.startsWith("@"));
	} catch (error) {
		throw new Error(
			`Failed to fetch symbols: ${error instanceof Error ? error.message : error}`,
		);
	}
}

/**
 * Validate if symbol exists and is tradeable
 */
export async function validateSymbol(symbol: string): Promise<boolean> {
	try {
		const symbols = await getSymbols();
		return symbols.includes(symbol);
	} catch {
		return false;
	}
}

/**
 * Format price for display
 */
export function formatPrice(price: number, decimals = 2): string {
	return price.toFixed(decimals);
}

/**
 * Calculate liquidation price
 * liquidationPrice = entryPrice * (1 - (1 / leverage))
 */
export function calculateLiquidationPrice(
	entryPrice: number,
	leverage: number,
	side: "long" | "short" = "long",
): number {
	if (leverage <= 1) return 0;

	if (side === "long") {
		return entryPrice * (1 - 1 / leverage);
	} else {
		return entryPrice * (1 + 1 / leverage);
	}
}

/**
 * Calculate unrealized PnL
 */
export function calculatePnL(
	entryPrice: number,
	currentPrice: number,
	size: number,
	side: "buy" | "sell" = "buy",
): number {
	const priceDiff = currentPrice - entryPrice;
	if (side === "sell") {
		return -priceDiff * size;
	}
	return priceDiff * size;
}

/**
 * Check if price is near liquidation
 * Returns true if price is within 1% of liquidation price
 */
export function isNearLiquidation(
	currentPrice: number,
	liquidationPrice: number,
	leverage: number,
): boolean {
	const threshold = (liquidationPrice * leverage) / 100; // 1% buffer based on leverage
	return Math.abs(currentPrice - liquidationPrice) <= threshold;
}
