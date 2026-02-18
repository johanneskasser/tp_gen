/**
 * Main service for supabase/edge-runtime
 * Routes /functions/v1/<name> to the corresponding function worker.
 * JWT validation is handled externally by Kong — omitted here.
 *
 * Uses the EdgeRuntime.userWorkers API (proprietary to supabase/edge-runtime).
 */

const FUNCTIONS_BASE = "/home/deno/functions";
const MEMORY_LIMIT_MB = 150;
const WORKER_TIMEOUT_MS = 60_000;
const CPU_SOFT_LIMIT_MS = 1_000;
const CPU_HARD_LIMIT_MS = 2_000;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight globally
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type, x-webhook-signature",
      },
    });
  }

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);

  // Accept both /functions/v1/<name> and /<name>
  const functionName =
    parts[0] === "functions" && parts[1] === "v1" ? parts[2] : parts[0];

  if (!functionName) {
    return new Response(JSON.stringify({ error: "Function name required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const servicePath = `${FUNCTIONS_BASE}/${functionName}`;

  try {
    // @ts-ignore — EdgeRuntime is a global provided by supabase/edge-runtime
    const worker = await EdgeRuntime.userWorkers.create({
      servicePath,
      memoryLimitMb: MEMORY_LIMIT_MB,
      workerTimeoutMs: WORKER_TIMEOUT_MS,
      cpuTimeSoftLimitMs: CPU_SOFT_LIMIT_MS,
      cpuTimeHardLimitMs: CPU_HARD_LIMIT_MS,
      noModuleCache: false,
      importMapPath: null,
      envVars: Object.entries(Deno.env.toObject()),
      forceCreate: false,
      netAccessDisabled: false,
    });

    return await worker.fetch(req);
  } catch (err) {
    const msg = (err as Error).message ?? String(err);
    if (msg.includes("does not exist") || msg.includes("not found")) {
      return new Response(JSON.stringify({ error: "Function not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.error(`[main] Error in function "${functionName}":`, msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
