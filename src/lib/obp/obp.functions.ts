// Server functions for Operation: Broken Prod (participant pages, exam, leaderboard, projector screen, host console).
// All database access goes through the service role on the server; the browser never touches obp_ tables directly.
import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ---------------------------------- types --------------------------------- */

export type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

export type Field = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "url" | "image";
  required?: boolean;
  placeholder?: string;
  max?: number;
};
export type Stage = {
  id: number;
  title: string;
  subtitle: string | null;
  status: "locked" | "open" | "closed";
  duration_minutes: number;
  started_at: string | null;
  ends_at: string | null;
  position: number;
};
export type Challenge = {
  id: string;
  stage_id: number;
  title: string;
  description_md: string;
  points_max: number;
  kind: string;
  repeatable: boolean;
  fields: Field[];
  sort_order: number;
  ai_judged: boolean;
};
export type Announcement = {
  id: string;
  kind: "info" | "twist" | "alert" | "win";
  message_md: string;
  created_at: string;
};
export type PublicState = {
  title: string;
  current_stage: number;
  stages: Stage[];
  challenges: Challenge[];
  announcements: Announcement[];
  registration_open: boolean;
  registered_count: number;
  download_url: string | null;
  event_code_now: string | null;
  frozen: boolean;
  exam_open: boolean;
  exam_minutes: number;
  server_now: string;
};
export type BoardRow = {
  team_id: string;
  name: string;
  emoji: string;
  color: string;
  score: number;
  challenge_points: number;
  adjustment_points: number;
  hint_cost: number;
  exam_points: number;
  hidden_test_points: number;
  first_blood_points: number;
  badges: { emoji: string; title: string }[];
  last_scored_at: string | null;
};
export type FirstBlood = {
  test_id: string;
  label: string;
  bonus: number;
  name: string;
  emoji: string;
  color: string;
  first_passed_at: string;
};
export type ExamBoardRow = {
  team_id: string;
  name: string;
  emoji: string;
  scaled: number;
  passed: boolean;
  correct: number;
  total: number;
  seconds_used: number;
};
export type Leaderboard = {
  rows: BoardRow[];
  frozen: boolean;
  frozen_at: string | null;
  first_bloods: FirstBlood[];
  exam: ExamBoardRow[];
  server_now: string;
};
export type TestRow = { id: string; result: "PASS" | "FAIL" | "ERROR"; earned: number };
export type MySubmission = {
  id: string;
  challenge_id: string;
  payload: Record<string, Json>;
  status: "pending" | "approved" | "partial" | "rejected";
  points_awarded: number;
  reviewer_note: string | null;
  ai_score: number | null;
  breakdown: {
    median?: number;
    runs?: { breakdown?: { criterion: string; points: number; max: number; why: string }[] }[];
  } | null;
  created_at: string;
  reviewed_at: string | null;
};
export type Dashboard = {
  me: { id: string; name: string; emoji: string; color: string; code: string };
  auto_scores: {
    stage_id: number;
    total: number;
    rows: TestRow[];
    commit_sha: string | null;
    scored_at: string;
  }[];
  reports: {
    created_at: string;
    kind: "auto" | "manual" | "bug";
    note: Record<string, string> | null;
    local_summary: { pass?: number; fail?: number; failing?: string[]; tool?: string } | null;
    status: string;
    verified_stage: number | null;
    verified_total: number | null;
    verify_error: string | null;
  }[];
  submissions: MySubmission[];
  hints: {
    id: string;
    stage_id: number;
    title: string;
    cost: number;
    bought: boolean;
    body: string | null;
  }[];
  badges: { emoji: string; title: string }[];
  score: number | null;
  rank: number | null;
};
export type ExamQuestion = {
  number: number;
  id: string;
  domain_title: string;
  kind: "single" | "multi";
  select_count: number;
  prompt_md: string;
  code: string | null;
  options: { id: string; text: string }[];
  choice: string[];
  flagged: boolean;
};
export type ExamState =
  | { status: "closed" | "ready"; minutes: number; total: number; pass_mark: number }
  | {
      status: "in_progress";
      started_at: string;
      ends_at: string;
      server_now: string;
      total: number;
      questions: ExamQuestion[];
    }
  | {
      status: "submitted";
      submitted_at: string;
      started_at: string;
      review_open: boolean;
      result: {
        scaled: number;
        passed: boolean;
        pass_mark: number;
        correct: number;
        total: number;
        points: number;
        domains: {
          domain: string;
          title: string;
          correct: number;
          total: number;
          pct: number;
          result: string;
        }[];
      };
    };
