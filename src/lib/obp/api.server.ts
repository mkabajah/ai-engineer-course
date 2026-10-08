// HTTP API for Operation: Broken Prod, served at /api/orbit/* (see src/routes/api.orbit.$.ts).
//
// Participants' terminals (the in-repo reporter, tools/orbit-reporter.mjs):
//   GET  /api/orbit                → { name, version, stage, registration_open }
//   POST /api/orbit/register       { name, email, eventCode }                          → { code, token, name, existing, site }
//   POST /api/orbit/report         header x-orbit-token; { kind, note?, local?, snapshot? } → { ok, id, message }
//   GET  /api/orbit/status         header x-orbit-token                                → status JSON
//   GET  /api/orbit/now                                                                 → { stage, exam_open, frozen, announcements, tickets }
//
// Organizer laptop (verify-snapshots.mjs, ai-review-repos.mjs, judge-f3.mjs) — header x-orbit-organizer: <ORBIT_ORGANIZER_SECRET>
//   GET  /api/orbit/organizer/state                 → { current_stage, stages }
//   POST /api/orbit/organizer/claim     { limit }   → [{ id, team_name, team_code, snapshot_path, snapshot_sha256, created_at }]
//   POST /api/orbit/organizer/snapshot  { path }    → { url }   (short-lived signed download URL)
//   POST /api/orbit/organizer/verify    { report, stage, total, rows, error }
//   POST /api/orbit/organizer/judged    { code, challenge, points, note }
//   GET  /api/orbit/organizer/roster                → [{ name, code }]
//   POST /api/orbit/organizer/ai        { system, prompt, max_tokens? } → { text }   (uses the site's AI provider)
//   POST /api/orbit/organizer/import    { pack }    → load obp-content-pack.json (same as Admin → Setup)
//   POST /api/orbit/organizer/stage     { stage }   → open a stage (0 lobby · 1 · 4 · 2 · 3 · 99 finish)
//   POST /api/orbit/organizer/settings  { event_code?, registration_open?, exam_open?, exam_review_open?, exam_minutes?, frozen? }

export type RpcResult = { data: unknown; error: { message: string } | null };
export type Deps = {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<RpcResult>;
  upload: (path: string, bytes: Uint8Array) => Promise<{ error: { message: string } | null }>;
  signedPack?: () => Promise<string | null>;
  signedDownload: (
    path: string,
  ) => Promise<{ url: string | null; error: { message: string } | null }>;
  info: () => Promise<{ stage: number; registration_open: boolean }>;
  stages: () => Promise<unknown[]>;
  /** what the terminal shows with `npm run mission`: current stage, clock, latest announcements */
  live?: () => Promise<{
    stage: { id: number; title: string; status: string; ends_at: string | null } | null;
    exam_open: boolean;
    frozen: boolean;
    announcements: { kind: string; message_md: string; created_at: string }[];
    tickets: { id: string; from: string; title: string; body_md: string; released_at: string }[];
  }>;
  roster: () => Promise<{ name: string; code: string }[]>;
  updateSettings?: (
    patch: Record<string, unknown>,
  ) => Promise<{ error: { message: string } | null }>;
  ai?: (system: string, prompt: string, maxTokens: number, model?: string) => Promise<string>;
  organizerSecret?: string;
  siteUrl?: string;
  now?: () => Date;
};

export const MAX_SNAPSHOT_BYTES = 8 * 1024 * 1024;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-orbit-token",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json", "cache-control": "no-store" },
  });

function friendly(err: { message: string }): string {
  const m = err.message || "Unknown error";
  return m
    .replace(/^.*?ERROR:\s*/, "")
    .split("\n")[0]
    .slice(0, 200);
}

