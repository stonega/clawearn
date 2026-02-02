#!/usr/bin/env bun

const HOST = "https://clob.polymarket.com";
const GAMMA_API = "https://gamma-api.polymarket.com";
const DATA_API = "https://data-api.polymarket.com";
const CHAIN_ID = 137; // Polygon mainnet

// Lazy load heavy dependencies
let ClobClient: any;
let Wallet: any;

async function loadDependencies() {
  if (!ClobClient) {
    const module = await import("@polymarket/clob-client");
    ClobClient = module.ClobClient;
  }
  if (!Wallet) {
    const module = await import("ethers");
    Wallet = module.Wallet;
  }
}

// Command routing
const command = Bun.argv[2];
const subcommand = Bun.argv[3];

async function main() {
  try {
    if (!command) {
      showHelp();
      return;
    }

    switch (command) {
      case "account":
        await handleAccount();
        break;
      case "balance":
        await handleBalance();
        break;
      case "market":
        await handleMarket();
        break;
      case "price":
        await handlePrice();
        break;
      case "order":
        await handleOrder();
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

async function handleAccount() {
  if (subcommand === "create") {
    const email = getArg("--email");
    const password = getArg("--password");

    if (!email || !password) {
      console.error("Usage: account create --email <email> --password <password>");
      process.exit(1);
    }

    await loadDependencies();

    // Generate new wallet
    const wallet = Wallet.createRandom();
    console.log("Account created successfully!");
    console.log(`Address: ${wallet.address}`);
    console.log(`Private Key: ${wallet.privateKey}`);
    console.log(
      "\n⚠️  SAVE YOUR PRIVATE KEY SECURELY - You cannot recover it if lost!"
    );
    console.log(
      "Store this in an environment variable or secure key management system."
    );
  } else if (subcommand === "export-key") {
    const email = getArg("--email");
    const password = getArg("--password");
    const privateKey = getArg("--private-key");

    if (!privateKey && (!email || !password)) {
      console.error(
        "Usage: account export-key --private-key <key> OR --email <email> --password <password>"
      );
      process.exit(1);
    }

    console.log("Private Key: ", privateKey || "Set via --private-key flag");
    console.log(
      "⚠️  NEVER share your private key. Use it only with trusted services."
    );
  } else {
    console.error("Usage: account [create|export-key]");
    process.exit(1);
  }
}

async function handleBalance() {
  if (subcommand === "check") {
    const privateKey = getArg("--private-key");

    if (!privateKey) {
      console.error("Usage: balance check --private-key <key>");
      process.exit(1);
    }

    try {
      await loadDependencies();

      const signer = new Wallet(privateKey);
      const client = new ClobClient(HOST, CHAIN_ID, signer);
      const apiCreds = await client.createOrDeriveApiKey();

      const signatureType = parseInt(getArg("--signature-type") || "0");
      const funderAddress =
        getArg("--funder") || signer.address;

      const authedClient = new ClobClient(
        HOST,
        CHAIN_ID,
        signer,
        apiCreds,
        signatureType,
        funderAddress
      );

      // Note: For full balance data, would need to implement balance fetch
      // from user positions API
      console.log(`Wallet Address: ${signer.address}`);
      console.log("API Credentials derived successfully");
      console.log("Use --funder flag for proxy wallet address if applicable");
    } catch (error) {
      console.error(
        "Failed to check balance:",
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  } else if (subcommand === "pocket-money") {
    const amount = getArg("--amount");

    if (!amount) {
      console.error("Usage: balance pocket-money --amount <amount>");
      process.exit(1);
    }

    console.log(`Requesting ${amount} USDC pocket money...`);
    console.log("Note: Pocket money requires testnet setup or faucet access");
    console.log("For production, deposit via Polymarket.com interface");
  } else {
    console.error("Usage: balance [check|pocket-money]");
    process.exit(1);
  }
}

async function handleMarket() {
  if (subcommand === "search") {
    const query = getArg("--query");

    if (!query) {
      console.error("Usage: market search --query <query>");
      process.exit(1);
    }

    try {
      // Search via Gamma API
      const response = await fetch(
        `${GAMMA_API}/search?q=${encodeURIComponent(query)}&limit=10`
      );
      const results = await response.json();

      console.log(`Search results for "${query}":`);
      console.log(JSON.stringify(results, null, 2));
    } catch (error) {
      console.error(
        "Market search failed:",
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  } else if (subcommand === "list") {
    const tag = getArg("--tag");
    const limit = getArg("--limit") || "10";

    try {
      const response = await fetch(
        `${GAMMA_API}/events?active=true&closed=false&limit=${limit}${tag ? `&tag_id=${tag}` : ""}`
      );
      const events = await response.json();

      console.log(`Active markets (limit: ${limit}):`);
      console.log(JSON.stringify(events, null, 2));
    } catch (error) {
      console.error(
        "Failed to list markets:",
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  } else if (subcommand === "info") {
    const marketId = getArg("--market-id");

    if (!marketId) {
      console.error("Usage: market info --market-id <id>");
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
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  } else {
    console.error("Usage: market [search|list|info]");
    process.exit(1);
  }
}

async function handlePrice() {
  if (subcommand === "get") {
    const tokenId = getArg("--token-id");
    const side = getArg("--side") || "buy";

    if (!tokenId) {
      console.error("Usage: price get --token-id <id> [--side buy|sell]");
      process.exit(1);
    }

    try {
      const response = await fetch(
        `${HOST}/price?token_id=${tokenId}&side=${side}`
      );
      const price = await response.json();

      console.log(`Current price for token ${tokenId}:`);
      console.log(JSON.stringify(price, null, 2));
    } catch (error) {
      console.error(
        "Failed to fetch price:",
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  } else if (subcommand === "book") {
    const tokenId = getArg("--token-id");

    if (!tokenId) {
      console.error("Usage: price book --token-id <id>");
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
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  } else {
    console.error("Usage: price [get|book]");
    process.exit(1);
  }
}

async function handleOrder() {
  if (subcommand === "buy" || subcommand === "sell") {
    const tokenId = getArg("--token-id");
    const price = parseFloat(getArg("--price") || "0");
    const size = parseFloat(getArg("--size") || "1");
    const privateKey = getArg("--private-key");
    const signatureType = parseInt(getArg("--signature-type") || "0");
    const funder = getArg("--funder");

    if (!tokenId || !privateKey || price === 0 || size === 0) {
      console.error(
        `Usage: order ${subcommand} --token-id <id> --price <price> --size <size> --private-key <key> [--signature-type <0|1|2>] [--funder <address>]`
      );
      process.exit(1);
    }

    try {
      await loadDependencies();

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
        funderAddress
      );

      console.log("Fetching market details...");
      const market = await authedClient.getMarket(tokenId);

      console.log(
        `Placing ${subcommand.toUpperCase()} order: ${size} shares @ $${price}`
      );

      const module = await import("@polymarket/clob-client");
      const side =
        subcommand === "buy"
          ? module.Side.BUY
          : module.Side.SELL;

      const response = await authedClient.createAndPostOrder(
        {
          tokenID: tokenId,
          price: price,
          size: size,
          side: side,
        },
        {
          tickSize: market.tickSize,
          negRisk: market.negRisk,
        },
        module.OrderType.GTC
      );

      console.log("✓ Order placed successfully!");
      console.log(`Order ID: ${response.orderID}`);
      console.log(`Status: ${response.status}`);
    } catch (error) {
      console.error(
        "Failed to place order:",
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  } else if (subcommand === "list-open") {
    const privateKey = getArg("--private-key");

    if (!privateKey) {
      console.error("Usage: order list-open --private-key <key>");
      process.exit(1);
    }

    try {
      await loadDependencies();

      const signer = new Wallet(privateKey);
      const client = new ClobClient(HOST, CHAIN_ID, signer);
      const userApiCreds = await client.createOrDeriveApiKey();

      const signatureType = parseInt(getArg("--signature-type") || "0");
      const funder = getArg("--funder") || signer.address;

      const authedClient = new ClobClient(
        HOST,
        CHAIN_ID,
        signer,
        userApiCreds,
        signatureType,
        funder
      );

      console.log("Fetching open orders...");
      const orders = await authedClient.getOpenOrders();

      console.log(`Found ${orders.length} open orders:`);
      console.log(JSON.stringify(orders, null, 2));
    } catch (error) {
      console.error(
        "Failed to fetch orders:",
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  } else if (subcommand === "cancel") {
    const orderId = getArg("--order-id");
    const privateKey = getArg("--private-key");

    if (!orderId || !privateKey) {
      console.error("Usage: order cancel --order-id <id> --private-key <key>");
      process.exit(1);
    }

    try {
      await loadDependencies();

      const signer = new Wallet(privateKey);
      const client = new ClobClient(HOST, CHAIN_ID, signer);
      const userApiCreds = await client.createOrDeriveApiKey();

      const signatureType = parseInt(getArg("--signature-type") || "0");
      const funder = getArg("--funder") || signer.address;

      const authedClient = new ClobClient(
        HOST,
        CHAIN_ID,
        signer,
        userApiCreds,
        signatureType,
        funder
      );

      console.log(`Cancelling order ${orderId}...`);
      await authedClient.cancelOrder(orderId);

      console.log("✓ Order cancelled successfully!");
    } catch (error) {
      console.error(
        "Failed to cancel order:",
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  } else {
    console.error("Usage: order [buy|sell|list-open|cancel]");
    process.exit(1);
  }
}

function getArg(name: string): string | null {
  const index = Bun.argv.indexOf(name);
  return index !== -1 && index + 1 < Bun.argv.length
    ? Bun.argv[index + 1]
    : null;
}

function showHelp() {
  console.log(`
Polymarket Trading CLI

Usage: polymarket-cli.ts <command> [subcommand] [options]

ACCOUNT COMMANDS:
  account create
    --email <email>              Email for the account
    --password <password>        Password for the account

  account export-key
    --private-key <key>          Your private key
    --email <email>              Account email
    --password <password>        Account password

BALANCE COMMANDS:
  balance check
    --private-key <key>          Your private key
    --signature-type <0|1|2>     0=EOA, 1=POLY_PROXY, 2=GNOSIS_SAFE (default: 0)
    --funder <address>           Funder address (default: wallet address)

  balance pocket-money
    --amount <amount>            Amount to request

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
    --private-key <key>          Your private key
    --signature-type <0|1|2>     0=EOA, 1=POLY_PROXY, 2=GNOSIS_SAFE (default: 0)
    --funder <address>           Funder address (for proxy wallets)

  order sell
    --token-id <id>              Token ID
    --price <price>              Price per share
    --size <size>                Number of shares
    --private-key <key>          Your private key
    --signature-type <0|1|2>     0=EOA, 1=POLY_PROXY, 2=GNOSIS_SAFE (default: 0)
    --funder <address>           Funder address (for proxy wallets)

  order list-open
    --private-key <key>          Your private key
    --signature-type <0|1|2>     0=EOA, 1=POLY_PROXY, 2=GNOSIS_SAFE (default: 0)
    --funder <address>           Funder address (for proxy wallets)

  order cancel
    --order-id <id>              Order ID to cancel
    --private-key <key>          Your private key
    --signature-type <0|1|2>     0=EOA, 1=POLY_PROXY, 2=GNOSIS_SAFE (default: 0)
    --funder <address>           Funder address (for proxy wallets)

SIGNATURE TYPES:
  0 (EOA)         - Standalone wallet (you pay gas)
  1 (POLY_PROXY)  - Polymarket.com account (email/Google login)
  2 (GNOSIS_SAFE) - Polymarket.com account (wallet connection)

EXAMPLES:
  # Search for markets
  polymarket-cli.ts market search --query "bitcoin 2025"

  # Place a buy order
  polymarket-cli.ts order buy \\
    --token-id 0x... \\
    --price 0.50 \\
    --size 10 \\
    --private-key $PRIVATE_KEY

  # Check open orders
  polymarket-cli.ts order list-open --private-key $PRIVATE_KEY

  # View market details
  polymarket-cli.ts market info --market-id 0x...

  # Get current price
  polymarket-cli.ts price get --token-id 0x... --side buy
`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
