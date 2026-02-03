import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { Wallet } from "ethers";

const WALLET_DIR = path.join(os.homedir(), ".config", "clawearn");
const WALLET_FILE = path.join(WALLET_DIR, "wallet.json");

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
	console.log(`\n   ${wallet.address}\n`);
	console.log(
		"═══════════════════════════════════════════════════════════════",
	);
	console.log(
		"\n📤 Send USDC (Arbitrum) to this address to fund your trading account",
	);
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

EXAMPLES:
  # Create a new wallet
  clawearn wallet create

  # Show your wallet address (for receiving funds)
  clawearn wallet show

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
