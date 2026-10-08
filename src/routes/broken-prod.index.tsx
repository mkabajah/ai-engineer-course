import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Bot,
  CheckCircle2,
  CircleDashed,
  Download,
  GraduationCap,
  ImagePlus,
  KeyRound,
  Lightbulb,
  Loader2,
  Lock,
  LogOut,
  Radio,
  Send,
  Terminal,
  Trophy,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Markdown } from "@/components/obp/Markdown";
import {
  Announcements,
  ObpNav,
  STAGE_META,
  StageTimeline,
  currentStage,
  errMsg,
  fmtClock,
  readCode,
  timeAgo,
  usePoll,
  useServerNow,
  writeCode,
} from "@/components/obp/shared";
import {
  obpBuyHint,
  obpDashboard,
  obpPublicState,
  obpSignIn,
  obpSubmit,
  obpUploadUrl,
  type Challenge,
  type Dashboard,
  type Field,
  type MySubmission,
  type PublicState,
} from "@/lib/obp/obp.functions";

export const Route = createFileRoute("/broken-prod/")({
  head: () => ({
    meta: [
      { title: "Operation: Broken Prod — AI Engineer Accelerator" },
      {
        name: "description",
        content:
          "A 3-hour solo mission: fix production with your agents, pass the exam, build the tooling, ship the feature.",
      },
      { property: "og:title", content: "Operation: Broken Prod" },
      {
        property: "og:description",
        content: "Production is down. You're on call. Fix it with Claude Code and Kiro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BrokenProdPage,
});

function BrokenProdPage() {
  const [state, setState] = useState<PublicState | null>(null);
  // Read the code after mount (not during render) so server and client HTML match
  const [code, setCode] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setCode(readCode());
    setMounted(true);
  }, []);
  const [dash, setDash] = useState<Dashboard | null>(null);
  const now = useServerNow(state?.server_now);

  usePoll(async () => setState(await obpPublicState()), 5000);
  const refreshDash = usePoll(
    async () => {
      if (!code) return setDash(null);
      try {
        setDash(await obpDashboard({ data: { code } }));
      } catch (e) {
        if (/Unknown personal code/.test(errMsg(e))) {
          writeCode(null);
          setCode(null);
          setDash(null);
        }
      }
    },
    5000,
    [code],
  );

  const signOut = () => {
    writeCode(null);
    setCode(null);
    setDash(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ObpNav active="mission" />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        {!state || !mounted || (code && !dash) ? (
          <div className="h-64 animate-pulse rounded-md bg-muted" />
        ) : dash && code ? (
          <Cockpit
            state={state}
            dash={dash}
            code={code}
            now={now}
            onSignOut={signOut}
            refresh={refreshDash}
          />
        ) : (
          <Lobby
            state={state}
            now={now}
            onSignedIn={(c) => {
              writeCode(c);
              setCode(c);
            }}
          />
        )}
      </main>
    </div>
  );
}

/* ─────────────────────────────── signed out ─────────────────────────────── */

function Lobby({
  state,
  now,
  onSignedIn,
}: {
  state: PublicState;
  now: number;
  onSignedIn: (code: string) => void;
}) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const signIn = async () => {
    setBusy(true);
    try {
      const me = await obpSignIn({ data: { code: input.trim().toUpperCase() } });
      toast.success(`Welcome, ${me.name} ${me.emoji}`);
      onSignedIn(me.code);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <section className="grid grid-cols-1 [&>*]:min-w-0 gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-primary-foreground">
              <Radio className="h-3 w-3 animate-pulse" /> SEV-1 · incident open
            </span>
            <span className="label-eyebrow">Challenge #3 · solo · 3 hours</span>
          </div>
          <h1 className="display mt-4 text-5xl sm:text-7xl">
            Production is down.
            <br />
            <span className="text-primary">You're on call.</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Orbit Shop is broken in 15 places. Bring your agents: fix production while hidden tests
            verify every snapshot live, pass a certification-style exam, forge the hooks, skills and
            agents that stop it happening again, then ship a feature end to end. Everything is
            scored automatically or by the AI judge.
          </p>
        </div>
        <div className="rounded-md border border-rule bg-card p-5">
          <div className="label-eyebrow">On call right now</div>
          <div className="mt-1 font-serif text-6xl tabular-nums">{state.registered_count}</div>
          <div className="text-xs text-muted-foreground">engineers registered</div>
          {state.event_code_now && (
            <div className="mt-4 border-t border-rule pt-4">
              <div className="label-eyebrow">Event code</div>
              <div className="mt-1 font-mono text-2xl tracking-widest">{state.event_code_now}</div>
            </div>
          )}
        </div>
      </section>

      <Announcements items={state.announcements} />
      <StageTimeline stages={state.stages} current={state.current_stage} now={now} />

      <section className="grid grid-cols-1 [&>*]:min-w-0 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-md border border-rule bg-card p-6">
          <div className="label-eyebrow text-primary">Get on the incident</div>
          <h2 className="serif mt-1 text-3xl">Three steps, then sign in</h2>
          <ol className="mt-5 space-y-5 text-sm">
            <li className="flex gap-4">
              <Step n={1} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">Download the mission pack</div>
                <p className="mt-1 text-muted-foreground">
                  Orbit Shop's code, its tests and the reporter agent that sends your progress here.
                </p>
                {state.download_url ? (
                  <Button
                    asChild
                    className="mt-3 h-auto max-w-full whitespace-normal py-2 text-left"
                  >
                    <a href={state.download_url} download>
                      <Download /> Download orbit-shop-mission-pack.zip
                    </a>
                  </Button>
                ) : (
                  <p className="mt-2 rounded-sm border border-dashed border-rule px-3 py-2 text-xs text-muted-foreground">
                    Available at kickoff.
                  </p>
                )}
              </div>
            </li>
            <li className="flex gap-4">
              <Step n={2} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">
                  Fill in <code className="font-mono text-[0.9em]">orbit.config.json</code>
                </div>
                <Terminal_
                  lines={[
                    `{ "name": "Your Name", "email": "you@example.com",`,
                    `  "eventCode": "${state.event_code_now ?? "<on the projector>"}", "apiUrl": "…keep as is…" }`,
                  ]}
                />
              </div>
            </li>
            <li className="flex gap-4">
              <Step n={3} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">Register from your terminal</div>
                <Terminal_
                  lines={["npm install", "npm run register   # prints your personal code"]}
                />
                {!state.registration_open && (
                  <p className="mt-2 text-xs text-primary">
                    Registration is closed. Ask the organizer.
                  </p>
                )}
              </div>
            </li>
          </ol>
        </div>
        <div className="flex flex-col rounded-md border border-rule bg-card p-6">
          <div className="label-eyebrow">Already registered?</div>
          <h2 className="serif mt-1 text-3xl">Sign in with your personal code</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The 6-character code <span className="font-mono">npm run register</span> printed. Lost
            it? Run <span className="font-mono">npm run status</span>.
          </p>
          <div className="mt-5 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && input.trim().length >= 4 && signIn()}
              placeholder="e.g. K7Q2MX"
              className="font-mono text-lg tracking-[0.3em]"
              maxLength={12}
              autoComplete="off"
            />
            <Button onClick={signIn} disabled={busy || input.trim().length < 4}>
              {busy ? <Loader2 className="animate-spin" /> : <KeyRound />} Enter
            </Button>
          </div>
          <div className="mt-auto flex flex-wrap gap-2 pt-6">
            <Button asChild variant="outline" size="sm">
              <Link to="/broken-prod/leaderboard">
                <Trophy /> Leaderboard
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/40 font-mono text-xs text-primary">
      {n}
    </span>
  );
}

function Terminal_({ lines }: { lines: string[] }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-md bg-[#0F1B30] px-3 py-2.5 font-mono text-[12px] leading-relaxed text-[#E8EDF7]">
      {lines.map((l, i) => (
        <div key={i}>
          <span className="select-none text-[#5C6F96]">
            {l.startsWith("{") || l.startsWith(" ") ? "" : "$ "}
          </span>
          {l}
        </div>
      ))}
    </pre>
  );
}

/* ─────────────────────────────── signed in ─────────────────────────────── */

function Cockpit({
  state,
  dash,
  code,
  now,
  onSignOut,
  refresh,
}: {
  state: PublicState;
  dash: Dashboard;
  code: string;
  now: number;
  onSignOut: () => void;
  refresh: () => void;
}) {
  const stage = currentStage(state.stages, state.current_stage);
  const left =
    stage?.status === "open" && stage.ends_at ? new Date(stage.ends_at).getTime() - now : null;
  const subsByChallenge = useMemo(() => {
    const m = new Map<string, MySubmission>();
    for (const s of dash.submissions) if (!m.has(s.challenge_id)) m.set(s.challenge_id, s);
    return m;
  }, [dash.submissions]);
  const stageStatus = new Map(state.stages.map((s) => [s.id, s.status]));
  const openChallenges = state.challenges.filter((c) => stageStatus.get(c.stage_id) === "open");
  const pastChallenges = state.challenges.filter(
    (c) => stageStatus.get(c.stage_id) === "closed" && subsByChallenge.has(c.id),
  );
  const testStage = state.current_stage === 4 ? 1 : state.current_stage;
  const tests = dash.auto_scores.find((a) => a.stage_id === testStage) ?? null;
  const twist = state.announcements.find((a) => a.kind === "twist");

  return (
    <>
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-rule bg-card px-5 py-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full text-2xl"
            style={{ background: `${dash.me.color}22` }}
          >
            {dash.me.emoji}
          </span>
          <div>
            <div className="text-lg font-semibold leading-tight">{dash.me.name}</div>
            <div className="font-mono text-[11px] text-muted-foreground">code {dash.me.code}</div>
          </div>
          {dash.badges.length > 0 && (
            <div
              className="ml-2 flex gap-1 text-lg"
              title={dash.badges.map((b) => b.title).join(", ")}
            >
              {dash.badges.map((b, i) => (
                <span key={i}>{b.emoji}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-6">
          <Stat
            label="Score"
            value={state.frozen || dash.score === null ? "🧊" : String(dash.score)}
          />
          <Stat label="Rank" value={state.frozen || !dash.rank ? "—" : `#${dash.rank}`} />
          {left !== null && (
            <Stat
              label={stage?.title ?? "Stage"}
              value={left > 0 ? fmtClock(left) : "0:00"}
              urgent={left < 5 * 60_000}
            />
          )}
          <Button variant="ghost" size="sm" onClick={onSignOut} title="Sign out">
            <LogOut />
          </Button>
        </div>
      </section>

      {state.frozen && (
        <div className="rounded-md border border-sky-300/60 bg-sky-50 px-4 py-3 text-sm text-sky-950">
          🧊 <b>The leaderboard is frozen.</b> Scores still count. Keep shipping: the final reveal
          is at the end.
        </div>
      )}
      <Announcements
        items={
          twist
            ? [twist, ...state.announcements.filter((a) => a.id !== twist.id)]
            : state.announcements
        }
      />
      <StageTimeline stages={state.stages} current={state.current_stage} now={now} />

      {state.current_stage === 0 && (
        <div className="rounded-md border border-dashed border-rule p-8 text-center">
          <CircleDashed className="mx-auto h-8 w-8 animate-spin text-muted-foreground [animation-duration:4s]" />
          <div className="serif mt-3 text-3xl">You're registered. Stand by.</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Open the mission pack in Claude Code or Kiro and read the README while you wait. The
            clock starts when the host opens Stage 1.
          </p>
        </div>
      )}

      {stage && stage.status === "open" && (
        <section>
          <div className="label-eyebrow text-primary">
            {STAGE_META[stage.id]?.tag ?? "Stage"} · live
          </div>
          <h2 className="serif mt-1 text-4xl">{stage.title}</h2>
          {stage.subtitle && <p className="mt-1 text-sm text-muted-foreground">{stage.subtitle}</p>}
        </section>
      )}

      {(testStage === 1 || testStage === 3) && stage?.status === "open" && (
        <HiddenTests tests={tests} stageId={testStage} now={now} />
      )}

      {state.current_stage === 1 && state.tickets.length > 0 && (
        <SupportInbox tickets={state.tickets} now={now} />
      )}

      {state.current_stage === 4 && (
        <Link
          to="/broken-prod/exam"
          className="group flex items-center justify-between gap-4 rounded-md border border-primary bg-primary/[0.06] p-5 transition-colors hover:bg-primary/10"
        >
          <div className="flex items-center gap-4">
            <GraduationCap className="h-8 w-8 text-primary" />
            <div>
              <div className="text-lg font-semibold">
                Certification exam: {state.exam_open ? "open now" : "opens soon"}
              </div>
              <div className="text-sm text-muted-foreground">
                {state.exam_minutes} minutes · single, multiple, order and match questions · pass at
                720/1000 · no AI tools
              </div>
            </div>
          </div>
          <ArrowUpRight className="h-5 w-5 text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      )}

      {openChallenges.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <h3 className="serif text-2xl">Challenges</h3>
            <span className="text-xs text-muted-foreground">
              AI-judged cards are scored the moment you submit
            </span>
          </div>
          <div className="grid grid-cols-1 [&>*]:min-w-0 gap-4 lg:grid-cols-2">
            {openChallenges.map((c) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                submission={subsByChallenge.get(c.id) ?? null}
                code={code}
                open
                onDone={refresh}
              />
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 [&>*]:min-w-0 gap-5 lg:grid-cols-[1.3fr_1fr]">
        <ReportsFeed dash={dash} now={now} />
        <HintShop dash={dash} code={code} state={state} onBought={refresh} />
      </section>

      {pastChallenges.length > 0 && (
        <section className="space-y-4">
          <h3 className="serif text-2xl">Earlier results</h3>
          <div className="grid grid-cols-1 [&>*]:min-w-0 gap-4 lg:grid-cols-2">
            {pastChallenges.map((c) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                submission={subsByChallenge.get(c.id) ?? null}
                code={code}
                open={false}
                onDone={refresh}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Stat({ label, value, urgent }: { label: string; value: string; urgent?: boolean }) {
  return (
    <div className="text-right">
      <div
        className={`font-mono text-2xl font-semibold tabular-nums ${urgent ? "text-primary" : ""}`}
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function HiddenTests({
  tests,
  stageId,
  now,
}: {
  tests: Dashboard["auto_scores"][number] | null;
  stageId: number;
  now: number;
}) {
  const rows = tests?.rows ?? [];
  const pass = rows.filter((r) => r.result === "PASS").length;
  return (
    <section className="rounded-md border border-rule bg-card p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="label-eyebrow">Hidden tests · verified from your last snapshot</div>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="font-serif text-5xl tabular-nums">{tests?.total ?? 0}</span>
            <span className="text-sm text-muted-foreground">
              points · {pass}/{rows.length || "?"} passing
            </span>
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          {tests ? (
            <>
              Verified {timeAgo(tests.scored_at, now)}
              {tests.commit_sha && <span className="font-mono"> · {tests.commit_sha}</span>}
            </>
          ) : (
            <>
              No verified snapshot yet. Fix something, then run{" "}
              <span className="font-mono">npm run report</span>.
            </>
          )}
        </div>
      </div>
      {rows.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {rows.map((r) => (
            <span
              key={r.id}
              title={
                r.result === "LOCKED"
                  ? `${r.id}: fixed, but locked until you file a bug report (npm run bug)`
                  : `${r.id}: ${r.result}${r.earned ? ` (${r.earned > 0 ? "+" : ""}${r.earned})` : ""}`
              }
              className={`inline-flex min-w-14 items-center justify-center gap-1 rounded-sm px-2 py-1 font-mono text-[11px] ${
                r.result === "LOCKED"
                  ? "bg-sky-100 text-sky-900"
                  : r.earned < 0
                    ? "bg-primary/10 text-primary"
                    : r.result === "PASS"
                      ? "bg-emerald-100 text-emerald-800"
                      : r.result === "ERROR"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-muted text-muted-foreground"
              }`}
            >
              {r.result === "LOCKED" ? (
                <Lock className="h-3 w-3" />
              ) : r.result === "PASS" ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3 opacity-60" />
              )}
              {r.id}
            </span>
          ))}
        </div>
      )}
      <p className="mt-3 text-[11px] text-muted-foreground">
        {stageId === 1
          ? "Test IDs only: bug names stay secret. 🔒 = fixed but locked until you file a bug report (npm run bug). Red herrings and traps can cost points."
          : "API contract + plot-twist acceptance tests."}{" "}
        🩸 First to pass a nasty test draws First Blood.
      </p>
    </section>
  );
}

function SupportInbox({ tickets, now }: { tickets: PublicState["tickets"]; now: number }) {
  const [open, setOpen] = useState<string | null>(null);
  const fresh = (t: PublicState["tickets"][number]) =>
    now - new Date(t.released_at).getTime() < 5 * 60_000;
  return (
    <section className="rounded-md border border-rule bg-card p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="label-eyebrow">📮 Support inbox</div>
          <p className="mt-1 text-xs text-muted-foreground">
            New tickets arrive during the stage. Not every ticket is accurate, and not every bug has
            a ticket. Your agent can't see this page: you decide what to give it.
          </p>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{tickets.length} tickets</span>
      </div>
      <ul className="mt-4 divide-y divide-rule rounded-sm border border-rule">
        {tickets.map((t) => {
          // a late ticket opens itself; the first batch at the stage start stays collapsed
          const isOpen = open === t.id || (fresh(t) && tickets.filter(fresh).length <= 3);
          return (
            <li key={t.id} className={fresh(t) ? "bg-primary/[0.04]" : ""}>
              <button
                onClick={() => setOpen(open === t.id ? null : t.id)}
                className="flex w-full items-baseline gap-3 px-3 py-2.5 text-left text-sm"
              >
                <span className="w-12 shrink-0 font-mono text-xs text-muted-foreground">
                  #{t.id}
                </span>
                <span className="flex-1 font-medium">
                  {fresh(t) && (
                    <span className="mr-2 rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      NEW
                    </span>
                  )}
                  {t.title}
                </span>
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                  {t.from}
                </span>
                <span className="w-16 shrink-0 text-right text-[11px] text-muted-foreground">
                  {timeAgo(t.released_at, now)}
                </span>
              </button>
              {isOpen && (
                <div className="px-3 pb-3 pl-[4.75rem] text-sm text-muted-foreground">
                  <Markdown text={t.body_md} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ReportsFeed({ dash, now }: { dash: Dashboard; now: number }) {
  return (
    <div className="rounded-md border border-rule bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="serif text-2xl">Your reporter</h3>
        <Terminal className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Hooks report automatically when your agent stops. Manual:{" "}
        <span className="font-mono">npm run report</span> · bug note:{" "}
        <span className="font-mono">npm run bug</span>
      </p>
      {dash.reports.length === 0 ? (
        <p className="mt-5 rounded-sm border border-dashed border-rule p-4 text-center text-sm text-muted-foreground">
          Nothing reported yet.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-rule">
          {dash.reports.slice(0, 10).map((r, i) => (
            <li key={i} className="flex items-start gap-3 py-2.5 text-sm">
              <span className="mt-0.5 text-base">
                {r.kind === "bug"
                  ? "🐛"
                  : r.status === "verified"
                    ? "✅"
                    : r.status === "error"
                      ? "⚠️"
                      : r.status === "superseded"
                        ? "⏭️"
                        : "⏳"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate">
                  {r.kind === "bug"
                    ? r.note?.title || "Bug report"
                    : r.status === "verified"
                      ? r.verified_stage
                        ? `Snapshot verified: ${r.verified_total} pts (${r.verified_stage === 3 ? "Ship It" : "Bug Bounty"} tests)`
                        : "Snapshot stored for the AI review"
                      : r.status === "error"
                        ? r.verify_error
                        : r.status === "superseded"
                          ? "Replaced by a newer snapshot"
                          : "Waiting for the hidden tests…"}
                </div>
                {r.local_summary && r.kind !== "bug" && (
                  <div className="font-mono text-[11px] text-muted-foreground">
                    local: {r.local_summary.pass ?? 0} pass / {r.local_summary.fail ?? 0} fail
                    {r.local_summary.tool ? ` · ${r.local_summary.tool}` : ""}
                  </div>
                )}
              </div>
              <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                {timeAgo(r.created_at, now)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function HintShop({
  dash,
  code,
  state,
  onBought,
}: {
  dash: Dashboard;
  code: string;
  state: PublicState;
  onBought: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const status = new Map(state.stages.map((s) => [s.id, s.status]));
  const hints = dash.hints.filter((h) => status.get(h.stage_id) !== "locked");
  const buy = async (id: string, cost: number) => {
    if (!window.confirm(`Buy this hint for ${cost} points? It can't be undone.`)) return;
    setBusy(id);
    try {
      await obpBuyHint({ data: { code, hint: id } });
      onBought();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="rounded-md border border-rule bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="serif text-2xl">Hint shop</h3>
        <Lightbulb className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Cheaper than losing 20 minutes. The cost comes off your score.
      </p>
      {hints.length === 0 ? (
        <p className="mt-5 rounded-sm border border-dashed border-rule p-4 text-center text-sm text-muted-foreground">
          Hints unlock with their stage.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {hints.map((h) => (
            <li key={h.id} className="rounded-sm border border-rule bg-background p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{h.title}</span>
                {h.bought ? (
                  <span className="font-mono text-[11px] text-muted-foreground">
                    bought · −{h.cost}
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy === h.id}
                    onClick={() => buy(h.id, h.cost)}
                  >
                    {busy === h.id ? <Loader2 className="animate-spin" /> : null}−{h.cost} pts
                  </Button>
                )}
              </div>
              {h.bought && h.body && (
                <Markdown text={h.body} className="mt-2 text-muted-foreground" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ─────────────────────────────── challenge card ─────────────────────────────── */

const STATUS_STYLE: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-800",
  partial: "bg-sky-100 text-sky-800",
  rejected: "bg-muted text-muted-foreground",
  pending: "bg-amber-100 text-amber-900",
};

function ChallengeCard({
  challenge,
  submission,
  code,
  open,
  onDone,
}: {
  challenge: Challenge;
  submission: MySubmission | null;
  code: string;
  open: boolean;
  onDone: () => void;
}) {
  const canSubmit =
    open &&
    challenge.kind !== "auto" &&
    (!submission || submission.status === "rejected" || challenge.repeatable);
  const runs = submission?.breakdown?.runs ?? [];
  const breakdown = runs.find((r) => r.breakdown?.length)?.breakdown ?? [];
  return (
    <article className="flex flex-col rounded-md border border-rule bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {challenge.id} ·{" "}
            {challenge.kind === "auto"
              ? challenge.points_max > 0
                ? "automatic"
                : "read this first"
              : challenge.ai_judged
                ? "AI-judged"
                : "host-reviewed"}
          </div>
          <h4 className="mt-1 text-lg font-semibold leading-snug">{challenge.title}</h4>
        </div>
        <span className="shrink-0 rounded-full border border-rule px-2.5 py-1 font-mono text-xs">
          {challenge.points_max > 0 ? `${challenge.points_max} pts` : "📌 brief"}
        </span>
      </div>
      <Markdown text={challenge.description_md} className="mt-3 text-sm text-muted-foreground" />

      {submission && (
        <div className="mt-4 rounded-sm border border-rule bg-background p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[submission.status] ?? ""}`}
            >
              {submission.status === "pending" ? "being reviewed" : submission.status}
            </span>
            {submission.status !== "pending" && (
              <span className="font-mono text-sm font-semibold">
                {submission.points_awarded}/{challenge.points_max}
              </span>
            )}
          </div>
          {submission.reviewer_note && (
            <p className="mt-2 text-muted-foreground">{submission.reviewer_note}</p>
          )}
          {breakdown.length > 0 && (
            <ul className="mt-2 space-y-1 text-[12px] text-muted-foreground">
              {breakdown.map((b, i) => (
                <li key={i} className="flex gap-2">
                  <span className="shrink-0 font-mono tabular-nums">
                    {b.points}/{b.max}
                  </span>
                  <span>
                    <b className="font-medium text-foreground">{b.criterion}</b> {b.why}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {canSubmit && (
        <SubmitForm challenge={challenge} code={code} onDone={onDone} retry={Boolean(submission)} />
      )}
      {challenge.kind === "auto" && !submission && challenge.points_max > 0 && (
        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Bot className="h-3.5 w-3.5" /> Nothing to submit: the AI reviewer reads your last
          snapshot.
        </p>
      )}
    </article>
  );
}

function SubmitForm({
  challenge,
  code,
  onDone,
  retry,
}: {
  challenge: Challenge;
  code: string;
  onDone: () => void;
  retry: boolean;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [images, setImages] = useState<Record<string, { path: string; preview: string }[]>>({});
  const [uploading, setUploading] = useState(false);
  const [phase, setPhase] = useState<"idle" | "judging">("idle");
  const [expanded, setExpanded] = useState(false);

  const upload = async (f: Field, files: FileList | null) => {
    if (!files?.length) return;
    const max = f.max ?? 4;
    const current = images[f.key] ?? [];
    const list = Array.from(files).slice(0, Math.max(0, max - current.length));
    setUploading(true);
    try {
      const added: { path: string; preview: string }[] = [];
      for (const file of list) {
        if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name} is larger than 5 MB`);
        const type = file.type as "image/png" | "image/jpeg" | "image/gif" | "image/webp";
        if (!["image/png", "image/jpeg", "image/gif", "image/webp"].includes(type))
          throw new Error(`${file.name}: use PNG, JPG, GIF or WebP`);
        const signed = await obpUploadUrl({
          data: {
            code,
            challenge: challenge.id,
            filename: file.name,
            contentType: type,
            size: file.size,
          },
        });
        const { error } = await supabase.storage
          .from(signed.bucket)
          .uploadToSignedUrl(signed.path, signed.token, file, { contentType: type });
        if (error) throw new Error(error.message);
        added.push({ path: signed.path, preview: URL.createObjectURL(file) });
      }
      setImages((m) => ({ ...m, [f.key]: [...current, ...added] }));
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    for (const f of challenge.fields) {
      const v =
        f.type === "image" ? (images[f.key] ?? []).length : (values[f.key] ?? "").trim().length;
      if (f.required && !v) return toast.error(`"${f.label}" is required`);
    }
    const payload: Record<string, string | string[]> = {};
    for (const f of challenge.fields) {
      if (f.type === "image") payload[f.key] = (images[f.key] ?? []).map((x) => x.path);
      else if (values[f.key]?.trim()) payload[f.key] = values[f.key].trim();
    }
    setPhase("judging");
    try {
      const r = await obpSubmit({ data: { code, challenge: challenge.id, payload } });
      if (r.judged) {
        if (r.injection_attempt)
          toast.error("🚨 The judge detected an injection attempt: 0 points.");
        else toast.success(`🤖 ${r.score}/${r.max}: ${r.feedback}`, { duration: 9000 });
      } else toast(r.message);
      onDone();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setPhase("idle");
    }
  };

  if (!expanded)
    return (
      <Button
        className="mt-4 self-start"
        variant={retry ? "outline" : "default"}
        onClick={() => setExpanded(true)}
      >
        <Send /> {retry ? "Try again" : "Submit"}
      </Button>
    );

  return (
    <div className="mt-4 space-y-3 border-t border-rule pt-4">
      {challenge.fields.map((f) => (
        <label key={f.key} className="block text-sm">
          <span className="mb-1 block text-xs font-medium">
            {f.label}
            {f.required && <span className="text-primary"> *</span>}
          </span>
          {f.type === "textarea" ? (
            <Textarea
              rows={6}
              className="font-mono text-[12.5px]"
              value={values[f.key] ?? ""}
              placeholder={f.placeholder}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            />
          ) : f.type === "image" ? (
            <div>
              <div className="flex flex-wrap gap-2">
                {(images[f.key] ?? []).map((img) => (
                  <img
                    key={img.path}
                    src={img.preview}
                    alt=""
                    className="h-20 w-28 rounded-sm border border-rule object-cover"
                  />
                ))}
                <span className="relative flex h-20 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-rule text-[11px] text-muted-foreground hover:border-primary hover:text-primary">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="h-4 w-4" />
                  )}
                  add image
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    multiple
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={(e) => {
                      void upload(f, e.target.files);
                      e.target.value = "";
                    }}
                  />
                </span>
              </div>
            </div>
          ) : (
            <Input
              type={f.type === "url" ? "url" : "text"}
              value={values[f.key] ?? ""}
              placeholder={f.placeholder ?? (f.type === "url" ? "https://…" : undefined)}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            />
          )}
        </label>
      ))}
      <div className="flex items-center gap-3">
        <Button onClick={submit} disabled={phase === "judging" || uploading}>
          {phase === "judging" ? <Loader2 className="animate-spin" /> : <Send />}
          {phase === "judging"
            ? challenge.ai_judged
              ? "AI judge reviewing (3 runs)…"
              : "Submitting…"
            : "Submit for judging"}
        </Button>
        <Button variant="ghost" onClick={() => setExpanded(false)} disabled={phase === "judging"}>
          Cancel
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Everything you submit is treated as data. Trying to instruct the judge scores 0.
      </p>
    </div>
  );
}
