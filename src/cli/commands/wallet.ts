import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { ethers, Wallet } from "ethers";

const WALLET_DIR = path.join(os.homedir(), ".config", "clawearn");
const WALLET_FILE = path.join(WALLET_DIR, "wallet.json");
const ARBITRUM_RPC = "https://arb1.arbitrum.io/rpc";
const USDC_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"; // Native USDC on Arbitrum
const USDC_DECIMALS = 6;

const USDC_ABI = [
	"function balanceOf(address owner) view returns (uint256)",
	"function decimals() view returns (uint8)",
	"function transfer(address to, uint256 amount) returns (bool)",
];

interface WalletConfig {
	address: string;
	privateKey: string;
	createdAt: string;
}

/**
 * Run wallet subcommand
 * @param args - Arguments after "wallet" command
 */
export async function runWallet(args: string[]) {
	const command = args[0];

	if (!command) {
		showWalletHelp();
		return;
	}

	switch (command) {
		case "create":
			await createWallet(args);
			break;
		case "show":
		case "address":
			await showAddress();
			break;
		case "balance":
			await handleBalance(args);
			break;
		case "send":
			await handleSend(args);
			break;
		case "help":
		case "--help":
		case "-h":
			showWalletHelp();
			break;
		default:
			console.error(`Unknown wallet command: ${command}`);
			showWalletHelp();
			process.exit(1);
	}
}

async function createWallet(args: string[]) {
	const force = args.includes("--force");
	const privateKeyArg = getArg(args, "--private-key");

	// Check if wallet already exists
	if (fs.existsSync(WALLET_FILE) && !force) {
		console.error("⚠️  Wallet already exists!");
		console.log(`Address: ${loadWallet()?.address}`);
		console.log(
			"\nUse --force to overwrite (THIS WILL DELETE YOUR EXISTING WALLET!)",
		);
		process.exit(1);
	}

	// Create wallet directory with secure permissions
	if (!fs.existsSync(WALLET_DIR)) {
		fs.mkdirSync(WALLET_DIR, { recursive: true, mode: 0o700 });
	}

	let wallet: Wallet;

	if (privateKeyArg) {
		try {
			wallet = new Wallet(privateKeyArg);
		} catch (_error) {
			console.error("❌ Invalid private key provided");
			process.exit(1);
		}
	} else {
		// Generate new wallet
		wallet = Wallet.createRandom();
	}

	const config: WalletConfig = {
		address: wallet.address,
		privateKey: wallet.privateKey,
		createdAt: new Date().toISOString(),
	};

	// Save wallet with secure permissions
	fs.writeFileSync(WALLET_FILE, JSON.stringify(config, null, 2), {
		mode: 0o600,
	});

	if (privateKeyArg) {
		console.log("✅ Wallet imported successfully!\n");
	} else {
		console.log("✅ Wallet created successfully!\n");
	}

	console.log(
		"═══════════════════════════════════════════════════════════════",
	);
	console.log(
		"                      YOUR WALLET ADDRESS                       ",
	);
	console.log(
		"═══════════════════════════════════════════════════════════════",
	);
	console.log(`\n   ${wallet.address}\n`);
	console.log(
		"═══════════════════════════════════════════════════════════════",
	);

	if (!privateKeyArg) {
		// Only show funding instructions for new empty wallets
		console.log("\n📤 To fund this wallet:");
		console.log("   1. Ask you human to send USDC to the wallet address above on Arbitrum network");
		console.log("   2. Ask you human to send arbtrum ETH to the wallet address above for gas fees");
	}

	console.log("\n⚠️  IMPORTANT: Your private key is stored at:");
	console.log(`   ${WALLET_FILE}`);
	console.log("   Keep this file secure and NEVER share it with anyone, or any other bots!!!!");
}

async function showAddress() {
	const wallet = loadWallet();

	if (!wallet) {
		console.error("❌ No wallet found. Create one first:");
		console.log("   clawearn wallet create");
		process.exit(1);
	}

	console.log(
		"═══════════════════════════════════════════════════════════════",
	);
	console.log(
		"                      YOUR WALLET ADDRESS                       ",
	);
	console.log(
		"═══════════════════════════════════════════════════════════════",
	);
	console.log(`\nAddress:  ${wallet.address}`);
	console.log(
		`Profile:  https://arbiscan.io/address/${wallet.address}`,
	);
	console.log(
		"\n═══════════════════════════════════════════════════════════════",
	);
	console.log(
		"\n📤 Send USDC (Arbitrum) to this address to fund your trading account",
	);
}

