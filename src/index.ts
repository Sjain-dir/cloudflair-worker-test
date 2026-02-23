export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method === "GET" && new URL(request.url).pathname === "/") {
			return new Response("Worker is running. POST to /test to send a binary transaction test.", {
				headers: { "content-type": "text/plain" },
			});
		}

		if (request.method === "POST" && new URL(request.url).pathname === "/test") {
			const url = new URL(request.url);
			const API_KEY = url.searchParams.get("api-key") || "APIKEY";

			// Dummy bytes to simulate a serialized transaction
			const txBytes = new Uint8Array([
				1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
				0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
				0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
				0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
			]);

			const targetUrl = `http://185.191.117.97/irisb?api-key=${API_KEY}&method=sendTransaction`;

			try {
				const startTime = Date.now();
				const response = await fetch(targetUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/octet-stream",
					},
					body: txBytes,
				});
				const elapsed = Date.now() - startTime;

				const responseBody = await response.text();

				return Response.json({
					success: true,
					target_url: targetUrl,
					request_info: {
						content_type: "application/octet-stream",
						body_size_bytes: txBytes.byteLength,
					},
					response: {
						status: response.status,
						statusText: response.statusText,
						headers: Object.fromEntries(response.headers.entries()),
						body: tryParseJson(responseBody),
					},
					elapsed_ms: elapsed,
				}, {
					headers: { "content-type": "application/json" },
				});
			} catch (err: any) {
				return Response.json({
					success: false,
					error: err.message,
					target_url: targetUrl,
				}, {
					status: 502,
					headers: { "content-type": "application/json" },
				});
			}
		}

		return new Response("Not found", { status: 404 });
	},
} satisfies ExportedHandler<Env>;

function tryParseJson(text: string) {
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}
