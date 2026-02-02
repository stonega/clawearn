import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";

describe("polymarket.ts", () => {
    describe("getArg helper function", () => {
        // We'll test the getArg logic by reimplementing it for testing
        function getArg(args: string[], name: string): string | undefined {
            const index = args.indexOf(name);
            return index !== -1 && index + 1 < args.length
                ? args[index + 1]
                : undefined;
        }

        it("should return value after flag", () => {
            const args = ["--query", "bitcoin"];
            expect(getArg(args, "--query")).toBe("bitcoin");
        });

        it("should return undefined when flag not found", () => {
            const args = ["--other", "value"];
            expect(getArg(args, "--query")).toBeUndefined();
        });

        it("should return undefined when flag is last arg", () => {
            const args = ["--query"];
            expect(getArg(args, "--query")).toBeUndefined();
        });

        it("should handle multiple flags", () => {
            const args = ["--query", "test", "--limit", "10"];
            expect(getArg(args, "--query")).toBe("test");
            expect(getArg(args, "--limit")).toBe("10");
        });

        it("should return first occurrence", () => {
            const args = ["--query", "first", "--query", "second"];
            expect(getArg(args, "--query")).toBe("first");
        });
    });
});

describe("runPolymarket command routing", () => {
    let consoleLogSpy: ReturnType<typeof spyOn>;
    let consoleErrorSpy: ReturnType<typeof spyOn>;
    let processExitSpy: ReturnType<typeof spyOn>;

    beforeEach(() => {
        consoleLogSpy = spyOn(console, "log").mockImplementation(() => { });
        consoleErrorSpy = spyOn(console, "error").mockImplementation(() => { });
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
        const { runPolymarket } = await import("./polymarket");
        await runPolymarket([]);

        expect(consoleLogSpy).toHaveBeenCalled();
        const output = consoleLogSpy.mock.calls.flat().join(" ");
        expect(output).toContain("Polymarket Trading Commands");
    });

    it("should show help for --help flag", async () => {
        const { runPolymarket } = await import("./polymarket");
        await runPolymarket(["--help"]);

        expect(consoleLogSpy).toHaveBeenCalled();
        const output = consoleLogSpy.mock.calls.flat().join(" ");
        expect(output).toContain("Polymarket Trading Commands");
    });

    it("should show help for help command", async () => {
        const { runPolymarket } = await import("./polymarket");
        await runPolymarket(["help"]);

        expect(consoleLogSpy).toHaveBeenCalled();
        const output = consoleLogSpy.mock.calls.flat().join(" ");
        expect(output).toContain("Polymarket Trading Commands");
    });

    it("should show help for -h flag", async () => {
        const { runPolymarket } = await import("./polymarket");
        await runPolymarket(["-h"]);

        expect(consoleLogSpy).toHaveBeenCalled();
        const output = consoleLogSpy.mock.calls.flat().join(" ");
        expect(output).toContain("Polymarket Trading Commands");
    });

    it("should error for unknown command", async () => {
        const { runPolymarket } = await import("./polymarket");

        try {
            await runPolymarket(["unknown-command"]);
        } catch (_e) {
            // Expected: process.exit throws
        }

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            "Unknown polymarket command: unknown-command",
        );
    });
});

describe("polymarket subcommand validation", () => {
    let consoleLogSpy: ReturnType<typeof spyOn>;
    let consoleErrorSpy: ReturnType<typeof spyOn>;
    let processExitSpy: ReturnType<typeof spyOn>;

    beforeEach(() => {
        consoleLogSpy = spyOn(console, "log").mockImplementation(() => { });
        consoleErrorSpy = spyOn(console, "error").mockImplementation(() => { });
        processExitSpy = spyOn(process, "exit").mockImplementation(() => {
            throw new Error("process.exit called");
        });
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        processExitSpy.mockRestore();
    });

    it("should error when account subcommand is invalid", async () => {
        const { runPolymarket } = await import("./polymarket");

        try {
            await runPolymarket(["account", "invalid"]);
        } catch (_e) {
            // Expected: process.exit throws
        }

        expect(consoleErrorSpy).toHaveBeenCalled();
        const errorOutput = consoleErrorSpy.mock.calls.flat().join(" ");
        expect(errorOutput).toContain("account");
    });

    it("should error when balance subcommand is invalid", async () => {
        const { runPolymarket } = await import("./polymarket");

        try {
            await runPolymarket(["balance", "invalid"]);
        } catch (_e) {
            // Expected: process.exit throws
        }

        expect(consoleErrorSpy).toHaveBeenCalled();
        const errorOutput = consoleErrorSpy.mock.calls.flat().join(" ");
        expect(errorOutput).toContain("balance");
    });

    it("should error when market subcommand is invalid", async () => {
        const { runPolymarket } = await import("./polymarket");

        try {
            await runPolymarket(["market", "invalid"]);
        } catch (_e) {
            // Expected: process.exit throws
        }

        expect(consoleErrorSpy).toHaveBeenCalled();
        const errorOutput = consoleErrorSpy.mock.calls.flat().join(" ");
        expect(errorOutput).toContain("market");
    });

    it("should error when price subcommand is invalid", async () => {
        const { runPolymarket } = await import("./polymarket");

        try {
            await runPolymarket(["price", "invalid"]);
        } catch (_e) {
            // Expected: process.exit throws
        }

        expect(consoleErrorSpy).toHaveBeenCalled();
        const errorOutput = consoleErrorSpy.mock.calls.flat().join(" ");
        expect(errorOutput).toContain("price");
    });

    it("should error when order subcommand is invalid", async () => {
        const { runPolymarket } = await import("./polymarket");

        try {
            await runPolymarket(["order", "invalid"]);
        } catch (_e) {
            // Expected: process.exit throws
        }

        expect(consoleErrorSpy).toHaveBeenCalled();
        const errorOutput = consoleErrorSpy.mock.calls.flat().join(" ");
        expect(errorOutput).toContain("order");
    });
});

