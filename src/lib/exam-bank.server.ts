// Server-only question bank for the Claude Code Architect exam simulation.
// Correct answers never leave the server until the exam has finished.

export type Domain = "agentic" | "tools_mcp" | "claude_code" | "prompting" | "context";

export const DOMAINS: Record<Domain, string> = {
  agentic: "Agentic architecture & orchestration",
  tools_mcp: "Tool design & MCP integration",
  claude_code: "Claude Code configuration & workflows",
  prompting: "Prompt engineering & structured output",
  context: "Context management & reliability",
};

export type McqQuestion = {
  id: string;
  kind: "single";
  domain: Domain;
  prompt: string;
  choices: string[];
  answer: number;
  explanation: string;
  points: number;
  presentation?: "terminal" | "architecture" | "code" | "incident";
  exhibit?: string;
};
export type MultiQuestion = {
  id: string;
  kind: "multi";
  domain: Domain;
  prompt: string;
  choices: string[];
  answers: number[];
  explanation: string;
  points: number;
  presentation?: "terminal" | "architecture" | "code" | "incident";
  exhibit?: string;
};
export type OrderingQuestion = {
  id: string;
  kind: "ordering";
  domain: Domain;
  prompt: string;
  choices: string[];
  answer: number[];
  explanation: string;
  points: number;
  presentation?: "architecture" | "workflow";
  exhibit?: string;
};
export type TaskQuestion = {
  id: string;
  kind: "task";
  domain: Domain;
  prompt: string;
  scenario: string;
  rubric: string;
  explanation: string;
  points: number;
  presentation?: "code" | "architecture";
  starter?: string;
};
export type ExamQuestion = McqQuestion | MultiQuestion | OrderingQuestion | TaskQuestion;

// [domain, prompt, correct, [wrong x3], explanation]
type Raw = [Domain, string, string, [string, string, string], string];

