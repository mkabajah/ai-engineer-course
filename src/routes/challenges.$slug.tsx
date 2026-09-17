import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowUpRight, Bot, Check, CircleCheck, FileCode2, Github, Lightbulb, ScanSearch, Sparkles, Trophy } from "lucide-react";
import { ChallengeCountdown } from "@/components/ChallengeCountdown";
import {
  getChallenge,
  getLeaderboard,
  getMySubmission,
  submitEntry,
  type LeaderboardRow,
  type PublicChallenge,
} from "@/lib/challenge.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/challenges/$slug")({
  component: ChallengePage,
  head: () => ({
    meta: [
      { title: "Challenge #1: First Open-Source Contribution — AI Engineer Accelerator" },
      {
        name: "description",
        content: "Live 45-minute challenge: make one useful open-source change and submit your pull request.",
      },
      { property: "og:title", content: "Challenge #1: First Open-Source Contribution" },
      {
        property: "og:description",
        content: "Live 45-minute challenge: make one useful open-source change and submit your pull request.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Submission = {
  id: string;
  participant_name: string;
  github_username: string;
  link_url: string;
  link_type: string;
  repo_full_name: string | null;
  eval_status: string;
  ai_review: string | null;
  ai_score: number | null;
  ai_confidence: string | null;
  merge_state: string | null;
  instructor_score: number | null;
  instructor_notes: string | null;
  updated_at?: string;
};

const STATE_STYLE: Record<string, string> = {
  not_started: "bg-slate-100 text-slate-600 border-slate-200",
  live: "bg-emerald-100 text-emerald-700 border-emerald-200",
  paused: "bg-amber-100 text-amber-700 border-amber-200",
  finished: "bg-[#DE3D4D]/12 text-[#DE3D4D] border-[#DE3D4D]/25",
};
const STATE_LABEL: Record<string, string> = {
  not_started: "Not started",
  live: "Live",
  paused: "Paused",
  finished: "Finished",
};

const EVAL_LABEL: Record<string, string> = {
  awaiting: "Awaiting review",
  evaluating: "Evaluating",
  evaluated: "Evaluated",
  needs_review: "Needs attention",
};
const EVAL_STYLE: Record<string, string> = {
  awaiting: "bg-slate-100 text-slate-600 border-slate-200",
  evaluating: "bg-sky-100 text-sky-700 border-sky-200",
  evaluated: "bg-emerald-100 text-emerald-700 border-emerald-200",
  needs_review: "bg-amber-100 text-amber-800 border-amber-200",
};

const MOTIVATION_TERMS = [
  "Use everything you learned",
  "AI",
  "MCP",
  "Hooks",
  "Agents",
  "Kiro Specs",
  "RAG",
  "Claude Skills",
  "Test the change",
  "Keep the scope focused",
  "Ship something useful",
];

const PROJECT_GUIDE: Record<string, { bestFor: string; challenge: string; setup: string }> = {
  Sashiko: {
    bestFor: "Embedded, Linux & AI agents",
    challenge: "Review pipeline, provider handling, diagnostics",
    setup: "Moderate — Rust build",
  },
  "MCP Python SDK": {
    bestFor: "AI & backend engineers",
    challenge: "MCP tools, transports, error handling",
    setup: "Good — Python",
  },
  Gradio: {
    bestFor: "AI application engineers",
    challenge: "Components and MCP-facing UI",
    setup: "Moderate — Python plus some frontend work",
  },
  "PlatformIO Core": {
    bestFor: "Embedded engineers",
    challenge: "CLI and project tooling",
    setup: "Good — Python; select tasks needing no board",
  },
  marimo: {
    bestFor: "AI, data & product engineers",
    challenge: "Interactive notebook UI and Python components",
    setup: "Moderate",
  },
  "Open Food Facts app": {
    bestFor: "Product & mobile engineers",
    challenge: "Small, visible app enhancements",
    setup: "Heavy — prepare Flutter beforehand",
  },
  tldraw: {
    bestFor: "Frontend & product engineers",
    challenge: "Canvas UI and shared components",
    setup: "Moderate — prepare the monorepo",
  },
  Grafana: {
    bestFor: "Software & data engineers",
    challenge: "Query editor and dashboard behavior",
    setup: "Heavy — run focused frontend checks",
  },
  Penpot: {
    bestFor: "Product & industrial engineers",
    challenge: "Design canvas interactions",
    setup: "Heavy",
  },
  PostHog: {
    bestFor: "Product & full-stack engineers",
    challenge: "Developer workflow and analytics UI",
    setup: "Heavy",
  },
};

const REVIEW_STAGES = [
  { label: "Validating your GitHub link", detail: "Confirming the pull request or commit is public and readable.", icon: Github },
  { label: "Fetching the change", detail: "Loading repository context and the changed files from GitHub.", icon: ScanSearch },
  { label: "Reading the actual diff", detail: "Looking at what changed—not judging by size or title.", icon: FileCode2 },
  { label: "Evaluating quality fairly", detail: "Checking usefulness, focus, verification, relevance, and clarity.", icon: Bot },
  { label: "Preparing your review", detail: "Calibrating the provisional mark and confidence level.", icon: Sparkles },
];

function ReviewProgress({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 700);
    return () => window.clearInterval(interval);
  }, []);

  const elapsed = Math.max(0, now - startedAt);
  const activeIndex = Math.min(REVIEW_STAGES.length - 1, Math.floor(elapsed / 3200));

  return (
    <div className="ai-review-panel overflow-hidden rounded-md border border-primary/30 bg-card" role="status" aria-live="polite">
      <div className="relative border-b border-rule px-5 py-5 sm:px-6">
        <div className="ai-review-scan" aria-hidden="true" />
        <div className="relative flex items-start gap-4">
          <div className="ai-review-orbit grid h-12 w-12 shrink-0 place-items-center rounded-full border border-primary/30 bg-background text-primary">
            <Bot className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="label-eyebrow text-primary">AI review in progress</p>
            <h3 className="mt-1 text-xl sm:text-2xl">Analyzing your contribution</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              The evaluator is reading the GitHub diff and gathering evidence for a fair provisional mark.
            </p>
          </div>
        </div>
      </div>
      <ol className="grid gap-0 px-5 py-3 sm:px-6">
        {REVIEW_STAGES.map((stage, index) => {
          const Icon = stage.icon;
          const done = index < activeIndex;
          const active = index === activeIndex;
          return (
            <li key={stage.label} className={`ai-review-step flex gap-3 border-b border-rule py-3 last:border-0 ${active ? "is-active" : ""}`}>
              <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border ${done ? "border-emerald-300 bg-emerald-100 text-emerald-700" : active ? "border-primary bg-primary/10 text-primary" : "border-rule bg-background text-muted-foreground"}`}>
                {done ? <CircleCheck className="h-4 w-4" aria-hidden="true" /> : <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
              </span>
              <span className="min-w-0">
                <span className={`block text-sm font-semibold ${index > activeIndex ? "text-muted-foreground" : "text-foreground"}`}>{stage.label}</span>
                {(active || done) && <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{stage.detail}</span>}
              </span>
              {active && <span className="ai-review-dots ml-auto mt-2 shrink-0" aria-hidden="true"><i /><i /><i /></span>}
            </li>
          );
        })}
      </ol>
      <p className="border-t border-rule bg-background/70 px-5 py-3 text-xs leading-relaxed text-muted-foreground sm:px-6">
        Contribution size does not earn points by itself. A focused, useful, well-verified fix can score higher than a large change.
      </p>
    </div>
  );
}

type SortKey = "points" | "name" | "status";

function Leaderboard({ rows, highlightId }: { rows: LeaderboardRow[]; highlightId?: string | null }) {
  const [sort, setSort] = useState<SortKey>("points");
  const [asc, setAsc] = useState(false);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let d = 0;
      if (sort === "points") d = (a.points ?? -1) - (b.points ?? -1);
      else if (sort === "name") d = a.participant_name.localeCompare(b.participant_name);
      else d = a.eval_status.localeCompare(b.eval_status);
      if (d === 0) d = (a.points ?? -1) - (b.points ?? -1);
      return asc ? d : -d;
    });
    return copy;
  }, [rows, sort, asc]);

  function toggle(key: SortKey) {
    if (key === sort) setAsc((v) => !v);
    else {
      setSort(key);
      setAsc(key === "name");
    }
  }

  const arrow = (key: SortKey) => (sort === key ? (asc ? "↑" : "↓") : "");

  return (
    <section className="challenge-reveal rounded-2xl border border-rule bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="label-eyebrow flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" /> Leaderboard
        </h2>
        <span className="text-xs text-muted-foreground">
          {rows.length} participant{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No submissions yet — be the first on the board.</p>
      ) : (
        <div className="-mx-5 mt-4 overflow-x-auto sm:mx-0">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-rule text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2 font-medium">#</th>
                <th className="px-3 py-2 font-medium">
                  <button type="button" onClick={() => toggle("name")} className="hover:text-foreground">
                    Participant {arrow("name")}
                  </button>
                </th>
                <th className="px-3 py-2 font-medium">Project</th>
                <th className="px-3 py-2 font-medium">
                  <button type="button" onClick={() => toggle("status")} className="hover:text-foreground">
                    Status {arrow("status")}
                  </button>
                </th>
                <th className="px-3 py-2 text-right font-medium">
                  <button type="button" onClick={() => toggle("points")} className="hover:text-foreground">
                    Points {arrow("points")}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => (
                <tr
                  key={r.id}
                  className={`border-b border-rule/60 last:border-0 ${
                    r.id === highlightId ? "bg-primary/5" : ""
                  }`}
                >
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{r.participant_name}</div>
                    <div className="text-xs text-muted-foreground">@{r.github_username}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{r.repo_full_name ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${
                        EVAL_STYLE[r.eval_status] ?? "border-slate-200 bg-slate-100 text-slate-600"
                      }`}
                    >
                      {EVAL_LABEL[r.eval_status] ?? r.eval_status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {r.points == null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span className="font-mono text-base font-semibold">
                        {r.points}
                        <span className="text-xs text-muted-foreground">/100</span>
                        {r.is_final && <span className="ml-1 text-[10px] uppercase text-primary">final</span>}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 px-1 text-xs text-muted-foreground">
        AI scores are provisional until your instructor confirms them — confirmed marks are labelled final.
      </p>
    </section>
  );
}

function tokenKey(slug: string) {
  return `challenge-token-${slug}`;
}

function ChallengePage() {
  const { slug } = Route.useParams();
  const [challenge, setChallenge] = useState<PublicChallenge | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const offsetRef = useRef(0); // serverNow - clientNow
  const anchorRef = useRef<{ endAt: number | null; state: string; remaining: number } | null>(null);

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [analysisStartedAt, setAnalysisStartedAt] = useState<number | null>(null);
  const [board, setBoard] = useState<LeaderboardRow[]>([]);

  // load + poll challenge (keeps everyone on the instructor's clock)
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const c = await getChallenge({ data: { slug } });
        if (!alive) return;
        if (c) {
          offsetRef.current = new Date(c.server_now).getTime() - Date.now();
          anchorRef.current = {
            endAt: c.end_at ? new Date(c.end_at).getTime() : null,
            state: c.state,
            remaining: c.remaining_ms,
          };
        }
        setChallenge(c);
        setLoadError(null);
      } catch (e) {
        if (alive) setLoadError((e as Error).message);
      }
    };
    load();
    const iv = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [slug]);

  // leaderboard
  useEffect(() => {
    let alive = true;
    const load = () =>
      getLeaderboard({ data: { slug } })
        .then((rows) => {
          if (alive) setBoard(rows);
        })
        .catch(() => {});
    load();
    const iv = setInterval(load, 8000);
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [slug]);

  // local 1s tick
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(iv);
  }, []);

  // restore own submission
  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem(tokenKey(slug)) : null;
    if (!t) return;
    getMySubmission({ data: { token: t } })
      .then((s) => {
        if (s) {
          setSubmission(s as Submission);
          if (s.eval_status === "evaluating") setAnalysisStartedAt(Date.now());
          setName(s.participant_name);
          setUsername(s.github_username);
          setUrl(s.link_url);
        }
      })
      .catch(() => {});
  }, [slug]);

  // poll own submission while evaluating
  useEffect(() => {
    if (!submission || submission.eval_status !== "evaluating") return;
    const t = localStorage.getItem(tokenKey(slug));
    if (!t) return;
    const iv = setInterval(async () => {
      const s = await getMySubmission({ data: { token: t } }).catch(() => null);
      if (s) setSubmission(s as Submission);
    }, 4000);
    return () => clearInterval(iv);
  }, [submission?.eval_status, slug]);

  const live = useMemo(() => {
    const a = anchorRef.current;
    if (!challenge || !a) return { state: challenge?.state ?? "not_started", remaining: 0 };
    if (a.state === "live" && a.endAt) {
      const now = Date.now() + offsetRef.current;
      const rem = a.endAt - now;
      return { state: rem <= 0 ? "finished" : "live", remaining: Math.max(0, rem) };
    }
    return { state: a.state, remaining: a.remaining };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge, tick]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setAnalysisStartedAt(Date.now());
    try {
      const token = localStorage.getItem(tokenKey(slug));
      const res = await submitEntry({
        data: {
          slug,
          participant_name: name.trim(),
          github_username: username.trim().replace(/^@/, ""),
          link_url: url.trim(),
          token: token ?? null,
        },
      });
      localStorage.setItem(tokenKey(slug), res.token);
      setSubmission(res.submission as Submission);
      toast.success(token ? "Submission updated" : "Submission received");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
      setAnalysisStartedAt(null);
    }
  }

  if (challenge === undefined) {
    return (
      <div className="min-h-screen bg-background px-6 py-20">
        <div className="mx-auto max-w-5xl animate-pulse space-y-6">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-12 w-3/4 rounded bg-muted" />
          <div className="h-64 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (loadError && !challenge) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <h1 className="serif text-3xl">Couldn't load the challenge</h1>
          <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
        </div>
      </div>
    );
  }

  if (challenge === null) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <h1 className="serif text-3xl">Challenge not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">Check the link with your instructor.</p>
        </div>
      </div>
    );
  }

  const state = live.state as PublicChallenge["state"];
  const totalMs = challenge.duration_minutes * 60_000;
  const closed = state === "finished";
  const notOpen = state === "not_started";

  return (
    <div className="challenge-page min-h-screen overflow-hidden bg-background text-foreground">
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <span className="label-eyebrow flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              {state === "live" && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />}
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            AI Engineer Accelerator — Live Challenge
          </span>
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${STATE_STYLE[state]}`}
          >
            <span className={`h-2 w-2 rounded-full ${state === "live" ? "animate-pulse bg-emerald-500" : "bg-current"}`} />
            {STATE_LABEL[state]}
          </span>
        </div>
      </header>

      <div className="motivation-rail border-b border-rule bg-foreground text-background" aria-label="Challenge reminders">
        <div className="motivation-track py-2.5">
          {[...MOTIVATION_TERMS, ...MOTIVATION_TERMS].map((term, index) => (
            <span key={`${term}-${index}`} className="flex shrink-0 items-center gap-3 whitespace-nowrap text-xs font-semibold uppercase tracking-widest">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              {term}
            </span>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="challenge-reveal relative">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Build something useful. Ship it today.
          </div>
          <h1 className="display max-w-4xl text-4xl sm:text-6xl lg:text-7xl">{challenge.title}</h1>
          {challenge.goal && (
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">{challenge.goal}</p>
          )}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* left column */}
          <div className="order-2 space-y-10 lg:order-1">
            {challenge.description && (
              <section>
                <h2 className="label-eyebrow">Instructions</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                  {challenge.description}
                </p>
              </section>
            )}

            <section className="challenge-reveal [animation-delay:120ms]">
              <div className="flex items-center gap-2">
                <Github className="h-5 w-5 text-primary" aria-hidden="true" />
                <h2 className="label-eyebrow">Suggested projects</h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Pick one of these projects, or bring another public open-source project that interests you.
              </p>
              {challenge.repos.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  No suggestions have been published yet — you can still choose any public open-source project.
                </p>
              ) : (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {challenge.repos.map((r) => {
                    const guide = PROJECT_GUIDE[r.name];
                    return (
                    <li key={r.url} className="challenge-project">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex h-full min-h-36 flex-col items-start justify-between gap-4 rounded-md border border-rule bg-card px-4 py-4 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="flex w-full items-start justify-between gap-3">
                          <span className="min-w-0 break-words font-mono text-sm font-semibold">{r.name}</span>
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                        </span>
                        {guide && (
                          <span className="grid w-full gap-2 text-xs leading-relaxed text-muted-foreground">
                            <span><strong className="font-semibold text-foreground">Best for:</strong> {guide.bestFor}</span>
                            <span><strong className="font-semibold text-foreground">Try:</strong> {guide.challenge}</span>
                            <span className="border-t border-rule pt-2"><strong className="font-semibold text-foreground">Setup:</strong> {guide.setup}</span>
                          </span>
                        )}
                      </a>
                    </li>
                    );
                  })}
                </ul>
              )}
              <div className="mt-3 flex gap-3 rounded-md border border-dashed border-primary/40 bg-primary/5 p-4">
                <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold">Something else in mind?</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    You are not limited to this list. Choose any public GitHub repository, make a useful change, then submit its pull request or commit link below.
                  </p>
                </div>
              </div>
            </section>

            {/* submission form */}
            <section id="submit" className="challenge-reveal [animation-delay:220ms]">
              <h2 className="label-eyebrow">{submission ? "Update your submission" : "Submit your work"}</h2>
              <form onSubmit={handleSubmit} className="mt-3 space-y-4 rounded-sm border border-rule bg-card p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="text-muted-foreground">Full name</span>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      minLength={2}
                      maxLength={120}
                      placeholder="Layla Ahmad"
                      className="mt-1 bg-background"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-muted-foreground">GitHub username</span>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      maxLength={39}
                      placeholder="octocat"
                      className="mt-1 bg-background font-mono"
                    />
                  </label>
                </div>
                <label className="block text-sm">
                  <span className="text-muted-foreground">Public pull request or commit URL</span>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    maxLength={400}
                    placeholder="https://github.com/owner/repo/pull/123"
                    className="mt-1 bg-background font-mono text-[13px]"
                  />
                </label>
                <Button
                  type="submit"
                  disabled={busy || closed || notOpen}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {busy
                    ? "Checking your link…"
                    : notOpen
                      ? "Waiting for the start"
                      : closed
                        ? "Submissions closed"
                        : submission
                          ? "Update submission"
                           : "Submit"}
                  {!busy && !closed && !notOpen && <Check className="h-4 w-4" aria-hidden="true" />}
                </Button>
                <p className="text-xs text-muted-foreground">
                  You can keep updating your own submission until the timer ends. Each pull request or commit can
                  only be submitted once.
                </p>
              </form>
            </section>

            {busy && analysisStartedAt !== null && (
              <section className="challenge-reveal" aria-label="AI contribution review">
                <ReviewProgress startedAt={analysisStartedAt} />
              </section>
            )}

            {/* confirmation */}
            {submission && (
              <section>
                <h2 className="label-eyebrow">Your submission</h2>
                <div className="mt-3 space-y-4 rounded-sm border border-rule p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-rule bg-muted px-2.5 py-0.5 text-xs uppercase tracking-wider">
                      {submission.link_type === "pr" ? "Pull request" : "Commit"}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${EVAL_STYLE[submission.eval_status]}`}
                    >
                      {EVAL_LABEL[submission.eval_status] ?? submission.eval_status}
                    </span>
                    {submission.merge_state && (
                      <span className="rounded-full border border-rule px-2.5 py-0.5 text-xs text-muted-foreground">
                        GitHub: {submission.merge_state}
                      </span>
                    )}
                  </div>
                  <a
                    href={submission.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block break-all font-mono text-[13px] underline underline-offset-4"
                  >
                    {submission.link_url}
                  </a>
                  {submission.eval_status === "evaluating" && (
                    <ReviewProgress startedAt={analysisStartedAt ?? new Date(submission.updated_at ?? Date.now()).getTime()} />
                  )}
                  {submission.ai_review && (
                    <div className="challenge-reveal rounded-sm bg-card p-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="label-eyebrow">Provisional review</span>
                        {submission.instructor_score != null ? (
                          <span className="font-mono text-2xl">{submission.instructor_score}/100</span>
                        ) : submission.ai_score != null ? (
                          <span className="font-mono text-2xl">{submission.ai_score}/100</span>
                        ) : (
                          <span className="text-sm text-amber-700">Needs human review</span>
                        )}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/80">{submission.ai_review}</p>
                      {submission.ai_confidence && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Confidence: {submission.ai_confidence}. Provisional only — your instructor's score is final.
                        </p>
                      )}
                      {submission.instructor_notes && (
                        <p className="mt-3 border-t border-rule pt-3 text-sm">
                          <span className="label-eyebrow">Instructor</span>
                          <br />
                          {submission.instructor_notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}

            {closed ? (
              <Leaderboard rows={board} highlightId={submission?.id} />
            ) : (
              <section className="challenge-reveal rounded-2xl border border-dashed border-rule bg-card/50 p-6 text-center">
                <Trophy className="mx-auto h-6 w-6 text-muted-foreground/50" aria-hidden="true" />
                <p className="mt-2 text-sm text-muted-foreground">
                  The leaderboard appears here once the challenge finishes.
                </p>
              </section>
            )}
          </div>

          {/* timer */}
          <aside className="challenge-reveal order-1 [animation-delay:80ms] lg:order-2">
            <div className="lg:sticky lg:top-2">
              <ChallengeCountdown remainingMs={live.remaining} totalMs={totalMs} state={state} />
              <p className="mt-4 text-center text-sm text-muted-foreground">
                {state === "not_started"
                  ? `The clock starts when your instructor begins — ${challenge.duration_minutes} minutes on the board.`
                  : state === "paused"
                    ? "The instructor paused the clock. Hands off the keyboard."
                    : state === "finished"
                      ? "Time is up. Submissions are closed."
                      : "Same deadline for everyone — synced to the instructor's clock."}
              </p>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {challenge.submission_count} submission{challenge.submission_count === 1 ? "" : "s"} so far
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
