import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_applicants",
  title: "List applicants",
  description: "Admin only: list course applicants with stage and AI total score, optionally filtered by stage.",
  inputSchema: {
    stage: z.string().max(40).optional().describe("Optional stage filter, e.g. 'passed' or 'accepted_paid'."),
    limit: z.number().int().min(1).max(200).optional().describe("Max rows (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ stage, limit }, ctx) => {
    let q = supabaseForUser(ctx)
      .from("applications")
      .select("id,full_name,email,city,stage,total_score,github_url,created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 50);
    if (stage) q = q.eq("stage", stage);
    const { data, error } = await q;
    if (error) throw new ToolError(error.message);
    const applicants = (data ?? []).map((a) => ({ ...a }));
    return { content: [{ type: "text", text: JSON.stringify(applicants) }], structuredContent: { applicants } };
  },
});
