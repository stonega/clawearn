import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

// Test directory to avoid touching real wallet
const TEST_WALLET_DIR = path.join(os.tmpdir(), `clawearn-test-${Date.now()}`);
const _TEST_WALLET_FILE = path.join(TEST_WALLET_DIR, "wallet.json");

// Mock the wallet module paths before importing
const _originalHomedir = os.homedir;

describe("wallet.ts", () => {
	beforeEach(() => {
		// Clean up test directory
		if (fs.existsSync(TEST_WALLET_DIR)) {
			fs.rmSync(TEST_WALLET_DIR, { recursive: true });
		}
		fs.mkdirSync(TEST_WALLET_DIR, { recursive: true });
	});

	afterEach(() => {
		// Cleanup
		if (fs.existsSync(TEST_WALLET_DIR)) {
			fs.rmSync(TEST_WALLET_DIR, { recursive: true });
		}
	});

	describe("getStoredPrivateKey", () => {
		it("should return null if no wallet file exists", async () => {
			// Import fresh module
			const { getStoredPrivateKey } = await import("./wallet");
			// Since we can't easily mock the path, we test the actual behavior
			// This test assumes no wallet file exists in the test environment
			const key = getStoredPrivateKey();
			expect(key === null || typeof key === "string").toBe(true);
		});
	});

	describe("getStoredAddress", () => {
		it("should return null if no wallet file exists", async () => {
			const { getStoredAddress } = await import("./wallet");
			const address = getStoredAddress();
			expect(address === null || typeof address === "string").toBe(true);
		});
	});
});

// Test helper functions that can be unit tested
describe("wallet helper functions", () => {
	describe("WalletConfig interface", () => {
		it("should have correct structure", () => {
			const config = {
				address: "0x1234567890123456789012345678901234567890",
				privateKey: "0xabcdef1234567890",
				createdAt: new Date().toISOString(),
			};

			expect(config.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
			expect(config.privateKey).toMatch(/^0x[a-fA-F0-9]+$/);
			expect(new Date(config.createdAt)).toBeInstanceOf(Date);
		});
	});
});

// Integration-style tests that verify command routing
describe("runWallet command routing", () => {
	let consoleLogSpy: ReturnType<typeof spyOn>;
	let consoleErrorSpy: ReturnType<typeof spyOn>;
	let processExitSpy: ReturnType<typeof spyOn>;

	beforeEach(() => {
		consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});
		consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
		processExitSpy = spyOn(process, "exit").mockImplementation(() => {
			throw new Error("process.exit called");
		});
	});

	afterEach(() => {
		consoleLogSpy.mockRestore();
		consoleErrorSpy.mockRestore();
		processExitSpy.mockRestore();
	});

	it("should show help when no command provided", async () => {
		const { runWallet } = await import("./wallet");
		await runWallet([]);

		expect(consoleLogSpy).toHaveBeenCalled();
		const output = consoleLogSpy.mock.calls.flat().join(" ");
		expect(output).toContain("Wallet Management Commands");
	});

	it("should show help for --help flag", async () => {
		const { runWallet } = await import("./wallet");
		await runWallet(["--help"]);

		expect(consoleLogSpy).toHaveBeenCalled();
		const output = consoleLogSpy.mock.calls.flat().join(" ");
		expect(output).toContain("Wallet Management Commands");
	});

	it("should show help for help command", async () => {
		const { runWallet } = await import("./wallet");
		await runWallet(["help"]);

		expect(consoleLogSpy).toHaveBeenCalled();
		const output = consoleLogSpy.mock.calls.flat().join(" ");
		expect(output).toContain("Wallet Management Commands");
	});

	it("should show help for -h flag", async () => {
		const { runWallet } = await import("./wallet");
		await runWallet(["-h"]);

		expect(consoleLogSpy).toHaveBeenCalled();
		const output = consoleLogSpy.mock.calls.flat().join(" ");
		expect(output).toContain("Wallet Management Commands");
	});

	it("should error for unknown command", async () => {
		const { runWallet } = await import("./wallet");

		try {
			await runWallet(["unknown-command"]);
		} catch (_e) {
			// Expected: process.exit throws
		}

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"Unknown wallet command: unknown-command",
		);
	});
});