export function decodeBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new Uint8Array(bytes));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time string comparison (both sides hashed first so lengths match). */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [x, y] = await Promise.all([sha256Hex(enc.encode(a)), sha256Hex(enc.encode(b))]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

function cleanNote(note: unknown): Record<string, string> | null {
  if (!note || typeof note !== "object") return null;
  const out: Record<string, string> = {};
  for (const k of ["title", "root_cause", "fix", "test", "files"]) {
    const v = (note as Record<string, unknown>)[k];
    if (v !== undefined && v !== null) out[k] = String(v).slice(0, 1000);
  }
  return Object.keys(out).length ? out : null;
}

function cleanLocal(local: unknown): Record<string, unknown> | null {
  if (!local || typeof local !== "object") return null;
  const l = local as Record<string, unknown>;
  return {
    pass: Number(l.pass) || 0,
    fail: Number(l.fail) || 0,
    failing: Array.isArray(l.failing)
      ? l.failing.slice(0, 30).map((x) => String(x).slice(0, 200))
      : [],
    node: l.node ? String(l.node).slice(0, 20) : undefined,
    tool: l.tool ? String(l.tool).slice(0, 40) : undefined,
  };
}

const intOrNull = (v: unknown) =>
  v === null || v === undefined || v === "" ? null : Math.trunc(Number(v));

async function organizer(req: Request, route: string, deps: Deps): Promise<Response> {
  if (!deps.organizerSecret || deps.organizerSecret.length < 16) {
    return json(
      {
        error:
          "Organizer API disabled: add the secret ORBIT_ORGANIZER_SECRET (16+ characters) in Lovable → Cloud → Secrets",
      },
      503,
    );
  }
  const given = req.headers.get("x-orbit-organizer") ?? "";
  if (!(await safeEqual(given, deps.organizerSecret)))
    return json({ error: "Wrong organizer secret" }, 401);

  const body =
    req.method === "POST"
      ? ((await req.json().catch(() => null)) as Record<string, unknown> | null)
      : null;
  if (req.method === "POST" && !body) return json({ error: "Send JSON" }, 400);

  if (req.method === "GET" && route === "state") {
    const i = await deps.info();
    return json({
      current_stage: i.stage,
      registration_open: i.registration_open,
      stages: await deps.stages(),
    });
  }
  if (req.method === "GET" && route === "roster") return json(await deps.roster());
  if (req.method === "POST" && route === "claim") {
    const { data, error } = await deps.rpc("obp_claim_pending_reports", {
      p_limit: intOrNull(body!.limit) ?? 30,
    });
    if (error) return json({ error: friendly(error) }, 400);
    return json(data ?? []);
  }
  if (req.method === "POST" && route === "snapshot") {
    const p = String(body!.path ?? "");
    if (!/^[0-9a-f-]{36}\/[\w.-]+\.tar\.gz$/i.test(p))
      return json({ error: "Invalid snapshot path" }, 400);
    const { url, error } = await deps.signedDownload(p);
    if (error || !url)
      return json({ error: `Could not sign download: ${error ? friendly(error) : "no url"}` }, 502);
    return json({ url });
  }
  if (req.method === "POST" && route === "verify") {
    const report = String(body!.report ?? "");
    if (!UUID_RE.test(report)) return json({ error: "report must be a uuid" }, 400);
    const rows = Array.isArray(body!.rows)
      ? (body!.rows as Record<string, unknown>[]).slice(0, 200).map((r) => ({
          id: String(r.id ?? "").slice(0, 40),
          result: String(r.result ?? "").slice(0, 10),
          earned: Number(r.earned) || 0,
        }))
      : null;
    const { error } = await deps.rpc("obp_verify_report", {
      p_report: report,
      p_stage: intOrNull(body!.stage),
      p_total: intOrNull(body!.total),
      p_rows: rows,
      p_error: body!.error ? String(body!.error).slice(0, 300) : null,
    });
    if (error) return json({ error: friendly(error) }, 400);
    return json({ ok: true });
  }
  if (req.method === "POST" && route === "judged") {
    const { data, error } = await deps.rpc("obp_publish_judged_score", {
      p_team_code: String(body!.code ?? ""),
      p_challenge: String(body!.challenge ?? ""),
      p_points: intOrNull(body!.points) ?? 0,
      p_note: String(body!.note ?? "").slice(0, 2000),
    });
    if (error) return json({ error: friendly(error) }, 400);
    return json({ ok: true, result: data });
  }
  // Host controls from the organizer laptop (same as the buttons in Admin → Broken Prod)
  if (req.method === "POST" && route === "import") {
    const pack = body!.pack as Record<string, unknown> | undefined;
    if (!pack || pack.format !== "obp-content-pack")
      return json({ error: "Send { pack: <obp-content-pack.json> }" }, 400);
    const { data, error } = await deps.rpc("obp_import_content", { p: pack });
    if (error) return json({ error: friendly(error) }, 400);
    const imported = { ...(data as Record<string, unknown>) };
    if (Array.isArray(pack.tickets)) {
      const t = await deps.rpc("obp_import_tickets", { p: pack.tickets });
      if (t.error) return json({ error: friendly(t.error) }, 400);
      imported.tickets = t.data;
    }
    return json({ ok: true, imported });
  }
  if (req.method === "POST" && route === "stage") {
    const { error } = await deps.rpc("obp_open_stage", { p_stage: intOrNull(body!.stage) ?? 0 });
    if (error) return json({ error: friendly(error) }, 400);
    return json({ ok: true });
  }
  if (req.method === "POST" && route === "settings") {
    if (!deps.updateSettings) return json({ error: "not available" }, 503);
    const patch: Record<string, unknown> = {};
    if (typeof body!.event_code === "string" && body!.event_code.trim().length >= 3)
      patch.event_code = body!.event_code.trim().slice(0, 40);
    for (const k of ["registration_open", "exam_open", "exam_review_open", "leaderboard_frozen"])
      if (typeof body![k] === "boolean" && k !== "leaderboard_frozen") patch[k] = body![k];
    if (typeof body!.exam_minutes === "number")
      patch.exam_minutes = Math.max(1, Math.min(180, Math.trunc(body!.exam_minutes)));
    if (typeof body!.frozen === "boolean") {
      const { error } = await deps.rpc("obp_set_frozen", { p_frozen: body!.frozen });
      if (error) return json({ error: friendly(error) }, 400);
    }
    if (Object.keys(patch).length) {
      const { error } = await deps.updateSettings(patch);
      if (error) return json({ error: friendly(error) }, 400);
    }
    return json({ ok: true, updated: Object.keys(patch) });
  }
  if (req.method === "POST" && route === "ai") {
    if (!deps.ai) return json({ error: "No AI provider configured on the site" }, 503);
    const system = String(body!.system ?? "").slice(0, 20_000);
    const prompt = String(body!.prompt ?? "").slice(0, 400_000);
    if (!prompt) return json({ error: "prompt required" }, 400);
    try {
      return json({
        text: await deps.ai(
          system,
          prompt,
          Math.min(16000, intOrNull(body!.max_tokens) ?? 1500),
          typeof body!.model === "string" && /^[\w./-]{3,60}$/.test(body!.model)
            ? body!.model
            : undefined,
        ),
      });
    } catch (e) {
      return json({ error: (e as Error).message }, 502);
    }
  }
  return json({ error: `No organizer route ${req.method} ${route}` }, 404);
}

/** `subpath` is everything after /api/orbit (e.g. "", "register", "organizer/claim"). */
export async function handle(req: Request, subpath: string, deps: Deps): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const route = subpath.replace(/^\/+|\/+$/g, "");

  try {
    if (route.startsWith("organizer/"))
      return await organizer(req, route.slice("organizer/".length), deps);

    // Mission pack download: the bucket is private, so hand out a short-lived signed link
    if (req.method === "GET" && route === "download") {
      const url = deps.signedPack ? await deps.signedPack() : null;
      if (!url)
        return json({ error: "The mission pack isn't uploaded yet — ask the organizer" }, 404);
      return new Response(null, {
        status: 302,
        headers: { ...cors, location: url, "cache-control": "no-store" },
      });
    }

    if (req.method === "GET" && route === "") {
      const i = await deps.info();
      return json({
        name: "Orbit API",
        version: 1,
        stage: i.stage,
        registration_open: i.registration_open,
      });
    }

    if (req.method === "GET" && route === "now") {
      if (!deps.live) return json({ error: "Not available" }, 404);
      return json({ ...(await deps.live()), server_time: new Date().toISOString() });
    }

    if (req.method === "POST" && route === "register") {
      const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
      if (!body) return json({ error: "Send JSON: { name, email, eventCode }" }, 400);
      const { data, error } = await deps.rpc("obp_register_participant", {
        p_name: String(body.name ?? "").slice(0, 100),
        p_email: String(body.email ?? "").slice(0, 200),
        p_event_code: String(body.eventCode ?? "").slice(0, 60),
      });
      if (error) return json({ error: friendly(error) }, 400);
      return json({ ...(data as Record<string, unknown>), site: deps.siteUrl ?? null });
    }

    const token = req.headers.get("x-orbit-token") ?? "";
    if (!UUID_RE.test(token))
      return json(
        { error: "Missing or invalid x-orbit-token — run `npm run register` first" },
        401,
      );

    if (req.method === "GET" && route === "status") {
      const { data, error } = await deps.rpc("obp_report_status", { p_token: token });
      if (error) return json({ error: friendly(error) }, 400);
      if (!data) return json({ error: "Unknown token — run `npm run register` again" }, 401);
      return json(data);
    }

    if (req.method === "POST" && route === "report") {
      const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
      if (!body) return json({ error: "Send JSON" }, 400);
      const kind = ["auto", "manual", "bug"].includes(String(body.kind))
        ? String(body.kind)
        : "manual";

      const who = await deps.rpc("obp_team_by_token", { p_token: token });
      if (who.error) return json({ error: friendly(who.error) }, 400);
      const team = who.data as { id: string; name: string; code: string } | null;
      if (!team) return json({ error: "Unknown token — run `npm run register` again" }, 401);

      let path: string | null = null;
      let sha: string | null = null;
      let size: number | null = null;
      if (body.snapshot) {
        const snap = body.snapshot as { data?: unknown; sha256?: unknown; format?: unknown };
        if (snap.format !== "tar.gz" || typeof snap.data !== "string")
          return json({ error: 'snapshot must be {format:"tar.gz", data:<base64>, sha256}' }, 400);
        if (snap.data.length > Math.ceil((MAX_SNAPSHOT_BYTES * 4) / 3) + 8) {
          return json(
            { error: "Snapshot is larger than 8 MB — remove big files (node_modules, videos)" },
            413,
          );
        }
        let bytes: Uint8Array;
        try {
          bytes = decodeBase64(snap.data);
        } catch {
          return json({ error: "snapshot.data is not valid base64" }, 400);
        }
        if (bytes.length > MAX_SNAPSHOT_BYTES)
          return json(
            { error: "Snapshot is larger than 8 MB — remove big files (node_modules, videos)" },
            413,
          );
        if (bytes[0] !== 0x1f || bytes[1] !== 0x8b)
          return json({ error: "Snapshot is not gzip data" }, 400);
        sha = await sha256Hex(bytes);
        if (snap.sha256 && snap.sha256 !== sha)
          return json({ error: "Snapshot checksum mismatch — try again" }, 400);
        const stamp = (deps.now?.() ?? new Date()).toISOString().replace(/[:.]/g, "-");
        path = `${team.id}/${stamp}-${sha.slice(0, 8)}.tar.gz`;
        size = bytes.length;
        const up = await deps.upload(path, bytes);
        if (up.error) return json({ error: `Upload failed: ${friendly(up.error)}` }, 502);
      } else if (kind !== "bug") {
        return json({ error: "auto/manual reports must include a snapshot" }, 400);
      }

      const rec = await deps.rpc("obp_record_report", {
        p_token: token,
        p_kind: kind,
        p_note: cleanNote(body.note),
        p_local: cleanLocal(body.local),
        p_path: path,
        p_sha: sha,
        p_bytes: size,
      });
      if (rec.error) return json({ error: friendly(rec.error) }, 429);
      return json({
        ok: true,
        id: (rec.data as { id: string }).id,
        message: path
          ? `📦 Snapshot received for ${team.name}. Hidden tests will verify it in ~1 minute.`
          : `🐛 Bug report received for ${team.name}.`,
      });
    }

    return json({ error: `No route ${req.method} /api/orbit/${route}` }, 404);
  } catch (e) {
    return json({ error: `Server error: ${(e as Error).message}` }, 500);
  }
}