export type ExamReviewItem = {
  number: number;
  id: string;
  domain_title: string;
  kind: string;
  prompt_md: string;
  code: string | null;
  options: { id: string; text: string }[];
  correct: string[];
  explanation_md: string;
  my_choice: string[];
  is_correct: boolean;
};

/* --------------------------------- helpers -------------------------------- */

const Code = z.string().trim().min(4).max(12);

async function requireAdmin(context: unknown) {
  const ctx = context as {
    supabase: { rpc: (fn: string, a: unknown) => Promise<{ data: unknown }> };
    userId: string;
  };
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

async function server() {
  return import("./db.server");
}

/* ------------------------------ public reads ------------------------------ */

export const obpPublicState = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicState> => {
    const { db } = await server();
    const c = await db();
    const [settings, stages, challenges, rubrics, ann, count] = await Promise.all([
      c.from("obp_settings").select("*").eq("id", 1).maybeSingle(),
      c.from("obp_stages").select("*").order("position"),
      c
        .from("obp_challenges")
        .select(
          "id, stage_id, title, description_md, points_max, kind, repeatable, fields, sort_order",
        )
        .eq("visible", true)
        .order("sort_order"),
      c.from("obp_challenge_rubrics").select("challenge_id"),
      c.from("obp_announcements").select("*").order("created_at", { ascending: false }).limit(8),
      c
        .from("obp_teams")
        .select("id", { count: "exact", head: true })
        .not("registered_at", "is", null),
    ]);
    const s = settings.data ?? {};
    const judged = new Set(
      (rubrics.data ?? []).map((r: { challenge_id: string }) => r.challenge_id),
    );
    return {
      title: s.event_title ?? "Operation: Broken Prod",
      current_stage: s.current_stage ?? 0,
      stages: (stages.data ?? []) as Stage[],
      challenges: ((challenges.data ?? []) as Omit<Challenge, "ai_judged">[]).map((x) => ({
        ...x,
        ai_judged: judged.has(x.id),
      })),
      announcements: (ann.data ?? []) as Announcement[],
      registration_open: Boolean(s.registration_open),
      registered_count: count.count ?? 0,
      download_url: s.download_url ?? null,
      event_code_now: (s.current_stage ?? 0) === 0 ? (s.event_code ?? null) : null,
      frozen: Boolean(s.leaderboard_frozen),
      exam_open: Boolean(s.exam_open),
      exam_minutes: s.exam_minutes ?? 30,
      server_now: new Date().toISOString(),
    };
  },
);

export const obpLeaderboard = createServerFn({ method: "GET" }).handler(
  async (): Promise<Leaderboard> => {
    const { db } = await server();
    const c = await db();
    const [settings, rows, fb, exam] = await Promise.all([
      c
        .from("obp_settings")
        .select("leaderboard_frozen, frozen_snapshot, frozen_at")
        .eq("id", 1)
        .maybeSingle(),
      c
        .from("obp_leaderboard")
        .select("*")
        .order("score", { ascending: false })
        .order("last_scored_at", { ascending: true, nullsFirst: false }),
      c
        .from("obp_first_bloods")
        .select("test_id, label, bonus, name, emoji, color, first_passed_at")
        .order("first_passed_at"),
      c
        .from("obp_exam_board")
        .select("team_id, name, emoji, scaled, passed, correct, total, seconds_used")
        .order("scaled", { ascending: false })
        .order("seconds_used"),
    ]);
    const frozen = Boolean(settings.data?.leaderboard_frozen);
    const frozenAt: string | null = settings.data?.frozen_at ?? null;
    const live = (rows.data ?? []) as BoardRow[];
    const strip = (r: BoardRow): BoardRow => ({ ...r, score: Number(r.score) });
    return {
      rows: (frozen ? ((settings.data?.frozen_snapshot ?? []) as BoardRow[]) : live).map(strip),
      frozen,
      frozen_at: frozenAt,
      // While frozen, hide First Bloods drawn after the freeze too
      first_bloods: ((fb.data ?? []) as FirstBlood[]).filter(
        (x) => !frozen || !frozenAt || x.first_passed_at <= frozenAt,
      ),
      exam: (exam.data ?? []) as ExamBoardRow[],
      server_now: new Date().toISOString(),
    };
  },
);

/* ---------------------------- participant (code) --------------------------- */

export const obpSignIn = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => z.object({ code: Code }).parse(input))
  .handler(async ({ data }) => {
    const { rpc } = await server();
    const me = await rpc<{
      id: string;
      name: string;
      emoji: string;
      color: string;
      code: string;
    } | null>("obp_team_by_code", { p_code: data.code });
    if (!me) throw new Error("Unknown personal code — it was printed by `npm run register`");
    return me;
  });

