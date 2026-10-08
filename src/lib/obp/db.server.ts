// Server-only access to the obp_ tables/functions (service role). Never import this from client code.
// The obp_ objects are not in the generated Supabase types, so this client is deliberately untyped.
import type { SupabaseClient } from "@supabase/supabase-js";

export async function db(): Promise<SupabaseClient> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as SupabaseClient;
}

/** Turn a Postgres error into the readable message raised by our functions ("Wrong event code — …"). */
export function friendly(err: { message?: string } | null | undefined): string {
  const m = err?.message || "Unknown error";
  return m
    .replace(/^.*?ERROR:\s*/, "")
    .split("\n")[0]
    .slice(0, 240);
}

export class ObpError extends Error {}

export async function rpc<T = unknown>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const client = await db();
  const { data, error } = await client.rpc(fn, args);
  if (error) throw new ObpError(friendly(error));
  return data as T;
}

export const BUCKET_SUBMISSIONS = "obp-submissions";
export const BUCKET_SNAPSHOTS = "obp-snapshots";
export const BUCKET_DOWNLOADS = "obp-downloads";
export const PACK_PATH = "mission-pack/orbit-shop-mission-pack.zip";
