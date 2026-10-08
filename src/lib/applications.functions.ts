import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine(
    (v) => v === "" || /^https?:\/\/[^\s]+\.[^\s]+/i.test(v),
    { message: "Must be a valid URL starting with http(s)://" },
  )
  .optional()
  .nullable();

const ApplicationInput = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(200),
  phone: z.string().trim().max(40).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  location_pref: z.string().trim().max(60).optional().nullable(),
  education_degree: z.string().max(120).optional().nullable(),
  education_institution: z.string().max(160).optional().nullable(),
  graduation_year: z.number().int().min(1950).max(2050).optional().nullable(),
  employment_status: z.string().max(60).optional().nullable(),
  employment_role: z.string().max(160).optional().nullable(),
  english_level: z.number().int().min(1).max(5).optional().nullable(),
  english_sample: z.string().trim().min(30).max(1500).optional().nullable(),
  time_commitment_ok: z.literal(true, { message: "Time commitment must be confirmed" }),
  time_commitment_note: z.string().trim().max(600).optional().nullable(),
  financial_ack: z.boolean(),
  github_url: optionalUrl,
  linkedin_url: optionalUrl,
  portfolio_url: optionalUrl,
  languages: z.string().trim().max(300).optional().nullable(),
  llm_experience: z.boolean(),
  llm_experience_desc: z.string().max(800).optional().nullable(),
  essay_shipping: z.string().trim().min(50).max(3000),
  essay_curiosity: z.string().trim().min(50).max(3000),
  essay_fit: z.string().trim().min(50).max(3000),
  video_path: z.string().trim().min(1).max(400),
  quiz: z
    .array(
      z.object({
        question_id: z.string().uuid(),
        selected_index: z.number().int().nullable(),
        time_taken_seconds: z.number().nonnegative(),
      }),
    )
    .max(50)
    .optional()
    .default([]),
});

export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((input) => ApplicationInput.parse(input))
  .handler(async ({ data }) => {
    const { quiz, ...app } = data;

    // grade quiz
    let correctCount = 0;
    let totalTime = 0;
    let quizRows: Array<{
      question_id: string;
      selected_index: number | null;
      time_taken_seconds: number;
      is_correct: boolean;
    }> = [];

    if (quiz.length > 0) {
      const qIds = quiz.map((q) => q.question_id);
      const { data: questions } = await supabaseAdmin
        .from("quiz_questions")
        .select("id, correct_index")
        .in("id", qIds);
      const correctMap = new Map((questions ?? []).map((q) => [q.id, q.correct_index]));
      quizRows = quiz.map((q) => {
        const correctIdx = correctMap.get(q.question_id);
        const isCorrect = q.selected_index !== null && q.selected_index === correctIdx;
        if (isCorrect) correctCount++;
        totalTime += q.time_taken_seconds;
        return {
          question_id: q.question_id,
          selected_index: q.selected_index,
          time_taken_seconds: q.time_taken_seconds,
          is_correct: isCorrect,
        };
      });
    }

    const avgTime = quiz.length > 0 ? totalTime / quiz.length : null;

    const { data: inserted, error } = await supabaseAdmin
      .from("applications")
      .insert({
        ...app,
        quiz_correct_count: correctCount,
        quiz_total_count: quiz.length,
        quiz_avg_time_seconds: avgTime,
        quiz_completed_at: quiz.length > 0 ? new Date().toISOString() : null,
      })
      .select("id")
      .single();
    if (error || !inserted) throw new Error(error?.message ?? "Failed to save application");

    if (quizRows.length > 0) {
      await supabaseAdmin
        .from("quiz_responses")
        .insert(quizRows.map((q) => ({ ...q, application_id: inserted.id })));
    }

    // fire AI scoring (await; relatively quick)
    try {
      await scoreInternal(inserted.id);
    } catch (e) {
      console.error("AI scoring failed", e);
    }

    return { id: inserted.id };
  });

type ScoreDim = {
  dimension: "shipping" | "curiosity" | "fit" | "communication" | "portfolio";
  score: number;
  rationale: string;
};