export const obpDashboard = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => z.object({ code: Code }).parse(input))
  .handler(async ({ data }): Promise<Dashboard> => {
    const { rpc, db } = await server();
    const d = await rpc<Omit<Dashboard, "rank"> | null>("obp_my_dashboard", { p_code: data.code });
    if (!d) throw new Error("Unknown personal code");
    let rank: number | null = null;
    const c = await db();
    const { data: s } = await c
      .from("obp_settings")
      .select("leaderboard_frozen")
      .eq("id", 1)
      .maybeSingle();
    if (!s?.leaderboard_frozen) {
      const { data: rows } = await c
        .from("obp_leaderboard")
        .select("team_id, score")
        .order("score", { ascending: false });
      const list = (rows ?? []) as { team_id: string; score: number }[];
      const mine = list.find((r) => r.team_id === d.me.id);
      if (mine) rank = 1 + list.filter((r) => Number(r.score) > Number(mine.score)).length;
    }
    return {
      ...d,
      score: s?.leaderboard_frozen ? null : d.score === null ? null : Number(d.score),
      rank,
    };
  });

export const obpBuyHint = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; hint: string }) =>
    z.object({ code: Code, hint: z.string().min(1).max(40) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { rpc } = await server();
    return { body: await rpc<string>("obp_buy_hint", { p_code: data.code, p_hint: data.hint }) };
  });

/** Signed upload URL for one screenshot. The browser uploads straight to Storage with it. */
export const obpUploadUrl = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      code: string;
      challenge: string;
      filename: string;
      contentType: string;
      size: number;
    }) =>
      z
        .object({
          code: Code,
          challenge: z.string().min(1).max(40),
          filename: z.string().min(1).max(200),
          contentType: z.enum(["image/png", "image/jpeg", "image/gif", "image/webp"]),
          size: z
            .number()
            .int()
            .min(1)
            .max(5 * 1024 * 1024),
        })
        .parse(input),
  )
  .handler(async ({ data }) => {
    const { rpc, db, BUCKET_SUBMISSIONS } = await server();
    const me = await rpc<{ id: string } | null>("obp_team_by_code", { p_code: data.code });
    if (!me) throw new Error("Unknown personal code");
    const ext = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/gif": "gif",
      "image/webp": "webp",
    }[data.contentType];
    const path = `${me.id}/${data.challenge.replace(/[^\w-]/g, "")}/${crypto.randomUUID()}.${ext}`;
    const c = await db();
    const { data: signed, error } = await c.storage
      .from(BUCKET_SUBMISSIONS)
      .createSignedUploadUrl(path);
    if (error || !signed)
      throw new Error(`Upload not available: ${error?.message ?? "unknown error"}`);
    return { path, token: signed.token, bucket: BUCKET_SUBMISSIONS };
  });

