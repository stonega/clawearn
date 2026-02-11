import {
	ExchangeClient,
	HttpTransport,
	InfoClient,
	SubscriptionClient,
	WebSocketTransport,
} from "@nktkas/hyperliquid";
import { ethers, Wallet } from "ethers";
import { privateKeyToAccount } from "viem/accounts";
import { getStoredAddress, getStoredPrivateKey } from "./wallet";

// Arbitrum RPC endpoints
const ARBITRUM_RPC_LIST = [
	"https://arb1.arbitrum.io/rpc",
	"https://arbitrum-one.publicnode.com",
];

function getRandomRpc(rpcList: string[]): string {
	return rpcList[Math.floor(Math.random() * rpcList.length)];
}

const ARBITRUM_RPC = getRandomRpc(ARBITRUM_RPC_LIST);
const HYPERLIQUID_VAULT_ARBITRUM = "0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7";
const ARB_USDC_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"; // Native USDC on Arbitrum
const USDC_DECIMALS = 6;
const MIN_DEPOSIT_USDC = 5;

/**
 * Run hyperliquid subcommand
 * @param args - Arguments after "hyperliquid" command
 */
export async function runHyperliquid(args: string[]) {
	const command = args[0];

	if (!command) {
		showHyperliquidHelp();
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
		case "position":
			await handlePosition(args);
			break;
		case "deposit":
			await handleDeposit(args);
			break;
		case "withdraw":
			await handleWithdraw(args);
			break;
		case "help":
		case "--help":
		case "-h":
			showHyperliquidHelp();
			break;
		default:
			console.error(`Unknown hyperliquid command: ${command}`);
			showHyperliquidHelp();
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
		console.log(`Example: clawearn hyperliquid ${command} --private-key 0x...`);
		process.exit(1);
	}
	return key;
}

async function handleAccount(args: string[]) {
	const subcommand = args[1];

	if (!subcommand || subcommand === "info") {
		// Show account info
		const address = getStoredAddress();
		if (address) {
			console.log(`\n═══════════════════════════════════════════════════════════════`);
			console.log(`                    HYPERLIQUID ACCOUNT                      `);
			console.log(`═══════════════════════════════════════════════════════════════`);
			console.log(`\nWallet Address: ${address}`);
			console.log(`\n═══════════════════════════════════════════════════════════════\n`);
		} else {
			console.error("❌ No wallet found!");
			console.log("Create one with: clawearn wallet create");
		}
		return;
	}

	console.error(`Unknown account subcommand: ${subcommand}`);
	process.exit(1);
}

