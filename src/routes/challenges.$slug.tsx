import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ChallengeCountdown } from "@/components/ChallengeCountdown";
import { getChallenge, getMySubmission, submitEntry, type PublicChallenge } from "@/lib/challenge.functions";
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
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <span className="label-eyebrow">AI Engineer Accelerator — Live Challenge</span>
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${STATE_STYLE[state]}`}
          >
            <span className={`h-2 w-2 rounded-full ${state === "live" ? "animate-pulse bg-emerald-500" : "bg-current"}`} />
            {STATE_LABEL[state]}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <h1 className="display text-4xl sm:text-6xl">{challenge.title}</h1>
        {challenge.goal && (
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground sm:text-xl">{challenge.goal}</p>
        )}

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

            <section>
              <h2 className="label-eyebrow">Approved repositories</h2>
              {challenge.repos.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  No repositories have been published yet — your instructor will add them shortly.
                </p>
              ) : (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {challenge.repos.map((r) => (
                    <li key={r.url}>
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between gap-3 rounded-sm border border-rule bg-card px-3 py-2.5 text-sm transition-colors hover:border-[#DE3D4D]/50"
                      >
                        <span className="truncate font-mono text-[13px]">{r.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground group-hover:text-[#DE3D4D]">↗</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* submission form */}
            <section id="submit">
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
                <button
                  type="submit"
                  disabled={busy || closed || notOpen}
                  className="inline-flex w-full items-center justify-center rounded-sm bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-40 sm:w-auto"
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
                </button>
                <p className="text-xs text-muted-foreground">
                  You can keep updating your own submission until the timer ends. Each pull request or commit can
                  only be submitted once.
                </p>
              </form>
            </section>

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
                    <p className="text-sm text-muted-foreground">
                      Reading the diff on GitHub and reviewing it… this usually takes under a minute.
                    </p>
                  )}
                  {submission.ai_review && (
                    <div className="rounded-sm bg-card p-4">
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
          </div>

          {/* timer */}
          <aside className="order-1 lg:order-2">
            <div className="lg:sticky lg:top-8">
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
