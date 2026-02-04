import { ethers, Wallet } from "ethers";
import { getStoredPrivateKey } from "./wallet";

const HYPERLIQUID_RPC = "https://api.hyperliquid.xyz";
const ARBITRUM_RPC = "https://arb1.arbitrum.io/rpc";
const USDC_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"; // Native USDC on Arbitrum

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

async function handleBalance(args: string[]) {
	const subcommand = args[1];

	if (subcommand === "check") {
		const privateKey = requirePrivateKey("hyperliquid balance check");

		try {
			const signer = new Wallet(privateKey);
			const provider = new ethers.providers.JsonRpcProvider(ARBITRUM_RPC);
			const signerWithProvider = signer.connect(provider);

			console.log("Checking USDC balance on Arbitrum...\n");

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

			console.log(`═══════════════════════════════════════════════════════════════`);
			console.log(
				`                         HYPERLIQUID BALANCE                     `,
			);
			console.log(`═══════════════════════════════════════════════════════════════`);
			console.log(`\nWallet Address: ${signer.address}`);
			console.log(`\nUSDC Balance:  ${usdcFormatted} USDC`);
			console.log(`ETH Balance:   ${ethFormatted} ETH (for gas)`);
			console.log(
				`\n═══════════════════════════════════════════════════════════════\n`,
			);

			if (parseFloat(usdcFormatted) === 0) {
				console.log(
					"⚠️  Your USDC balance is 0. Fund your wallet to start trading!\n",
				);
			}
		} catch (error) {
			console.error(
				"Failed to check balance:",
				error instanceof Error ? error.message : error,
			);
			process.exit(1);
		}
	} else if (subcommand === "deposit") {
		console.error(
			"❌ Deposit command coming soon! (Phase 2)\nFor now, send USDC directly to your wallet address.",
		);
		process.exit(1);
	} else {
		console.error("Usage: clawearn hyperliquid balance [check|deposit]");
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
  balance deposit      Deposit USDC (coming soon)

EXAMPLES:
  # Show account info
  clawearn hyperliquid account

  # Check USDC balance
  clawearn hyperliquid balance check

TRADING COMING SOON:
  # Phase 2: Deposits
  # Phase 3: Place orders
  # Phase 4: Manage positions

DOCUMENTATION:
  Read skills/markets/hyperliquid/SKILL.md for full guide
  ⚠️  Pay special attention to risk warnings!

SUPPORT:
  GitHub: https://github.com/stonega/clawearn
  Hyperliquid Docs: https://hyperliquid.gitbook.io
`);
}