async function judgeSubmission(submissionId: string, opts: { requireTeam?: string } = {}) {
  const { db, rpc, BUCKET_SUBMISSIONS } = await server();
  const J = await import("./judge.server");
  const c = await db();
  const { data: sub } = await c
    .from("obp_submissions")
    .select("id, team_id, challenge_id, payload, status, obp_challenges(title, fields, points_max)")
    .eq("id", submissionId)
    .maybeSingle();
  if (!sub) throw new Error("Submission not found");
  if (opts.requireTeam && sub.team_id !== opts.requireTeam) throw new Error("Not your submission");
  const { data: rubric } = await c
    .from("obp_challenge_rubrics")
    .select("*")
    .eq("challenge_id", sub.challenge_id)
    .maybeSingle();
  if (!rubric) return { judged: false as const, message: "Submitted. The host reviews this one." };
  if (!J.aiConfigured()) {
    await c
      .from("obp_submissions")
      .update({ reviewer_note: "🤖 AI judge not configured — the host will review this." })
      .eq("id", sub.id);
    return {
      judged: false as const,
      message: "Submitted. The AI judge is offline, so the host will review it.",
    };
  }

  const challenge = (
    Array.isArray(sub.obp_challenges) ? sub.obp_challenges[0] : sub.obp_challenges
  ) as { title: string; fields: Field[] };
  const payload = (sub.payload ?? {}) as Record<string, unknown>;
  const fields = (challenge.fields ?? []) as Field[];
  const userText = J.buildUserMessage({
    challengeTitle: challenge.title,
    rubric: rubric.rubric_md,
    max: rubric.max,
    fields,
    payload,
  });

  const attachments: Awaited<ReturnType<typeof J.fetchUrlAttachment>>[] = [];
  let images = 0;
  let urls = 0;
  for (const f of fields) {
    const value = payload[f.key];
    if (!value) continue;
    if (f.type === "image") {
      for (const p of (Array.isArray(value) ? value : [value]).map(String)) {
        if (images >= 4) break;
        if (!p.startsWith(`${sub.team_id}/`)) {
          attachments.push({
            label: f.label,
            kind: "text",
            text: "(an image that does not belong to this participant was ignored)",
          });
          continue;
        }
        const { data: blob, error } = await c.storage.from(BUCKET_SUBMISSIONS).download(p);
        if (error || !blob) {
          attachments.push({ label: f.label, kind: "text", text: `(upload could not be read)` });
          continue;
        }
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const mediaType = J.IMAGE_TYPES.includes(blob.type) ? blob.type : J.mediaTypeFromName(p);
        if (!mediaType || bytes.length > J.MAX_IMAGE_BYTES) {
          attachments.push({
            label: f.label,
            kind: "text",
            text: "(upload skipped: use PNG/JPG/GIF/WebP under 5 MB)",
          });
          continue;
        }
        attachments.push({
          label: `${f.label} #${++images}`,
          kind: "image",
          mediaType,
          base64: J.toBase64(bytes),
        });
      }
    } else if (f.type === "url" && urls < 3) {
      urls++;
      attachments.push(await J.fetchUrlAttachment(String(value), f.label));
    }
  }

  const result = await J.judge({ content: J.buildContent(userText, attachments), max: rubric.max });
  if (!result) {
    await c
      .from("obp_submissions")
      .update({ reviewer_note: "🤖 AI judge unavailable — the host will review this." })
      .eq("id", sub.id);
    return {
      judged: false as const,
      message: "The AI judge is busy. Your answer is saved and the host will review it.",
    };
  }
  const note = result.run.injection_attempt
    ? "🤖 AI judge: 🚨 judge-injection attempt detected → 0 points."
    : `🤖 AI judge (${result.score}/${rubric.max}): ${result.run.feedback}`;
  await rpc("obp_record_ai_verdict", {
    p_submission: sub.id,
    p_score: result.score,
    p_feedback: {
      median: result.score,
      runs: result.runs,
      errors: result.errors,
      attachments: attachments.map((a) => ({ label: a.label, kind: a.kind })),
    },
    p_note: note,
    p_final: Boolean(rubric.auto_approve),
  });
  return {
    judged: true as const,
    score: result.score,
    max: rubric.max as number,
    final: Boolean(rubric.auto_approve),
    feedback: result.run.feedback,
    breakdown: result.run.breakdown,
    injection_attempt: result.run.injection_attempt,
  };
}

export const obpSubmit = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; challenge: string; payload: Record<string, unknown> }) =>
    z
      .object({
        code: Code,
        challenge: z.string().min(1).max(40),
        payload: z.record(
          z.string().max(60),
          z.union([z.string().max(20_000), z.array(z.string().max(300)).max(4)]),
        ),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { rpc } = await server();
    const me = await rpc<{ id: string } | null>("obp_team_by_code", { p_code: data.code });
    if (!me) throw new Error("Unknown personal code");
    const id = await rpc<string>("obp_submit_answer", {
      p_code: data.code,
      p_challenge: data.challenge,
      p_payload: data.payload,
    });
    try {
      return { id, ...(await judgeSubmission(id, { requireTeam: me.id })) };
    } catch (e) {
      console.error("obp judge failed", e);
      return {
        id,
        judged: false as const,
        message: "Saved. The AI judge failed, so the host will review it.",
      };
    }
  });

/* ----------------------------------- exam ---------------------------------- */

export const obpExamGet = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => z.object({ code: Code }).parse(input))
  .handler(async ({ data }): Promise<ExamState> => {
    const { rpc } = await server();
    return rpc<ExamState>("obp_exam_get", { p_code: data.code });
  });

export const obpExamStart = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => z.object({ code: Code }).parse(input))
  .handler(async ({ data }): Promise<ExamState> => {
    const { rpc } = await server();
    return rpc<ExamState>("obp_exam_start", { p_code: data.code });
  });

export const obpExamSave = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; question: string; choice: string[]; flagged: boolean }) =>
    z
      .object({
        code: Code,
        question: z.string().min(1).max(20),
        choice: z.array(z.string().max(4)).max(6),
        flagged: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<string> => {
    const { rpc } = await server();
    return rpc<string>("obp_exam_save", {
      p_code: data.code,
      p_question: data.question,
      p_choice: data.choice,
      p_flagged: data.flagged,
    });
  });

export const obpExamSubmit = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => z.object({ code: Code }).parse(input))
  .handler(async ({ data }): Promise<ExamState> => {
    const { rpc } = await server();
    return rpc<ExamState>("obp_exam_submit", { p_code: data.code });
  });