describe("polymarket argument validation", () => {
    let consoleLogSpy: ReturnType<typeof spyOn>;
    let consoleErrorSpy: ReturnType<typeof spyOn>;
    let processExitSpy: ReturnType<typeof spyOn>;

    beforeEach(() => {
        consoleLogSpy = spyOn(console, "log").mockImplementation(() => { });
        consoleErrorSpy = spyOn(console, "error").mockImplementation(() => { });
        processExitSpy = spyOn(process, "exit").mockImplementation(() => {
            throw new Error("process.exit called");
        });
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        processExitSpy.mockRestore();
    });

    it("should error when market search is missing --query", async () => {
        const { runPolymarket } = await import("./polymarket");

        try {
            await runPolymarket(["market", "search"]);
        } catch (_e) {
            // Expected: process.exit throws
        }

        expect(consoleErrorSpy).toHaveBeenCalled();
        const errorOutput = consoleErrorSpy.mock.calls.flat().join(" ");
        expect(errorOutput).toContain("--query");
    });

    it("should error when market info is missing --market-id", async () => {
        const { runPolymarket } = await import("./polymarket");

        try {
            await runPolymarket(["market", "info"]);
        } catch (_e) {
            // Expected: process.exit throws
        }

        expect(consoleErrorSpy).toHaveBeenCalled();
        const errorOutput = consoleErrorSpy.mock.calls.flat().join(" ");
        expect(errorOutput).toContain("--market-id");
    });

    it("should error when price get is missing --token-id", async () => {
        const { runPolymarket } = await import("./polymarket");

        try {
            await runPolymarket(["price", "get"]);
        } catch (_e) {
            // Expected: process.exit throws
        }

        expect(consoleErrorSpy).toHaveBeenCalled();
        const errorOutput = consoleErrorSpy.mock.calls.flat().join(" ");
        expect(errorOutput).toContain("--token-id");
    });

    it("should error when price book is missing --token-id", async () => {
        const { runPolymarket } = await import("./polymarket");

        try {
            await runPolymarket(["price", "book"]);
        } catch (_e) {
            // Expected: process.exit throws
        }

        expect(consoleErrorSpy).toHaveBeenCalled();
        const errorOutput = consoleErrorSpy.mock.calls.flat().join(" ");
        expect(errorOutput).toContain("--token-id");
    });

    it("should error when order cancel is missing --order-id", async () => {
        const { runPolymarket } = await import("./polymarket");

        try {
            await runPolymarket(["order", "cancel"]);
        } catch (_e) {
            // Expected: process.exit throws
        }

        expect(consoleErrorSpy).toHaveBeenCalled();
        const errorOutput = consoleErrorSpy.mock.calls.flat().join(" ");
        expect(errorOutput).toContain("--order-id");
    });

    it("should error when balance pocket-money is missing --amount", async () => {
        const { runPolymarket } = await import("./polymarket");

        try {
            await runPolymarket(["balance", "pocket-money"]);
        } catch (_e) {
            // Expected: process.exit throws
        }

        expect(consoleErrorSpy).toHaveBeenCalled();
        const errorOutput = consoleErrorSpy.mock.calls.flat().join(" ");
        expect(errorOutput).toContain("--amount");
    });

    it("should error when account create is missing credentials", async () => {
        const { runPolymarket } = await import("./polymarket");

        try {
            await runPolymarket(["account", "create"]);
        } catch (_e) {
            // Expected: process.exit throws
        }

        expect(consoleErrorSpy).toHaveBeenCalled();
        const errorOutput = consoleErrorSpy.mock.calls.flat().join(" ");
        expect(errorOutput).toContain("--email");
    });
});