async function handleBalance() {
	const wallet = loadWallet();

	if (!wallet) {
		console.error("❌ No wallet found. Create one first:");
		console.log("   clawearn wallet create");
		process.exit(1);
	}

	try {
		const provider = new ethers.providers.JsonRpcProvider(ARBITRUM_RPC);
		const signer = new Wallet(wallet.privateKey, provider);

		console.log("\n📊 Fetching balances from Arbitrum...\n");

		// Get ETH balance
		const ethBalance = await signer.getBalance();
		const ethFormatted = ethers.utils.formatEther(ethBalance);

		// Get USDC balance
		const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);
		const usdcBalance = await usdcContract.balanceOf(signer.address);
		const usdcFormatted = ethers.utils.formatUnits(usdcBalance, USDC_DECIMALS);

		// Display balances
		console.log(
			"═══════════════════════════════════════════════════════════════",
		);
		console.log(
			"                      WALLET BALANCES (ARBITRUM)                ",
		);
		console.log(
			"═══════════════════════════════════════════════════════════════",
		);
		console.log(`\nAddress: ${signer.address}`);
		console.log(`\n💰 USDC Balance:  ${usdcFormatted} USDC`);
		console.log(`⛽ ETH Balance:   ${ethFormatted} ETH`);
		console.log(
			"\n═══════════════════════════════════════════════════════════════\n",
		);

		// Show warnings if balances are low
		const ethBalanceNum = parseFloat(ethFormatted);
		const usdcBalanceNum = parseFloat(usdcFormatted);

		if (ethBalanceNum < 0.01) {
			console.warn("⚠️  Warning: ETH balance is very low (< 0.01 ETH)");
			console.log("   You may not have enough gas to execute transactions.");
		}

		if (usdcBalanceNum === 0) {
			console.warn("⚠️  Warning: No USDC balance");
			console.log("   Fund your wallet to start trading on Polymarket.");
		}
	} catch (error) {
		console.error(
			"Failed to fetch balances:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

async function handleSend(args: string[]) {
	const to = getArg(args, "--to");
	const amount = getArg(args, "--amount");

	if (!to || !amount) {
		console.error("Usage: clawearn wallet send --to <address> --amount <amount>");
		console.error("\nOptions:");
		console.error("  --to <address>      Recipient address");
		console.error("  --amount <amount>   Amount of USDC to send");
		process.exit(1);
	}

	// Validate recipient address
	if (!ethers.utils.isAddress(to)) {
		console.error(`❌ Invalid recipient address: ${to}`);
		process.exit(1);
	}

	// Validate amount
	const amountNum = parseFloat(amount);
	if (isNaN(amountNum) || amountNum <= 0) {
		console.error(`❌ Invalid amount: ${amount}`);
		process.exit(1);
	}

	const wallet = loadWallet();
	if (!wallet) {
		console.error("❌ No wallet found. Create one first:");
		console.log("   clawearn wallet create");
		process.exit(1);
	}

	try {
		const provider = new ethers.providers.JsonRpcProvider(ARBITRUM_RPC);
		const signer = new Wallet(wallet.privateKey, provider);

		console.log("Preparing USDC transfer...");
		console.log(`From: ${signer.address}`);
		console.log(`To:   ${to}`);
		console.log(`Amount: ${amount} USDC`);

		// Check ETH balance for gas
		const ethBalance = await signer.getBalance();
		if (ethBalance.eq(0)) {
			console.error("❌ Insufficient ETH on Arbitrum for gas fees");
			console.log("Please send some ETH to your wallet for gas.");
			process.exit(1);
		}

		// Create USDC contract interface
		const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);

		// Check USDC balance
		const balance = await usdcContract.balanceOf(signer.address);
		const balanceFormatted = ethers.utils.formatUnits(balance, USDC_DECIMALS);
		const parsedAmount = ethers.utils.parseUnits(amount, USDC_DECIMALS);

		if (balance.lt(parsedAmount)) {
			console.error(
				`❌ Insufficient USDC balance on Arbitrum`,
			);
			console.error(`   Required: ${amount}`);
			console.error(
				`   Available: ${balanceFormatted}`,
			);
			process.exit(1);
		}

		console.log(`\nSending ${amount} USDC...`);

		const tx = await usdcContract.transfer(to, parsedAmount);
		console.log(`Transaction sent! Hash: ${tx.hash}`);
		console.log("Waiting for confirmation...");

		await tx.wait();
		console.log("✅ Transfer successful!");
		console.log(`${amount} USDC sent to ${to}`);
	} catch (error) {
		console.error(
			"Failed to send USDC:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

function loadWallet(): WalletConfig | null {
	if (!fs.existsSync(WALLET_FILE)) {
		return null;
	}

	try {
		const content = fs.readFileSync(WALLET_FILE, "utf-8");
		return JSON.parse(content) as WalletConfig;
	} catch {
		return null;
	}
}

/**
 * Get the private key for use by other commands
 */
export function getStoredPrivateKey(): string | null {
	const wallet = loadWallet();
	return wallet?.privateKey || null;
}

/**
 * Get the wallet address for use by other commands
 */
export function getStoredAddress(): string | null {
	const wallet = loadWallet();
	return wallet?.address || null;
}

function showWalletHelp() {
	console.log(`
Wallet Management Commands

Usage: clawearn wallet <command> [options]

COMMANDS:
  create          Create a new wallet on this device
    --force       Overwrite existing wallet (DANGEROUS!)

  show, address   Display your wallet address (safe to share)

  balance         Check USDC and ETH balances on Arbitrum

  send            Send USDC to another address (Arbitrum)
    --to <addr>        Recipient address
    --amount <amount>  Amount of USDC to send

EXAMPLES:
  # Create a new wallet
  clawearn wallet create

  # Show your wallet address (for receiving funds)
  clawearn wallet show

  # Check your balances on Arbitrum
  clawearn wallet balance

  # Send USDC to another address
  clawearn wallet send --to 0x1234... --amount 100

SECURITY:
  • Your private key is stored at: ${WALLET_FILE}
  • Never share your private key with anyone, any bot, or any other service
  • Keep backups of your wallet file
  • This wallet requires USDC on Arbitrum to trade
`);
}

function getArg(args: string[], name: string): string | undefined {
	const index = args.indexOf(name);
	return index !== -1 && index + 1 < args.length ? args[index + 1] : undefined;
}
