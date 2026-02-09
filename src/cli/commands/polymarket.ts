import { ClobClient } from "@polymarket/clob-client";
import { ethers, Wallet } from "ethers";
import { getStoredAddress, getStoredPrivateKey } from "./wallet";

const HOST = "https://clob.polymarket.com";
const GAMMA_API = "https://gamma-api.polymarket.com";
const DATA_API = "https://data-api.polymarket.com";
const CHAIN_ID = 137; // Polygon mainnet
const ARBITRUM_RPC = "https://arb1.arbitrum.io/rpc";
const POLYGON_RPC = "https://polygon-rpc.com/";
const ARB_USDC_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"; // Native USDC on Arbitrum
const ARB_USDCE_ADDRESS = "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"; // Bridged USDC.e on Arbitrum
const POLYGON_USDC_ADDRESS = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174"; // USDC on Polygon
const POLYGON_POL_ADDRESS = "0x0000000000000000000000000000000000001010"; // POL (native) on Polygon
const CLOB_EXCHANGE_ADDRESS = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E"; // Polymarket CLOB Exchange on Polygon
const USDC_DECIMALS = 6;

/**
 * Run polymarket subcommand
 * @param args - Arguments after "polymarket" command
 */
export async function runPolymarket(args: string[]) {
	const command = args[0];

	if (!command) {
		showPolymarketHelp();
		return;
	}

	switch (command) {
		case "account":
			await handleAccount(args);
			break;
		case "balance":
			await handleBalance(args);
			break;
		case "market":
			await handleMarket(args);
			break;
		case "price":
			await handlePrice(args);
			break;
		case "order":
			await handleOrder(args);
			break;
		case "deposit":
			await handleDeposit(args);
			break;
		case "withdraw":
			await handleWithdraw(args);
			break;
		case "refuel":
			await handleRefuel(args.slice(1));
			break;
		case "help":
		case "--help":
		case "-h":
			showPolymarketHelp();
			break;
		default:
			console.error(`Unknown polymarket command: ${command}`);
			showPolymarketHelp();
			process.exit(1);
	}
}

function getArg(args: string[], name: string): string | undefined {
	const index = args.indexOf(name);
	return index !== -1 && index + 1 < args.length ? args[index + 1] : undefined;
}

/**
 * Get private key from --private-key arg or stored wallet
 */
function getPrivateKey(args: string[]): string | null {
	const argKey = getArg(args, "--private-key");
	if (argKey) return argKey;
	return getStoredPrivateKey();
}

/**
 * Require private key, show helpful error if missing
 */
function requirePrivateKey(args: string[], command: string): string {
	const key = getPrivateKey(args);
	if (!key) {
		console.error(`❌ No wallet found!`);
		console.log(`\nTo use this command, either:`);
		console.log(`  1. Create a clawearn wallet: clawearn wallet create`);
		console.log(`  2. Or provide: --private-key <key>\n`);
		console.log(`Example: clawearn polymarket ${command} --private-key 0x...`);
		process.exit(1);
	}
	return key;
}

/**
 * Approve USDC for CLOB contract if needed
 */