async function handleBalance(args: string[]) {
	const address = getStoredAddress();
	if (!address) {
		console.error("❌ No wallet found!");
		process.exit(1);
	}

	try {
		const client = new InfoClient({ transport: new HttpTransport() });
		const state = await client.clearinghouseState({ user: address });

		console.log(`\n═══════════════════════════════════════════════════════════════`);
		console.log(`                    HYPERLIQUID BALANCE                       `);
		console.log(`═══════════════════════════════════════════════════════════════`);
		console.log(`\nWallet Address: ${address}`);

		if (state.marginSummary) {
			const accountValue = state.marginSummary.accountValue;
			const totalMarginUsed = state.marginSummary.totalMarginUsed;
			const totalNtlPos = state.marginSummary.totalNtlPos;

			console.log(`\nAccount Value:    ${accountValue}`);
			console.log(`Margin Used:      ${totalMarginUsed}`);
			console.log(`Total Notional:   ${totalNtlPos}`);
		}

		if (state.assetPositions && state.assetPositions.length > 0) {
			console.log(`\nOpen Positions:`);
			for (const position of state.assetPositions) {
				if (position.position.szi !== "0") {
					console.log(`  ${position.position.coin}: ${position.position.szi}`);
				}
			}
		}

		console.log(`\n═══════════════════════════════════════════════════════════════\n`);
	} catch (error) {
		console.error(
			"Failed to fetch balance:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

async function handleMarket(args: string[]) {
	const subcommand = args[1];

	if (subcommand === "list") {
		try {
			const client = new InfoClient({ transport: new HttpTransport() });
			const metadata = await client.meta();

			console.log(`\n═══════════════════════════════════════════════════════════════`);
			console.log(`                    HYPERLIQUID MARKETS                     `);
			console.log(`═══════════════════════════════════════════════════════════════\n`);

			console.log("Available Coins:");
			for (const asset of metadata.universe) {
				const delistedStr = asset.isDelisted ? " (DELISTED)" : "";
				console.log(`  ${asset.name} - Max Leverage: ${asset.maxLeverage}x${delistedStr}`);
			}

			console.log(`\n═══════════════════════════════════════════════════════════════\n`);
		} catch (error) {
			console.error(
				"Failed to fetch markets:",
				error instanceof Error ? error.message : error,
			);
			process.exit(1);
		}
		return;
	}

	if (subcommand === "info") {
		const coinArg = getArg(args, "--coin");
		if (!coinArg) {
			console.error("❌ --coin argument required");
			console.log("Example: clawearn hyperliquid market info --coin ETH");
			process.exit(1);
		}

		try {
			const client = new InfoClient({ transport: new HttpTransport() });
			const book = await client.l2Book({ coin: coinArg });

			console.log(`\n═══════════════════════════════════════════════════════════════`);
			console.log(`                  HYPERLIQUID MARKET: ${coinArg}`);
			console.log(`═══════════════════════════════════════════════════════════════\n`);

			if (book.levels && book.levels.length > 0) {
				// Bids (buy side)
				console.log("Top Bids:");
				const bids = book.levels[0];
				for (let i = 0; i < Math.min(5, bids.length); i++) {
					console.log(`  ${bids[i].px}: ${bids[i].sz} (${bids[i].n} orders)`);
				}

				// Asks (sell side)
				console.log("\nTop Asks:");
				const asks = book.levels[1];
				for (let i = 0; i < Math.min(5, asks.length); i++) {
					console.log(`  ${asks[i].px}: ${asks[i].sz} (${asks[i].n} orders)`);
				}
			}

			console.log(`\n═══════════════════════════════════════════════════════════════\n`);
		} catch (error) {
			console.error(
				"Failed to fetch market info:",
				error instanceof Error ? error.message : error,
			);
			process.exit(1);
		}
		return;
	}

	console.error(`Unknown market subcommand: ${subcommand}`);
	console.log("Use: clawearn hyperliquid market list");
	console.log("Or:  clawearn hyperliquid market info --coin <coin>");
	process.exit(1);
}

async function handlePrice(args: string[]) {
	const coinArg = getArg(args, "--coin");
	if (!coinArg) {
		console.error("❌ --coin argument required");
		console.log("Example: clawearn hyperliquid price --coin ETH");
		process.exit(1);
	}

	try {
		const client = new InfoClient({ transport: new HttpTransport() });
		const book = await client.l2Book({ coin: coinArg });

		if (!book.levels || book.levels.length < 2) {
			console.error("❌ No price data available");
			process.exit(1);
		}

		const bestBid = book.levels[0][0];
		const bestAsk = book.levels[1][0];
		const mid = (Number(bestBid.px) + Number(bestAsk.px)) / 2;

		console.log(`\n${coinArg} Price:`);
		console.log(`  Bid: ${bestBid.px}`);
		console.log(`  Ask: ${bestAsk.px}`);
		console.log(`  Mid: ${mid.toFixed(2)}\n`);
	} catch (error) {
		console.error(
			"Failed to fetch price:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

async function handleOrder(args: string[]) {
	const subcommand = args[1];

	if (!subcommand) {
		showOrderHelp();
		return;
	}

	if (subcommand === "buy" || subcommand === "sell") {
		const privateKey = requirePrivateKey(args, `order ${subcommand}`);
		const coinArg = getArg(args, "--coin");
		const priceArg = getArg(args, "--price");
		const sizeArg = getArg(args, "--size");

		if (!coinArg || !priceArg || !sizeArg) {
			console.error(
				"❌ Missing required arguments: --coin, --price, --size",
			);
			console.log(
				`Example: clawearn hyperliquid order ${subcommand} --coin ETH --price 3000 --size 0.1`,
			);
			process.exit(1);
		}

		try {
			const wallet = privateKeyToAccount(privateKey as `0x${string}`);
			const client = new ExchangeClient({
				transport: new HttpTransport(),
				wallet,
			});

			// Get metadata to find coin index
			const infoClient = new InfoClient({
				transport: new HttpTransport(),
			});
			const metadata = await infoClient.meta();
			const assetIndex = metadata.universe.findIndex(
				(a) => a.name === coinArg,
			);

			if (assetIndex === -1) {
				console.error(`❌ Coin not found: ${coinArg}`);
				process.exit(1);
			}

			const isBuy = subcommand === "buy";
			console.log(
				`\nPlacing ${subcommand.toUpperCase()} order for ${sizeArg} ${coinArg} at ${priceArg}...`,
			);

			const result = await client.order({
				orders: [
					{
						a: assetIndex,
						b: isBuy,
						p: priceArg,
						s: sizeArg,
						r: false,
						t: { limit: { tif: "Gtc" } },
					},
				],
				grouping: "na",
			});

			if (result.status === "ok") {
				console.log("✓ Order placed successfully!");
				console.log(`Status: ${JSON.stringify(result.response)}`);
			} else {
				console.error("❌ Order failed:", result);
				process.exit(1);
			}
		} catch (error) {
			console.error(
				"Failed to place order:",
				error instanceof Error ? error.message : error,
			);
			process.exit(1);
		}
		return;
	}

	if (subcommand === "list-open") {
		const address = getStoredAddress();
		if (!address) {
			console.error("❌ No wallet found!");
			process.exit(1);
		}

		try {
			const client = new InfoClient({ transport: new HttpTransport() });
			const state = await client.clearinghouseState({ user: address });

			console.log(`\n═══════════════════════════════════════════════════════════════`);
			console.log(`                    OPEN ORDERS                             `);
			console.log(`═══════════════════════════════════════════════════════════════\n`);

			// Hyperliquid API returns open orders in the state
			// Implementation depends on actual API response structure
			console.log("(Open orders data not yet implemented)");

			console.log(`\n═══════════════════════════════════════════════════════════════\n`);
		} catch (error) {
			console.error(
				"Failed to fetch open orders:",
				error instanceof Error ? error.message : error,
			);
			process.exit(1);
		}
		return;
	}

	console.error(`Unknown order subcommand: ${subcommand}`);
	showOrderHelp();
	process.exit(1);
}

function showOrderHelp() {
	console.log(`
Order Commands

Usage: clawearn hyperliquid order <command> [options]

COMMANDS:
  buy                Buy a perpetual
    --coin <coin>              Coin to buy (e.g., ETH, BTC)
    --price <price>            Price per unit
    --size <size>              Size to buy

  sell               Sell a perpetual
    --coin <coin>              Coin to sell
    --price <price>            Price per unit
    --size <size>              Size to sell

  list-open          List open orders

EXAMPLES:
  clawearn hyperliquid order buy --coin ETH --price 3000 --size 0.1
  clawearn hyperliquid order sell --coin BTC --price 45000 --size 0.01
  clawearn hyperliquid order list-open
	`);
}

async function handlePosition(args: string[]) {
	const address = getStoredAddress();
	if (!address) {
		console.error("❌ No wallet found!");
		process.exit(1);
	}

	try {
		const client = new InfoClient({ transport: new HttpTransport() });
		const state = await client.clearinghouseState({ user: address });

		console.log(`\n═══════════════════════════════════════════════════════════════`);
		console.log(`                    OPEN POSITIONS                            `);
		console.log(`═══════════════════════════════════════════════════════════════\n`);

		if (state.assetPositions && state.assetPositions.length > 0) {
			for (const position of state.assetPositions) {
				if (position.position.szi !== "0") {
					console.log(`Coin: ${position.position.coin}`);
					console.log(`  Size: ${position.position.szi}`);
					console.log(`  Entry Price: ${position.position.entryPx}`);
					console.log(`  Leverage: ${position.position.leverage}`);
				}
			}
		} else {
			console.log("No open positions");
		}

		console.log(`\n═══════════════════════════════════════════════════════════════\n`);
	} catch (error) {
		console.error(
			"Failed to fetch positions:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

async function handleDeposit(args: string[]) {
	const privateKey = requirePrivateKey(args, "deposit");
	const amountArg = getArg(args, "--amount");

	if (!amountArg) {
		console.error("❌ --amount argument required");
		console.log("Example: clawearn hyperliquid deposit --amount 100");
		process.exit(1);
	}

	const amount = Number(amountArg);
	if (Number.isNaN(amount) || amount < MIN_DEPOSIT_USDC) {
		console.error(`❌ Deposit amount must be at least ${MIN_DEPOSIT_USDC} USDC`);
		console.error(`   You entered: ${amountArg}`);
		process.exit(1);
	}

	try {
		const provider = new ethers.providers.JsonRpcProvider(ARBITRUM_RPC);
		const signer = new Wallet(privateKey, provider);

		// ERC20 ABI for transfer
		const erc20ABI = [
			"function transfer(address to, uint256 amount) returns (bool)",
			"function balanceOf(address account) view returns (uint256)",
		];

		const usdcContract = new ethers.Contract(
			ARB_USDC_ADDRESS,
			erc20ABI,
			signer,
		);

		// Check balance
		const balance = (await usdcContract.balanceOf(
			signer.address,
		)) as ethers.BigNumber;
		const amountWei = ethers.utils.parseUnits(amountArg, USDC_DECIMALS);

		if (balance.lt(amountWei)) {
			console.error("❌ Insufficient USDC balance");
			console.error(
				`   Available: ${ethers.utils.formatUnits(balance, USDC_DECIMALS)} USDC`,
			);
			console.error(`   Required: ${amountArg} USDC`);
			process.exit(1);
		}

		console.log(`\n═══════════════════════════════════════════════════════════════`);
		console.log(`                    HYPERLIQUID DEPOSIT                      `);
		console.log(`═══════════════════════════════════════════════════════════════\n`);
		console.log("📤 Deposit Details:");
		console.log(`   Amount: ${amountArg} USDC`);
		console.log(`   To: ${HYPERLIQUID_VAULT_ARBITRUM}`);
		console.log(`   From: ${signer.address}`);
		console.log("\nSending USDC...");

		const tx = await usdcContract.transfer(
			HYPERLIQUID_VAULT_ARBITRUM,
			amountWei,
		);

		console.log(`✓ Transaction sent!`);
		console.log(`   Hash: ${tx.hash}`);
		console.log("   Waiting for confirmation...\n");

		const receipt = await tx.wait();

		if (receipt && receipt.status === 1) {
			console.log("✅ Deposit successful!");
			console.log(
				`   ${amountArg} USDC will be available in your Hyperliquid account shortly`,
			);
			console.log(`\nVerify your balance with:`);
			console.log(`   clawearn hyperliquid balance`);
		} else {
			console.error("❌ Deposit transaction failed!");
			process.exit(1);
		}

		console.log(`\n═══════════════════════════════════════════════════════════════\n`);
	} catch (error) {
		console.error(
			"Failed to deposit:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

async function handleWithdraw(args: string[]) {
	const privateKey = requirePrivateKey(args, "withdraw");
	const amountArg = getArg(args, "--amount");
	const recipientArg = getArg(args, "--recipient");

	if (!amountArg) {
		console.error("❌ --amount argument required");
		console.log("Example: clawearn hyperliquid withdraw --amount 100");
		process.exit(1);
	}

	const amount = Number(amountArg);
	if (Number.isNaN(amount) || amount < MIN_DEPOSIT_USDC) {
		console.error(`❌ Withdrawal amount must be at least ${MIN_DEPOSIT_USDC} USDC`);
		console.error(`   You entered: ${amountArg}`);
		process.exit(1);
	}

	const address = getStoredAddress();
	if (!address) {
		console.error("❌ No wallet found!");
		process.exit(1);
	}

	const recipient = recipientArg || address;

	try {
		const wallet = privateKeyToAccount(privateKey as `0x${string}`);
		const client = new ExchangeClient({
			transport: new HttpTransport(),
			wallet,
		});

		console.log("\n📤 Withdrawal Details:");
		console.log(`   Amount: ${amountArg} USDC`);
		console.log(`   Chain: Arbitrum`);
		console.log(`   Recipient: ${recipient}`);
		console.log("\nProcessing withdrawal...");

		const result = await client.withdraw({
			amount: amountArg,
			address: recipient as `0x${string}`,
		});

		if (result.status === "ok") {
			console.log("✓ Withdrawal initiated successfully!");
			console.log(`Response: ${JSON.stringify(result.response)}`);
		} else {
			console.error("❌ Withdrawal failed:", result);
			process.exit(1);
		}
	} catch (error) {
		console.error(
			"Failed to withdraw:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

function showHyperliquidHelp() {
	console.log(`
Hyperliquid Trading Commands

Usage: clawearn hyperliquid <command> [subcommand] [options]

SETUP:
   First, create a wallet:
      clawearn wallet create

   Fund your wallet with USDC on Arbitrum using:
      clawearn hyperliquid deposit info

ACCOUNT COMMANDS:
   account              Show your wallet address
   account info         Same as above

BALANCE COMMANDS:
   balance check        Check account balance and positions

MARKET COMMANDS:
   market list          List all available coins
   market info          Get order book for a coin
     --coin <coin>              Coin name (e.g., ETH, BTC)

PRICE COMMANDS:
   price                Get current bid/ask/mid price
     --coin <coin>              Coin name

ORDER COMMANDS:
   order buy            Place a buy order
     --coin <coin>              Coin to buy (required)
     --price <price>            Price per unit (required)
     --size <size>              Size to buy (required)

   order sell           Place a sell order
     --coin <coin>              Coin to sell (required)
     --price <price>            Price per unit (required)
     --size <size>              Size to sell (required)

   order list-open      List your open orders

POSITION COMMANDS:
   position             View your open positions

DEPOSIT COMMANDS:
   deposit              Deposit USDC to Hyperliquid
     --amount <amount>          Amount to deposit (required, minimum 5 USDC)

WITHDRAW COMMANDS:
   withdraw             Withdraw USDC to Arbitrum
     --amount <amount>          Amount to withdraw (required)
     --recipient <address>      Recipient address (defaults to your wallet)

EXAMPLES:

WORKFLOW: List Markets → Check Price → Place Order
   # 1. List available coins
   clawearn hyperliquid market list

   # 2. Check price for a coin
   clawearn hyperliquid price --coin ETH

   # 3. Place a buy order
   clawearn hyperliquid order buy --coin ETH --price 3000 --size 0.1

OTHER EXAMPLES:
   # Check your balance and positions
   clawearn hyperliquid balance

   # View open positions
   clawearn hyperliquid position

   # Deposit 100 USDC
   clawearn hyperliquid deposit --amount 100

   # Withdraw 100 USDC to your wallet
   clawearn hyperliquid withdraw --amount 100

   # Withdraw to a specific address
   clawearn hyperliquid withdraw --amount 50 --recipient 0xOtherAddress
	`);
}
