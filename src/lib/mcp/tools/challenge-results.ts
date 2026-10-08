import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_challenge_results",
  title: "Get challenge results",
  description: "Admin only: list participant submissions or exam attempts with scores for one challenge.",
  inputSchema: { slug: z.string().min(1).max(60).describe("Challenge slug, e.g. '1' or 'claude-architect'.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }, ctx) => {
    const sb = supabaseForUser(ctx);
    const { data: ch, error } = await sb.from("challenges").select("id,title,challenge_type").eq("slug", slug).maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!ch) throw new ToolError(`No challenge with slug "${slug}"`);
    if (ch.challenge_type === "exam") {
      const { data, error: e } = await sb
        .from("exam_attempts")
        .select("participant_name,status,total_score,passed,submitted_at")
        .eq("challenge_id", ch.id)
        .order("total_score", { ascending: false, nullsFirst: false });
      if (e) throw new ToolError(e.message);
      const results = (data ?? []).map((r) => ({ ...r }));
      return { content: [{ type: "text", text: JSON.stringify({ title: ch.title, results }) }], structuredContent: { title: ch.title, results } };
    }
    const { data, error: e } = await sb
      .from("challenge_submissions")
      .select("participant_name,github_username,repo_full_name,link_url,eval_status,ai_score,instructor_score")
      .eq("challenge_id", ch.id)
      .order("ai_score", { ascending: false, nullsFirst: false });
    if (e) throw new ToolError(e.message);
    const results = (data ?? []).map((r) => ({ ...r }));
    return { content: [{ type: "text", text: JSON.stringify({ title: ch.title, results }) }], structuredContent: { title: ch.title, results } };
  },
});