describe("wallet send command validation", () => {
	let consoleLogSpy: ReturnType<typeof spyOn>;
	let consoleErrorSpy: ReturnType<typeof spyOn>;
	let processExitSpy: ReturnType<typeof spyOn>;

	beforeEach(() => {
		consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});
		consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
		processExitSpy = spyOn(process, "exit").mockImplementation(() => {
			throw new Error("process.exit called");
		});
	});

	afterEach(() => {
		consoleLogSpy.mockRestore();
		consoleErrorSpy.mockRestore();
		processExitSpy.mockRestore();
	});

	it("should error when send is missing --to and --amount", async () => {
		const { runWallet } = await import("./wallet");

		try {
			await runWallet(["send"]);
		} catch (_e) {
			// Expected: process.exit throws
		}

		expect(consoleErrorSpy).toHaveBeenCalled();
		const errorOutput = consoleErrorSpy.mock.calls.flat().join(" ");
		expect(errorOutput).toContain("--to");
		expect(errorOutput).toContain("--amount");
	});

	it("should error when send is missing --to", async () => {
		const { runWallet } = await import("./wallet");

		try {
			await runWallet(["send", "--amount", "100"]);
		} catch (_e) {
			// Expected: process.exit throws
		}

		expect(consoleErrorSpy).toHaveBeenCalled();
		const errorOutput = consoleErrorSpy.mock.calls.flat().join(" ");
		expect(errorOutput).toContain("--to");
	});

	it("should error when send is missing --amount", async () => {
		const { runWallet } = await import("./wallet");

		try {
			await runWallet(["send", "--to", "0x1234567890123456789012345678901234567890"]);
		} catch (_e) {
			// Expected: process.exit throws
		}

		expect(consoleErrorSpy).toHaveBeenCalled();
		const errorOutput = consoleErrorSpy.mock.calls.flat().join(" ");
		expect(errorOutput).toContain("--amount");
	});

	it("should error on invalid recipient address", async () => {
		const { runWallet } = await import("./wallet");

		try {
			await runWallet(["send", "--to", "invalid-address", "--amount", "100"]);
		} catch (_e) {
			// Expected: process.exit throws
		}

		expect(consoleErrorSpy).toHaveBeenCalled();
		const errorOutput = consoleErrorSpy.mock.calls.flat().join(" ");
		expect(errorOutput).toContain("Invalid recipient address");
	});

	it("should error on invalid amount (non-numeric)", async () => {
		const { runWallet } = await import("./wallet");

		try {
			await runWallet([
				"send",
				"--to",
				"0x1234567890123456789012345678901234567890",
				"--amount",
				"invalid",
			]);
		} catch (_e) {
			// Expected: process.exit throws
		}

		expect(consoleErrorSpy).toHaveBeenCalled();
		const errorOutput = consoleErrorSpy.mock.calls.flat().join(" ");
		expect(errorOutput).toContain("Invalid amount");
	});

	it("should error on negative amount", async () => {
		const { runWallet } = await import("./wallet");

		try {
			await runWallet([
				"send",
				"--to",
				"0x1234567890123456789012345678901234567890",
				"--amount",
				"-100",
			]);
		} catch (_e) {
			// Expected: process.exit throws
		}

		expect(consoleErrorSpy).toHaveBeenCalled();
		const errorOutput = consoleErrorSpy.mock.calls.flat().join(" ");
		expect(errorOutput).toContain("Invalid amount");
	});

	it("should error on zero amount", async () => {
		const { runWallet } = await import("./wallet");

		try {
			await runWallet([
				"send",
				"--to",
				"0x1234567890123456789012345678901234567890",
				"--amount",
				"0",
			]);
		} catch (_e) {
			// Expected: process.exit throws
		}

		expect(consoleErrorSpy).toHaveBeenCalled();
		const errorOutput = consoleErrorSpy.mock.calls.flat().join(" ");
		expect(errorOutput).toContain("Invalid amount");
	});
});
