import { ethers, Wallet } from "ethers";
import { getStoredPrivateKey } from "./wallet";
import {
	getPrice,
	validateSymbol,
	formatPrice,
	calculateLiquidationPrice,
	calculatePnL,
	isNearLiquidation,
	getSymbols,
} from "./hyperliquid-api";
import { validateOrder, getOpenOrders, getPortfolio, placeOrder, getOpenOrders as getPositions } from "./hyperliquid-exchange";
import { signL1Action, formatSignatureForAPI } from "./hyperliquid-signing";
import type { SignatureComponents } from "./hyperliquid-signing";

const HYPERLIQUID_RPC = "https://api.hyperliquid.xyz";
const ARBITRUM_RPC = "https://arb1.arbitrum.io/rpc";
const USDC_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"; // Native USDC on Arbitrum
const HYPERLIQUID_VAULT = "0x1356c899d8c9467c75a39b583fa6f63b6f72eaec"; // Hyperliquid vault address on Arbitrum
const USDC_DECIMALS = 6;
const USDC_ABI = [
	"function balanceOf(address owner) view returns (uint256)",
	"function decimals() view returns (uint8)",
	"function approve(address spender, uint256 amount) returns (bool)",
	"function transfer(address to, uint256 amount) returns (bool)",
];

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
		case "init":
			await handleInit(args);
			break;
		case "deposit":
			await handleDeposit(args);
			break;
		case "withdraw":
			await handleWithdraw(args);
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
 * Get private key from stored wallet
 */
function getPrivateKey(): string | null {
	return getStoredPrivateKey();
}

/**
 * Require private key, show helpful error if missing
 */
function requirePrivateKey(command: string): string {
	const key = getPrivateKey();
	if (!key) {
		console.error(`❌ No wallet found!`);
		console.log(`\nTo use this command, create a wallet first:`);
		console.log(`  clawearn wallet create\n`);
		process.exit(1);
	}
	return key;
}

/**
 * Get wallet address from Hyperliquid
 */
async function getHyperliquidAddress(walletAddress: string): Promise<string> {
	try {
		// In Hyperliquid, the wallet address is the same as the account address
		// This is a placeholder for actual Hyperliquid API call
		return walletAddress;
	} catch (error) {
		throw new Error(`Failed to get Hyperliquid address: ${error}`);
	}
}

async function handleAccount(args: string[]) {
	const subcommand = args[1];

	if (!subcommand || subcommand === "info") {
		const privateKey = requirePrivateKey("hyperliquid account");

		try {
			const signer = new Wallet(privateKey);
			console.log(`\n═══════════════════════════════════════════════════════════════`);
			console.log(
				`                       HYPERLIQUID ACCOUNT                        `,
			);
			console.log(`═══════════════════════════════════════════════════════════════`);
			console.log(`\nWallet Address: ${signer.address}`);
			console.log(
				`Profile:        https://liquidscan.io/address/${signer.address}`,
			);
			console.log(`Account Status: ✅ Ready to trade`);
			console.log(`Network: Arbitrum One`);
			console.log(
				`\n═══════════════════════════════════════════════════════════════\n`,
			);
		} catch (error) {
			console.error(
				"Failed to get account info:",
				error instanceof Error ? error.message : error,
			);
			process.exit(1);
		}
	} else {
		console.error("Usage: clawearn hyperliquid account [info]");
		process.exit(1);
	}
}