export const obpExamBlur = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => z.object({ code: Code }).parse(input))
  .handler(async ({ data }): Promise<null> => {
    const { rpc } = await server();
    return rpc<null>("obp_exam_blur", { p_code: data.code });
  });

export const obpExamReview = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => z.object({ code: Code }).parse(input))
  .handler(async ({ data }): Promise<ExamReviewItem[]> => {
    const { rpc } = await server();
    return rpc<ExamReviewItem[]>("obp_exam_review", { p_code: data.code });
  });

/* ----------------------------------- admin --------------------------------- */

export type AdminOverview = {
  settings: {
    current_stage: number;
    event_code: string;
    registration_open: boolean;
    exam_open: boolean;
    exam_minutes: number;
    exam_review_open: boolean;
    leaderboard_frozen: boolean;
    download_url: string | null;
    event_title: string;
    frozen_at: string | null;
  };
  stages: Stage[];
  participants: {
    id: string;
    name: string;
    emoji: string;
    email: string | null;
    join_code: string;
    registered_at: string | null;
    score: number;
    reports: number;
    last_report_at: string | null;
    last_status: string | null;
  }[];
  reports: {
    id: string;
    created_at: string;
    name: string;
    emoji: string;
    kind: string;
    note: Record<string, string> | null;
    status: string;
    verified_stage: number | null;
    verified_total: number | null;
    verify_error: string | null;
    snapshot_bytes: number | null;
  }[];
  submissions: {
    id: string;
    created_at: string;
    team_name: string;
    team_emoji: string;
    challenge_id: string;
    challenge_title: string;
    points_max: number;
    status: string;
    points_awarded: number;
    ai_score: number | null;
    reviewer_note: string | null;
    payload: Record<string, Json>;
  }[];
  exam_progress: {
    team_id: string;
    name: string;
    emoji: string;
    started_at: string | null;
    ends_at: string | null;
    submitted_at: string | null;
    total: number | null;
    answered: number;
    flagged: number;
    tab_switches: number | null;
    scaled: number | null;
    passed: boolean | null;
  }[];
  announcements: Announcement[];
  badges: { id: string; emoji: string; title: string }[];
  content: {
    challenges: number;
    rubrics: number;
    questions: number;
    active_questions: number;
    hints: number;
  };
  health: {
    ai: string | null;
    organizer_secret: boolean;
    pending_reports: number;
    oldest_pending_at: string | null;
  };
  server_now: string;
};

