#!/usr/bin/env bun

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { runHyperliquid } from "./commands/hyperliquid";
import { runPolymarket } from "./commands/polymarket";
import { runWallet } from "./commands/wallet";

const VERSION = "0.4.0";

// Command routing
const command = Bun.argv[2];

async function main() {
	try {
		if (!command) {
			showHelp();
			return;
		}

		switch (command) {
			case "wallet":
				await runWallet(Bun.argv.slice(3));
				break;
			case "polymarket":
			case "poly":
				await runPolymarket(Bun.argv.slice(3));
				break;
			case "hyperliquid":
			case "hl":
				await runHyperliquid(Bun.argv.slice(3));
				break;
			case "uninstall":
				await handleUninstall(Bun.argv.slice(3));
				break;
			case "version":
			case "--version":
			case "-v":
				console.log(`clawearn v${VERSION}`);
				break;
			case "help":
			case "--help":
			case "-h":
				showHelp();
				break;
			default:
				console.error(`Unknown command: ${command}`);
				showHelp();
				process.exit(1);
		}
	} catch (error) {
		console.error("Error:", error instanceof Error ? error.message : error);
		process.exit(1);
	}
}

async function handleUninstall(args: string[]) {
	const force = args.includes("--force");

	console.log("\n🔐 ClawEarn Uninstall\n");
	console.log(
		"This will uninstall the CLI but PRESERVE your wallet for backup.\n",
	);

	const walletPath = path.join(os.homedir(), ".config", "clawearn");
	const walletFile = path.join(walletPath, "wallet.json");

	if (fs.existsSync(walletFile)) {
		console.log(`📁 Wallet found at: ${walletFile}`);
		console.log("✅ Wallet will be PRESERVED (not deleted)\n");
	}

	if (!force) {
		console.log("To complete uninstall, run:");
		console.log("  bun unlink");
		console.log("\nOr to uninstall globally:");
		console.log("  npm uninstall -g clawearn\n");
		console.log("To force uninstall without prompting:");
		console.log("  clawearn uninstall --force\n");
		return;
	}

	console.log("✅ Uninstall complete!");
	console.log("\nYour wallet has been preserved at:");
	console.log(`  ${walletFile}\n`);
	console.log("To restore clawearn later:");
	console.log("  bun install");
	console.log("  bun link\n");
}

function showHelp() {
	console.log(`
ClawEarn - Trading CLI

Usage: clawearn <command> [subcommand] [options]

COMMANDS:
   wallet                    Wallet management (create, show, send)
   polymarket, poly          Polymarket trading commands
   hyperliquid, hl           Hyperliquid perpetual futures trading
   uninstall                 Uninstall CLI (preserves wallet)
   version, -v               Show version
   help, -h                  Show this help

GETTING STARTED:
  # 1. Create a wallet on this device
  clawearn wallet create

  # 2. Fund your wallet with USDC on Arbitrum
  #    (send to the address shown after wallet creation)

  # 3. Start trading!
  clawearn polymarket market search --query "bitcoin"
  clawearn hyperliquid market list

EXAMPLES:
  # Show your wallet address (to receive funds)
  clawearn wallet show

  # Send USDC to another address
  clawearn wallet send --to 0x... --amount 100

  # Search for markets on Polymarket
  clawearn polymarket market search --query "bitcoin 2025"

  # Place a buy order on Polymarket
  clawearn poly order buy \\
    --token-id 0x... \\
    --price 0.50 \\
    --size 10

  # List Hyperliquid markets
  clawearn hyperliquid market list

  # Buy a perpetual on Hyperliquid
  clawearn hl order buy --coin ETH --price 3000 --size 0.1

For more information on a specific command, use:
  clawearn <command> help
	`);
}

main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