async function approveUSDCIfNeeded(
	signer: Wallet,
	requiredAmount: string,
): Promise<void> {
	try {
		const provider = new ethers.providers.JsonRpcProvider(POLYGON_RPC);
		const signerWithProvider = signer.connect(provider);

		// ERC20 ABI for approval
		const erc20ABI = [
			"function allowance(address owner, address spender) view returns (uint256)",
			"function approve(address spender, uint256 amount) returns (bool)",
		];

		const usdcContract = new ethers.Contract(
			POLYGON_USDC_ADDRESS,
			erc20ABI,
			signerWithProvider,
		);

		// Check current allowance
		const currentAllowance = (await usdcContract.allowance(
			signer.address,
			CLOB_EXCHANGE_ADDRESS,
		)) as ethers.BigNumber;

		const requiredAmountBN = ethers.BigNumber.from(requiredAmount);

		if (currentAllowance.gte(requiredAmountBN)) {
			// Already approved enough
			return;
		}

		console.log("Approving USDC for trading...");
		console.log(
			`Current allowance: ${ethers.utils.formatUnits(currentAllowance, USDC_DECIMALS)} USDC`,
		);
		console.log(
			`Required for this order: ${ethers.utils.formatUnits(requiredAmountBN, USDC_DECIMALS)} USDC`,
		);

		// Approve a large amount (max uint256) to avoid repeated approvals
		const maxApproval = ethers.constants.MaxUint256;

		// Get current gas prices and set much higher values for reliability
		const feeData = await provider.getFeeData();
		// Use current base fee + buffer to ensure transaction goes through
		const currentBaseFee = feeData.lastBaseFeePerGas
			? feeData.lastBaseFeePerGas.mul(2)
			: ethers.utils.parseUnits("500", "gwei");
		const maxFeePerGas = currentBaseFee.add(
			ethers.utils.parseUnits("50", "gwei"),
		);
		const maxPriorityFeePerGas = ethers.utils.parseUnits("50", "gwei");

		const approveTx = await usdcContract.approve(
			CLOB_EXCHANGE_ADDRESS,
			maxApproval,
			{
				maxFeePerGas,
				maxPriorityFeePerGas,
			},
		);

		console.log(`Approval transaction sent: ${approveTx.hash}`);
		console.log("Waiting for confirmation...");

		const receipt = await approveTx.wait();

		if (receipt && receipt.status === 1) {
			console.log(
				`✓ USDC approved for trading on Polygon (unlimited amount)`,
			);
		} else {
			console.error("❌ Approval transaction failed!");
			process.exit(1);
		}
	} catch (error) {
		console.error(
			"Failed to approve USDC:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

async function handleAccount(args: string[]) {
	const subcommand = args[1];

	if (!subcommand) {
		// Show account info
		const address = getStoredAddress();
		if (address) {
			console.log(`\n═══════════════════════════════════════════════════════════════`);
			console.log(
				`                     POLYMARKET ACCOUNT                      `,
			);
			console.log(`═══════════════════════════════════════════════════════════════`);
			console.log(`\nWallet Address: ${address}`);
			console.log(
				`Profile:        https://polymarketscan.org/address/${address}`,
			);
			console.log(
				`\n═══════════════════════════════════════════════════════════════\n`,
			);
		} else {
			console.error("❌ No wallet found!");
			console.log("Create one with: clawearn wallet create");
		}
		return;
	}

	if (subcommand === "export-key") {
		console.error("deprecated: Use 'clawearn wallet export' instead.");
		process.exit(1);
	} else if (subcommand === "info") {
		const address = getStoredAddress();
		if (!address) {
			console.error("❌ No wallet found!");
			process.exit(1);
		}
		console.log(`\n═══════════════════════════════════════════════════════════════`);
		console.log(
			`                     POLYMARKET ACCOUNT                      `,
		);
		console.log(`═══════════════════════════════════════════════════════════════`);
		console.log(`\nWallet Address: ${address}`);
		console.log(
			`Profile:        https://polymarketscan.org/address/${address}`,
		);
		console.log(
			`\n═══════════════════════════════════════════════════════════════\n`,
		);
	} else {
		console.error("Usage: clawearn polymarket account [info]");
		process.exit(1);
	}
}

async function handleBalance(args: string[]) {
	const subcommand = args[1];

	if (subcommand === "check") {
		const privateKey = requirePrivateKey(args, "polymarket balance check");

		try {
			const signer = new Wallet(privateKey);
			const walletAddress = signer.address;

			console.log("\n📊 Fetching Polymarket balance...\n");

			try {
				// Fetch balances on Polygon
				const polygonProvider = new ethers.providers.JsonRpcProvider(POLYGON_RPC);
				const polygonWallet = new ethers.Wallet(privateKey, polygonProvider);

				// Fetch USDC balance on Polygon
				const usdcContract = new ethers.Contract(
					POLYGON_USDC_ADDRESS,
					[
						"function balanceOf(address owner) view returns (uint256)",
						"function decimals() view returns (uint8)",
					],
					polygonProvider,
				);

				const usdcBalance = await usdcContract.balanceOf(walletAddress);
				const usdcFormatted = ethers.utils.formatUnits(usdcBalance, USDC_DECIMALS);

				// Fetch POL balance on Polygon
				const polBalance = await polygonProvider.getBalance(walletAddress);
				const polFormatted = ethers.utils.formatEther(polBalance);

				// Fetch positions from Data API
				const positionsResponse = await fetch(
					`${DATA_API}/positions?user=${walletAddress}&limit=1000`,
				);

				if (!positionsResponse.ok) {
					throw new Error(
						`Failed to fetch positions: ${positionsResponse.statusText}`,
					);
				}

				// biome-ignore lint/suspicious/noExplicitAny: API response structure
				const positions = (await positionsResponse.json()) as any[];

				// Fetch total holdings value from Data API
				const valueResponse = await fetch(
					`${DATA_API}/value?user=${walletAddress}`,
				);

				if (!valueResponse.ok) {
					throw new Error(
						`Failed to fetch value: ${valueResponse.statusText}`,
					);
				}

				// biome-ignore lint/suspicious/noExplicitAny: API response structure
				const valueData = (await valueResponse.json()) as any[];

				let totalValue = 0;
				if (valueData && valueData.length > 0) {
					totalValue = valueData[0].value || 0;
				}

				// Display balance information
				console.log(
					"═══════════════════════════════════════════════════════════════",
				);
				console.log(
					"                    POLYMARKET BALANCE                          ",
				);
				console.log(
					"═══════════════════════════════════════════════════════════════",
				);
				console.log(`\nWallet: ${walletAddress}`);
				console.log("\n💰 Token Balances (Polygon):");
				console.log(`   USDC:  ${usdcFormatted} USDC`);
				console.log(`   POL:   ${polFormatted} POL`);
				console.log(`\n📈 Portfolio Value: $${totalValue.toFixed(2)} USDC`);

				if (positions && positions.length > 0) {
					console.log(`\nOpen Positions: ${positions.length}`);
					console.log("\nTop Positions:");

					// Show top 5 positions by current value
					const sortedPositions = positions
						.sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0))
						.slice(0, 5);

					// biome-ignore lint/suspicious/noExplicitAny: Position object from API
					sortedPositions.forEach((pos: any, index: number) => {
						const title = pos.title || "Unknown Market";
						const outcome = pos.outcome || "Unknown";
						const size = pos.size || 0;
						const avgPrice = pos.avgPrice || 0;
						const currentValue = pos.currentValue || 0;
						const pnl = pos.cashPnl || 0;

						console.log(
							`\n${index + 1}. ${title} - ${outcome}`,
						);
						console.log(
							`   Shares: ${size.toFixed(2)} @ $${avgPrice.toFixed(2)} avg`,
						);
						console.log(`   Current Value: $${currentValue.toFixed(2)}`);
						console.log(
							`   P&L: $${pnl.toFixed(2)} (${pos.percentPnl ? pos.percentPnl.toFixed(1) : "0"}%)`,
						);
					});
				} else {
					console.log("\nNo open positions");
				}

				console.log(
					"\n═══════════════════════════════════════════════════════════════\n",
				);
			} catch (apiError) {
				console.error("❌ Could not fetch balance from Polymarket API");
				console.error(
					"\nNote: Your wallet may not have any activity on Polymarket yet.",
				);
				console.error("To get started:");
				console.error("  1. Visit https://polymarket.com");
				console.error(`  2. Connect wallet: ${walletAddress}`);
				console.error("  3. Make a deposit and place some trades");
				console.error(
					"  4. Try again to see your positions and balance\n",
				);

				if (apiError instanceof Error) {
					console.error(
						`Error details: ${apiError.message}`,
					);
				}
			}
		} catch (error) {
			console.error(
				"Failed to check balance:",
				error instanceof Error ? error.message : error,
			);
			process.exit(1);
		}
	} else {
		console.error("Usage: clawearn polymarket balance check");
		process.exit(1);
	}
}

async function handleMarket(args: string[]) {
	const subcommand = args[1];

	if (subcommand === "search") {
		const query = getArg(args, "--query");

		if (!query) {
			console.error("Usage: clawearn polymarket market search --query <query>");
			process.exit(1);
		}

		try {
			// Search via Gamma API
			const response = await fetch(
				`${GAMMA_API}/public-search?q=${encodeURIComponent(query)}&limit_per_type=10`,
			);
			// biome-ignore lint/suspicious/noExplicitAny: API response structure
			const results = (await response.json()) as any;

			if (!results || (!results.events && !results.tags && !results.profiles)) {
				console.log(`No results found for "${query}"`);
				return;
			}

			console.log(`Search results for "${query}":`);

			if (results.events && results.events.length > 0) {
				console.log("\nEvents:");
				// biome-ignore lint/suspicious/noExplicitAny: API response type
				results.events.forEach((event: any) => {
					console.log(`- ${event.title} (ID: ${event.id})`);
				});
			}

			if (results.tags && results.tags.length > 0) {
				console.log("\nTags:");
				// biome-ignore lint/suspicious/noExplicitAny: API response type
				results.tags.forEach((tag: any) => {
					console.log(`- ${tag.label} (ID: ${tag.id})`);
				});
			}

			// Full debug output if needed
			// console.log(JSON.stringify(results, null, 2));
		} catch (error) {
			console.error(
				"Market search failed:",
				error instanceof Error ? error.message : error,
			);
			process.exit(1);
		}
	} else if (subcommand === "list") {
		const tag = getArg(args, "--tag");
		const limit = getArg(args, "--limit") || "10";

		try {
			const response = await fetch(
				`${GAMMA_API}/events?active=true&closed=false&limit=${limit}${tag ? `&tag_id=${tag}` : ""}`,
			);
			const events = await response.json();

			console.log(`Active markets (limit: ${limit}):`);
			console.log(JSON.stringify(events, null, 2));
		} catch (error) {
			console.error(
				"Failed to list markets:",
				error instanceof Error ? error.message : error,
			);
			process.exit(1);
		}
	} else if (subcommand === "info") {
		const marketId = getArg(args, "--market-id");

		if (!marketId) {
			console.error("Usage: clawearn polymarket market info --market-id <id>");
			console.error("\nNote: market-id can be either:");
			console.error(
				"  - A Gamma Event ID (from market search results)",
			);
			console.error("  - A CLOB condition ID (for direct lookup)");
			process.exit(1);
		}

		try {
			const client = new ClobClient(HOST, CHAIN_ID);

			// Try to fetch as condition ID first (CLOB format)
			let market;
			let isConditionId = false;

			try {
				market = await client.getMarket(marketId);

				// Check if market is an error response
				// biome-ignore lint/suspicious/noExplicitAny: Market object from CLOB
				if ((market as any).error) {
					throw new Error(`CLOB Error: ${(market as any).error}`);
				}

				isConditionId = true;
			} catch (clobError) {
				// If that fails, try to fetch from Gamma API to convert Event ID to condition ID
				// Note: CLOB client errors are logged to console by the library
				console.log("\n");  // Add spacing
				console.log(
					"Not a CLOB Condition ID, attempting to fetch as Gamma Event ID...",
				);

				try {
					// Try the events endpoint first
					// biome-ignore lint/suspicious/noExplicitAny: Gamma API response
					let gammaResponse = await fetch(
						`${GAMMA_API}/events/${marketId}`,
					);

					let event;

					if (!gammaResponse.ok) {
						// Try alternative Gamma endpoint that might be used for event details
						console.log(
							"  (events endpoint failed, trying alternatives...)",
						);

						// Try searching for it instead
						gammaResponse = await fetch(
							`${GAMMA_API}/public-search?q=${encodeURIComponent(marketId)}&limit_per_type=1`,
						);

						if (gammaResponse.ok) {
							// biome-ignore lint/suspicious/noExplicitAny: Search response
							const searchResults = (await gammaResponse.json()) as any;

							if (
								searchResults.events &&
								searchResults.events.length > 0
							) {
								event = searchResults.events[0];
							} else {
								throw new Error(
									`Event not found with ID: ${marketId}`,
								);
							}
						} else {
							throw new Error(
								`Failed to fetch from Gamma API: ${gammaResponse.statusText}`,
							);
						}
					} else {
						// biome-ignore lint/suspicious/noExplicitAny: Gamma Event structure
						event = (await gammaResponse.json()) as any;
					}

					if (!event) {
						throw new Error("No event data returned");
					}

					console.log("\n📌 Gamma Event Found:");
					console.log(`   Title: ${event.title || "Unknown"}`);
					console.log(`   ID: ${event.id}`);

					// Fetch markets for this event
					let markets = event.markets;

					if (!markets || markets.length === 0) {
						// Try fetching markets separately
						console.log("   Fetching associated markets...");

						try {
							// biome-ignore lint/suspicious/noExplicitAny: Market list response
							const marketsResponse = await fetch(
								`${GAMMA_API}/markets?event_id=${event.id}&limit=100`,
							);

							if (marketsResponse.ok) {
								// biome-ignore lint/suspicious/noExplicitAny: Markets array
								markets = (await marketsResponse.json()) as any[];
							}
						} catch (e) {
							console.log("   Could not fetch markets separately");
						}
					}

					if (markets && markets.length > 0) {
						console.log(
							`\n   ${markets.length} markets in this event:`,
						);

						// Try to fetch full market details to get titles and token IDs
						// biome-ignore lint/suspicious/noExplicitAny: Market object from Gamma
						for (let idx = 0; idx < Math.min(10, markets.length); idx++) {
							const mkt = markets[idx];
							let title = mkt.title || mkt.question || mkt.outcome || "Unknown";
							const conditionId = mkt.conditionId || mkt.condition_id || mkt.id || "N/A";

							// Parse clobTokenIds from Gamma API (it's a JSON string array)
							// These are ERC1155 token IDs used for order placement
							let tokenIds: string[] = [];
							if (mkt.clobTokenIds) {
								try {
									tokenIds = JSON.parse(mkt.clobTokenIds);
								} catch (e) {
									// If parsing fails, try as direct array
									tokenIds = Array.isArray(mkt.clobTokenIds)
										? mkt.clobTokenIds
										: [];
								}
							}

							console.log(
								`   ${idx + 1}. ${title}`,
							);
							console.log(
								`      Condition ID: ${conditionId}`,
							);
							if (tokenIds.length > 0) {
								tokenIds.forEach((tId, tIdx) => {
									const outcomeLabel = tIdx === 0 ? "YES" : "NO";
									console.log(
										`      ${outcomeLabel} Token ID: ${tId}`,
									);
								});
							}
						}

						if (markets.length > 10) {
							console.log(
								`   ... and ${markets.length - 10} more markets`,
							);
						}

						console.log(
							"\n   Use one of the Token IDs above to place orders.",
						);
						return;
					} else {
						console.error(
							"   No markets found for this event",
						);
						process.exit(1);
					}
				} catch (gammaError) {
					console.error(
						`\n❌ Could not fetch event details`,
					);
					console.error(
						`   ID: ${marketId}`,
					);
					console.error(
						`   Error: ${gammaError instanceof Error ? gammaError.message : gammaError}`,
					);
					console.error(
						"\n   This ID might be invalid or the market may have expired.",
					);
					console.error(
						"   Try: clawearn polymarket market search --query 'bitcoin'",
					);
					process.exit(1);
				}
			}

			// Display CLOB market details
			console.log(
				"\n═══════════════════════════════════════════════════════════════",
			);
			console.log("                       MARKET DETAILS                        ");
			console.log(
				"═══════════════════════════════════════════════════════════════\n",
			);
			console.log(
				JSON.stringify(market, null, 2),
			);

			if (isConditionId) {
				console.log(
					"\n✓ This is a valid CLOB Condition ID. Use it with 'order buy/sell --token-id'",
				);
			}
		} catch (error) {
			console.error(
				"Failed to fetch market info:",
				error instanceof Error ? error.message : error,
			);
			process.exit(1);
		}
	} else {
		console.error("Usage: clawearn polymarket market [search|list|info]");
		process.exit(1);
	}
}

async function handlePrice(args: string[]) {
	const subcommand = args[1];

	try {
		const client = new ClobClient(HOST, CHAIN_ID);

		if (subcommand === "get") {
			const tokenId = getArg(args, "--token-id");
			const side = getArg(args, "--side") || "buy";

			if (!tokenId) {
				console.error(
					"Usage: clawearn polymarket price get --token-id <id> [--side buy|sell]",
				);
				process.exit(1);
			}

			const price = await client.getPrice(tokenId, side);

			console.log(`Current price for token ${tokenId}:`);
			console.log(JSON.stringify(price, null, 2));
		} else if (subcommand === "book") {
			const tokenId = getArg(args, "--token-id");

			if (!tokenId) {
				console.error("Usage: clawearn polymarket price book --token-id <id>");
				process.exit(1);
			}

			const orderbook = await client.getOrderBook(tokenId);

			console.log(`Order book for token ${tokenId}:`);
			console.log(JSON.stringify(orderbook, null, 2));
		} else {
			console.error("Usage: clawearn polymarket price [get|book]");
			process.exit(1);
		}
	} catch (error) {
		console.error(
			"Failed to fetch price data:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

async function handleOrder(args: string[]) {
	const subcommand = args[1];

	if (subcommand === "buy" || subcommand === "sell") {
		const tokenId = getArg(args, "--token-id");
		const price = parseFloat(getArg(args, "--price") || "0");
		const size = parseFloat(getArg(args, "--size") || "1");

		if (!tokenId || price === 0 || size === 0) {
			console.error(
				`Usage: clawearn polymarket order ${subcommand} --token-id <id> --price <price> --size <size>`,
			);
			process.exit(1);
		}

		const privateKey = requirePrivateKey(
			args,
			`polymarket order ${subcommand}`,
		);

		try {
			const signer = new Wallet(privateKey);

			// Default tick size and negRisk for market
			// These will be used if we can't fetch market details
			// Most Polymarket orders use 0.001 tick size
			let tickSize: "0.1" | "0.01" | "0.001" | "0.0001" = "0.001";
			let negRisk = false;

			// Attempt to fetch market details if possible (for tick size info)
			// This is optional - the CLOB API will validate these on order submission
			// Note: tokenId is an outcome/token ID, not a market/condition ID
			// We can't reliably fetch market details without the condition ID,
			// so we skip this and use defaults that work with the API
			console.log("ℹ Using default tick size 0.001 (will be validated by API)");

			console.log(
				`Placing ${subcommand.toUpperCase()} order: ${size} shares @ $${price}`,
			);

			// Step 0: Ensure USDC is approved for trading
			// Calculate the amount needed (price * size * 10^6 for microunits)
			const orderCost = ethers.BigNumber.from(
				Math.ceil(price * size * 1000000),
			);
			console.log("Checking USDC approval for trading...");
			await approveUSDCIfNeeded(signer, orderCost.toString());

			// Step 1: Initialize client with signer
			console.log("Creating initial client...");
			const initialClient = new ClobClient(HOST, CHAIN_ID, signer);

			// Step 2: Derive API credentials from wallet
			console.log("Deriving API credentials...");
			let userApiCreds;
			try {
				userApiCreds = await initialClient.createOrDeriveApiKey();
				console.log("✓ API credentials obtained");
			} catch (credError) {
				console.error("❌ Could not derive API credentials");
				console.error(
					"   Wallet may not be registered on Polymarket.com",
				);
				console.error("   Please visit https://polymarket.com to register");
				process.exit(1);
			}

			// Step 3 & 4: Reinitialize with full authentication
			console.log("Initializing authenticated client...");
			const client = new ClobClient(
				HOST,
				CHAIN_ID,
				signer,
				userApiCreds,
				0, // Signature type 0 = EOA
				signer.address, // Funder = your wallet address
			);

			// Step 5: Place order using createAndPostOrder
			const module = await import("@polymarket/clob-client");
			const side = subcommand === "buy" ? module.Side.BUY : module.Side.SELL;

			// Use createAndPostOrder as per Polymarket documentation
			try {
				const response = await client.createAndPostOrder(
					{
						tokenID: tokenId,
						price: price,
						size: size,
						side: side,
					},
					{
						tickSize: tickSize,
						negRisk: negRisk,
					},
					module.OrderType.GTC, // Good-Til-Cancelled
				);

				console.log("✓ Order placed successfully!");
				console.log(`Order ID: ${response.orderID}`);
				console.log(`Status: ${response.status}`);
			} catch (orderError) {
				// If createAndPostOrder fails, try with explicit market fetch
				console.log("\nRetrying with direct market fetch...");

				try {
					// Fetch tick size and neg risk directly using token ID
					tickSize = await client.getTickSize(tokenId);
					negRisk = await client.getNegRisk(tokenId);

					console.log(`✓ Got market details: tick size = ${tickSize}, negRisk = ${negRisk}`);

					// Retry order creation with correct parameters
					const response = await client.createAndPostOrder(
						{
							tokenID: tokenId,
							price: price,
							size: size,
							side: side,
						},
						{
							tickSize: tickSize,
							negRisk: negRisk,
						},
						module.OrderType.GTC,
					);

					console.log("✓ Order placed successfully!");
					console.log(`Order ID: ${response.orderID}`);
					console.log(`Status: ${response.status}`);
				} catch (retryError) {
					throw orderError; // Throw original error if retry fails
				}
			}
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);

			// Check if it's a Cloudflare block
			if (errorMsg.includes("403") || errorMsg.includes("Cloudflare")) {
				console.error("Failed to place order: Cloudflare protection detected");
				console.error("\nPolymarket uses Cloudflare protection. Possible solutions:");
				console.error("  1. Wait a moment and try again");
				console.error("  2. Check your IP is not rate-limited");
				console.error("  3. Try accessing polymarket.com directly first");
				console.error("  4. Use a different network/VPN");
			} else {
				console.error(
					"Failed to place order:",
					errorMsg,
				);
			}
			process.exit(1);
		}
	} else if (subcommand === "list-open") {
		const privateKey = requirePrivateKey(args, "polymarket order list-open");

		try {
			const signer = new Wallet(privateKey);
			const client = new ClobClient(HOST, CHAIN_ID, signer);
			const userApiCreds = await client.createOrDeriveApiKey();

			const authedClient = new ClobClient(
				HOST,
				CHAIN_ID,
				signer,
				userApiCreds,
			);

			console.log("Fetching open orders...");
			const orders = await authedClient.getOpenOrders();

			console.log(`Found ${orders.length} open orders:`);
			console.log(JSON.stringify(orders, null, 2));
		} catch (error) {
			console.error(
				"Failed to fetch orders:",
				error instanceof Error ? error.message : error,
			);
			process.exit(1);
		}
	} else if (subcommand === "cancel") {
		const orderId = getArg(args, "--order-id");

		if (!orderId) {
			console.error("Usage: clawearn polymarket order cancel --order-id <id>");
			process.exit(1);
		}

		const privateKey = requirePrivateKey(args, "polymarket order cancel");

		try {
			const signer = new Wallet(privateKey);
			const client = new ClobClient(HOST, CHAIN_ID, signer);
			const userApiCreds = await client.createOrDeriveApiKey();

			const authedClient = new ClobClient(
				HOST,
				CHAIN_ID,
				signer,
				userApiCreds,
			);

			console.log(`Cancelling order ${orderId}...`);
			await authedClient.cancelOrder({ orderID: orderId });

			console.log("✓ Order cancelled successfully!");
		} catch (error) {
			console.error(
				"Failed to cancel order:",
				error instanceof Error ? error.message : error,
			);
			process.exit(1);
		}
	} else {
		console.error(
			"Usage: clawearn polymarket order [buy|sell|list-open|cancel]",
		);
		process.exit(1);
	}
}

const BRIDGE_API = "https://bridge.polymarket.com";
const L2PASS_REFUEL_ADDRESS = "0x222228060e7efbb1d78bb5d454581910e3922222";
const POLYGON_CHAIN_ID = 109; // LayerZero chain ID for Polygon (not EVM chain ID 137)

const ERC20_ABI = [
	"function balanceOf(address owner) view returns (uint256)",
	"function decimals() view returns (uint8)",
	"function transfer(address to, uint256 amount) returns (bool)",
];

// L2Pass Gas Refuel Contract ABI
const REFUEL_ABI = [
	{
		inputs: [
			{ internalType: "uint16", name: "dstChainId", type: "uint16" },
			{ internalType: "uint256", name: "nativeForDst", type: "uint256" },
			{ internalType: "address", name: "addressOnDst", type: "address" },
			{ internalType: "bool", name: "useZro", type: "bool" },
		],
		name: "estimateGasRefuelFee",
		outputs: [
			{ internalType: "uint256", name: "nativeFee", type: "uint256" },
			{ internalType: "uint256", name: "zroFee", type: "uint256" },
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "uint16", name: "dstChainId", type: "uint16" },
			{ internalType: "address", name: "zroPaymentAddress", type: "address" },
			{ internalType: "uint256", name: "nativeForDst", type: "uint256" },
			{ internalType: "address", name: "addressOnDst", type: "address" },
		],
		name: "gasRefuel",
		outputs: [],
		stateMutability: "payable",
		type: "function",
	},
	{
		inputs: [],
		name: "gasRefuelPrice",
		outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
];

async function fetchDepositAddress(walletAddress: string): Promise<string> {
	try {
		const response = await fetch(`${BRIDGE_API}/deposit`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ address: walletAddress }),
		});

		if (!response.ok) {
			throw new Error(`Bridge API error: ${response.statusText}`);
		}

		const data = (await response.json()) as { address?: { evm?: string } };
		if (!data.address || !data.address.evm) {
			throw new Error("No EVM deposit address returned from Bridge API");
		}

		return data.address.evm;
	} catch (error) {
		throw new Error(
			`Failed to fetch deposit address: ${error instanceof Error ? error.message : error}`,
		);
	}
}