export const obpAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminOverview> => {
    await requireAdmin(context);
    const { db } = await server();
    const { aiConfigured } = await import("./judge.server");
    const c = await db();
    const [
      settings,
      stages,
      teams,
      board,
      reports,
      subs,
      exam,
      ann,
      badges,
      ch,
      ru,
      qs,
      qa,
      hints,
      pending,
    ] = await Promise.all([
      c.from("obp_settings").select("*").eq("id", 1).maybeSingle(),
      c.from("obp_stages").select("*").order("position"),
      c.from("obp_teams").select("id, name, emoji, email, join_code, registered_at").order("name"),
      c.from("obp_leaderboard").select("team_id, score"),
      c.from("obp_reports_feed").select("*").order("created_at", { ascending: false }).limit(80),
      c
        .from("obp_submissions")
        .select(
          "id, created_at, team_id, challenge_id, status, points_awarded, ai_score, reviewer_note, payload, obp_teams(name, emoji), obp_challenges(title, points_max)",
        )
        .order("created_at", { ascending: false })
        .limit(200),
      c.from("obp_exam_progress").select("*").order("name"),
      c.from("obp_announcements").select("*").order("created_at", { ascending: false }).limit(20),
      c.from("obp_badges").select("id, emoji, title").order("id"),
      c.from("obp_challenges").select("id", { count: "exact", head: true }),
      c.from("obp_challenge_rubrics").select("challenge_id", { count: "exact", head: true }),
      c.from("obp_exam_questions").select("id", { count: "exact", head: true }),
      c.from("obp_exam_questions").select("id", { count: "exact", head: true }).eq("active", true),
      c.from("obp_hints").select("id", { count: "exact", head: true }),
      c
        .from("obp_reports")
        .select("created_at")
        .in("status", ["pending", "verifying"])
        .order("created_at")
        .limit(500),
    ]);
    const scores = new Map(
      ((board.data ?? []) as { team_id: string; score: number }[]).map((r) => [
        r.team_id,
        Number(r.score),
      ]),
    );
    const feed = (reports.data ?? []) as (AdminOverview["reports"][number] & { team_id: string })[];
    const { data: allReports } = await c
      .from("obp_reports")
      .select("team_id, created_at, status")
      .order("created_at", { ascending: false })
      .limit(5000);
    const byTeam = new Map<string, { n: number; last: string; status: string }>();
    for (const r of (allReports ?? []) as {
      team_id: string;
      created_at: string;
      status: string;
    }[]) {
      const cur = byTeam.get(r.team_id);
      if (cur) cur.n++;
      else byTeam.set(r.team_id, { n: 1, last: r.created_at, status: r.status });
    }
    const one = <T>(x: T | T[] | null): T | null => (Array.isArray(x) ? (x[0] ?? null) : x);
    const pend = (pending.data ?? []) as { created_at: string }[];
    return {
      settings: settings.data as AdminOverview["settings"],
      stages: (stages.data ?? []) as Stage[],
      participants: (
        (teams.data ?? []) as Omit<
          AdminOverview["participants"][number],
          "score" | "reports" | "last_report_at" | "last_status"
        >[]
      ).map((t) => ({
        ...t,
        score: scores.get(t.id) ?? 0,
        reports: byTeam.get(t.id)?.n ?? 0,
        last_report_at: byTeam.get(t.id)?.last ?? null,
        last_status: byTeam.get(t.id)?.status ?? null,
      })),
      reports: feed,
      submissions: ((subs.data ?? []) as Record<string, unknown>[]).map((s) => {
        const t = one(s.obp_teams as { name: string; emoji: string } | null);
        const ch2 = one(s.obp_challenges as { title: string; points_max: number } | null);
        return {
          id: s.id as string,
          created_at: s.created_at as string,
          team_name: t?.name ?? "?",
          team_emoji: t?.emoji ?? "",
          challenge_id: s.challenge_id as string,
          challenge_title: ch2?.title ?? (s.challenge_id as string),
          points_max: ch2?.points_max ?? 0,
          status: s.status as string,
          points_awarded: s.points_awarded as number,
          ai_score: (s.ai_score as number | null) ?? null,
          reviewer_note: (s.reviewer_note as string | null) ?? null,
          payload: (s.payload as Record<string, Json>) ?? {},
        };
      }),
      exam_progress: (exam.data ?? []) as AdminOverview["exam_progress"],
      announcements: (ann.data ?? []) as Announcement[],
      badges: (badges.data ?? []) as AdminOverview["badges"],
      content: {
        challenges: ch.count ?? 0,
        rubrics: ru.count ?? 0,
        questions: qs.count ?? 0,
        active_questions: qa.count ?? 0,
        hints: hints.count ?? 0,
      },
      health: {
        ai: aiConfigured(),
        organizer_secret: (process.env.ORBIT_ORGANIZER_SECRET ?? "").length >= 16,
        pending_reports: pend.length,
        oldest_pending_at: pend[0]?.created_at ?? null,
      },
      server_now: new Date().toISOString(),
    };
  });

const requireObpAdmin = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    await requireAdmin(context);
    return next();
  });

const S_OpenStage = z.object({ stage: z.number().int().min(0).max(99) });
export const obpAdminOpenStage = createServerFn({ method: "POST" })
  .middleware([requireObpAdmin])
  .inputValidator((input: z.input<typeof S_OpenStage>) => S_OpenStage.parse(input))
  .handler(async ({ data: { stage } }) => {
    const { rpc } = await server();
    await rpc("obp_open_stage", { p_stage: stage });
    return { ok: true };
  });

const S_ExtendStage = z.object({
  stage: z.number().int(),
  minutes: z.number().int().min(-30).max(60),
});
export const obpAdminExtendStage = createServerFn({ method: "POST" })
  .middleware([requireObpAdmin])
  .inputValidator((input: z.input<typeof S_ExtendStage>) => S_ExtendStage.parse(input))
  .handler(async ({ data: { stage, minutes } }) => {
    const { rpc } = await server();
    await rpc("obp_extend_stage", { p_stage: stage, p_minutes: minutes });
    return { ok: true };
  });

