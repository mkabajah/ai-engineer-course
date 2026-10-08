// Orbit API for Operation: Broken Prod — the in-repo reporter and the organizer scripts call this.
// Logic lives in src/lib/obp/api.server.ts.
import { createFileRoute } from "@tanstack/react-router";

async function serve({ request, params }: { request: Request; params: { _splat?: string } }) {
  const { handle, defaultDeps } = await import("@/lib/obp/api.server");
  return handle(request, params._splat ?? "", await defaultDeps(request));
}

export const Route = createFileRoute("/api/orbit/$")({
  server: {
    handlers: {
      GET: serve,
      POST: serve,
      OPTIONS: serve,
    },
  },
});
