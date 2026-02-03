#!/usr/bin/env bun

import { runPolymarket } from "./commands/polymarket";
import { runWallet } from "./commands/wallet";

const VERSION = "0.1.0";

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

function showHelp() {
	console.log(`
ClawEarn - Prediction Market Trading CLI

Usage: clawearn <command> [subcommand] [options]

COMMANDS:
  wallet              Wallet management (create, show, export)
  polymarket, poly    Polymarket trading commands
  version, -v         Show version
  help, -h            Show this help

GETTING STARTED:
  # 1. Create a wallet on this device
  clawearn wallet create

  # 2. Fund your wallet with USDC on Polygon
  #    (send to the address shown after wallet creation)

  # 3. Start trading!
  clawearn polymarket market search --query "bitcoin"

EXAMPLES:
  # Show your wallet address (to receive funds)
  clawearn wallet show

  # Search for markets on Polymarket
  clawearn polymarket market search --query "bitcoin 2025"

  # Place a buy order on Polymarket
  clawearn poly order buy \\
    --token-id 0x... \\
    --price 0.50 \\
    --size 10

For more information on a specific command, use:
  clawearn <command> help
`);
}

main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
