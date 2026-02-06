import { ClobClient } from "@polymarket/clob-client";
import { ethers, Wallet } from "ethers";
import { getStoredAddress, getStoredPrivateKey } from "./wallet";

const HOST = "https://clob.polymarket.com";
const GAMMA_API = "https://gamma-api.polymarket.com";
const DATA_API = "https://data-api.polymarket.com";
const CHAIN_ID = 137; // Polygon mainnet
const ARBITRUM_RPC = "https://arb1.arbitrum.io/rpc";
const ARB_USDC_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"; // Native USDC
const ARB_USDCE_ADDRESS = "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"; // Bridged USDC.e

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

async function handleAccount(args: string[]) {
	const subcommand = args[1];

	if (!subcommand) {
		// Show account info
		const address = getStoredAddress();
		if (address) {
			console.log(`Wallet Address: ${address}`);
			console.log("Use 'clawearn wallet show' for more details.");
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
		console.log(`Wallet Address: ${address}`);
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
				console.log(`Total Holdings Value: $${totalValue.toFixed(2)} USDC`);

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
			process.exit(1);
		}

		try {
			const client = new ClobClient(HOST, CHAIN_ID);
			const market = await client.getMarket(marketId);

			console.log("Market details:");
			console.log(JSON.stringify(market, null, 2));
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
			const client = new ClobClient(HOST, CHAIN_ID, signer);

			console.log("Creating API credentials...");
			const userApiCreds = await client.createOrDeriveApiKey();

			console.log("Initializing authenticated client...");
			const authedClient = new ClobClient(
				HOST,
				CHAIN_ID,
				signer,
				userApiCreds,
			);

			console.log("Fetching market details...");
			const market = await authedClient.getMarket(tokenId);

			console.log(
				`Placing ${subcommand.toUpperCase()} order: ${size} shares @ $${price}`,
			);

			const module = await import("@polymarket/clob-client");
			const side = subcommand === "buy" ? module.Side.BUY : module.Side.SELL;

			// Create the signed order
			const signedOrder = await authedClient.createOrder(
				{
					tokenID: tokenId,
					price: price,
					size: size,
					side: side,
				},
				market.tickSize,
			);

			// Post the order to the API
			const response = await authedClient.postOrder(
				signedOrder,
				module.OrderType.GTC,
			);

			console.log("✓ Order placed successfully!");
			console.log(`Order ID: ${response.orderID}`);
			console.log(`Status: ${response.status}`);
		} catch (error) {
			console.error(
				"Failed to place order:",
				error instanceof Error ? error.message : error,
			);
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

   market list
     --tag <tag>                  Filter by tag
     --limit <n>                  Results limit (default: 10)

   market info
     --market-id <id>             Market ID

PRICE COMMANDS:
   price get
     --token-id <id>              Token ID
     --side <buy|sell>            Side (default: buy)

   price book
     --token-id <id>              Token ID

ORDER COMMANDS:
   order buy
     --token-id <id>              Token ID
     --price <price>              Price per share
     --size <size>                Number of shares

   order sell
     --token-id <id>              Token ID
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

REFUEL COMMANDS:
    refuel estimate
      --amount <amount>            Amount of POL to refuel
      --recipient <address>        Recipient address (default: your address)

    refuel refuel
      --amount <amount>            Amount of POL to refuel
      --recipient <address>        Recipient address (default: your address)

EXAMPLES:
   # Search for markets
   clawearn polymarket market search --query "bitcoin 2025"

   # Place a buy order (uses stored wallet)
   clawearn poly order buy \\
     --token-id 0x... \\
     --price 0.50 \\
     --size 10

   # Check open orders
   clawearn poly order list-open

   # View your wallet address
   clawearn polymarket account
`);
}
