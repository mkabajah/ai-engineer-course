import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  GraduationCap,
  ListChecks,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/obp/Markdown";
import { ObpNav, errMsg, fmtClock, readCode, usePoll, useServerNow } from "@/components/obp/shared";
import {
  obpExamBlur,
  obpExamGet,
  obpExamReview,
  obpExamSave,
  obpExamStart,
  obpExamSubmit,
  type ExamQuestion,
  type ExamReviewItem,
  type ExamState,
} from "@/lib/obp/obp.functions";

export const Route = createFileRoute("/broken-prod/exam")({
  head: () => ({
    meta: [
      { title: "Broken Prod Certification Exam — AI Engineer Accelerator" },
      {
        name: "description",
        content:
          "35 questions, 30 minutes, certification style: Claude Code, Kiro, agents and GenAI fundamentals.",
      },
      { property: "og:title", content: "Broken Prod Certification Exam" },
      { property: "og:description", content: "35 questions, 30 minutes. Pass at 720/1000." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ExamPage,
});

const WORDS = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE"];

function ExamPage() {
  // Read the code after mount (not during render) so server and client HTML match
  const [code, setCode] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setCode(readCode());
    setMounted(true);
  }, []);
  const [exam, setExamRaw] = useState<ExamState | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Never move backwards (a slow "ready" poll must not replace a running exam and reset it to question 1)
  const setExam = useCallback((next: ExamState) => {
    const rank = (e: ExamState) =>
      e.status === "submitted" ? 2 : e.status === "in_progress" ? 1 : 0;
    setExamRaw((prev) => (!prev || rank(next) >= rank(prev) ? next : prev));
  }, []);

  const load = useCallback(async () => {
    if (!code) return;
    try {
      setExam(await obpExamGet({ data: { code } }));
      setError(null);
    } catch (e) {
      setError(errMsg(e));
    }
  }, [code, setExam]);

  // Poll only while waiting for the host to open the exam (or for the review to open)
  const waiting =
    !exam || exam.status === "closed" || (exam.status === "submitted" && !exam.review_open);
  usePoll(
    async () => {
      if (waiting) await load();
    },
    5000,
    [waiting, load],
  );

  if (!mounted)
    return (
      <Shell>
        <div className="h-64 animate-pulse rounded-md bg-muted" />
      </Shell>
    );
  if (!code) {
    return (
      <Shell>
        <div className="mx-auto max-w-md rounded-md border border-rule bg-card p-8 text-center">
          <GraduationCap className="mx-auto h-8 w-8 text-primary" />
          <h1 className="serif mt-3 text-3xl">Sign in first</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your personal code on the mission page, then come back here.
          </p>
          <Button asChild className="mt-5">
            <Link to="/broken-prod">Go to the mission page</Link>
          </Button>
        </div>
      </Shell>
    );
  }
  if (error)
    return (
      <Shell>
        <p className="text-sm text-primary">{error}</p>
      </Shell>
    );
  if (!exam)
    return (
      <Shell>
        <div className="h-64 animate-pulse rounded-md bg-muted" />
      </Shell>
    );
  if (exam.status === "in_progress")
    return <ExamRunner key={exam.started_at} code={code} exam={exam} onDone={setExam} />;
  if (exam.status === "submitted")
    return (
      <Shell>
        <ScoreReport code={code} exam={exam} />
      </Shell>
    );
  return (
    <Shell>
      <Intro exam={exam} code={code} onStarted={setExam} />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ObpNav active="exam" />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}

/* ───────────────────────────── intro ───────────────────────────── */

function Intro({
  exam,
  code,
  onStarted,
}: {
  exam: Extract<ExamState, { status: "closed" | "ready" }>;
  code: string;
  onStarted: (e: ExamState) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [agree, setAgree] = useState(false);
  const start = async () => {
    setBusy(true);
    try {
      onStarted(await obpExamStart({ data: { code } }));
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="grid grid-cols-1 [&>*]:min-w-0 gap-8 lg:grid-cols-[1.3fr_1fr]">
      <div>
        <div className="label-eyebrow text-primary">The Arena · certification exam</div>
        <h1 className="display mt-3 text-5xl sm:text-6xl">Broken Prod Certified Engineer</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Generative AI fundamentals, Claude Code, Kiro and spec-driven development, agent design,
          security and prompting, configuration and troubleshooting. Scenario-based questions in the
          style of the AWS and Anthropic certification exams.
        </p>
        <dl className="mt-8 grid grid-cols-3 gap-3">
          {[
            [String(exam.total), "questions"],
            [`${exam.minutes} min`, "time limit"],
            [`${exam.pass_mark}`, "to pass (of 1000)"],
          ].map(([v, l]) => (
            <div key={l} className="rounded-md border border-rule bg-card p-4">
              <dt className="font-serif text-3xl tabular-nums">{v}</dt>
              <dd className="text-[11px] uppercase tracking-widest text-muted-foreground">{l}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="rounded-md border border-rule bg-card p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <ShieldCheck className="h-5 w-5 text-primary" /> Exam rules
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>
            • Multiple choice (one answer) and multiple response ("Choose TWO"). All-or-nothing, no
            penalty for guessing.
          </li>
          <li>• Your questions and options are in a random order. Answers save as you click.</li>
          <li>
            • Flag questions for review and use the navigator. The exam submits itself at 00:00.
          </li>
          <li>• No AI tools, no other tabs. Leaving this tab is logged for the proctor.</li>
          <li>
            • You get a scaled score and a per-domain report. Answers are shown only when the host
            opens the review.
          </li>
        </ul>
        {exam.status === "closed" ? (
          <div className="mt-6 flex items-center gap-2 rounded-sm border border-dashed border-rule p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Waiting for the proctor to open the exam…
          </div>
        ) : (
          <>
            <label className="mt-6 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <span>I'll take this exam alone, without AI tools or notes.</span>
            </label>
            <Button size="lg" className="mt-4 w-full" disabled={!agree || busy} onClick={start}>
              {busy ? <Loader2 className="animate-spin" /> : <Clock />} Start the exam (
              {exam.minutes} min)
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────── runner ───────────────────────────── */

function ExamRunner({
  code,
  exam,
  onDone,
}: {
  code: string;
  exam: Extract<ExamState, { status: "in_progress" }>;
  onDone: (e: ExamState) => void;
}) {
  const now = useServerNow(exam.server_now, 500);
  const [questions, setQuestions] = useState<ExamQuestion[]>(exam.questions);
  const [idx, setIdx] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(0);
  const endsAt = new Date(exam.ends_at).getTime();
  const remaining = endsAt - now;
  const submittedRef = useRef(false);
  const q = questions[idx];

  const answered = questions.filter((x) => x.choice.length > 0).length;
  const flagged = questions.filter((x) => x.flagged).length;

  // Saves run one after another per question, so a slow request can never overwrite a newer answer.
  const chains = useRef(new Map<string, Promise<void>>());
  const persist = useCallback(
    (question: ExamQuestion) => {
      const prev = chains.current.get(question.id) ?? Promise.resolve();
      const next = prev.then(async () => {
        setSaving((n) => n + 1);
        try {
          await obpExamSave({
            data: {
              code,
              question: question.id,
              choice: question.choice,
              flagged: question.flagged,
            },
          });
        } catch (e) {
          toast.error(`Not saved: ${errMsg(e)}`);
        } finally {
          setSaving((n) => n - 1);
        }
      });
      chains.current.set(question.id, next);
    },
    [code],
  );

  const update = (patch: Partial<ExamQuestion>) => {
    if (!q) return;
    const nextQ = { ...q, ...patch };
    setQuestions((list) => list.map((x) => (x.id === nextQ.id ? nextQ : x)));
    persist(nextQ);
  };

  const choose = (optId: string) => {
    if (!q) return;
    if (q.kind === "single") update({ choice: [optId] });
    else {
      const has = q.choice.includes(optId);
      if (!has && q.choice.length >= q.select_count) {
        toast(`Choose ${WORDS[q.select_count] ?? q.select_count}: unselect one first`);
        return;
      }
      update({ choice: has ? q.choice.filter((c) => c !== optId) : [...q.choice, optId] });
    }
  };

  const submit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      await Promise.all(chains.current.values());
      onDone(await obpExamSubmit({ data: { code } }));
    } catch (e) {
      submittedRef.current = false;
      toast.error(errMsg(e));
    } finally {
      setSubmitting(false);
    }
  }, [code, onDone]);

  useEffect(() => {
    if (remaining <= 0) void submit();
  }, [remaining, submit]);

  // Proctoring signal: tab hidden / window blurred
  useEffect(() => {
    let last = 0;
    const report = () => {
      if (Date.now() - last < 3000) return;
      last = Date.now();
      void obpExamBlur({ data: { code } }).catch(() => {});
    };
    const onVis = () => document.visibilityState === "hidden" && report();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", report);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", report);
    };
  }, [code]);

  // Keyboard: A–E / 1–5 answer, ←/→ move, F flag
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (reviewing || confirm || !q) return;
      const t = e.target as HTMLElement | null;
      if (t && ["INPUT", "TEXTAREA"].includes(t.tagName)) return;
      const k = e.key.toLowerCase();
      const n = "abcde".indexOf(k) >= 0 ? "abcde".indexOf(k) : "12345".indexOf(k);
      if (n >= 0 && q.options[n]) choose(q.options[n].id);
      else if (e.key === "ArrowRight") setIdx((i) => Math.min(questions.length - 1, i + 1));
      else if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
      else if (k === "f") update({ flagged: !q.flagged });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const timerTone =
    remaining < 60_000
      ? "text-primary animate-pulse"
      : remaining < 5 * 60_000
        ? "text-[color:var(--timer-urgent)]"
        : "";

  return (
    <div className="min-h-screen select-none bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-rule bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <div className="label-eyebrow text-[10px] text-primary">
              Broken Prod Certified Engineer
            </div>
            <div className="text-sm font-semibold">
              Question {idx + 1} of {questions.length}
              <span className="ml-3 font-normal text-muted-foreground">
                {answered} answered · {flagged} flagged{" "}
                {saving > 0 && <Loader2 className="ml-1 inline h-3 w-3 animate-spin" />}
              </span>
            </div>
          </div>
          <div className="hidden flex-1 px-6 md:block">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(answered / questions.length) * 100}%` }}
              />
            </div>
          </div>
          <div className={`text-right font-mono tabular-nums ${timerTone}`}>
            <div className="text-2xl font-bold">{fmtClock(remaining)}</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              time left
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        {reviewing ? (
          <ReviewScreen
            questions={questions}
            onOpen={(i) => {
              setIdx(i);
              setReviewing(false);
            }}
            onEnd={() => setConfirm(true)}
            onBack={() => setReviewing(false)}
          />
        ) : q ? (
          <section className="min-w-0">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                {q.domain_title}
              </span>
              <Button
                variant={q.flagged ? "default" : "outline"}
                size="sm"
                onClick={() => update({ flagged: !q.flagged })}
              >
                <Flag /> {q.flagged ? "Flagged" : "Mark for review"}
              </Button>
            </div>
            <Markdown text={q.prompt_md} className="mt-4 text-lg" />
            {q.code && (
              <pre className="mt-4 overflow-x-auto rounded-md bg-[#0F1B30] p-4 font-mono text-[12.5px] leading-relaxed text-[#E8EDF7]">
                <code>{q.code}</code>
              </pre>
            )}
            {q.kind === "multi" && (
              <div className="mt-4 inline-block rounded-sm bg-primary/10 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                Choose {WORDS[q.select_count] ?? q.select_count}
              </div>
            )}
            <div className="mt-4 space-y-2" role={q.kind === "single" ? "radiogroup" : "group"}>
              {q.options.map((o, i) => {
                const on = q.choice.includes(o.id);
                return (
                  <button
                    key={o.id}
                    type="button"
                    role={q.kind === "single" ? "radio" : "checkbox"}
                    aria-checked={on}
                    onClick={() => choose(o.id)}
                    className={`flex w-full items-start gap-3 rounded-md border p-4 text-left text-sm transition-colors ${
                      on
                        ? "border-primary bg-primary/[0.06]"
                        : "border-rule bg-card hover:border-foreground/30"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border text-[11px] font-semibold ${
                        q.kind === "single" ? "rounded-full" : "rounded-sm"
                      } ${on ? "border-primary bg-primary text-primary-foreground" : "border-rule text-muted-foreground"}`}
                    >
                      {"ABCDE"[i]}
                    </span>
                    <span className="flex-1">
                      <Markdown text={o.text} />
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setIdx((i) => Math.max(0, i - 1))}
                disabled={idx === 0}
              >
                <ChevronLeft /> Previous
              </Button>
              {idx < questions.length - 1 ? (
                <Button onClick={() => setIdx((i) => i + 1)}>
                  Next <ChevronRight />
                </Button>
              ) : (
                <Button onClick={() => setReviewing(true)}>
                  <ListChecks /> Review answers
                </Button>
              )}
            </div>
            <p className="mt-4 text-center text-[11px] text-muted-foreground">
              Keys: A–E answer · ← → move · F flag
            </p>
          </section>
        ) : null}

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-md border border-rule bg-card p-4">
            <div className="mb-3 text-xs text-muted-foreground">Navigator</div>
            <div className="grid grid-cols-7 gap-1">
              {questions.map((x, i) => (
                <button
                  key={x.id}
                  onClick={() => {
                    setIdx(i);
                    setReviewing(false);
                  }}
                  className={`relative aspect-square rounded-sm text-[11px] font-medium ${
                    i === idx && !reviewing ? "ring-2 ring-foreground" : ""
                  } ${x.choice.length ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  {i + 1}
                  {x.flagged && (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[color:var(--timer-urgent)]" />
                  )}
                </button>
              ))}
            </div>
          </div>
          <Button className="w-full" variant="outline" onClick={() => setReviewing(true)}>
            <ListChecks /> Review all
          </Button>
          <Button className="w-full" onClick={() => setConfirm(true)} disabled={submitting}>
            End exam
          </Button>
        </aside>
      </main>

      {confirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-md border border-rule bg-card p-6 shadow-xl">
            <h2 className="text-xl font-semibold">End the exam?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {questions.length - answered > 0 ? (
                <>
                  <AlertTriangle className="mr-1 inline h-4 w-4 text-[color:var(--timer-urgent)]" />
                  {questions.length - answered} question(s) are unanswered and will count as
                  incorrect.{" "}
                </>
              ) : null}
              {flagged > 0 ? `${flagged} are flagged for review. ` : ""}You can't change answers
              afterwards.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirm(false)}>
                Keep going
              </Button>
              <Button onClick={submit} disabled={submitting}>
                {submitting && <Loader2 className="animate-spin" />} End and score
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewScreen({
  questions,
  onOpen,
  onEnd,
  onBack,
}: {
  questions: ExamQuestion[];
  onOpen: (i: number) => void;
  onEnd: () => void;
  onBack: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "unanswered" | "flagged">("all");
  const list = questions
    .map((q, i) => ({ q, i }))
    .filter(({ q }) =>
      filter === "all" ? true : filter === "flagged" ? q.flagged : q.choice.length === 0,
    );
  return (
    <section>
      <h2 className="serif text-3xl">Review your answers</h2>
      <div className="mt-4 flex gap-2">
        {(["all", "unanswered", "flagged"] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
          >
            {f}
          </Button>
        ))}
      </div>
      <ul className="mt-4 divide-y divide-rule rounded-md border border-rule bg-card">
        {list.map(({ q, i }) => (
          <li key={q.id}>
            <button
              onClick={() => onOpen(i)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-muted/50"
            >
              <span className="w-8 font-mono text-xs text-muted-foreground">{i + 1}</span>
              <span className="line-clamp-1 flex-1">{q.prompt_md.replace(/[*`#>]/g, "")}</span>
              {q.flagged && <Flag className="h-3.5 w-3.5 text-[color:var(--timer-urgent)]" />}
              <span className={`text-xs ${q.choice.length ? "text-foreground" : "text-primary"}`}>
                {q.choice.length ? "answered" : "unanswered"}
              </span>
            </button>
          </li>
        ))}
        {list.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-muted-foreground">Nothing here.</li>
        )}
      </ul>
      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft /> Back to the question
        </Button>
        <Button onClick={onEnd}>End exam</Button>
      </div>
    </section>
  );
}

/* ───────────────────────────── score report ───────────────────────────── */

function ScoreReport({
  code,
  exam,
}: {
  code: string;
  exam: Extract<ExamState, { status: "submitted" }>;
}) {
  const r = exam.result;
  const [review, setReview] = useState<ExamReviewItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const minutes = useMemo(
    () =>
      Math.round(
        (new Date(exam.submitted_at).getTime() - new Date(exam.started_at).getTime()) / 60000,
      ),
    [exam],
  );
  const loadReview = async () => {
    setLoading(true);
    try {
      setReview(await obpExamReview({ data: { code } }));
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-8">
      <section
        className={`rounded-md border p-8 ${r.passed ? "border-emerald-300 bg-emerald-50/60" : "border-rule bg-card"}`}
      >
        <div className="label-eyebrow">Score report · Broken Prod Certified Engineer</div>
        <div className="mt-4 flex flex-wrap items-end gap-6">
          <div>
            <div className="font-serif text-7xl tabular-nums leading-none">{r.scaled}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              scaled score (100–1000) · pass mark {r.pass_mark}
            </div>
          </div>
          <div
            className={`mb-2 rounded-full px-4 py-1.5 text-sm font-semibold ${r.passed ? "bg-emerald-600 text-white" : "bg-muted text-foreground"}`}
          >
            {r.passed ? "🎓 PASS" : "FAIL"}
          </div>
          <div className="mb-2 ml-auto text-right text-sm text-muted-foreground">
            +{r.points} leaderboard points
            <br />
            finished in {minutes} min
          </div>
        </div>
      </section>

      <section>
        <h2 className="serif text-2xl">Performance by domain</h2>
        <ul className="mt-4 space-y-3">
          {(r.domains ?? []).map((d) => (
            <li key={d.domain} className="rounded-md border border-rule bg-card p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">{d.title}</span>
                <span
                  className={
                    d.result === "Meets competencies"
                      ? "text-emerald-700"
                      : "text-[color:var(--timer-urgent)]"
                  }
                >
                  {d.result}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full ${d.pct >= 70 ? "bg-emerald-600" : "bg-[color:var(--timer-urgent)]"}`}
                  style={{ width: `${d.pct}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        {!exam.review_open ? (
          <p className="rounded-sm border border-dashed border-rule p-4 text-center text-sm text-muted-foreground">
            Answers and explanations unlock when the proctor opens the review.
          </p>
        ) : review ? (
          <div className="space-y-4">
            <h2 className="serif text-2xl">Answer review</h2>
            {review.map((it) => (
              <article
                key={it.id}
                className={`rounded-md border p-5 ${it.is_correct ? "border-emerald-200" : "border-primary/30"}`}
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {it.is_correct ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-primary" />
                  )}
                  Question {it.number} · {it.domain_title}
                </div>
                <Markdown text={it.prompt_md} className="mt-2" />
                {it.code && (
                  <pre className="mt-3 overflow-x-auto rounded-md bg-[#0F1B30] p-3 font-mono text-[12px] text-[#E8EDF7]">
                    <code>{it.code}</code>
                  </pre>
                )}
                <ul className="mt-3 space-y-1.5 text-sm">
                  {it.options.map((o) => {
                    const correct = it.correct.includes(o.id);
                    const mine = it.my_choice.includes(o.id);
                    return (
                      <li
                        key={o.id}
                        className={`rounded-sm border px-3 py-2 ${correct ? "border-emerald-300 bg-emerald-50" : mine ? "border-primary/40 bg-primary/5" : "border-rule"}`}
                      >
                        <span className="mr-2 font-mono text-xs">
                          {correct ? "✓" : mine ? "✗" : "·"}
                        </span>
                        {o.text}
                        {mine && (
                          <span className="ml-2 text-[11px] text-muted-foreground">
                            (your answer)
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <Markdown text={it.explanation_md} className="mt-3 text-sm text-muted-foreground" />
              </article>
            ))}
          </div>
        ) : (
          <Button onClick={loadReview} disabled={loading}>
            {loading && <Loader2 className="animate-spin" />} Show answers and explanations
          </Button>
        )}
      </section>
    </div>
  );
}
