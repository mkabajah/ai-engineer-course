// GET /api/orbit → { name, version, stage, registration_open } (health check used in the setup guide)
import { createFileRoute } from "@tanstack/react-router";

async function serve({ request }: { request: Request }) {
  const { handle, defaultDeps } = await import("@/lib/obp/api.server");
  return handle(request, "", await defaultDeps(request));
}

export const Route = createFileRoute("/api/orbit/")({
  server: {
    handlers: {
      GET: serve,
      OPTIONS: serve,
    },
  },
});
