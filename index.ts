import { join } from "node:path";
import { serve } from "bun";

const port = process.env.PORT || 3000;

console.log(`Starting Clawearn server on http://localhost:${port}...`);

serve({
    port,
    async fetch(req) {
        const url = new URL(req.url);
        const path = url.pathname;

        console.log(`[${req.method}] ${path}`);

        // CORS headers
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        };

        if (req.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            // 1. Serve Homepage
            if (path === "/" || path === "/index.html") {
                return new Response(
                    Bun.file(join(process.cwd(), "public", "index.html")),
                    {
                        headers: { ...corsHeaders, "Content-Type": "text/html" },
                    },
                );
            }

            // 2. Serve specific static files from public
            if (path === "/styles.css") {
                return new Response(
                    Bun.file(join(process.cwd(), "public", "styles.css")),
                    {
                        headers: { ...corsHeaders, "Content-Type": "text/css" },
                    },
                );
            }

            // 3. Serve install script
            if (path === "/install.sh" || path === "/install") {
                return new Response(Bun.file(join(process.cwd(), "install.sh")), {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "text/x-shellscript",
                        "Content-Disposition": "inline",
                    },
                });
            }

            // 3. Serve skills files (directory listing or file content)
            if (path.startsWith("/skills/")) {
                const relativePath = path.substring("/skills/".length);
                // safe join to avoid directory traversal
                const fullPath = join(process.cwd(), "skills", relativePath);

                // basic security check
                if (!fullPath.startsWith(join(process.cwd(), "skills"))) {
                    return new Response("Forbidden", { status: 403 });
                }

                if (await Bun.file(fullPath).exists()) {
                    return new Response(Bun.file(fullPath), { headers: corsHeaders });
                }
            }

            // simple 404
            return new Response("Not Found", { status: 404 });
        } catch (e) {
            console.error(e);
            return new Response("Internal Server Error", { status: 500 });
        }
    },
});