async function handleDeposit(args: string[]) {
	const amountStr = getArg(args, "--amount");
	const useUsdce = args.includes("--usdce");

	if (!amountStr) {
		console.error(
			"Usage: clawearn polymarket deposit --amount <amount> [--usdce]",
		);
		process.exit(1);
	}

	const privateKey = requirePrivateKey(args, "polymarket deposit");

	try {
		const provider = new ethers.providers.JsonRpcProvider(ARBITRUM_RPC);
		const wallet = new Wallet(privateKey, provider);

		console.log("Fetching deposit address from Polymarket...");
		const targetAddress = await fetchDepositAddress(wallet.address);

		console.log(`Deposit Address (Arbitrum): ${targetAddress}`);

		const tokenAddress = useUsdce ? ARB_USDCE_ADDRESS : ARB_USDC_ADDRESS;
		const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);

		const decimals = await tokenContract.decimals();
		const amount = ethers.utils.parseUnits(amountStr, decimals);

		// Check balance
		const balance = await tokenContract.balanceOf(wallet.address);
		if (balance.lt(amount)) {
			console.error(
				`❌ Insufficient ${useUsdce ? "USDC.e" : "USDC"} balance on Arbitrum`,
			);
			console.error(`   Required: ${amountStr}`);
			console.error(
				`   Available: ${ethers.utils.formatUnits(balance, decimals)}`,
			);
			process.exit(1);
		}

		// Check ETH balance for gas
		const ethBalance = await wallet.getBalance();
		if (ethBalance.eq(0)) {
			console.error("❌ Insufficient ETH on Arbitrum for gas fees");
			process.exit(1);
		}

		console.log(`Creating deposit transaction...`);
		console.log(`From:   ${wallet.address}`);
		console.log(`To:     ${targetAddress} (Polymarket Deposit Address)`);
		console.log(
			`Amount: ${amountStr} ${useUsdce ? "USDC.e" : "USDC"} (Arbitrum)`,
		);

		const tx = await tokenContract.transfer(targetAddress, amount);
		console.log(`\nTransaction sent! Hash: ${tx.hash}`);
		console.log("Waiting for confirmation...");

		await tx.wait();
		console.log("✅ Deposit successful!");
		console.log(
			"Funds should appear in your Polymarket account after bridging is complete.",
		);
	} catch (error) {
		console.error(
			"Failed to deposit:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

/**
 * Handle withdraw command to create withdrawal addresses and send tokens
 * Withdraws USDC.e from Polygon to Arbitrum
 */
async function handleWithdraw(args: string[]) {
	const amountStr = getArg(args, "--amount");
	const sourceAddress = getStoredAddress() || getArg(args, "--address");
	if (!sourceAddress) {
		console.error("❌ No source address found!");
		console.log("Either create a wallet with: clawearn wallet create");
		console.log(
			"Or provide: --address <your-polymarket-wallet-address>",
		);
		process.exit(1);
	}

	// Recipient defaults to source address
	const recipientAddr = getArg(args, "--recipient-address") || sourceAddress;

	try {
		// Arbitrum chain ID: 42161, USDC.e address on Arbitrum
		const toChainId = "42161";
		const toTokenAddress = ARB_USDCE_ADDRESS;

		console.log("Creating withdrawal address for Arbitrum...");
		console.log(`Source:      ${sourceAddress}`);
		console.log(`Destination: Arbitrum (Chain ID: ${toChainId})`);
		console.log(`Token:       USDC.e (${toTokenAddress})`);
		console.log(
			`Recipient:   ${recipientAddr}${recipientAddr === sourceAddress ? " (same as source)" : ""}`,
		);
		console.log("");

		const response = await fetch(
			"https://bridge.polymarket.com/withdraw",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					address: sourceAddress,
					toChainId,
					toTokenAddress,
					recipientAddr,
				}),
			},
		);

		if (!response.ok) {
			const error = await response.json();
			throw new Error(
				error.error ||
					`API error: ${response.status} ${response.statusText}`,
			);
		}

		// biome-ignore lint/suspicious/noExplicitAny: Bridge API response
		const result: any = await response.json();
		const depositAddress = result.address.evm;

		console.log("✅ Withdrawal address created successfully!\n");
		console.log("EVM Deposit Address:");
		console.log(`  ${depositAddress}`);

		// If amount is provided, send the token
		if (amountStr) {
			await sendUSDCeToDepositAddress(
				sourceAddress,
				depositAddress,
				amountStr,
			);
		} else {
			console.log("\n⚠️  Instructions:");
			console.log(
				"1. Send USDC.e from your Polymarket wallet to the address above",
			);
			console.log("2. Funds will be automatically bridged to Arbitrum");
			console.log(`3. USDC.e will arrive at: ${recipientAddr}`);

			if (result.note) {
				console.log(`\nℹ️  ${result.note}`);
			}
		}
	} catch (error) {
		console.error(
			"Failed to create withdrawal address:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

/**
 * Send USDC.e from Polygon to the withdrawal deposit address
 */
async function sendUSDCeToDepositAddress(
	sourceAddress: string,
	depositAddress: string,
	amountStr: string,
): Promise<void> {
	try {
		const privateKey = getStoredPrivateKey();
		if (!privateKey) {
			console.error("❌ No private key found!");
			console.log("Create a wallet with: clawearn wallet create");
			process.exit(1);
		}

		const provider = new ethers.providers.JsonRpcProvider(POLYGON_RPC);
		const wallet = new Wallet(privateKey, provider);

		// Use USDC.e on Polygon (same address as Polymarket uses)
		const usdceAddress = POLYGON_USDC_ADDRESS;
		const tokenContract = new ethers.Contract(
			usdceAddress,
			ERC20_ABI,
			wallet,
		);

		const decimals = await tokenContract.decimals();
		const amount = ethers.utils.parseUnits(amountStr, decimals);

		// Check balance
		const balance = await tokenContract.balanceOf(wallet.address);
		if (balance.lt(amount)) {
			console.error(`❌ Insufficient USDC balance on Polygon`);
			console.error(`   Required: ${amountStr}`);
			console.error(
				`   Available: ${ethers.utils.formatUnits(balance, decimals)}`,
			);
			process.exit(1);
		}

		console.log("\n📤 Sending USDC to withdrawal address...");
		console.log(`From:   ${wallet.address}`);
		console.log(`To:     ${depositAddress} (Bridge Deposit Address)`);
		console.log(`Amount: ${amountStr} USDC.e`);
		console.log("");

		// Get current gas prices for Polygon
		const feeData = await provider.getFeeData();
		const gasPrice = feeData.gasPrice;

		// Estimate gas for the transfer
		const gasEstimate = await tokenContract.estimateGas.transfer(
			depositAddress,
			amount,
		);

		// Add 20% buffer to gas estimate
		const adjustedGas = gasEstimate.mul(120).div(100);

		// For Polygon, use gasPrice instead of EIP-1559
		const tx = await tokenContract.transfer(depositAddress, amount, {
			gasPrice: gasPrice || ethers.utils.parseUnits("50", "gwei"),
			gasLimit: adjustedGas,
		});

		console.log(`Transaction sent! Hash: ${tx.hash}`);
		console.log("Waiting for confirmation...");

		const receipt = await tx.wait();
		console.log("");
		console.log("✅ Transfer successful!");
		console.log(`Block: ${receipt.blockNumber}`);
		console.log("\n⏳ Funds will be bridged to Arbitrum within 10-30 minutes");
	} catch (error) {
		console.error(
			"Failed to send withdrawal:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

async function handleRefuel(args: string[]) {
	const subcommand = args[0];

	if (!subcommand) {
		showRefuelHelp();
		return;
	}

	switch (subcommand) {
		case "estimate":
			await handleRefuelEstimate(args);
			break;
		case "refuel":
			await handleGasRefuel(args);
			break;
		case "help":
		case "--help":
		case "-h":
			showRefuelHelp();
			break;
		default:
			console.error(`Unknown refuel command: ${subcommand}`);
			showRefuelHelp();
			process.exit(1);
	}
}

async function handleRefuelEstimate(args: string[]) {
	const amountStr = getArg(args, "--amount");
	const recipientArg = getArg(args, "--recipient");

	if (!amountStr) {
		console.error(
			"Usage: clawearn polymarket refuel estimate --amount <amount> [--recipient <address>]",
		);
		process.exit(1);
	}

	const privateKey = requirePrivateKey(args, "polymarket refuel estimate");

	try {
		const provider = new ethers.providers.JsonRpcProvider(ARBITRUM_RPC);
		const wallet = new Wallet(privateKey, provider);
		const recipient = recipientArg || wallet.address;

		// Validate recipient address
		if (!ethers.utils.isAddress(recipient)) {
			console.error(`❌ Invalid recipient address: ${recipient}`);
			process.exit(1);
		}

		const refuelContract = new ethers.Contract(
			L2PASS_REFUEL_ADDRESS,
			REFUEL_ABI,
			provider,
		);

		// Parse amount in wei
		const amountWei = ethers.utils.parseEther(amountStr);

		console.log("Estimating gas refuel fee...");
		console.log(`  Amount: ${amountStr} POL`);
		console.log(`  Recipient: ${recipient}`);
		console.log(`  Destination: Polygon (Chain ID: ${POLYGON_CHAIN_ID})\n`);

		try {
			// biome-ignore lint/suspicious/noExplicitAny: Contract call returns tuple
			const [nativeFee, zroFee] = (await refuelContract.estimateGasRefuelFee(
				POLYGON_CHAIN_ID,
				amountWei,
				recipient,
				false,
			)) as any;

			console.log("Fee Estimation Results:");
			console.log(`  Native Fee (ETH): ${ethers.utils.formatEther(nativeFee)}`);
			console.log(`  ZRO Fee: ${ethers.utils.formatEther(zroFee)}`);
			console.log(
				`\n  Total Cost (ETH): ${ethers.utils.formatEther(nativeFee.add(zroFee))}`,
			);

			// Check wallet balance
			const ethBalance = await wallet.getBalance();
			const totalRequired = nativeFee.add(zroFee);

			if (ethBalance.lt(totalRequired)) {
				console.error(`\n⚠️  Warning: Insufficient ETH balance for this refuel`);
				console.error(
					`   Required: ${ethers.utils.formatEther(totalRequired)} ETH`,
				);
				console.error(`   Available: ${ethers.utils.formatEther(ethBalance)} ETH`);
			}
		} catch (estimateError) {
			// If estimation fails, provide helpful error message
			if (estimateError instanceof Error && estimateError.message.includes("CALL_EXCEPTION")) {
				console.error("❌ Failed to estimate refuel fee");
				console.error("\nPossible reasons:");
				console.error("  1. Polygon (Chain ID 137) may not be supported by this refuel contract");
				console.error("  2. The refuel contract destination may not be configured");
				console.error("  3. LayerZero endpoint may have an issue");
				console.error("\nPlease verify the destination chain is supported.");
			} else {
				throw estimateError;
			}
			process.exit(1);
		}
	} catch (error) {
		console.error(
			"Failed to estimate refuel fee:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

async function handleGasRefuel(args: string[]) {
	const amountStr = getArg(args, "--amount");
	const recipientArg = getArg(args, "--recipient");

	if (!amountStr) {
		console.error(
			"Usage: clawearn polymarket refuel refuel --amount <amount> [--recipient <address>]",
		);
		process.exit(1);
	}

	const privateKey = requirePrivateKey(args, "polymarket refuel refuel");

	try {
		const provider = new ethers.providers.JsonRpcProvider(ARBITRUM_RPC);
		const wallet = new Wallet(privateKey, provider);
		const recipient = recipientArg || wallet.address;

		// Validate recipient address
		if (!ethers.utils.isAddress(recipient)) {
			console.error(`❌ Invalid recipient address: ${recipient}`);
			process.exit(1);
		}

		const refuelContract = new ethers.Contract(
			L2PASS_REFUEL_ADDRESS,
			REFUEL_ABI,
			wallet,
		);

		// Parse amount in wei
		const amountWei = ethers.utils.parseEther(amountStr);

		console.log("Estimating gas refuel fee...");
		// biome-ignore lint/suspicious/noExplicitAny: Contract call returns tuple
		const [nativeFee, zroFee] = (await refuelContract.estimateGasRefuelFee(
			POLYGON_CHAIN_ID,
			amountWei,
			recipient,
			false,
		)) as any;

		const totalCost = nativeFee.add(zroFee);

		// Check wallet balance
		const ethBalance = await wallet.getBalance();
		if (ethBalance.lt(totalCost)) {
			console.error("❌ Insufficient ETH balance for refuel");
			console.error(
				`   Required: ${ethers.utils.formatEther(totalCost)} ETH`,
			);
			console.error(`   Available: ${ethers.utils.formatEther(ethBalance)} ETH`);
			process.exit(1);
		}

		console.log("\n📤 Gas Refuel Transaction Details:");
		console.log(`   From: ${wallet.address}`);
		console.log(`   To: ${recipient}`);
		console.log(`   Amount: ${amountStr} POL`);
		console.log(`   Network: Polygon (Chain ID: ${POLYGON_CHAIN_ID})`);
		console.log(`   Native Fee: ${ethers.utils.formatEther(nativeFee)} ETH`);
		console.log(`   ZRO Fee: ${ethers.utils.formatEther(zroFee)} ETH`);
		console.log(`   Total Cost: ${ethers.utils.formatEther(totalCost)} ETH`);

		console.log("\nSending refuel transaction...");

		// Execute refuel with estimated fee and manual gas limit
		// Cross-chain transactions typically need 200k-500k gas
		const tx = await refuelContract.gasRefuel(
			POLYGON_CHAIN_ID,
			ethers.constants.AddressZero,
			amountWei,
			recipient,
			{
				value: totalCost,
				gasLimit: ethers.BigNumber.from("300000"), // Manual gas limit for cross-chain refuel
			},
		);

		console.log(`✓ Transaction sent!`);
		console.log(`   Hash: ${tx.hash}`);
		console.log("   Waiting for confirmation...\n");

		const receipt = await tx.wait();

		if (receipt && receipt.status === 1) {
			console.log("✅ Gas Refuel successful!");
			console.log(
				`   ${amountStr} POL will be available on Polygon shortly`,
			);
			console.log(`   Recipient: ${recipient}`);
		} else {
			console.error("❌ Transaction failed!");
			process.exit(1);
		}
	} catch (error) {
		console.error(
			"Failed to execute refuel:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

function showRefuelHelp() {
	console.log(`
Gas Refuel Commands

Usage: clawearn polymarket refuel <command> [options]

COMMANDS:
  estimate          Estimate the cost of refueling gas on Polygon
    --amount <amount>         Amount of POL to refuel (required)
    --recipient <address>     Recipient address on Polygon (default: your address)
    --private-key <key>       Private key (optional, uses stored wallet if not provided)

  refuel            Execute a gas refuel transaction to Polygon
    --amount <amount>         Amount of POL to refuel (required)
    --recipient <address>     Recipient address on Polygon (default: your address)
    --private-key <key>       Private key (optional, uses stored wallet if not provided)

EXAMPLES:
  # Estimate the cost to refuel 0.5 POL to your Polygon account
  clawearn polymarket refuel estimate --amount 0.5

  # Estimate the cost to refuel 1 POL to another address
  clawearn polymarket refuel estimate --amount 1 --recipient 0x1234...

  # Execute a refuel transaction (0.5 POL to your address)
  clawearn polymarket refuel refuel --amount 0.5

  # Refuel to a specific address
  clawearn polymarket refuel refuel --amount 1 --recipient 0x5678...

NOTES:
  • The refuel contract is deployed on Arbitrum
  • Gas is refueled to Polygon network
  • You need ETH on Arbitrum to pay for the refuel transaction fees
  • This uses the L2Pass refuel service (0x065699fda5db01cdbffd1625aeed8e6f5ba7efdf)
`);
}

function showPolymarketHelp() {
	console.log(`
Polymarket Trading Commands

Usage: clawearn polymarket <command> [subcommand] [options]

SETUP:
   First, create a wallet:
     clawearn wallet create

   Fund your wallet with USDC on Polygon, then start trading!

ACCOUNT COMMANDS:
   account              Show your wallet address and status
   account info         Same as above

BALANCE COMMANDS:
   balance check        Check wallet connection (uses stored wallet)

MARKET COMMANDS:
    market search
      --query <query>              Search query
      Returns: Gamma Event IDs (for use with market info)

    market list
      --tag <tag>                  Filter by tag
      --limit <n>                  Results limit (default: 10)
      Returns: Gamma Event IDs (for use with market info)

    market info
      --market-id <id>             Market ID (Gamma Event ID)
      Returns: Event details with Token IDs (for use with order buy/sell)

PRICE COMMANDS:
   price get
     --token-id <id>              Token ID
     --side <buy|sell>            Side (default: buy)

   price book
     --token-id <id>              Token ID

ORDER COMMANDS:
    order buy
      --token-id <id>              Token ID (numeric, from market info)
      --price <price>              Price per share
      --size <size>                Number of shares

    order sell
      --token-id <id>              Token ID (numeric, from market info)
      --price <price>              Price per share
      --size <size>                Number of shares

   order list-open                List your open orders

   order cancel
     --order-id <id>              Order ID to cancel

NOTE: All commands use your stored wallet automatically.
      Create one with: clawearn wallet create

DEPOSIT COMMANDS:
     deposit
       --amount <amount>            Amount of USDC to deposit
       --usdce                      Use bridged USDC.e instead of native USDC

WITHDRAW COMMANDS:
     withdraw [--amount <amount>] [--recipient-address <addr>]
       --amount <amount>            Amount of USDC.e to withdraw (optional)
       --recipient-address <addr>   Recipient wallet address (defaults to your wallet)

REFUEL COMMANDS:
    refuel estimate
      --amount <amount>            Amount of POL to refuel
      --recipient <address>        Recipient address (default: your address)

    refuel refuel
      --amount <amount>            Amount of POL to refuel
      --recipient <address>        Recipient address (default: your address)

EXAMPLES:

WORKFLOW: Search → Get ID → Place Order
    # 1. Search for a market by name
    clawearn polymarket market search --query "bitcoin price 2025"
    # Returns: List of Gamma Event IDs

    # 2. Get market details and token IDs
    clawearn polymarket market info --market-id <gamma-event-id>
    # Returns: List of markets with Token IDs (YES and NO outcomes)

    # 3. Place a buy order using a Token ID
    clawearn polymarket order buy \\
      --token-id <token-id> \\
      --price 0.50 \\
      --size 10

OTHER EXAMPLES:
     # Check open orders
     clawearn poly order list-open

     # View your wallet address
     clawearn polymarket account

     # Withdraw 0.1 USDC.e to Arbitrum (to your own wallet)
     clawearn polymarket withdraw --amount 0.1

     # Withdraw to another address
     clawearn polymarket withdraw --amount 0.1 --recipient-address "0xOtherAddress"

     # Just create withdrawal address (manual transfer)
     clawearn polymarket withdraw
	`);
}
