import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ChevronLeft, ChevronRight, Flag, Pause, Sparkles, Trophy, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getChallenge, type PublicChallenge } from "@/lib/challenge.functions";
import {
  getExamQuestions,
  getMyAttempt,
  saveAnswers,
  startAttempt,
  submitAttempt,
  type AttemptView,
  type PublicQuestion,
} from "@/lib/exam.functions";

export const Route = createFileRoute("/exams/$slug")({
  head: () => ({
    meta: [
      { title: "Claude Code Architect Exam Simulation — Hasoub AI Accelerator" },
      { name: "description", content: "A 90-minute, 75-question interactive simulation of the Claude Code architect certification exam." },
      { property: "og:title", content: "Claude Code Architect Exam Simulation" },
      { property: "og:description", content: "75 questions, 90 minutes, five domains. Can you pass?" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ExamPage,
});

type Answers = Record<string, number | string>;

const DOMAIN_INFO = [
  ["Agentic architecture & orchestration", "Agent loops, subagents, escalation, error propagation"],
  ["Tool design & MCP integration", "Tool descriptions, tool_choice, MCP scopes, structured errors"],
  ["Claude Code configuration & workflows", "CLAUDE.md, rules, skills, commands, hooks, plan mode, CI"],
  ["Prompt engineering & structured output", "Criteria, few-shot, schemas, validation retries, batches"],
  ["Context management & reliability", "Case facts, lost-in-the-middle, compaction, handoffs"],
];

function fmt(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h > 0 ? `${h}:` : ""}${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function ExamPage() {
  const { slug } = Route.useParams();
  const tokenKey = `exam-token-${slug}`;
  const [exam, setExam] = useState<PublicChallenge | null>(null);
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [token, setToken] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<AttemptView | null>(null);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [flags, setFlags] = useState<Set<string>>(new Set());
  const [idx, setIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const loadedAnswers = useRef(false);
  const autoSubmitted = useRef(false);

  useEffect(() => {
    setToken(localStorage.getItem(tokenKey));
    try {
      setFlags(new Set(JSON.parse(localStorage.getItem(`${tokenKey}-flags`) ?? "[]")));
    } catch {
      /* ignore */
    }
  }, [tokenKey]);

  const refreshExam = useCallback(async () => {
    try {
      const c = await getChallenge({ data: { slug } });
      if (c) {
        setExam(c);
        setOffset(new Date(c.server_now).getTime() - Date.now());
      }
    } catch (e) {
      console.error(e);
    }
  }, [slug]);

  useEffect(() => {
    refreshExam();
    const t = setInterval(refreshExam, 5000);
    const tick = setInterval(() => setNow(Date.now()), 250);
    return () => {
      clearInterval(t);
      clearInterval(tick);
    };
  }, [refreshExam]);

  const refreshAttempt = useCallback(async () => {
    if (!token) return;
    try {
      const a = await getMyAttempt({ data: { slug, token } });
      if (!a) {
        localStorage.removeItem(tokenKey);
        setToken(null);
        return;
      }
      setAttempt(a);
      if (!loadedAnswers.current) {
        setAnswers(a.answers ?? {});
        loadedAnswers.current = true;
      }
    } catch (e) {
      console.error(e);
    }
  }, [slug, token, tokenKey]);

  const state = exam?.state ?? "not_started";

  useEffect(() => {
    refreshAttempt();
  }, [refreshAttempt, state]);

  // Poll while grading or waiting for review to unlock
  useEffect(() => {
    if (!attempt || attempt.status === "in_progress") return;
    if (attempt.review) return;
    const t = setInterval(refreshAttempt, 5000);
    return () => clearInterval(t);
  }, [attempt, refreshAttempt]);

  useEffect(() => {
    if (!token || state === "not_started" || questions.length) return;
    getExamQuestions({ data: { slug, token } }).then(setQuestions).catch(console.error);
  }, [token, state, slug, questions.length]);

  const remaining = useMemo(() => {
    if (!exam) return 0;
    if (state === "live" && exam.end_at) return new Date(exam.end_at).getTime() - (now + offset);
    return exam.remaining_ms;
  }, [exam, state, now, offset]);

  const inProgress = attempt?.status === "in_progress";
  const canAnswer = inProgress && state === "live" && remaining > 0;

  // Debounced autosave
  useEffect(() => {
    if (!token || !loadedAnswers.current || !canAnswer) return;
    setSaveState("saving");
    const t = setTimeout(() => {
      saveAnswers({ data: { slug, token, answers } })
        .then(() => setSaveState("saved"))
        .catch(() => setSaveState("idle"));
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  const doSubmit = useCallback(async () => {
    if (!token) return;
    setSubmitting(true);
    setConfirmOpen(false);
    try {
      await submitAttempt({ data: { slug, token, answers } });
      await refreshAttempt();
      toast.success("Exam submitted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }, [token, slug, answers, refreshAttempt]);

  // Auto-submit at zero
  useEffect(() => {
    if (inProgress && state === "live" && exam?.end_at && remaining <= 0 && !autoSubmitted.current) {
      autoSubmitted.current = true;
      doSubmit();
    }
  }, [remaining, inProgress, state, exam, doSubmit]);

  const toggleFlag = (id: string) => {
    setFlags((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      localStorage.setItem(`${tokenKey}-flags`, JSON.stringify([...n]));
      return n;
    });
  };

  // Keyboard: 1-4 / A-D select, arrows navigate
  useEffect(() => {
    if (!canAnswer || !questions.length) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;
      const q = questions[idx];
      if (e.key === "ArrowRight") setIdx((i) => Math.min(questions.length - 1, i + 1));
      else if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
      else if (q?.kind === "single") {
        const map: Record<string, number> = { "1": 0, "2": 1, "3": 2, "4": 3, a: 0, b: 1, c: 2, d: 3 };
        const v = map[e.key.toLowerCase()];
        if (v !== undefined && q.choices && v < q.choices.length) setAnswers((a) => ({ ...a, [q.id]: v }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canAnswer, questions, idx]);

  const answeredCount = questions.filter((q) => {
    const a = answers[q.id];
    return typeof a === "number" || (typeof a === "string" && a.trim().length > 0);
  }).length;

  const urgency = remaining < 5 * 60_000 ? "critical" : remaining < 15 * 60_000 ? "urgent" : "calm";
  const timerColor =
    state !== "live" ? "text-muted-foreground" : urgency === "critical" ? "text-destructive" : urgency === "urgent" ? "text-[color:var(--timer-urgent)]" : "text-foreground";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-rule bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <div className="label-eyebrow text-[10px] text-primary">Challenge #2</div>
            <div className="truncate text-sm font-semibold sm:text-base">Claude Code Architect Exam</div>
          </div>
          {token && questions.length > 0 && inProgress && (
            <div className="hidden flex-1 px-6 md:block">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
              </div>
              <div className="mt-1 text-center text-[11px] text-muted-foreground">
                {answeredCount}/{questions.length} answered · {saveState === "saving" ? "Saving…" : saveState === "saved" ? "All changes saved" : " "}
              </div>
            </div>
          )}
          <div className={`text-right font-mono tabular-nums ${timerColor} ${urgency === "critical" && state === "live" ? "animate-pulse" : ""}`}>
            <div className="text-2xl font-bold sm:text-3xl">{fmt(remaining)}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {state === "live" ? "remaining" : state === "paused" ? "paused" : state === "finished" ? "finished" : "not started"}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {!token ? (
          <Register slug={slug} state={state} onStarted={(t) => { localStorage.setItem(tokenKey, t); loadedAnswers.current = false; setToken(t); }} />
        ) : !attempt ? (
          <p className="text-sm text-muted-foreground">Loading your attempt…</p>
        ) : !inProgress || submitting ? (
          <Results attempt={attempt} submitting={submitting} finished={state === "finished"} />
        ) : state === "not_started" ? (
          <Waiting name={attempt.participant_name} />
        ) : state === "finished" ? (
          <p className="text-sm text-muted-foreground">Time is up. Grading your exam…</p>
        ) : questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading questions…</p>
        ) : (
          <div className="relative grid gap-6 lg:grid-cols-[1fr_280px]">
            {state === "paused" && (
              <div className="absolute inset-0 z-20 flex items-start justify-center rounded-md bg-background/85 pt-24 backdrop-blur-sm">
                <div className="text-center">
                  <Pause className="mx-auto h-10 w-10 text-[color:var(--timer-paused)]" />
                  <div className="mt-3 text-2xl font-semibold">Exam paused by your instructor</div>
                  <p className="mt-1 text-sm text-muted-foreground">The timer is stopped. Your answers are saved.</p>
                </div>
              </div>
            )}
            <QuestionCard
              key={questions[idx].id}
              q={questions[idx]}
              index={idx}
              total={questions.length}
              value={answers[questions[idx].id]}
              flagged={flags.has(questions[idx].id)}
              onFlag={() => toggleFlag(questions[idx].id)}
              onChange={(v) => setAnswers((a) => ({ ...a, [questions[idx].id]: v }))}
              onPrev={() => setIdx((i) => Math.max(0, i - 1))}
              onNext={() => setIdx((i) => Math.min(questions.length - 1, i + 1))}
              disabled={!canAnswer}
            />
            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-md border border-rule bg-card p-4">
                <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Navigator</span>
                  <span>{answeredCount}/{questions.length}</span>
                </div>
                <div className="grid grid-cols-10 gap-1 lg:grid-cols-8">
                  {questions.map((q, i) => {
                    const a = answers[q.id];
                    const done = typeof a === "number" || (typeof a === "string" && a.trim().length > 0);
                    return (
                      <button
                        key={q.id}
                        onClick={() => setIdx(i)}
                        aria-label={`Question ${i + 1}${done ? ", answered" : ""}${flags.has(q.id) ? ", flagged" : ""}`}
                        className={`relative aspect-square rounded-sm text-[10px] font-medium transition-colors ${
                          i === idx ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""
                        } ${q.kind === "task" ? "rounded-full" : ""} ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
                      >
                        {i + 1}
                        {flags.has(q.id) && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[color:var(--timer-urgent)]" />}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-primary" /> answered</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[color:var(--timer-urgent)]" /> flagged</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground" /> hands-on</span>
                </div>
              </div>
              <Button className="w-full" size="lg" onClick={() => setConfirmOpen(true)} disabled={!canAnswer}>
                Submit exam
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">Keys: 1–4 to answer, ← → to move. Auto-submits at 00:00.</p>
            </aside>
          </div>
        )}
      </main>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-md border border-rule bg-card p-6 shadow-xl">
            <h2 className="text-xl font-semibold">Submit your exam?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {questions.length - answeredCount > 0
                ? `You have ${questions.length - answeredCount} unanswered question(s)${flags.size ? ` and ${flags.size} flagged` : ""}.`
                : "All questions answered."}{" "}
              You can't change answers after submitting.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>Keep working</Button>
              <Button onClick={doSubmit}>Submit now</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Register({ slug, state, onStarted }: { slug: string; state: string; onStarted: (t: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await startAttempt({ data: { slug, name, email } });
      onStarted(r.token);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
      <section className="challenge-reveal">
        <div className="label-eyebrow text-primary">Exam simulation</div>
        <h1 className="display mt-2 text-4xl leading-tight sm:text-5xl">Claude Code Architect</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          75 questions in 90 minutes: 70 scenario questions and 5 hands-on tasks reviewed by AI. Score 72/100 to pass.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {DOMAIN_INFO.map(([t, d], i) => (
            <div key={t} className="challenge-project rounded-md border border-rule bg-card p-4" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="text-sm font-semibold">{t}</div>
              <div className="mt-1 text-xs text-muted-foreground">{d}</div>
            </div>
          ))}
        </div>
        <ul className="mt-6 space-y-1 text-sm text-muted-foreground">
          <li>• Everyone starts together when your instructor presses Start.</li>
          <li>• Answers save automatically. You can flag questions and come back.</li>
          <li>• Your score appears right after you submit; explanations unlock when the exam ends.</li>
        </ul>
      </section>
      <form onSubmit={submit} className="h-fit space-y-4 rounded-md border border-rule bg-card p-6">
        <div className="text-lg font-semibold">Join the exam</div>
        <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} />
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} />
        <Button type="submit" className="w-full" size="lg" disabled={busy || state === "finished"}>
          {state === "finished" ? "Exam has finished" : busy ? "Joining…" : state === "live" ? "Join and start now" : "Join and wait for start"}
        </Button>
        <p className="text-[11px] text-muted-foreground">Use this same device for the whole exam.</p>
      </form>
    </div>
  );
}

function Waiting({ name }: { name: string }) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center challenge-reveal">
      <Sparkles className="mx-auto h-10 w-10 text-primary" />
      <h1 className="mt-4 text-3xl font-semibold">You're in, {name.split(" ")[0]}.</h1>
      <p className="mt-2 text-muted-foreground">The exam will open here automatically when your instructor starts the timer.</p>
    </div>
  );
}

function QuestionCard(props: {
  q: PublicQuestion;
  index: number;
  total: number;
  value: number | string | undefined;
  flagged: boolean;
  disabled: boolean;
  onFlag: () => void;
  onChange: (v: number | string) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const { q, index, total, value, flagged, disabled } = props;
  return (
    <section className="challenge-reveal rounded-md border border-rule bg-card p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          Question {index + 1} of {total} · <span className="text-primary">{q.domain_label}</span>
        </span>
        <span>{q.kind === "task" ? `Hands-on · ${q.points} pts` : "1 pt"}</span>
      </div>
      <h2 className="mt-4 text-xl font-semibold leading-snug sm:text-2xl">{q.prompt}</h2>
      {q.kind === "task" ? (
        <>
          <p className="mt-3 whitespace-pre-line rounded-sm bg-muted/60 p-4 text-sm leading-relaxed">{q.scenario}</p>
          <textarea
            value={typeof value === "string" ? value : ""}
            onChange={(e) => props.onChange(e.target.value)}
            disabled={disabled}
            maxLength={8000}
            rows={14}
            placeholder="Write your answer. Code, JSON and file paths are welcome."
            className="mt-4 w-full rounded-sm border border-rule bg-background p-3 font-mono text-sm focus:border-primary focus:outline-none"
          />
          <div className="text-right text-[11px] text-muted-foreground">{typeof value === "string" ? value.length : 0}/8000</div>
        </>
      ) : (
        <div className="mt-6 space-y-2" role="radiogroup">
          {q.choices?.map((c, i) => {
            const sel = value === i;
            return (
              <button
                key={i}
                role="radio"
                aria-checked={sel}
                disabled={disabled}
                onClick={() => props.onChange(i)}
                className={`flex w-full items-start gap-3 rounded-sm border px-4 py-3 text-left text-sm transition-all ${
                  sel ? "border-primary bg-primary/10 shadow-sm" : "border-rule bg-background hover:border-primary/60 hover:bg-accent"
                }`}
              >
                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-xs ${sel ? "border-primary bg-primary text-primary-foreground" : "border-rule text-muted-foreground"}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="leading-relaxed">{c}</span>
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-6 flex items-center justify-between gap-2">
        <Button variant="outline" onClick={props.onPrev} disabled={index === 0}>
          <ChevronLeft /> Back
        </Button>
        <Button variant={flagged ? "secondary" : "ghost"} onClick={props.onFlag}>
          <Flag className={flagged ? "fill-current" : ""} /> {flagged ? "Flagged" : "Flag"}
        </Button>
        <Button onClick={props.onNext} disabled={index === total - 1}>
          Next <ChevronRight />
        </Button>
      </div>
    </section>
  );
}

function Results({ attempt, submitting, finished }: { attempt: AttemptView; submitting: boolean; finished: boolean }) {
  const grading = submitting || attempt.status === "grading" || attempt.status === "in_progress";
  if (grading) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="ai-review-orbit mx-auto h-14 w-14 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <h1 className="mt-6 text-2xl font-semibold">Grading your exam…</h1>
        <p className="mt-2 text-sm text-muted-foreground">Scoring scenario questions and reviewing your hands-on tasks with AI.</p>
      </div>
    );
  }
  const score = attempt.total_score ?? 0;
  const passed = !!attempt.passed;
  return (
    <div className="space-y-8">
      <section className="challenge-reveal rounded-md border border-rule bg-card p-6 text-center sm:p-10">
        {passed ? <Trophy className="mx-auto h-12 w-12 text-primary" /> : <Sparkles className="mx-auto h-12 w-12 text-muted-foreground" />}
        <div className="mt-4 font-mono text-6xl font-bold tabular-nums">{score}<span className="text-2xl text-muted-foreground">/100</span></div>
        <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${passed ? "bg-primary text-primary-foreground" : "bg-destructive/10 text-destructive"}`}>
          {passed ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {passed ? "PASS" : "Not yet — pass mark is 72"}
        </div>
        {attempt.status === "needs_review" && (
          <p className="mt-3 text-xs text-muted-foreground">Some hands-on answers are waiting for instructor review; your score may go up.</p>
        )}
        {attempt.domain_scores && (
          <div className="mx-auto mt-8 max-w-2xl space-y-3 text-left">
            {Object.values(attempt.domain_scores).map((d) => {
              const pct = d.total ? Math.round((d.earned / d.total) * 100) : 0;
              return (
                <div key={d.label}>
                  <div className="flex justify-between text-xs">
                    <span>{d.label}</span>
                    <span className="font-mono">{pct}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full ${pct >= 72 ? "bg-primary" : "bg-destructive"}`} style={{ width: `${pct}%`, transition: "width 1s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {!attempt.review ? (
        <p className="text-center text-sm text-muted-foreground">
          {finished ? "Loading explanations…" : "Answer explanations unlock for everyone when the exam timer ends."}
        </p>
      ) : (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Review & explanations</h2>
          {attempt.review.map((r, i) => (
            <details key={r.id} className="rounded-md border border-rule bg-card p-4">
              <summary className="flex cursor-pointer items-start gap-3 text-sm">
                {r.kind === "task" ? (
                  <span className="shrink-0 font-mono text-xs text-primary">{r.earned}/{r.points}</span>
                ) : r.correct ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                )}
                <span><span className="text-muted-foreground">{i + 1}.</span> {r.prompt}</span>
              </summary>
              <div className="mt-3 space-y-2 pl-7 text-sm">
                {r.choices?.map((c, ci) => (
                  <div
                    key={ci}
                    className={`rounded-sm px-3 py-1.5 ${ci === r.answer ? "bg-primary/10 font-medium" : r.your_answer === ci ? "bg-destructive/10 line-through" : "text-muted-foreground"}`}
                  >
                    {String.fromCharCode(65 + ci)}. {c}
                  </div>
                ))}
                {r.kind === "task" && (
                  <>
                    <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-sm bg-muted p-3 font-mono text-xs">{String(r.your_answer ?? "(no answer)")}</pre>
                    {r.feedback && <p><strong>AI feedback:</strong> {r.feedback}</p>}
                  </>
                )}
                <p className="text-muted-foreground"><strong className="text-foreground">Why:</strong> {r.explanation}</p>
              </div>
            </details>
          ))}
        </section>
      )}
      <div className="text-center">
        <Link to="/" className="text-sm text-muted-foreground underline underline-offset-4">Back to home</Link>
      </div>
    </div>
  );
}
