import { ClobClient } from "@polymarket/clob-client";
import { ethers, Wallet } from "ethers";
import { getStoredPrivateKey } from "./wallet";

const HOST = "https://clob.polymarket.com";
const GAMMA_API = "https://gamma-api.polymarket.com";
const _DATA_API = "https://data-api.polymarket.com";
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
	const _subcommand = args[1];

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
		console.log(`  1. Create a wallet: clawearn wallet create`);
		console.log(`  2. Or provide: --private-key <key>\n`);
		console.log(`Example: clawearn ${command} --private-key 0x...`);
		process.exit(1);
	}
	return key;
}

async function handleAccount(args: string[]) {
	const subcommand = args[1];

	if (subcommand === "create") {
		const email = getArg(args, "--email");
		const password = getArg(args, "--password");

		if (!email || !password) {
			console.error(
				"Usage: clawearn polymarket account create --email <email> --password <password>",
			);
			process.exit(1);
		}

		// Generate new wallet
		const wallet = Wallet.createRandom();
		console.log("Account created successfully!");
		console.log(`Address: ${wallet.address}`);
		console.log(`Private Key: ${wallet.privateKey}`);
		console.log(
			"\n⚠️  SAVE YOUR PRIVATE KEY SECURELY - You cannot recover it if lost!",
		);
		console.log(
			"Store this in an environment variable or secure key management system.",
		);
	} else if (subcommand === "export-key") {
		const email = getArg(args, "--email");
		const password = getArg(args, "--password");
		const privateKey = getArg(args, "--private-key");

		if (!privateKey && (!email || !password)) {
			console.error(
				"Usage: clawearn polymarket account export-key --private-key <key> OR --email <email> --password <password>",
			);
			process.exit(1);
		}

		console.log("Private Key: ", privateKey || "Set via --private-key flag");
		console.log(
			"⚠️  NEVER share your private key. Use it only with trusted services.",
		);
	} else {
		console.error("Usage: clawearn polymarket account [create|export-key]");
		process.exit(1);
	}
}

async function handleBalance(args: string[]) {
	const subcommand = args[1];

	if (subcommand === "check") {
		const privateKey = requirePrivateKey(args, "polymarket balance check");

		try {
			const signer = new Wallet(privateKey);
			const client = new ClobClient(HOST, CHAIN_ID, signer);
			const apiCreds = await client.createOrDeriveApiKey();

			const signatureType = parseInt(
				getArg(args, "--signature-type") || "0",
				10,
			);
			const funderAddress = getArg(args, "--funder") || signer.address;

			const _authedClient = new ClobClient(
				HOST,
				CHAIN_ID,
				signer,
				apiCreds,
				signatureType,
				funderAddress,
			);

			// Note: For full balance data, would need to implement balance fetch
			// from user positions API
			console.log(`Wallet Address: ${signer.address}`);
			console.log("API Credentials derived successfully");
			console.log("Use --funder flag for proxy wallet address if applicable");
		} catch (error) {
			console.error(
				"Failed to check balance:",
				error instanceof Error ? error.message : error,
			);
			process.exit(1);
		}
	} else if (subcommand === "pocket-money") {
		const amount = getArg(args, "--amount");

		if (!amount) {
			console.error(
				"Usage: clawearn polymarket balance pocket-money --amount <amount>",
			);
			process.exit(1);
		}

		console.log(`Requesting ${amount} USDC pocket money...`);
		console.log("Note: Pocket money requires testnet setup or faucet access");
		console.log("For production, deposit via Polymarket.com interface");
	} else {
		console.error("Usage: clawearn polymarket balance [check|pocket-money]");
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
				`${GAMMA_API}/search?q=${encodeURIComponent(query)}&limit=10`,
			);
			const results = await response.json();

			console.log(`Search results for "${query}":`);
			console.log(JSON.stringify(results, null, 2));
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
			const response = await fetch(`${GAMMA_API}/markets/${marketId}`);
			const market = await response.json();

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

	if (subcommand === "get") {
		const tokenId = getArg(args, "--token-id");
		const side = getArg(args, "--side") || "buy";

		if (!tokenId) {
			console.error(
				"Usage: clawearn polymarket price get --token-id <id> [--side buy|sell]",
			);
			process.exit(1);
		}

		try {
			const response = await fetch(
				`${HOST}/price?token_id=${tokenId}&side=${side}`,
			);
			const price = await response.json();

			console.log(`Current price for token ${tokenId}:`);
			console.log(JSON.stringify(price, null, 2));
		} catch (error) {
			console.error(
				"Failed to fetch price:",
				error instanceof Error ? error.message : error,
			);
			process.exit(1);
		}
	} else if (subcommand === "book") {
		const tokenId = getArg(args, "--token-id");

		if (!tokenId) {
			console.error("Usage: clawearn polymarket price book --token-id <id>");
			process.exit(1);
		}

		try {
			const response = await fetch(`${HOST}/book?token_id=${tokenId}`);
			const orderbook = await response.json();

			console.log(`Order book for token ${tokenId}:`);
			console.log(JSON.stringify(orderbook, null, 2));
		} catch (error) {
			console.error(
				"Failed to fetch order book:",
				error instanceof Error ? error.message : error,
			);
			process.exit(1);
		}
	} else {
		console.error("Usage: clawearn polymarket price [get|book]");
		process.exit(1);
	}
}

async function handleOrder(args: string[]) {
	const subcommand = args[1];

	if (subcommand === "buy" || subcommand === "sell") {
		const tokenId = getArg(args, "--token-id");
		const price = parseFloat(getArg(args, "--price") || "0");
		const size = parseFloat(getArg(args, "--size") || "1");
		const signatureType = parseInt(getArg(args, "--signature-type") || "0", 10);
		const funder = getArg(args, "--funder");

		if (!tokenId || price === 0 || size === 0) {
			console.error(
				`Usage: clawearn polymarket order ${subcommand} --token-id <id> --price <price> --size <size> [--signature-type <0|1|2>] [--funder <address>]`,
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

			const funderAddress = funder || signer.address;

			console.log("Initializing authenticated client...");
			const authedClient = new ClobClient(
				HOST,
				CHAIN_ID,
				signer,
				userApiCreds,
				signatureType,
				funderAddress,
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

			const signatureType = parseInt(
				getArg(args, "--signature-type") || "0",
				10,
			);
			const funder = getArg(args, "--funder") || signer.address;

			const authedClient = new ClobClient(
				HOST,
				CHAIN_ID,
				signer,
				userApiCreds,
				signatureType,
				funder,
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

			const signatureType = parseInt(
				getArg(args, "--signature-type") || "0",
				10,
			);
			const funder = getArg(args, "--funder") || signer.address;

			const authedClient = new ClobClient(
				HOST,
				CHAIN_ID,
				signer,
				userApiCreds,
				signatureType,
				funder,
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

const ERC20_ABI = [
	"function balanceOf(address owner) view returns (uint256)",
	"function decimals() view returns (uint8)",
	"function transfer(address to, uint256 amount) returns (bool)",
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
		// For the deposit address generation, we technically need the *destination* wallet on Polymarket.
		// Usually this is the same EOA if using an EOA, or the proxy if using a proxy.
		// However, the Bridge API takes the "Polymarket wallet address".
		// Assuming the user wants to deposit to THIS wallet's address on Polymarket.
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
    --signature-type <0|1|2>     0=EOA (default), uses stored wallet

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
    --signature-type <0|1|2>     0=EOA (default)

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