const RUBRIC = `You are scoring an applicant to an intensive AI Engineer training program (only 20-25 of 100+ accepted). Score 0-10 on EACH dimension. Be strict and concrete. Names are blinded.

Weights for the final composite (you do NOT need to compute it):
- shipping (30%): Has shipped at least one project end-to-end. Can articulate the tradeoffs they made.
- curiosity (25%): Genuine AI curiosity — specific, non-obvious insight, not regurgitated marketing.
- fit (20%): Self-awareness. Clearly understands what they want. Names what would waste their time.
- communication (15%): Clear, structured English, no fluff. Specific over vague. Judged mainly from the short bio + essays.
- portfolio (10%): Real GitHub/project link with substance. Any AI/RAG/agent/MCP project = bonus.

Return STRICT JSON: { "shipping": {"score": <0-10>, "rationale": "<2 sentences>"}, "curiosity": {...}, "fit": {...}, "communication": {...}, "portfolio": {...} }`;

async function scoreInternal(applicationId: string) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY not set");

  const { data: app } = await supabaseAdmin
    .from("applications")
    .select("essay_shipping, essay_curiosity, essay_fit, github_url, portfolio_url, english_sample, languages")
    .eq("id", applicationId)
    .single();
  if (!app) return;

  const userContent = `Short bio (English): ${app.english_sample || "(none)"}

Essay 1 (shipping): ${app.essay_shipping}

Essay 2 (curiosity): ${app.essay_curiosity}

Essay 3 (fit): ${app.essay_fit}

Portfolio signals:
- GitHub: ${app.github_url || "(none)"}
- Project link: ${app.portfolio_url || "(none)"}
- Programming languages used >1 month: ${app.languages || "(none)"}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: RUBRIC },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI gateway ${res.status}: ${text}`);
  }
  const j = await res.json();
  const content = j.choices?.[0]?.message?.content;
  if (!content) throw new Error("No AI content");
  let parsed: Record<string, { score: number; rationale: string }>;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("AI returned invalid JSON");
  }

  const dims: ScoreDim[] = [];
  for (const dim of ["shipping", "curiosity", "fit", "communication", "portfolio"] as const) {
    const d = parsed[dim];
    if (d && typeof d.score === "number") {
      dims.push({ dimension: dim, score: Math.max(0, Math.min(10, d.score)), rationale: d.rationale ?? "" });
    }
  }

  // delete old scores then insert
  await supabaseAdmin.from("ai_scores").delete().eq("application_id", applicationId);
  await supabaseAdmin.from("ai_scores").insert(
    dims.map((d) => ({ application_id: applicationId, dimension: d.dimension, score: d.score, rationale: d.rationale })),
  );

  // composite weighted score (0-10)
  const weights: Record<string, number> = { shipping: 0.3, curiosity: 0.25, fit: 0.2, communication: 0.15, portfolio: 0.1 };
  let total = 0;
  let weightSum = 0;
  for (const d of dims) {
    const w = weights[d.dimension] ?? 0;
    total += d.score * w;
    weightSum += w;
  }
  const composite = weightSum > 0 ? total / weightSum : null;
  await supabaseAdmin.from("applications").update({ total_score: composite }).eq("id", applicationId);
}

export const rescoreApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    await scoreInternal(data.id);
    return { ok: true };
  });

export const updateApplicationStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; stage?: string; status?: string; admin_notes?: string }) =>
    z
      .object({
        id: z.string().uuid(),
        stage: z.enum(["applied", "takehome", "interview", "passed", "admitted", "accepted_paid", "wont_participate", "rejected"]).optional(),
        status: z.enum(["pending", "reviewing", "shortlisted", "rejected"]).optional(),
        admin_notes: z.string().max(5000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { id, ...patch } = data;
    const { error } = await supabaseAdmin.from("applications").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getSignedVideoUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { path: string }) => z.object({ path: z.string().min(1).max(400) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("applicant-videos")
      .createSignedUrl(data.path, 60 * 60);
    if (error || !signed) throw new Error(error?.message ?? "Failed to sign URL");
    return { url: signed.signedUrl };
  });
