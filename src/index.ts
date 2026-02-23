export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method === "GET" && new URL(request.url).pathname === "/") {
			return new Response("Worker is running. POST to /test to send a transaction test.", {
				headers: { "content-type": "text/plain" },
			});
		}

		if (request.method === "POST" && new URL(request.url).pathname === "/test") {
			const API_KEY = new URL(request.url).searchParams.get("api-key") || "APIKEY";

			const dummyBase64Txn = btoa("this_is_a_dummy_transaction_payload_for_testing");

			const payload = {
				id: 1,
				jsonrpc: "2.0",
				method: "sendTransaction",
				params: [
					dummyBase64Txn,
					{
						encoding: "base64",
						skipPreflight: true,
					},
					{ mevProtect: true },
				],
			};

			const targetUrl = `https://fr.gateway.astralane.io/iris?api-key=${API_KEY}`;

			try {
				const startTime = Date.now();
				const response = await fetch(targetUrl, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
				const elapsed = Date.now() - startTime;

				const responseBody = await response.text();

				return Response.json({
					success: true,
					request_sent: payload,
					target_url: targetUrl,
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
					request_sent: payload,
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
