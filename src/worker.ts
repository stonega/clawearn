

export default {
	async fetch(request: Request, _env: Env): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		console.log(`[${request.method}] ${path}`);

		// CORS headers
		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		};

		if (request.method === "OPTIONS") {
			return new Response(null, { headers: corsHeaders });
		}

		try {
			// 1. Serve Homepage
			if (path === "/" || path === "/index.html") {
				const indexContent = await fetch(
					new URL("./public/index.html", import.meta.url),
				);
				return new Response(indexContent.body, {
					headers: { ...corsHeaders, "Content-Type": "text/html" },
				});
			}

			// 2. Serve specific static files from public
			if (path === "/styles.css") {
				const cssContent = await fetch(
					new URL("./public/styles.css", import.meta.url),
				);
				return new Response(cssContent.body, {
					headers: { ...corsHeaders, "Content-Type": "text/css" },
				});
			}

			// 3. Serve install script
			if (path === "/install.sh" || path === "/install") {
				const installContent = await fetch(
					new URL("../install.sh", import.meta.url),
				);
				return new Response(installContent.body, {
					headers: {
						...corsHeaders,
						"Content-Type": "text/x-shellscript",
						"Content-Disposition": "inline",
					},
				});
			}

			// 4. Serve skills files (from public/skills)
			if (path.startsWith("/skills/")) {
				const relativePath = path.substring("/skills/".length);
				try {
					const skillsContent = await fetch(
						new URL(`./public/skills/${relativePath}`, import.meta.url),
					);
					return new Response(skillsContent.body, { headers: corsHeaders });
				} catch {
					return new Response("Not Found", { status: 404 });
				}
			}

			// Simple 404
			return new Response("Not Found", { status: 404 });
		} catch (e) {
			console.error(e);
			return new Response("Internal Server Error", { status: 500 });
		}
	},
};

type Env = Record<string, never>;