const RAW: Raw[] = [
  // ---------------- Agentic architecture & orchestration ----------------
  ["agentic", "Your agent loop calls the Messages API directly. Which signal should decide whether the loop continues?",
    "stop_reason: \"tool_use\" means run the requested tools and continue; \"end_turn\" means the task is finished",
    ["Whether the assistant's text contains the word \"done\"", "A fixed maximum of 5 iterations, regardless of the response", "Whether the response is longer than 500 tokens"],
    "The loop is driven by stop_reason. Parsing natural-language text or fixed iteration caps as the primary stop condition is fragile; caps are only a safety net."],
  ["agentic", "After your code executes a tool the model requested, how must the result be sent back?",
    "In the next user message as a tool_result block carrying the matching tool_use_id",
    ["As a new system prompt", "As an assistant message that repeats the tool call", "Appended to the tool's description"],
    "Tool results go in a user-role message as tool_result blocks that reference the tool_use_id, so the model can pair each result with its call."],
  ["agentic", "A coordinator delegates a literature search to a subagent, which returns off-topic results because it didn't know the scope of the research question. Most likely root cause?",
    "Subagents don't inherit the coordinator's conversation, so the scope must be passed explicitly in the task prompt",
    ["The subagent model is too small", "The temperature is too high", "The subagent has too few tools"],
    "Subagents start with a fresh context. Everything they need (goal, scope, constraints, prior findings) has to be written into the delegation prompt."],
  ["agentic", "A research system's report on \"AI's impact on creative industries\" only covers visual arts. Logs show every subagent did its assigned job well. Root cause?",
    "The coordinator decomposed the topic too narrowly",
    ["The synthesis agent dropped content", "The web search tool is broken", "The context window overflowed"],
    "If each worker performed well but coverage is incomplete, the failure is upstream: the decomposition missed music, writing, film, and so on."],
  ["agentic", "You want three research subagents to run in parallel using the Agent SDK. Best approach?",
    "Have the coordinator emit multiple Task tool calls in a single response",
    ["Spawn them one after another, waiting for each to finish", "Ask one subagent to role-play three researchers", "Send them through the Message Batches API"],
    "Multiple Task (subagent) tool calls in one assistant turn run concurrently; sequential turns serialize the work."],
  ["agentic", "A support agent must verify identity before issuing any refund. The prompt instruction is followed 97% of the time. Best fix?",
    "Enforce it in code: a prerequisite gate that blocks process_refund until get_customer has returned a verified ID",
    ["Write the rule in ALL CAPS and mark it CRITICAL", "Add more few-shot examples of verification", "Increase the temperature"],
    "When compliance must be deterministic (money, security), use programmatic enforcement. Prompts are probabilistic."],
  ["agentic", "Refunds over $500 must always go to a human. Most reliable implementation?",
    "A hook or tool wrapper that intercepts process_refund above the threshold and routes it to escalation",
    ["Tell the model in the system prompt to check the amount", "Ask the model to rate its confidence before refunding", "Audit refunds weekly and reverse mistakes"],
    "Intercepting the tool call guarantees the policy. Prompt-only rules and after-the-fact audits don't."],
  ["agentic", "Which escalation trigger is the most reliable?",
    "The customer explicitly asks for a human",
    ["Sentiment analysis detects frustration", "The model's self-reported confidence drops below 0.7", "The conversation exceeds 10 turns"],
    "Explicit requests are unambiguous and should be honored. Sentiment and self-reported confidence are poorly calibrated proxies."],
  ["agentic", "A customer asks for a human, but the issue is a password reset the agent could fix in one step. What should the agent do?",
    "Honor the request and escalate right away",
    ["Fix it anyway without mentioning the request", "Ask the customer to justify why they want a human", "Keep trying until the customer gets frustrated"],
    "An explicit request for a human is honored immediately; overriding it damages trust."],
  ["agentic", "What should an escalation handoff to a human agent contain?",
    "A structured summary: customer ID, issue, findings, actions already taken, and the recommended next step",
    ["Only the raw transcript", "Only the customer's name", "Nothing; the human can read the logs"],
    "Human agents often can't see the full transcript. A concise structured handoff avoids making the customer repeat everything."],
  ["agentic", "A subagent's web search times out. How should it report this to the coordinator?",
    "Return structured error context: failure type (timeout), the query attempted, any partial results, and whether retrying makes sense",
    ["Return an empty result marked as success", "Throw a generic \"operation failed\" error", "Retry silently forever"],
    "Structured errors let the coordinator decide whether to retry, reroute, or annotate a gap. Silent success or generic errors hide the problem."],
  ["agentic", "A search tool finds zero matches for a valid query. How should that differ from a database outage?",
    "Zero matches is a successful empty result; an outage is an error flagged with is_error and retry information",
    ["Report both with the same error", "Report both as success", "Crash the agent loop in both cases"],
    "Confusing \"no data\" with \"couldn't check\" leads agents to wrong conclusions, like telling a customer they have no orders."],
  ["agentic", "When is a fixed sequential pipeline (prompt chaining) better than dynamic agent decomposition?",
    "When the steps are predictable and known in advance, such as per-file review followed by a cross-file pass",
    ["Always, for every task", "For open-ended research with unknown sub-questions", "Never; agents should always decide"],
    "Fixed chains are simpler and more reliable for known workflows; dynamic decomposition suits open-ended tasks."],
  ["agentic", "Reviewing a 14-file PR in one pass gives shallow, inconsistent feedback. Best restructure?",
    "Run a local analysis pass per file, then a separate cross-file integration pass",
    ["Switch to a bigger model and keep the single pass", "Ask for shorter output", "Only review the first 5 files"],
    "Splitting focus avoids attention dilution; the integration pass catches cross-file issues such as broken contracts."],
  ["agentic", "Your synthesis agent writes claims, but you can no longer tell which source supports which. Fix?",
    "Have subagents return structured claim-source mappings (URL, excerpt, date) and preserve them through synthesis",
    ["Ask the synthesis agent to add citations from memory", "Remove sources to keep reports short", "Lower the temperature"],
    "Provenance is lost in summarization unless it's carried as structured data through each step."],
  ["agentic", "Two credible sources report conflicting statistics. What should the synthesis step do?",
    "Report both with attribution and flag the conflict, noting dates or methodology",
    ["Silently pick the most recent one", "Average the two numbers", "Leave the statistic out"],
    "Hiding or averaging conflicts misleads readers. Surfacing them with context is the reliable behavior."],
  ["agentic", "You want to explore two refactoring approaches from the same analysis without losing the baseline. What should you use?",
    "fork_session, branching both explorations from the shared context",
    ["/clear and redo the analysis twice", "Two unrelated sessions with no shared context", "Run --continue twice in the same session"],
    "Forking keeps the shared analysis and lets branches diverge independently."],
  ["agentic", "You resume a session days later after teammates changed several files. Best practice?",
    "Resume, but tell the agent which files changed so it re-reads them, or start fresh with a summary if much is stale",
    ["Resume and trust the old tool results", "Never resume sessions", "Delete CLAUDE.md before resuming"],
    "Stale tool results in history cause confident wrong answers. Targeted re-reads or a fresh summary fixes that."],
  ["agentic", "In a hub-and-spoke multi-agent design, why route all communication through the coordinator?",
    "It centralizes observability, error handling, and control over what information flows to each subagent",
    ["It's always faster", "Subagents can't call tools", "The API requires it"],
    "The coordinator is the single place to log, handle failures, and decide what each worker should see."],

  // ---------------- Tool design & MCP ----------------
  ["tools_mcp", "The agent keeps calling analyze_content when it should call analyze_document; both have one-line descriptions. Most effective first fix?",
    "Expand both descriptions: purpose, input formats, example queries, and when to use each versus the other",
    ["Add a separate routing classifier model", "Lower the temperature", "Delete one of the tools"],
    "Tool descriptions are the main signal the model uses to pick tools. Vague, overlapping descriptions cause misrouting."],
  ["tools_mcp", "An agent with 18 tools often picks the wrong one. Best fix?",
    "Give each agent or subagent only the 4 to 5 tools relevant to its role",
    ["Add more tools to cover edge cases", "List all 18 tools again in the system prompt", "Set tool_choice to auto"],
    "Selection reliability drops as tool count grows. Scoped toolsets per role improve accuracy."],
  ["tools_mcp", "You must guarantee the model calls one of your extraction tools rather than replying with text. Which setting?",
    "tool_choice: {\"type\": \"any\"}",
    ["tool_choice: {\"type\": \"auto\"}", "tool_choice: {\"type\": \"none\"}", "Add \"please use a tool\" to the prompt"],
    "\"any\" forces a tool call while letting the model choose which. \"auto\" allows plain text."],
  ["tools_mcp", "extract_metadata must run first, before any other tool. How do you force it?",
    "tool_choice: {\"type\": \"tool\", \"name\": \"extract_metadata\"}",
    ["tool_choice: {\"type\": \"any\"}", "Put extract_metadata first in the tools list", "tool_choice auto plus an instruction"],
    "Forced tool choice guarantees that specific tool on this turn. Later turns can then use auto."],
  ["tools_mcp", "The whole team should get a GitHub MCP server for this repo, but tokens must never be committed. Where should it be configured?",
    "In the project .mcp.json, using ${GITHUB_TOKEN} environment variable expansion",
    ["In .mcp.json with the token hardcoded", "In each developer's ~/.claude.json only", "In CLAUDE.md with the token"],
    "Project-scoped .mcp.json is shared through git; env var expansion keeps secrets out of it."],
  ["tools_mcp", "You're trying a personal experimental MCP server and don't want teammates to get it. Which scope?",
    "User scope (for example, claude mcp add --scope user), stored in ~/.claude.json",
    ["The project .mcp.json", ".claude/settings.json", "The project CLAUDE.md"],
    "User scope applies across your projects without touching shared, version-controlled files."],
  ["tools_mcp", "Which MCP primitive exposes a read-only content catalog (such as a documentation index) so the agent can see what's available without calling an action?",
    "Resources",
    ["Tools", "Prompts", "Sampling"],
    "Resources expose data or content; tools perform actions. A catalog as a resource cuts down on exploratory tool calls."],
  ["tools_mcp", "A tool returns a 40-field order object, but the agent only needs 5 fields, and context fills up quickly. Best fix?",
    "Trim the tool output to the relevant fields (in the tool wrapper or a PostToolUse hook) before it reaches the model",
    ["Use a bigger context window", "Ask the model to ignore irrelevant fields", "Return XML instead of JSON"],
    "Verbose tool results accumulate across turns. Filtering at the source keeps context lean."],
  ["tools_mcp", "What's the best shape for a tool error response?",
    "is_error: true plus an error category (transient/validation/permission/business), a retryable flag, and a human-readable message",
    ["The plain string \"error\"", "The raw stack trace", "An empty response"],
    "Structured errors let the agent pick the right recovery: retry, fix input, or explain to the user."],
  ["tools_mcp", "A refund request exceeds company policy. How should the tool signal this?",
    "As a non-retryable business error with an explanation, so the agent can inform the customer or escalate",
    ["As a retryable transient error", "As success, with a hidden note", "By crashing the tool"],
    "Marking policy violations as retryable causes pointless retry loops."],
  ["tools_mcp", "Which Claude Code built-in tool is best for finding files by name pattern (for example, **/*.config.ts)?",
    "Glob",
    ["Grep", "Read", "Edit"],
    "Glob matches file paths; Grep searches file contents."],
  ["tools_mcp", "You need every caller of processPayment() across the codebase. Which built-in tool fits?",
    "Grep",
    ["Glob", "Read every file one by one", "Write"],
    "Grep searches file contents for patterns; Glob only matches names."],
  ["tools_mcp", "An Edit fails because the target text appears multiple times in the file. Best fallback?",
    "Read the file and give Edit a larger, unique anchor (or rewrite the file with Write if needed)",
    ["Retry the identical edit", "Run a blind sed replacement through Bash", "Give up on the change"],
    "Edit requires a unique match. More surrounding context disambiguates it."],

  // ---------------- Claude Code configuration & workflows ----------------
  ["claude_code", "Where should coding standards go so every teammate gets them automatically?",
    "The project CLAUDE.md (repo root or .claude/CLAUDE.md), committed to version control",
    ["~/.claude/CLAUDE.md", "CLAUDE.local.md", "Pasted at the start of each session"],
    "The project-level CLAUDE.md is shared through git; user-level and local files are personal."],
  ["claude_code", "A new teammate says Claude ignores the team conventions you wrote. You put them in ~/.claude/CLAUDE.md. Why?",
    "The user-level file lives on your machine and isn't shared through version control",
    ["The file is too long", "CLAUDE.md only loads in plan mode", "Claude needs a weekly restart"],
    "~/.claude/CLAUDE.md applies only to your own sessions."],
  ["claude_code", "Testing conventions should apply only to **/*.test.tsx files spread across many folders. Best option?",
    "A .claude/rules/testing.md file with a paths glob in its frontmatter",
    ["A CLAUDE.md copied into every folder", "The root CLAUDE.md", "An MCP server"],
    "Path-scoped rules load only when matching files are involved, even when those files are scattered."],
  ["claude_code", "You want a reusable /review command available to the whole team. Where should it live?",
    ".claude/commands/review.md, committed to the repo",
    ["~/.claude/commands/review.md", ".claude/settings.json", ".mcp.json"],
    "Project commands in .claude/commands are shared; ~/.claude/commands is personal."],
  ["claude_code", "A skill produces a lot of exploratory output that clutters the main conversation. Which SKILL.md frontmatter helps?",
    "context: fork",
    ["allowed-tools: all", "model: haiku", "A longer description"],
    "context: fork runs the skill in an isolated sub-context and returns only the result."],
  ["claude_code", "How do you restrict a skill to read-only tools?",
    "Set allowed-tools in the SKILL.md frontmatter (for example, Read, Grep, Glob)",
    ["Add a note to CLAUDE.md", "Configure it in .mcp.json", "Rename the skill"],
    "allowed-tools limits which tools can be used while the skill is active."],
  ["claude_code", "When should you choose a skill over CLAUDE.md?",
    "For task-specific workflows loaded on demand; CLAUDE.md is for always-on universal standards",
    ["For standards that must apply to every request", "They're identical, so it doesn't matter", "Skills only work with MCP servers"],
    "CLAUDE.md is always in context. Skills load when relevant, which saves context."],
  ["claude_code", "You need to migrate a logging library across 45 files, and several approaches are possible. Best workflow?",
    "Use plan mode first to explore and agree on the approach, then execute",
    ["Start editing right away", "Edit one file at a time with no plan", "Run it headless overnight without review"],
    "Plan mode fits large, ambiguous, multi-file changes where the approach needs a decision first."],
  ["claude_code", "You have a single-line bug fix with a clear stack trace. Best workflow?",
    "Direct execution",
    ["Plan mode plus three subagents", "Fork the session into two branches", "The Message Batches API"],
    "Well-scoped, obvious changes don't need planning overhead."],
  ["claude_code", "You're running Claude Code in CI to review PRs and post structured findings. Which invocation?",
    "claude -p \"...\" --output-format json (optionally with --json-schema) for machine-parseable output",
    ["Interactive claude in the CI runner", "claude --continue", "Running /compact first"],
    "-p (print mode) runs non-interactively; JSON output lets the pipeline parse the findings."],
  ["claude_code", "A CI job running Claude Code hangs waiting for input. Fix?",
    "Use the -p / --print flag for non-interactive mode",
    ["Set CLAUDE_HEADLESS=true", "Add --yes", "Pipe \"yes\" into the command"],
    "-p is the documented non-interactive mode. The other options aren't real Claude Code flags."],
  ["claude_code", "Claude must never read the project's .env files, for every teammate. Best option?",
    "A permissions deny rule such as Read(./.env) in the committed .claude/settings.json",
    ["Ask nicely in CLAUDE.md", "Add .env to .gitignore", "Put the rule only in settings.local.json"],
    "Deny rules are enforced and take precedence; the shared settings.json applies to everyone."],
  ["claude_code", "Prettier should run automatically after every file Claude edits. Which hook?",
    "PostToolUse with a matcher for Edit|Write",
    ["PreToolUse", "UserPromptSubmit", "SessionStart"],
    "PostToolUse runs after the tool succeeds, which is the right moment to format the changed file."],
  ["claude_code", "You want to block any Bash command containing rm -rf. How?",
    "A PreToolUse hook on Bash that exits with code 2 (blocks the call and feeds stderr back to Claude)",
    ["A PostToolUse hook that exits with code 0", "A Stop hook", "A SessionStart hook"],
    "Only PreToolUse can prevent execution; exit code 2 means block."],

  // ---------------- Prompt engineering & structured output ----------------
  ["prompting", "A code review bot flags so many false positives that developers ignore it. Best fix?",
    "Explicit criteria for what to report (bugs, security) versus skip (style, nitpicks), with examples of each",
    ["Tell it to \"be conservative\"", "\"Only report high-confidence findings\"", "Switch to a bigger model"],
    "Vague instructions like \"be conservative\" don't change behavior reliably; concrete categorical criteria do."],
  ["prompting", "One noisy category (style comments) is destroying trust in the whole bot. Best short-term move?",
    "Temporarily disable that category while you refine its criteria, keeping the reliable categories running",
    ["Keep everything and add a disclaimer", "Turn off the whole bot", "Raise the self-reported confidence threshold"],
    "Isolating the noisy category preserves trust in the useful findings while you fix it."],
  ["prompting", "The model is inconsistent on ambiguous cases (is a missing null check a bug here?). Most effective fix?",
    "Add 2 to 4 few-shot examples of ambiguous cases, each explaining why that decision was made",
    ["Add more rules in capital letters", "Set temperature to 0 and change nothing else", "Ask for longer output"],
    "Few-shot examples with reasoning teach the model how to generalize judgment calls."],
  ["prompting", "How do you guarantee schema-valid JSON for an extraction task?",
    "Use tool use with an input_schema (structured output) instead of free-text JSON",
    ["Say \"respond only in JSON\"", "Parse the output with regex", "Prefill the response with \"{\""],
    "Tool schemas remove syntax errors and missing required fields. Prompting alone does not."],
  ["prompting", "Which problem does tool use with a JSON schema NOT prevent?",
    "Semantic errors, such as line items that don't add up to the stated total",
    ["Missing required fields", "Invalid JSON syntax", "Wrong field types"],
    "Schemas enforce structure, not truth. You still need semantic validation."],
  ["prompting", "Many invoices have no due date, and the model invents one. Fix?",
    "Make the field nullable and instruct the model to return null when the information is absent",
    ["Keep it required with a default of \"\"", "Lower the temperature", "Use a bigger model"],
    "Required fields pressure the model to fabricate; nullable fields make \"not present\" a valid answer."],
  ["prompting", "Your category enum misses real-world edge cases. Better schema design?",
    "Keep the enum, add an \"other\" value, and include a free-text detail field",
    ["Replace the enum with free text", "Drop the field", "Expand the enum to 200 values"],
    "\"other\" plus detail captures surprises while keeping the data analyzable."],
  ["prompting", "An extraction fails validation (wrong date format). What's the best retry?",
    "Send back the original document, the failed extraction, and the specific validation error for correction",
    ["Resend the identical request", "Say \"try again\"", "Switch to another model"],
    "Specific error feedback gives the model what it needs to correct itself."],
  ["prompting", "When will a validation-retry loop NOT help?",
    "When the required information simply isn't in the source document",
    ["When the date format is wrong", "When fields are nested incorrectly", "When a value is in the wrong field"],
    "Retries fix format and placement errors. They can't produce missing information, and pushing harder invites fabrication."],
  ["prompting", "You need a nightly report over 10,000 documents. Cost matters, and results by morning are fine. Best API choice?",
    "The Message Batches API (about 50% cheaper, processed within 24 hours)",
    ["Synchronous parallel requests", "Streaming responses", "A larger model"],
    "Latency-tolerant bulk jobs are exactly what batch processing is designed for."],
  ["prompting", "Developers wait on a blocking pre-merge check before they can merge. Which API?",
    "The synchronous Messages API",
    ["The Message Batches API", "Batches with polling every minute", "Batches with a priority flag"],
    "Batches have no latency guarantee (up to 24 hours), so they don't suit blocking workflows."],
  ["prompting", "How do you match Message Batches results back to their inputs?",
    "A custom_id on each request",
    ["The order of the results", "Timestamps", "A hash of each output"],
    "Results can come back in any order; custom_id is the correlation key."],
  ["prompting", "Claude reviewing its own code in the same session misses the bugs it introduced. Better approach?",
    "An independent review instance that doesn't have the generation context",
    ["Ask it to \"review harder\"", "Enable extended thinking in the same session", "Review twice in the same session"],
    "The generating context carries the same assumptions. A fresh instance reviews with fresh eyes."],
  ["prompting", "Extraction accuracy is 97% overall. Why isn't that enough to reduce human review?",
    "An aggregate number can hide poor accuracy on specific document types or fields; analyze accuracy by segment",
    ["97% is always enough", "Remove human review whenever accuracy is above 95%", "Only fix errors that users report"],
    "Stratified analysis reveals failure pockets that an aggregate metric hides."],

  // ---------------- Context management & reliability ----------------
  ["context", "In a long support chat, the agent forgets the order number and amount mentioned early on. Fix?",
    "Maintain a persistent case-facts block (IDs, amounts, dates) included in every prompt, separate from summarized history",
    ["Progressively summarize everything", "Rely on a bigger context window alone", "Ask the customer to repeat the details"],
    "Summaries lose exact numbers. Pinned case facts preserve them."],
  ["context", "To counter the \"lost in the middle\" effect, where should the key findings go?",
    "At the beginning of the input, with clear section headers",
    ["In the middle", "In random positions", "Anywhere, with the headers removed"],
    "Models attend best to the start and end of long inputs; headers help navigation."],
  ["context", "A long exploratory Claude Code session starts citing \"typical patterns\" instead of the actual classes it found earlier. Best mitigation?",
    "Record key findings in a scratchpad file, use /compact, and delegate verbose exploration to subagents",
    ["Just keep going", "Restart the laptop", "Increase max_tokens"],
    "Context degradation is managed by persisting findings and keeping the main context lean."],
  ["context", "Why does delegating verbose codebase exploration to a subagent help?",
    "The exploration noise stays in the subagent's context, and the main agent gets only a concise summary",
    ["Subagents have unlimited context", "Subagents are always faster", "Subagents never use tokens"],
    "Isolation protects the main conversation's context budget."],
  ["context", "What's the difference between /compact and /clear?",
    "/compact summarizes the conversation and continues; /clear wipes the context entirely",
    ["They do the same thing", "/clear summarizes; /compact deletes files", "/compact only works in plan mode"],
    "Use /compact to keep the thread going with less context, and /clear to start a fresh task."],
  ["context", "A customer asks for a refund, an address change, and has a billing question, all in one message. Best approach?",
    "Track each concern separately, resolve each one, and reply with a single unified response",
    ["Handle only the first request", "Escalate immediately", "Ask them to pick one"],
    "Multi-concern handling keeps every issue tracked so none get dropped."],
  ["context", "get_customer returns three matches for \"John Smith\". What should the agent do?",
    "Ask for an additional identifier (email, order number) instead of choosing one",
    ["Pick the most recent customer", "Pick the first match", "Merge the three records"],
    "Guessing risks acting on the wrong account. Disambiguate first."],
  ["context", "Two of five subagents failed, but the aggregated report says \"coverage complete\". What's the right behavior?",
    "Explicitly annotate the coverage gaps in the final output",
    ["Hide the gaps", "Retry forever", "Discard the whole report"],
    "Readers need to know what wasn't covered. Partial results with clear gaps beat false completeness."],
  ["context", "Across a 30-turn agent session, tool results pile up raw, token-heavy payloads. Best practice?",
    "Keep only the relevant fields or summaries from each result and drop raw payloads once used",
    ["Keep everything forever", "Raise max_tokens", "Move all results into the system prompt"],
    "Trimming accumulated tool output prevents context exhaustion and attention dilution."],
  ["context", "You want to route low-confidence extractions to human review. What must you do first?",
    "Calibrate field-level confidence scores against a labeled validation set",
    ["Trust the model's self-reported confidence as-is", "Route everything to humans permanently", "Rely only on random sampling"],
    "Uncalibrated confidence is unreliable. Calibration makes the thresholds meaningful."],
];