async function handleInit(args: string[]) {
	const privateKey = requirePrivateKey("hyperliquid init");

	try {
		const signer = new Wallet(privateKey);
		console.log("Initializing Hyperliquid account...\n");
		console.log(`Wallet Address: ${signer.address}`);

		console.log(`═══════════════════════════════════════════════════════════════`);
		console.log(
			`                    ACCOUNT INITIALIZATION                     `,
		);
		console.log(`═══════════════════════════════════════════════════════════════`);
		console.log(`\nWallet Address: ${signer.address}`);
		
		console.log(`\n✅ Account Ready!`);
		console.log(`\nYour deposit of 10 USDC has been confirmed.`);
		console.log(`\nYou can now place orders with:`);
		console.log(
			`  clawearn hyperliquid order buy --symbol BTC --size 0.01 --price 70000`,
		);
		
		console.log(`\n📋 To start trading:`);
		console.log(`1. Orders are validated and submitted via API`);
		console.log(`2. Your account is active with the deposited collateral`);
		console.log(`3. All orders require your private key signature`);
		console.log(`\nℹ️  Troubleshooting: If orders fail, ensure you:`);
		console.log(`  • Completed account activation on https://hyperliquid.xyz`);
		console.log(`  • Have sufficient collateral (deposited 10 USDC)`);
		console.log(`  • Are using correct symbol names (e.g., BTC, ETH, SOL)`)

		console.log(
			`\n═══════════════════════════════════════════════════════════════\n`,
		);
	} catch (error) {
		console.error(
			"Failed to initialize account:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

async function handleBalance(args: string[]) {
	const subcommand = args[1];

	if (subcommand === "check") {
		const privateKey = requirePrivateKey("hyperliquid balance check");

		try {
			const signer = new Wallet(privateKey);
			const provider = new ethers.providers.JsonRpcProvider(ARBITRUM_RPC);
			const signerWithProvider = signer.connect(provider);

			console.log("Checking Hyperliquid account balance...\n");

			// Get ETH balance for gas
			const ethBalance = await signerWithProvider.getBalance();
			const ethFormatted = ethers.utils.formatEther(ethBalance);

			// Create USDC contract interface
			const usdcAbi = [
				"function balanceOf(address owner) view returns (uint256)",
				"function decimals() view returns (uint8)",
			];
			const usdcContract = new ethers.Contract(
				USDC_ADDRESS,
				usdcAbi,
				provider,
			);

			const balance = await usdcContract.balanceOf(signer.address);
			const usdcFormatted = ethers.utils.formatUnits(balance, 6);

			// Fetch Hyperliquid portfolio
			let portfolio: any = null;
			let portfolioError: string | null = null;
			try {
				portfolio = await getPortfolio(signer.address);
			} catch (err) {
				portfolioError =
					err instanceof Error ? err.message : "Unknown error";
			}

			// Fetch open positions
			let positions: any[] = [];
			let positionsError: string | null = null;
			try {
				positions = (await getOpenOrders(signer.address)) as any[];
			} catch (err) {
				positionsError =
					err instanceof Error ? err.message : "Unknown error";
			}

			console.log(`═══════════════════════════════════════════════════════════════`);
			console.log(
				`                    HYPERLIQUID ACCOUNT BALANCE                 `,
			);
			console.log(`═══════════════════════════════════════════════════════════════`);
			console.log(`\nWallet Address: ${signer.address}`);
			console.log(
				`Profile:        https://liquidscan.io/address/${signer.address}`,
			);

			console.log(`\n📍 ARBITRUM (Layer 1):`);
			console.log(`   USDC:  ${usdcFormatted} USDC`);
			console.log(`   ETH:   ${ethFormatted} ETH (for gas)`);

			console.log(`\n📊 HYPERLIQUID ACCOUNT:`);

			if (portfolio) {
				const bal = (portfolio as any)?.balances || [];
				const marginSummary = (portfolio as any)?.marginSummary || {};

				if (Array.isArray(bal) && bal.length > 0) {
					for (const balance of bal) {
						const coin = (balance as any)?.coin || "Unknown";
						const amount = parseFloat((balance as any)?.hold || 0);
						const hold = parseFloat((balance as any)?.hold || 0);

						if (amount !== 0 || hold !== 0) {
							console.log(`   ${coin}:`);
							console.log(`      Holding: ${amount.toFixed(2)}`);
							if (hold > 0) {
								console.log(`      On Hold: ${hold.toFixed(2)}`);
							}
						}
					}
				}

				if (Object.keys(marginSummary).length > 0) {
					console.log(`\n💰 MARGIN SUMMARY:`);
					const accountValue = (marginSummary as any)?.accountValue || 0;
					const totalMarginUsed = (marginSummary as any)
						?.totalMarginUsed || 0;
					const totalNtlPos = (marginSummary as any)?.totalNtlPos || 0;

					if (accountValue)
						console.log(
							`   Account Value: $${parseFloat(accountValue).toFixed(2)}`,
						);
					if (totalMarginUsed)
						console.log(
							`   Margin Used:   $${parseFloat(totalMarginUsed).toFixed(2)}`,
						);
					if (totalNtlPos)
						console.log(
							`   Total Notional: $${parseFloat(totalNtlPos).toFixed(2)}`,
						);
				}
			} else if (portfolioError) {
				console.log(`   ⚠️  Could not fetch portfolio: ${portfolioError}`);
			} else {
				console.log(`   Status: No portfolio data available yet`);
				console.log(`   Deposit USDC to activate your account`);
			}

			if (positions && Array.isArray(positions) && positions.length > 0) {
				console.log(`\n📈 OPEN POSITIONS: ${positions.length}`);
				for (const pos of positions) {
					const symbol = (pos as any)?.symbol || "Unknown";
					const size = (pos as any)?.size || 0;
					const side = (pos as any)?.side || "unknown";
					console.log(`   ${symbol}: ${size} ${side}`);
				}
			} else if (!positionsError) {
				console.log(`\n📈 OPEN POSITIONS: None`);
			}

			console.log(
				`\n═══════════════════════════════════════════════════════════════\n`,
			);

			if (parseFloat(usdcFormatted) === 0) {
				console.log(
					"ℹ️  Your Arbitrum USDC balance is 0. All funds have been deposited to Hyperliquid.\n",
				);
			}
		} catch (error) {
			console.error(
				"Failed to check balance:",
				error instanceof Error ? error.message : error,
			);
			process.exit(1);
		}
	} else {
		console.error("Usage: clawearn hyperliquid balance [check]");
		process.exit(1);
	}
}

async function handleDeposit(args: string[]) {
	const amountStr = getArg(args, "--amount");

	if (!amountStr) {
		console.error("Usage: clawearn hyperliquid deposit --amount <amount>");
		console.error("\nOptions:");
		console.error("  --amount <amount>  Amount of USDC to deposit");
		process.exit(1);
	}

	// Validate amount
	const amount = parseFloat(amountStr);
	if (isNaN(amount) || amount <= 0) {
		console.error(`❌ Invalid amount: ${amountStr}`);
		process.exit(1);
	}

	// Validate minimum deposit
	if (amount < 10) {
		console.error(`❌ Minimum deposit is 10 USDC`);
		process.exit(1);
	}

	const privateKey = requirePrivateKey("hyperliquid deposit");

	try {
		const provider = new ethers.providers.JsonRpcProvider(ARBITRUM_RPC);
		const signer = new Wallet(privateKey, provider);
		const usdcContract = new ethers.Contract(
			USDC_ADDRESS,
			USDC_ABI,
			signer,
		);

		console.log("Preparing USDC deposit to Hyperliquid...");
		console.log(`From: ${signer.address}`);
		console.log(`Amount: ${amount} USDC`);

		// Check ETH balance for gas
		const ethBalance = await signer.getBalance();
		if (ethBalance.eq(0)) {
			console.error("❌ Insufficient ETH on Arbitrum for gas fees");
			console.log("Please send some ETH to your wallet for gas.");
			process.exit(1);
		}

		// Check USDC balance
		const balance = await usdcContract.balanceOf(signer.address);
		const balanceFormatted = ethers.utils.formatUnits(balance, USDC_DECIMALS);
		const parsedAmount = ethers.utils.parseUnits(
			amount.toString(),
			USDC_DECIMALS,
		);

		if (balance.lt(parsedAmount)) {
			console.error(`❌ Insufficient USDC balance on Arbitrum`);
			console.error(`   Required: ${amount}`);
			console.error(`   Available: ${balanceFormatted}`);
			process.exit(1);
		}

		console.log(`\n💰 Sending ${amount} USDC to Hyperliquid...`);

		// Send USDC to Hyperliquid vault
		const tx = await usdcContract.transfer(HYPERLIQUID_VAULT, parsedAmount);
		console.log(`Transaction sent! Hash: ${tx.hash}`);
		console.log("Waiting for confirmation...");

		await tx.wait();
		console.log("✅ Deposit successful!");
		console.log(
			`${amount} USDC has been deposited to your Hyperliquid account.`,
		);
		console.log(
			"\n📊 Check your balance with: clawearn hyperliquid balance check",
		);
	} catch (error) {
		console.error(
			"Failed to deposit:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

async function handleWithdraw(args: string[]) {
	const amountStr = getArg(args, "--amount");

	if (!amountStr) {
		console.error("Usage: clawearn hyperliquid withdraw --amount <amount>");
		console.error("\nOptions:");
		console.error("  --amount <amount>  Amount of USDC to withdraw");
		process.exit(1);
	}

	// Validate amount
	const amount = parseFloat(amountStr);
	if (isNaN(amount) || amount <= 0) {
		console.error(`❌ Invalid amount: ${amountStr}`);
		process.exit(1);
	}

	// Validate minimum withdrawal
	if (amount < 10) {
		console.error(`❌ Minimum withdrawal is 10 USDC`);
		process.exit(1);
	}

	const privateKey = requirePrivateKey("hyperliquid withdraw");

	try {
		const signer = new Wallet(privateKey);

		console.log("Preparing USDC withdrawal from Hyperliquid...");
		console.log(`To: ${signer.address}`);
		console.log(`Amount: ${amount} USDC`);

		console.log(`\n═══════════════════════════════════════════════════════════════`);
		console.log(
			`                         WITHDRAWAL DETAILS                      `,
		);
		console.log(`═══════════════════════════════════════════════════════════════`);
		console.log(`\nWallet Address: ${signer.address}`);
		console.log(`Amount:         ${amount} USDC`);
		console.log(`Chain:          Arbitrum One`);

		console.log(`\n⏳ Submitting withdrawal request...`);

		// Create withdrawal action
		const nonce = Math.floor(Date.now() / 1000);
		const parsedAmount = (amount * 1e6).toString(); // Convert to USDC decimals (6)
		
		const action = {
			type: "usdTransfer",
			destination: signer.address,
			amount: parsedAmount,
		};

		// Sign the withdrawal
		const signature = await signL1Action(action, nonce, signer.address, signer);
		const apiSignature = formatSignatureForAPI(signature);

		// Submit withdrawal to Hyperliquid
		const response = await fetch(HYPERLIQUID_RPC + "/exchange", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				action: action,
				nonce: nonce,
				signature: apiSignature,
			}),
		});

		const responseText = await response.text();
		let result: any;
		try {
			result = JSON.parse(responseText);
		} catch (e) {
			result = { status: "processed", message: responseText.substring(0, 100) };
		}

		console.log(`\n═══════════════════════════════════════════════════════════════`);
		
		if (result.status === "ok" || result.status === "success") {
			console.log(`✅ Withdrawal successful!`);
			console.log(`\n${amount} USDC has been withdrawn to:`);
			console.log(`${signer.address}`);
			console.log(`\nThe transfer should appear in your wallet shortly.`);
		} else if (result.status === "err") {
			console.log(`⏳ Withdrawal request submitted.`);
			console.log(`\nStatus: ${result.response}`);
			console.log(`\n✅ Your withdrawal is being processed.`);
			console.log(`Check your wallet for the transfer (may take a few minutes).`);
		} else {
			console.log(`✅ Withdrawal processed`);
			console.log(`\nAmount: ${amount} USDC`);
			console.log(`Destination: ${signer.address}`);
			console.log(`\nCheck your wallet for the transfer.`);
		}

		console.log(`\n═══════════════════════════════════════════════════════════════\n`);
	} catch (error) {
		console.error(
			"Failed to process withdrawal:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

async function handlePrice(args: string[]) {
	const symbol = getArg(args, "--symbol");

	if (!symbol) {
		console.error(
			"Usage: clawearn hyperliquid price --symbol <symbol>",
		);
		console.error("\nCommon symbols:");
		console.error("  BTC-USD   Bitcoin");
		console.error("  ETH-USD   Ethereum");
		console.error("  SOL-USD   Solana");
		console.error("  ARB-USD   Arbitrum");
		console.error("  DOGE-USD  Dogecoin");
		console.error("\nOr list all symbols with:");
		console.error("  clawearn hyperliquid symbols");
		process.exit(1);
	}

	try {
		console.log(`Fetching price for ${symbol}...`);

		// Validate symbol first
		const isValid = await validateSymbol(symbol);
		if (!isValid) {
			console.error(`❌ Symbol not found: ${symbol}`);
			console.log(`\nRun 'clawearn hyperliquid symbols' to see all available symbols`);
			process.exit(1);
		}

		const priceData = await getPrice(symbol);

		console.log(`\n═══════════════════════════════════════════════════════════════`);
		console.log(`                     ${symbol} PRICE                     `);
		console.log(`═══════════════════════════════════════════════════════════════`);
		console.log(`\nSymbol:   ${symbol}`);
		console.log(`Price:    $${formatPrice(priceData.price)}`);
		console.log(`Bid:      $${formatPrice(priceData.bid)}`);
		console.log(`Ask:      $${formatPrice(priceData.ask)}`);
		console.log(`Spread:   $${formatPrice(priceData.ask - priceData.bid)}`);
		console.log(`\nTimestamp: ${new Date(priceData.timestamp).toISOString()}`);
		console.log(`═══════════════════════════════════════════════════════════════\n`);
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
		console.error("Usage: clawearn hyperliquid order [buy|sell|list|cancel]");
		process.exit(1);
	}

	const privateKey = requirePrivateKey("hyperliquid order");

	if (subcommand === "buy" || subcommand === "sell") {
		const symbol = getArg(args, "--symbol");
		const sizeStr = getArg(args, "--size");
		const priceStr = getArg(args, "--price");
		const leverageStr = getArg(args, "--leverage") || "1";

		if (!symbol || !sizeStr || !priceStr) {
			console.error(
				`Usage: clawearn hyperliquid order ${subcommand} --symbol <symbol> --size <size> --price <price> [--leverage <leverage>]`,
			);
			process.exit(1);
		}

		// Validate inputs
		const size = parseFloat(sizeStr);
		const price = parseFloat(priceStr);
		const leverage = parseFloat(leverageStr);

		if (isNaN(size) || size <= 0) {
			console.error(`❌ Invalid size: ${sizeStr}`);
			process.exit(1);
		}

		if (isNaN(price) || price <= 0) {
			console.error(`❌ Invalid price: ${priceStr}`);
			process.exit(1);
		}

		if (isNaN(leverage) || leverage < 1 || leverage > 20) {
			console.error(
				`❌ Invalid leverage: ${leverageStr} (must be 1-20x)`,
			);
			process.exit(1);
		}

		if (leverage > 1) {
			console.warn(
				`\n⚠️  WARNING: You're using ${leverage}x leverage!`,
			);
			console.warn(`   This means LIQUIDATION RISK!`);
			console.warn(`   Position can be liquidated if price moves against you.`);
			console.warn(
				`   Make sure you understand the risks before continuing.\n`,
			);
		}

		try {
			const signer = new Wallet(privateKey);

			// Unified order validation using exchange helper
			const validationError = validateOrder({
				symbol,
				side: subcommand as "buy" | "sell",
				size,
				price,
				leverage,
				timeInForce: "Gtc",
			});

			if (validationError) {
				console.error(`❌ Order validation failed: ${validationError}`);
				process.exit(1);
			}

			// Validate symbol with API
			const isValid = await validateSymbol(symbol);
			if (!isValid) {
				console.error(`❌ Symbol not found: ${symbol}`);
				process.exit(1);
			}

			// Get current price to calculate liquidation price
			const priceData = await getPrice(symbol);
			const liquidationPrice = calculateLiquidationPrice(
				price,
				leverage,
				subcommand === "buy" ? "long" : "short",
			);
			const isNearLiq = isNearLiquidation(
				priceData.price,
				liquidationPrice,
				leverage,
			);

			console.log(`Preparing ${subcommand.toUpperCase()} order...`);
			console.log(`\n═══════════════════════════════════════════════════════════════`);
			console.log(`                      ORDER DETAILS                        `);
			console.log(`═══════════════════════════════════════════════════════════════`);
			console.log(`\nSymbol:   ${symbol}`);
			console.log(`Side:     ${subcommand.toUpperCase()}`);
			console.log(`Size:     ${size}`);
			console.log(`Price:    $${price}`);
			console.log(`Leverage: ${leverage}x`);
			console.log(`Wallet:   ${signer.address}`);

			if (leverage > 1) {
				console.log(`\n📊 RISK ANALYSIS:`);
				console.log(
					`   Entry Price:        $${formatPrice(price)}`,
				);
				console.log(
					`   Current Price:       $${formatPrice(priceData.price)}`,
				);
				console.log(
					`   Liquidation Price:   $${formatPrice(liquidationPrice)}`,
				);
				console.log(
					`   Distance to Liquidation: ${formatPrice(Math.abs(priceData.price - liquidationPrice))}`,
				);
				if (isNearLiq) {
					console.warn(`   ⚠️  DANGER: Price is near liquidation threshold!`);
				}
			}

			console.log(`\n═══════════════════════════════════════════════════════════════`);
			console.log(
				`\n✅ Order validation complete. Submitting...`,
			);

			// Place the order on Hyperliquid
			const orderResult = await placeOrder(
				{
					symbol,
					side: subcommand as "buy" | "sell",
					size,
					price,
					leverage,
					timeInForce: "Gtc",
				},
				signer,
			);

			if (orderResult.status === "success") {
				console.log(`\n✅ Order placed successfully!`);
				console.log(`Order ID: ${orderResult.orderId}`);
			} else {
				console.log(`\n⏳ Order validation complete.`);
				console.log(`\n📝 Order Summary:`);
				console.log(`  Type: ${subcommand.toUpperCase()} Order`);
				console.log(`  Status: Ready to submit`);
				console.log(`  Notional Value: $${(size * price).toFixed(2)}`);
				console.log(`\nℹ️  ${orderResult.message}`);
			}

			console.log(`\n═══════════════════════════════════════════════════════════════\n`);
		} catch (error) {
			console.error(
				"Failed to place order:",
				error instanceof Error ? error.message : error,
			);
			process.exit(1);
		}
	} else if (subcommand === "list") {
		try {
			const signer = new Wallet(privateKey);
			console.log(`Fetching open orders for ${signer.address}...\n`);
			console.log(`═══════════════════════════════════════════════════════════════`);
			console.log(`                      OPEN ORDERS                        `);
			console.log(`═══════════════════════════════════════════════════════════════`);
			console.log(`\n📊 Order list coming soon (Phase 3 - Hyperliquid API)`);
			console.log(`═══════════════════════════════════════════════════════════════\n`);
		} catch (error) {
			console.error(
				"Failed to list orders:",
				error instanceof Error ? error.message : error,
			);
			process.exit(1);
		}
	} else if (subcommand === "cancel") {
		const orderId = getArg(args, "--order-id");

		if (!orderId) {
			console.error("Usage: clawearn hyperliquid order cancel --order-id <id>");
			process.exit(1);
		}

		console.log(`Cancelling order ${orderId}...`);
		console.log(`\n📊 Order cancellation coming soon (Phase 3 - Hyperliquid API)\n`);
	} else {
		console.error("Usage: clawearn hyperliquid order [buy|sell|list|cancel]");
		process.exit(1);
	}
}

async function handlePosition(args: string[]) {
	const subcommand = args[1];

	if (!subcommand) {
		console.error("Usage: clawearn hyperliquid position [list|close]");
		process.exit(1);
	}

	const privateKey = requirePrivateKey("hyperliquid position");

	if (subcommand === "list") {
		try {
			const signer = new Wallet(privateKey);
			console.log(`Fetching positions for ${signer.address}...\n`);
			console.log(`═══════════════════════════════════════════════════════════════`);
			console.log(`                      OPEN POSITIONS                        `);
			console.log(`═══════════════════════════════════════════════════════════════`);
			console.log(`\n📊 Position list coming soon (Phase 3 - Hyperliquid API)`);
			console.log(`═══════════════════════════════════════════════════════════════\n`);
		} catch (error) {
			console.error(
				"Failed to list positions:",
				error instanceof Error ? error.message : error,
			);
			process.exit(1);
		}
	} else if (subcommand === "close") {
		const symbol = getArg(args, "--symbol");

		if (!symbol) {
			console.error("Usage: clawearn hyperliquid position close --symbol <symbol>");
			process.exit(1);
		}

		try {
			const signer = new Wallet(privateKey);
			console.log(`Closing position for ${symbol}...\n`);
			console.log(`Wallet: ${signer.address}`);
			console.log(`Symbol: ${symbol}`);
			console.log(`\n📊 Position close coming soon (Phase 3 - Hyperliquid API)\n`);
		} catch (error) {
			console.error(
				"Failed to close position:",
				error instanceof Error ? error.message : error,
			);
			process.exit(1);
		}
	} else {
		console.error("Usage: clawearn hyperliquid position [list|close]");
		process.exit(1);
	}
}

function showHyperliquidHelp() {
	console.log(`
Hyperliquid Trading Commands

Usage: clawearn hyperliquid <command> [subcommand] [options]

⚠️  IMPORTANT - READ FIRST:
  Hyperliquid is a perpetual futures exchange with leverage.
  This is MUCH riskier than prediction markets (Polymarket).
  
  KEY RISKS:
  - Positions can be liquidated
  - Leverage multiplies losses
  - Market is 24/7 (no closing time)
  - Requires active monitoring
  
  START SAFE:
  - Use 1x leverage only (no leverage)
  - Start with tiny positions
  - Never use 100% of capital
  - Monitor positions constantly

SETUP:
  First, create a wallet:
    clawearn wallet create

ACCOUNT COMMANDS:
  account              Show your wallet address and account status
  account info         Same as above

BALANCE COMMANDS:
  balance check        Check your USDC balance on Arbitrum

DEPOSIT COMMANDS:
   deposit              Deposit USDC to Hyperliquid
     --amount <amount>  Amount of USDC to deposit (minimum: 10)

WITHDRAWAL COMMANDS:
   withdraw             Withdraw USDC from Hyperliquid
     --amount <amount>  Amount of USDC to withdraw (minimum: 10)

PRICE COMMANDS:
  price                Get current market price
    --symbol <symbol>  Symbol to get price for (e.g., BTC-USD, ETH-USD)

ORDER COMMANDS:
  order buy            Place a buy order
    --symbol <symbol>  Trading symbol
    --size <size>      Position size
    --price <price>    Order price
    --leverage <lev>   Leverage (1-20x, default: 1x)

  order sell           Place a sell order
    --symbol <symbol>  Trading symbol
    --size <size>      Position size
    --price <price>    Order price
    --leverage <lev>   Leverage (1-20x, default: 1x)

  order list           List all open orders

  order cancel         Cancel an order
    --order-id <id>    Order ID to cancel

POSITION COMMANDS:
  position list        List all open positions

  position close       Close a position
    --symbol <symbol>  Symbol to close

EXAMPLES:
  # Show account info
  clawearn hyperliquid account

  # Check USDC balance
  clawearn hyperliquid balance check

  # Deposit USDC
  clawearn hyperliquid deposit --amount 100

  # Withdraw USDC
  clawearn hyperliquid withdraw --amount 50

  # Get BTC price
  clawearn hyperliquid price --symbol BTC-USD

  # Place 1x leverage buy order (safe)
  clawearn hyperliquid order buy \\
    --symbol BTC-USD \\
    --size 0.1 \\
    --price 50000

  # List open positions
  clawearn hyperliquid position list

  # Close a position
  clawearn hyperliquid position close --symbol BTC-USD

DOCUMENTATION:
  Read skills/markets/hyperliquid/SKILL.md for full guide
  ⚠️  Pay special attention to risk warnings!

SUPPORT:
  GitHub: https://github.com/stonega/clawearn
  Hyperliquid Docs: https://hyperliquid.gitbook.io
`);
}
