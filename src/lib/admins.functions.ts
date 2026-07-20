import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(context: { supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> }; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
}

export const listAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, created_at")
      .eq("role", "admin");
    if (error) throw new Error(error.message);
    if (!roles || roles.length === 0) return [] as { id: string; email: string; created_at: string }[];
    const results: { id: string; email: string; created_at: string }[] = [];
    for (const r of roles) {
      const { data } = await supabaseAdmin.auth.admin.getUserById(r.user_id);
      if (data?.user) {
        results.push({ id: r.user_id, email: data.user.email ?? "(no email)", created_at: r.created_at });
      }
    }
    return results;
  });

export const createAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; password: string }) =>
    z.object({ email: z.string().email().max(200), password: z.string().min(8).max(200) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error || !created?.user) throw new Error(error?.message ?? "Failed to create user");
    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: "admin" });
    if (rErr) throw new Error(rErr.message);
    return { id: created.user.id, email: created.user.email };
  });

export const removeAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("You cannot remove your own admin access");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", "admin");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const exportApplicationsCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { stage?: string }) =>
    z.object({ stage: z.string().optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("applications")
      .select(
        "id, created_at, full_name, email, phone, city, location_pref, education_degree, education_institution, graduation_year, employment_status, employment_role, github_url, linkedin_url, portfolio_url, languages, llm_experience, llm_experience_desc, english_level, essay_shipping, essay_curiosity, essay_fit, video_path, stage, status, total_score, admin_notes",
      )
      .order("created_at", { ascending: false });
    if (data.stage && data.stage !== "all") q = q.eq("stage", data.stage);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const cols = [
      "id","created_at","full_name","email","phone","city","location_pref","education_degree","education_institution","graduation_year","employment_status","employment_role","github_url","linkedin_url","portfolio_url","languages","llm_experience","llm_experience_desc","english_level","essay_shipping","essay_curiosity","essay_fit","video_path","stage","status","total_score","admin_notes",
    ];
    const escape = (v: unknown) => {
      if (v === null || v === undefined) return "";
      const s = String(v).replace(/"/g, '""');
      return `"${s}"`;
    };
    const header = cols.join(",");
    const body = (rows ?? []).map((r) => cols.map((c) => escape((r as Record<string, unknown>)[c])).join(",")).join("\n");
    return { csv: `${header}\n${body}`, count: rows?.length ?? 0 };
  });