function seeded(i: number) {
  let s = (i + 1) * 2654435761;
  return () => {
    s = (s ^ (s >>> 13)) * 1274126177;
    s = s ^ (s >>> 16);
    return ((s >>> 0) % 1000) / 1000;
  };
}

const BASE_MCQS: McqQuestion[] = RAW.map(([domain, prompt, correct, wrong, explanation], i) => {
  const rnd = seeded(i);
  const pos = Math.floor(rnd() * 4);
  const choices = [...wrong];
  choices.splice(pos, 0, correct);
  return { id: `q${i + 1}`, kind: "single", domain, prompt, choices, answer: pos, explanation, points: 1 };
});

// Rich simulations replace selected plain questions without changing IDs or total points,
// keeping saved attempts compatible with previous exam runs.
const INTERACTIVE: Record<string, ExamQuestion> = {
  q6: {
    id: "q6", kind: "single", domain: "agentic", points: 1, presentation: "architecture",
    prompt: "Place the reliable safety control in this refund-agent architecture.",
    exhibit: "Customer → Agent loop → [ ? ] → process_refund\n                         ↘ escalate_to_human",
    choices: ["A code-level prerequisite gate before process_refund", "A reminder inside the final response", "A weekly audit after refunds", "A confidence score shown to the customer"],
    answer: 0,
    explanation: "A deterministic prerequisite gate must verify identity before the refund tool can run; prompt reminders are probabilistic.",
  },
  q7: {
    id: "q7", kind: "multi", domain: "agentic", points: 1, presentation: "incident",
    prompt: "Select every event that should trigger an immediate human handoff.",
    exhibit: "POLICY CONSOLE · Refunds over $500 require approval · Explicit human requests are always honored",
    choices: ["The customer explicitly asks for a person", "A refund request is $740", "Sentiment is mildly negative", "The conversation reaches ten turns"],
    answers: [0, 1],
    explanation: "Explicit human requests and hard policy thresholds are deterministic escalation triggers; sentiment and turn count are unreliable proxies.",
  },
  q20: {
    id: "q20", kind: "ordering", domain: "tools_mcp", points: 1, presentation: "workflow",
    prompt: "Arrange the tool-use loop in the order the application must execute it.",
    choices: ["Execute the validated tool call", "Send tool_result with the matching tool_use_id", "Read the assistant response and stop_reason", "Call the model again with the updated messages"],
    answer: [2, 0, 1, 3],
    explanation: "Inspect the model response, execute validated calls, return matching tool results, then continue the model loop.",
  },
  q33: {
    id: "q33", kind: "single", domain: "claude_code", points: 1, presentation: "terminal",
    prompt: "The team wants this rule shared with everyone. Which correction is right?",
    exhibit: "$ cat ~/.claude/CLAUDE.md\nAlways run tests before committing.\n\n# Teammate reports: rule not loaded",
    choices: ["Move it to the repository's CLAUDE.md and commit it", "Run /compact", "Add it to .gitignore", "Rename it CLAUDE.local.md"],
    answer: 0,
    explanation: "The user-level file is local to one machine. Shared standards belong in the repository CLAUDE.md.",
  },
  q39: {
    id: "q39", kind: "multi", domain: "claude_code", points: 1, presentation: "code",
    prompt: "Select every configuration element needed for this team policy.",
    exhibit: "Requirements:\n• Never read .env files\n• Format files after Edit or Write\n• Apply test guidance only to **/*.test.ts",
    choices: ["A shared permissions.deny rule", "A PostToolUse hook matching Edit|Write", "A path-scoped rule with a files glob", "A personal ~/.claude setting only"],
    answers: [0, 1, 2],
    explanation: "Enforced deny permissions, a PostToolUse formatter hook, and a path-scoped rule satisfy the three requirements.",
  },
  q46: {
    id: "q46", kind: "single", domain: "prompting", points: 1, presentation: "code",
    prompt: "Inspect this extraction schema. What is the most important reliability fix?",
    exhibit: '{ "due_date": { "type": "string" }, "required": ["due_date"] }\n// Many source invoices have no due date',
    choices: ["Allow null and instruct the model to return null when absent", "Use a larger model", "Default every missing date to today", "Retry until a date appears"],
    answer: 0,
    explanation: "A nullable field makes absence valid and avoids pressuring the model to fabricate a date.",
  },
  q52: {
    id: "q52", kind: "ordering", domain: "prompting", points: 1, presentation: "workflow",
    prompt: "Order the reliable recovery flow after structured output fails validation.",
    choices: ["Run semantic checks", "Return the exact validation error", "Validate the structured response", "Retry with source, failed output, and error"],
    answer: [2, 1, 3, 0],
    explanation: "Validate first, expose the exact failure, retry with full correction context, then run semantic checks on the corrected result.",
  },
  q58: {
    id: "q58", kind: "single", domain: "context", points: 1, presentation: "architecture",
    prompt: "Which memory layer should preserve the exact order ID and refund amount?",
    exhibit: "Incoming turn\n   ↓\nPinned facts ── Summarized history ── Recent tool results\n   ↓                  ↓                       ↓\n                 Model context",
    choices: ["Pinned case facts", "Progressively summarized history only", "Raw tool results kept forever", "The model's hidden memory"],
    answer: 0,
    explanation: "Exact identifiers and amounts belong in a persistent facts block, separate from lossy conversation summaries.",
  },
};

