import installSh from "../install.sh";
import indexHtml from "../public/index.html";
import stylesCss from "../public/styles.css";
import { skillsMap } from "./skills";

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
				return new Response(indexHtml as unknown as string, {
					headers: { ...corsHeaders, "Content-Type": "text/html" },
				});
			}

			// 2. Serve specific static files from public
			if (path === "/styles.css") {
				return new Response(stylesCss as unknown as string, {
					headers: { ...corsHeaders, "Content-Type": "text/css" },
				});
			}

			// 3. Serve install script
			if (path === "/install.sh" || path === "/install") {
				return new Response(installSh as unknown as string, {
					headers: {
						...corsHeaders,
						"Content-Type": "text/x-shellscript",
						"Content-Disposition": "inline",
					},
				});
			}

			// 4. Serve skills files
			if (path.startsWith("/skills/")) {
				const skillContent = skillsMap[path];
				if (skillContent) {
					return new Response(skillContent as unknown as string, {
						headers: {
							...corsHeaders,
							"Content-Type": "text/markdown; charset=utf-8",
						},
					});
				}
				return new Response("Skill Not Found", {
					status: 404,
					headers: corsHeaders,
				});
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
