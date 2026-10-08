import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_challenges",
  title: "List challenges",
  description: "List all class challenges with their type, state, duration and schedule.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    const { data, error } = await supabaseForUser(ctx)
      .from("challenges")
      .select("slug,title,challenge_type,state,duration_minutes,start_at,end_at")
      .order("created_at");
    if (error) throw new ToolError(error.message);
    const challenges = (data ?? []).map((c) => ({ ...c }));
    return { content: [{ type: "text", text: JSON.stringify(challenges) }], structuredContent: { challenges } };
  },
});
