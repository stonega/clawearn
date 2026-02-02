import { Wallet } from "ethers";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const WALLET_DIR = path.join(os.homedir(), ".config", "moltearn");
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
        case "export":
            await exportKey(args);
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

    // Generate new wallet
    const wallet = Wallet.createRandom();

    const config: WalletConfig = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        createdAt: new Date().toISOString(),
    };

    // Save wallet with secure permissions
    fs.writeFileSync(WALLET_FILE, JSON.stringify(config, null, 2), {
        mode: 0o600,
    });

    console.log("✅ Wallet created successfully!\n");
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
    console.log("\n📤 To fund this wallet:");
    console.log("   1. Send USDC to the address above on Arbitrum network");
    console.log("   2. You'll need a small amount of ETH for gas fees");
    console.log("\n🔗 Bridge to Arbitrum: https://bridge.arbitrum.io/");
    console.log("🛒 Buy crypto: https://www.moonpay.com/ or use an exchange");
    console.log("\n⚠️  IMPORTANT: Your private key is stored at:");
    console.log(`   ${WALLET_FILE}`);
    console.log("   Keep this file secure and NEVER share it with anyone!");
    console.log("\n💡 Once funded, you can start trading with:");
    console.log('   moltearn polymarket market search --query "bitcoin"');
}

async function showAddress() {
    const wallet = loadWallet();

    if (!wallet) {
        console.error("❌ No wallet found. Create one first:");
        console.log("   moltearn wallet create");
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

async function exportKey(args: string[]) {
    const confirm = args.includes("--confirm");

    if (!confirm) {
        console.error("⚠️  WARNING: This will display your private key!");
        console.log("   Private keys give FULL CONTROL of your wallet.");
        console.log("   Never share this with anyone or paste it into websites.");
        console.log("\n   To confirm, run: moltearn wallet export --confirm");
        process.exit(1);
    }

    const wallet = loadWallet();

    if (!wallet) {
        console.error("❌ No wallet found. Create one first:");
        console.log("   moltearn wallet create");
        process.exit(1);
    }

    console.log("\n🔐 Your private key:");
    console.log(`   ${wallet.privateKey}`);
    console.log("\n⚠️  NEVER share this key with anyone!");
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

Usage: moltearn wallet <command> [options]

COMMANDS:
  create          Create a new wallet on this device
    --force       Overwrite existing wallet (DANGEROUS!)

  show, address   Display your wallet address (safe to share)

  export          Export your private key
    --confirm     Required flag to show the key

EXAMPLES:
  # Create a new wallet
  moltearn wallet create

  # Show your wallet address (for receiving funds)
  moltearn wallet show

  # Export private key (use with caution!)
  moltearn wallet export --confirm

SECURITY:
  • Your private key is stored at: ${WALLET_FILE}
  • Never share your private key with anyone
  • Keep backups of your wallet file
  • This wallet requires USDC on Arbitrum to trade
`);
}