/** Real dependencies: Supabase (service role) + the site's AI provider. */
export async function defaultDeps(req: Request): Promise<Deps> {
  const { db, BUCKET_SNAPSHOTS } = await import("./db.server");
  const client = await db();
  const origin = (() => {
    try {
      const u = new URL(req.url);
      const proto = req.headers.get("x-forwarded-proto") ?? u.protocol.replace(":", "");
      const host = req.headers.get("x-forwarded-host") ?? u.host;
      return `${proto}://${host}`;
    } catch {
      return null;
    }
  })();
  return {
    rpc: async (fn, args) => {
      const { data, error } = await client.rpc(fn, args);
      return { data, error: error ? { message: error.message } : null };
    },
    upload: async (path, bytes) => {
      const { error } = await client.storage
        .from(BUCKET_SNAPSHOTS)
        .upload(path, bytes, { contentType: "application/gzip", upsert: false });
      return { error: error ? { message: error.message } : null };
    },
    signedPack: async () => {
      const { BUCKET_DOWNLOADS, PACK_PATH } = await import("./db.server");
      const { data } = await client.storage
        .from(BUCKET_DOWNLOADS)
        .createSignedUrl(PACK_PATH, 600, { download: "orbit-shop-mission-pack.zip" });
      return data?.signedUrl ?? null;
    },
    signedDownload: async (path) => {
      const { data, error } = await client.storage
        .from(BUCKET_SNAPSHOTS)
        .createSignedUrl(path, 300);
      return { url: data?.signedUrl ?? null, error: error ? { message: error.message } : null };
    },
    info: async () => {
      const { data } = await client
        .from("obp_settings")
        .select("current_stage, registration_open")
        .eq("id", 1)
        .maybeSingle();
      return {
        stage: data?.current_stage ?? 0,
        registration_open: data?.registration_open ?? false,
      };
    },
    stages: async () => {
      const { data } = await client
        .from("obp_stages")
        .select("id, title, status, started_at, ends_at, position")
        .order("position");
      return data ?? [];
    },
    live: async () => {
      const [settings, stages, ann, tickets] = await Promise.all([
        client
          .from("obp_settings")
          .select("current_stage, exam_open, leaderboard_frozen")
          .eq("id", 1)
          .maybeSingle(),
        client.from("obp_stages").select("id, title, status, ends_at"),
        client
          .from("obp_announcements")
          .select("kind, message_md, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        client.rpc("obp_released_tickets"),
      ]);
      const cur = settings.data?.current_stage ?? 0;
      const stage = (stages.data ?? []).find((x: { id: number }) => x.id === cur) ?? null;
      return {
        stage,
        exam_open: Boolean(settings.data?.exam_open),
        frozen: Boolean(settings.data?.leaderboard_frozen),
        announcements: ann.data ?? [],
        tickets: (
          (tickets.data ?? []) as {
            id: string;
            from: string;
            title: string;
            body_md: string;
            released_at: string;
          }[]
        ).map(({ id, from, title, body_md, released_at }) => ({
          id,
          from,
          title,
          body_md,
          released_at,
        })),
      };
    },
    updateSettings: async (patch) => {
      const { error } = await client
        .from("obp_settings")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", 1);
      return { error: error ? { message: error.message } : null };
    },
    roster: async () => {
      const { data } = await client
        .from("obp_teams")
        .select("name, join_code")
        .not("registered_at", "is", null)
        .order("name");
      return (data ?? []).map((t: { name: string; join_code: string }) => ({
        name: t.name,
        code: t.join_code,
      }));
    },
    ai: async (system, prompt, maxTokens, model) => {
      const { callModel, modelEnv } = await import("./judge.server");
      const env = modelEnv();
      return callModel({
        system,
        content: [{ type: "text", text: prompt }],
        maxTokens,
        env: model ? { ...env, model } : env,
      });
    },
    organizerSecret: process.env.ORBIT_ORGANIZER_SECRET,
    siteUrl: process.env.ORBIT_SITE_URL || (origin ? `${origin}/broken-prod` : undefined),
  };
}