const MCQS: ExamQuestion[] = BASE_MCQS.map((q) => INTERACTIVE[q.id] ?? q);

const TASKS: TaskQuestion[] = [
  {
    id: "t1", kind: "task", domain: "claude_code", points: 6,
    presentation: "code",
    starter: "// .claude/settings.json\n{\n  \"permissions\": {\n    \"allow\": [],\n    \"deny\": []\n  },\n  \"hooks\": {}\n}\n\n// .claude/rules/testing.md\n---\npaths:\n---",
    prompt: "Hands-on: configure Claude Code for a team repository.",
    scenario: "Write the contents of .claude/settings.json (and any other file you need) so that: (1) nobody's Claude session can read .env files; (2) `npm test` runs without a permission prompt; (3) Prettier runs automatically on every file Claude edits; (4) team testing conventions apply only to **/*.test.ts files. Show the file paths and contents.",
    rubric: "1.5 pts: permissions.deny with Read(./.env) or similar in the shared .claude/settings.json. 1.5 pts: permissions.allow for Bash(npm test) or similar. 1.5 pts: hooks.PostToolUse with a matcher covering Edit/Write that runs prettier. 1.5 pts: .claude/rules/<file>.md with paths frontmatter glob **/*.test.ts. Accept reasonable syntax variations.",
    explanation: "Deny rules in the committed settings.json, allow rules for safe commands, PostToolUse with an Edit|Write matcher for formatting, and path-scoped rules in .claude/rules with a paths glob.",
  },
  {
    id: "t2", kind: "task", domain: "agentic", points: 6,
    presentation: "architecture",
    starter: "COORDINATOR\n├── Research agent A →\n├── Research agent B →\n└── Research agent C →\n\nFailure contract:\nProvenance contract:",
    prompt: "Hands-on: design a multi-agent research system.",
    scenario: "Design a coordinator + subagent system that writes a sourced report on a broad topic. Explain: how the coordinator decomposes the topic, what exactly goes into each subagent's prompt, how subagents run in parallel, how failures are reported, and how source provenance survives to the final report.",
    rubric: "1.2 each: broad decomposition covering all subtopics (and a coverage check); explicit context passed to subagents because they don't inherit history; parallel Task calls in a single response; structured error propagation with gap annotation; claim-source mappings preserved through synthesis.",
    explanation: "Strong answers cover broad decomposition, explicit context in delegation, parallel Task calls, structured errors with coverage gaps, and structured provenance.",
  },
  {
    id: "t3", kind: "task", domain: "tools_mcp", points: 6,
    presentation: "code",
    starter: '{\n  "name": "get_customer",\n  "description": "",\n  "input_schema": {}\n}\n\n{\n  "name": "process_refund",\n  "description": "",\n  "input_schema": {}\n}',
    prompt: "Hands-on: define tools for a support agent.",
    scenario: "Write tool definitions (name, description, input_schema) for get_customer and process_refund. Then describe the error response format your tools return, and how you guarantee a refund is never processed before the customer is verified.",
    rubric: "1.5: descriptions state purpose, inputs, and when to use each (distinct from each other). 1.5: valid input_schema with required fields and types. 1.5: structured error format (is_error, category, retryable, message; business vs transient). 1.5: programmatic prerequisite gate or hook, not just a prompt instruction.",
    explanation: "Clear, differentiated descriptions, typed schemas, structured errors, and code-level enforcement of the verification prerequisite.",
  },
  {
    id: "t4", kind: "task", domain: "prompting", points: 6,
    presentation: "code",
    starter: '{\n  "type": "object",\n  "properties": {\n    "vendor": {},\n    "due_date": {},\n    "line_items": [],\n    "total": {}\n  }\n}',
    prompt: "Hands-on: reliable invoice extraction.",
    scenario: "Design a JSON schema (as a tool input_schema) for extracting invoices: vendor, invoice number, due date, currency, line items, total, and category. Explain how you prevent fabricated values, handle unexpected categories, and what your retry strategy is when validation fails.",
    rubric: "1.5: valid schema used through tool use/forced tool choice. 1.5: nullable fields for data that may be missing, with an instruction to return null. 1.5: enum with other + detail field. 1.5: validation-retry that sends back the specific error, plus semantic checks (line items sum to total) and no retry when the data is absent.",
    explanation: "Tool-based schema, nullable fields, enum + other, specific error feedback, and semantic validation.",
  },
  {
    id: "t5", kind: "task", domain: "context", points: 6,
    presentation: "architecture",
    starter: "PINNED CASE FACTS\nCustomer ID:\nOrder ID:\nAmount:\n\nHANDOFF\nIssue:\nFindings:\nActions taken:\nRecommended next step:",
    prompt: "Hands-on: context strategy for long support sessions.",
    scenario: "A support agent handles 40+ turn conversations with many tool calls. Customers mention order IDs and amounts early; sometimes they ask for a human. Describe your context management strategy and write an example escalation handoff summary.",
    rubric: "1.5: persistent case-facts block kept outside summarized history. 1.5: trimming verbose tool outputs to relevant fields. 1.5: correct escalation triggers (explicit request honored immediately; not sentiment or self-confidence). 1.5: structured handoff example with customer ID, issue, actions taken, and next step.",
    explanation: "Case facts pinned, tool output trimmed, explicit-request escalation, and a structured handoff summary.",
  },
];

export const QUESTIONS: ExamQuestion[] = [...MCQS, ...TASKS];
export const TOTAL_POINTS = QUESTIONS.reduce((s, q) => s + q.points, 0); // 100
export const PASS_SCORE = 72;