const S_UpdateSettings = z.object({
  event_code: z.string().trim().min(3).max(40).optional(),
  registration_open: z.boolean().optional(),
  exam_open: z.boolean().optional(),
  exam_minutes: z.number().int().min(1).max(180).optional(),
  exam_review_open: z.boolean().optional(),
  download_url: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v.startsWith("/") || /^https:\/\//.test(v), "Use a site path or an https URL")
    .nullable()
    .optional(),
  event_title: z.string().trim().min(3).max(80).optional(),
});
export const obpAdminUpdateSettings = createServerFn({ method: "POST" })
  .middleware([requireObpAdmin])
  .inputValidator((input: z.input<typeof S_UpdateSettings>) => S_UpdateSettings.parse(input))
  .handler(async ({ data: patch }) => {
    const { db } = await server();
    const c = await db();
    const { error } = await c
      .from("obp_settings")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const S_Freeze = z.object({ frozen: z.boolean() });
export const obpAdminFreeze = createServerFn({ method: "POST" })
  .middleware([requireObpAdmin])
  .inputValidator((input: z.input<typeof S_Freeze>) => S_Freeze.parse(input))
  .handler(async ({ data: { frozen } }) => {
    const { rpc } = await server();
    await rpc("obp_set_frozen", { p_frozen: frozen });
    return { ok: true };
  });

const S_Announce = z.object({
  kind: z.enum(["info", "twist", "alert", "win"]),
  message_md: z.string().trim().min(1).max(4000),
});
export const obpAdminAnnounce = createServerFn({ method: "POST" })
  .middleware([requireObpAdmin])
  .inputValidator((input: z.input<typeof S_Announce>) => S_Announce.parse(input))
  .handler(async ({ data: a }) => {
    const { db } = await server();
    const c = await db();
    const { error } = await c.from("obp_announcements").insert(a);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const S_DeleteAnnouncement = z.object({ id: z.string().uuid() });
export const obpAdminDeleteAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireObpAdmin])
  .inputValidator((input: z.input<typeof S_DeleteAnnouncement>) =>
    S_DeleteAnnouncement.parse(input),
  )
  .handler(async ({ data: { id } }) => {
    const { db } = await server();
    const c = await db();
    await c.from("obp_announcements").delete().eq("id", id);
    return { ok: true };
  });

const S_ExamFinalize = z.object({ force: z.boolean() });
export const obpAdminExamFinalize = createServerFn({ method: "POST" })
  .middleware([requireObpAdmin])
  .inputValidator((input: z.input<typeof S_ExamFinalize>) => S_ExamFinalize.parse(input))
  .handler(async ({ data: { force } }) => {
    const { rpc } = await server();
    return { graded: await rpc<number>("obp_exam_finalize_all", { p_force: force }) };
  });

const S_ExamExtend = z.object({
  team: z.string().uuid(),
  minutes: z.number().int().min(1).max(60),
});
export const obpAdminExamExtend = createServerFn({ method: "POST" })
  .middleware([requireObpAdmin])
  .inputValidator((input: z.input<typeof S_ExamExtend>) => S_ExamExtend.parse(input))
  .handler(async ({ data: { team, minutes } }) => {
    const { rpc } = await server();
    await rpc("obp_exam_extend", { p_team: team, p_minutes: minutes });
    return { ok: true };
  });

const S_ReviewSubmission = z.object({
  id: z.string().uuid(),
  points: z.number().int().min(0).max(500),
  note: z.string().max(2000).optional(),
});
export const obpAdminReviewSubmission = createServerFn({ method: "POST" })
  .middleware([requireObpAdmin])
  .inputValidator((input: z.input<typeof S_ReviewSubmission>) => S_ReviewSubmission.parse(input))
  .handler(async ({ data: { id, points, note } }) => {
    const { db } = await server();
    const c = await db();
    const { data: sub } = await c
      .from("obp_submissions")
      .select("challenge_id, obp_challenges(points_max)")
      .eq("id", id)
      .maybeSingle();
    if (!sub) throw new Error("Submission not found");
    const ch = (Array.isArray(sub.obp_challenges) ? sub.obp_challenges[0] : sub.obp_challenges) as {
      points_max: number;
    } | null;
    const max = ch?.points_max ?? points;
    const status = points <= 0 ? "rejected" : points >= max ? "approved" : "partial";
    const patch: Record<string, unknown> = {
      status,
      points_awarded: points,
      reviewed_at: new Date().toISOString(),
    };
    if (note !== undefined) patch.reviewer_note = note ? `👤 Host: ${note}` : null;
    const { error } = await c.from("obp_submissions").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const S_Regrade = z.object({ id: z.string().uuid() });
export const obpAdminRegrade = createServerFn({ method: "POST" })
  .middleware([requireObpAdmin])
  .inputValidator((input: z.input<typeof S_Regrade>) => S_Regrade.parse(input))
  .handler(async ({ data: { id } }) => judgeSubmission(id));

const S_ScreenshotUrls = z.object({ paths: z.array(z.string().max(300)).max(8) });
export const obpAdminScreenshotUrls = createServerFn({ method: "POST" })
  .middleware([requireObpAdmin])
  .inputValidator((input: z.input<typeof S_ScreenshotUrls>) => S_ScreenshotUrls.parse(input))
  .handler(async ({ data: { paths } }) => {
    const { db, BUCKET_SUBMISSIONS } = await server();
    const c = await db();
    if (!paths.length) return [];
    const { data } = await c.storage.from(BUCKET_SUBMISSIONS).createSignedUrls(paths, 600);
    return (data ?? []).map((d) => ({ path: d.path, url: d.signedUrl }));
  });

const S_Adjust = z.object({
  team: z.string().uuid(),
  points: z.number().int().min(-500).max(500),
  reason: z.string().trim().min(2).max(300),
});
export const obpAdminAdjust = createServerFn({ method: "POST" })
  .middleware([requireObpAdmin])
  .inputValidator((input: z.input<typeof S_Adjust>) => S_Adjust.parse(input))
  .handler(async ({ data: { team, points, reason } }) => {
    const { db } = await server();
    const c = await db();
    const { error } = await c.from("obp_adjustments").insert({ team_id: team, points, reason });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const S_AwardBadge = z.object({
  team: z.string().uuid(),
  badge: z.string().min(1).max(40),
  remove: z.boolean().optional(),
});
export const obpAdminAwardBadge = createServerFn({ method: "POST" })
  .middleware([requireObpAdmin])
  .inputValidator((input: z.input<typeof S_AwardBadge>) => S_AwardBadge.parse(input))
  .handler(async ({ data: { team, badge, remove } }) => {
    const { db } = await server();
    const c = await db();
    const q = remove
      ? c.from("obp_team_badges").delete().eq("team_id", team).eq("badge_id", badge)
      : c
          .from("obp_team_badges")
          .upsert(
            { team_id: team, badge_id: badge },
            { onConflict: "team_id,badge_id", ignoreDuplicates: true },
          );
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const S_RemoveParticipant = z.object({ team: z.string().uuid() });
export const obpAdminRemoveParticipant = createServerFn({ method: "POST" })
  .middleware([requireObpAdmin])
  .inputValidator((input: z.input<typeof S_RemoveParticipant>) => S_RemoveParticipant.parse(input))
  .handler(async ({ data: { team } }) => {
    const { db } = await server();
    const c = await db();
    const { error } = await c.from("obp_teams").delete().eq("id", team);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const S_ImportContent = z.object({ pack: z.string().min(10).max(5_000_000) });
export const obpAdminImportContent = createServerFn({ method: "POST" })
  .middleware([requireObpAdmin])
  .inputValidator((input: z.input<typeof S_ImportContent>) => S_ImportContent.parse(input))
  .handler(async ({ data: { pack } }) => {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(pack);
    } catch {
      throw new Error("That file is not valid JSON");
    }
    if (parsed.format !== "obp-content-pack")
      throw new Error(
        "Not an obp-content-pack.json file (make it with organizer/scripts/make-content-pack.mjs)",
      );
    const { rpc } = await server();
    return rpc<Record<string, number>>("obp_import_content", { p: parsed });
  });

const S_PackUploadUrl = z.object({
  size: z
    .number()
    .int()
    .min(1)
    .max(50 * 1024 * 1024),
});
export const obpAdminPackUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireObpAdmin])
  .inputValidator((input: z.input<typeof S_PackUploadUrl>) => S_PackUploadUrl.parse(input))
  .handler(async ({ data: _ }) => {
    const { db, BUCKET_DOWNLOADS, PACK_PATH } = await server();
    const c = await db();
    const { data, error } = await c.storage
      .from(BUCKET_DOWNLOADS)
      .createSignedUploadUrl(PACK_PATH, { upsert: true });
    if (error || !data) throw new Error(`Upload not available: ${error?.message ?? "unknown"}`);
    const { data: pub } = c.storage.from(BUCKET_DOWNLOADS).getPublicUrl(PACK_PATH);
    return {
      bucket: BUCKET_DOWNLOADS,
      path: PACK_PATH,
      token: data.token,
      public_url: pub.publicUrl,
    };
  });

const S_ResetEvent = z.object({ confirm: z.literal("RESET") });
export const obpAdminResetEvent = createServerFn({ method: "POST" })
  .middleware([requireObpAdmin])
  .inputValidator((input: z.input<typeof S_ResetEvent>) => S_ResetEvent.parse(input))
  .handler(async ({ data: _ }) => {
    const { rpc } = await server();
    await rpc("obp_reset_event");
    return { ok: true };
  });
