import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { ChallengeCountdown } from "@/components/ChallengeCountdown";
import {
  adminClearSubmissions,
  adminControl,
  adminDeleteSubmission,
  adminGetChallengeData,
  adminReevaluate,
  adminSaveSettings,
  adminUpdateSubmission,
  type PublicChallenge,
  type Repo,
} from "@/lib/challenge.functions";

export const Route = createFileRoute("/admin/challenge")({
  head: () => ({
    meta: [
      { title: "Challenges — Hasoub AI Accelerator Admin" },
      { name: "description", content: "Browse and manage live training challenges." },
      { property: "og:title", content: "Challenges — Hasoub AI Accelerator Admin" },
      { property: "og:description", content: "Browse and manage live training challenges." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminChallengePage,
});

const SLUG = "1";

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
  created_at: string;
  updated_at: string;
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

function csvEscape(v: unknown) {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

function AdminChallengePage() {
  const [challenge, setChallenge] = useState<PublicChallenge | null | undefined>(undefined);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const offsetRef = useRef(0);
  const anchorRef = useRef<{ endAt: number | null; state: string; remaining: number } | null>(null);

  // settings draft
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(45);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async (hydrateDraft: boolean) => {
    try {
      const res = await adminGetChallengeData({ data: { slug: SLUG } });
      if (!res) {
        setChallenge(null);
        return;
      }
      const c = res.challenge;
      offsetRef.current = new Date(c.server_now).getTime() - Date.now();
      anchorRef.current = {
        endAt: c.end_at ? new Date(c.end_at).getTime() : null,
        state: c.state,
        remaining: c.remaining_ms,
      };
      setChallenge(c);
      setSubs(res.submissions as Submission[]);
      setError(null);
      if (hydrateDraft) {
        setTitle(c.title);
        setGoal(c.goal ?? "");
        setDescription(c.description ?? "");
        setDuration(c.duration_minutes);
        setRepos(c.repos);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load(true);
    const iv = setInterval(() => load(false), 6000);
    return () => clearInterval(iv);
  }, [load]);

  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(iv);
  }, []);

  const live = useMemo(() => {
    const a = anchorRef.current;
    if (!a) return { state: "not_started" as const, remaining: 0 };
    if (a.state === "live" && a.endAt) {
      const rem = a.endAt - (Date.now() + offsetRef.current);
      return { state: (rem <= 0 ? "finished" : "live") as PublicChallenge["state"], remaining: Math.max(0, rem) };
    }
    return { state: a.state as PublicChallenge["state"], remaining: a.remaining };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge, tick]);

  async function control(action: string, minutes?: number) {
    try {
      await adminControl({ data: { slug: SLUG, action, minutes } });
      await load(false);
      toast.success(`Challenge ${action}${action.endsWith("e") ? "d" : "ed"}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function clearAll() {
    if (!confirm("Delete ALL submissions and reviews for this challenge and reset the timer? This cannot be undone.")) return;
    if (!confirm("Last check — every participant entry will be permanently removed. Continue?")) return;
    try {
      await adminClearSubmissions({ data: { slug: SLUG, resetTimer: true } });
      await load(false);
      toast.success("Challenge data cleared — ready to run again");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await adminSaveSettings({
        data: {
          slug: SLUG,
          title: title.trim(),
          goal: goal.trim() || null,
          description: description.trim() || null,
          duration_minutes: Number(duration) || 45,
          repos: repos.filter((r) => r.name.trim() && r.url.trim()),
        },
      });
      await load(false);
      toast.success("Saved");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function exportCsv() {
    const header = [
      "Name",
      "GitHub username",
      "Repository",
      "Type",
      "URL",
      "Submitted at",
      "Last updated",
      "Evaluation status",
      "GitHub state",
      "AI score",
      "Confidence",
      "Instructor score",
      "AI review",
      "Instructor notes",
    ];
    const rows = subs.map((s) => [
      s.participant_name,
      s.github_username,
      s.repo_full_name,
      s.link_type === "pr" ? "Pull request" : "Commit",
      s.link_url,
      new Date(s.created_at).toLocaleString(),
      new Date(s.updated_at).toLocaleString(),
      EVAL_LABEL[s.eval_status] ?? s.eval_status,
      s.merge_state,
      s.ai_score,
      s.ai_confidence,
      s.instructor_score,
      s.ai_review,
      s.instructor_notes,
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `challenge-${SLUG}-results.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (challenge === undefined) {
    return (
      <div className="mx-auto max-w-7xl animate-pulse space-y-4 px-6 py-12">
        <div className="h-5 w-48 rounded bg-muted" />
        <div className="h-48 rounded bg-muted" />
      </div>
    );
  }
  if (challenge === null) {
    return <div className="px-6 py-12 text-sm text-muted-foreground">Challenge not found.</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="label-eyebrow">Live challenge control</span>
          <h1 className="serif mt-1 text-3xl">{challenge.title}</h1>
        </div>
        <Link
          to="/challenges/$slug"
          params={{ slug: SLUG }}
          target="_blank"
          className="text-xs uppercase tracking-widest underline underline-offset-4"
        >
          Open participant page ↗
        </Link>
      </div>

      {error && <p className="mt-4 rounded-sm border border-[#DE3D4D]/30 bg-[#DE3D4D]/5 p-3 text-sm text-[#DE3D4D]">{error}</p>}

      {/* controls + timer */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="rounded-sm border border-rule p-5">
          <ChallengeCountdown remainingMs={live.remaining} totalMs={challenge.duration_minutes * 60_000} state={live.state} />
          <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
            <button onClick={() => control("start")} className="rounded-sm bg-primary px-3 py-2 text-primary-foreground">
              Start
            </button>
            {live.state === "paused" ? (
              <button onClick={() => control("resume")} className="rounded-sm border border-rule px-3 py-2">
                Resume
              </button>
            ) : (
              <button onClick={() => control("pause")} className="rounded-sm border border-rule px-3 py-2">
                Pause
              </button>
            )}
            <button onClick={() => control("extend", 5)} className="rounded-sm border border-rule px-3 py-2">
              +5 min
            </button>
            <button onClick={() => control("extend", 1)} className="rounded-sm border border-rule px-3 py-2">
              +1 min
            </button>
            <button onClick={() => control("end")} className="rounded-sm border border-[#DE3D4D]/40 px-3 py-2 text-[#DE3D4D]">
              End now
            </button>
            <button
              onClick={() => {
                if (confirm("Reset the timer back to not started?")) control("reset");
              }}
              className="rounded-sm border border-rule px-3 py-2 text-muted-foreground"
            >
              Reset
            </button>
            <button
              onClick={clearAll}
              className="rounded-sm border border-[#DE3D4D]/40 bg-[#DE3D4D]/5 px-3 py-2 text-[#DE3D4D]"
            >
              Clear all submissions
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Clearing removes every submission and review, and resets the timer so you can run the challenge again.
          </p>
        </div>

        {/* settings */}
        <div className="rounded-sm border border-rule p-5">
          <span className="label-eyebrow">Setup</span>
          <div className="mt-3 grid gap-4">
            <label className="block text-sm">
              <span className="text-muted-foreground">Title</span>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
            </label>
            <label className="block text-sm">
              <span className="text-muted-foreground">Goal</span>
              <Input value={goal} onChange={(e) => setGoal(e.target.value)} className="mt-1" />
            </label>
            <label className="block text-sm">
              <span className="text-muted-foreground">Instructions</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="mt-1 w-full rounded-sm border border-rule bg-background p-3 text-sm"
              />
            </label>
            <label className="block max-w-[180px] text-sm">
              <span className="text-muted-foreground">Duration (minutes)</span>
              <Input
                type="number"
                min={1}
                max={600}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="mt-1"
              />
            </label>

            <div>
              <span className="text-sm text-muted-foreground">Suggested repositories</span>
              <div className="mt-2 space-y-2">
                {repos.map((r, i) => (
                  <div key={i} className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={r.name}
                      placeholder="owner/repo"
                      onChange={(e) =>
                        setRepos((p) => p.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
                      }
                      className="font-mono text-[13px] sm:max-w-[240px]"
                    />
                    <Input
                      value={r.url}
                      placeholder="https://github.com/owner/repo"
                      onChange={(e) => setRepos((p) => p.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
                      className="font-mono text-[13px]"
                    />
                    <button
                      onClick={() => setRepos((p) => p.filter((_, j) => j !== i))}
                      className="shrink-0 rounded-sm border border-rule px-3 py-2 text-xs text-muted-foreground"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setRepos((p) => [...p, { name: "", url: "" }])}
                  className="rounded-sm border border-rule px-3 py-2 text-xs"
                >
                  + Add repository
                </button>
              </div>
            </div>

            <div>
              <button
                onClick={save}
                disabled={saving}
                className="rounded-sm bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save setup"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* submissions */}
      <div className="mt-12 flex flex-wrap items-center justify-between gap-3">
        <h2 className="serif text-2xl">
          Submissions <span className="text-muted-foreground">({subs.length})</span>
        </h2>
        <button
          onClick={exportCsv}
          disabled={subs.length === 0}
          className="rounded-sm border border-rule px-4 py-2 text-xs uppercase tracking-widest disabled:opacity-40"
        >
          Export CSV
        </button>
      </div>

      {subs.length === 0 ? (
        <p className="mt-6 rounded-sm border border-dashed border-rule p-10 text-center text-sm text-muted-foreground">
          No submissions yet. They will appear here live as participants submit.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-sm border border-rule">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-card text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Repository</th>
                <th className="px-4 py-3">Link</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <SubmissionRow
                  key={s.id}
                  s={s}
                  open={open === s.id}
                  onToggle={() => setOpen(open === s.id ? null : s.id)}
                  onChanged={() => load(false)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SubmissionRow({
  s,
  open,
  onToggle,
  onChanged,
}: {
  s: Submission;
  open: boolean;
  onToggle: () => void;
  onChanged: () => void;
}) {
  const [review, setReview] = useState(s.ai_review ?? "");
  const [notes, setNotes] = useState(s.instructor_notes ?? "");
  const [score, setScore] = useState<string>(s.instructor_score != null ? String(s.instructor_score) : "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setReview(s.ai_review ?? "");
      setNotes(s.instructor_notes ?? "");
      setScore(s.instructor_score != null ? String(s.instructor_score) : "");
    }
  }, [s.ai_review, s.instructor_notes, s.instructor_score, open]);

  async function save() {
    setBusy(true);
    try {
      await adminUpdateSubmission({
        data: {
          id: s.id,
          ai_review: review,
          instructor_notes: notes,
          instructor_score: score.trim() === "" ? null : Math.max(0, Math.min(100, Number(score))),
          eval_status: score.trim() === "" ? undefined : "evaluated",
        },
      });
      onChanged();
      toast.success("Evaluation saved");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <tr className="border-t border-rule align-top">
        <td className="px-4 py-3">
          <div className="font-medium">{s.participant_name}</div>
          <div className="font-mono text-xs text-muted-foreground">@{s.github_username}</div>
        </td>
        <td className="px-4 py-3 font-mono text-[13px]">{s.repo_full_name}</td>
        <td className="max-w-[260px] px-4 py-3">
          <a href={s.link_url} target="_blank" rel="noopener noreferrer" className="block truncate font-mono text-[12px] underline underline-offset-4">
            {s.link_url}
          </a>
          <span className="text-xs text-muted-foreground">{s.link_type === "pr" ? "Pull request" : "Commit"}</span>
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
          {new Date(s.created_at).toLocaleTimeString()}
        </td>
        <td className="px-4 py-3">
          <span className={`whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs ${EVAL_STYLE[s.eval_status]}`}>
            {EVAL_LABEL[s.eval_status] ?? s.eval_status}
          </span>
        </td>
        <td className="whitespace-nowrap px-4 py-3 font-mono">
          {s.instructor_score != null ? (
            <span>{s.instructor_score}<span className="text-xs text-muted-foreground">/100 · final</span></span>
          ) : s.ai_score != null ? (
            <span className="text-muted-foreground">{s.ai_score}/100</span>
          ) : (
            <span className="text-xs text-amber-700">—</span>
          )}
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-right">
          <button onClick={onToggle} className="rounded-sm border border-rule px-3 py-1.5 text-xs">
            {open ? "Close" : "Review"}
          </button>
        </td>
      </tr>
      {open && (
        <tr className="border-t border-rule bg-card">
          <td colSpan={7} className="px-4 py-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <span className="label-eyebrow">AI review (editable)</span>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={7}
                  className="mt-2 w-full rounded-sm border border-rule bg-background p-3 text-sm"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  AI score: {s.ai_score ?? "—"} · confidence: {s.ai_confidence ?? "—"} · GitHub: {s.merge_state ?? "unknown"}
                </p>
              </div>
              <div className="space-y-3">
                <label className="block text-sm">
                  <span className="text-muted-foreground">Final score (0–100, authoritative)</span>
                  <Input type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} className="mt-1 max-w-[140px] bg-background" />
                </label>
                <label className="block text-sm">
                  <span className="text-muted-foreground">Review notes (visible to participant)</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="mt-1 w-full rounded-sm border border-rule bg-background p-3 text-sm"
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={save} disabled={busy} className="rounded-sm bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">
                    {busy ? "Saving…" : "Save evaluation"}
                  </button>
                  <button
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await adminReevaluate({ data: { id: s.id } });
                        onChanged();
                        toast.success("Re-evaluated");
                      } catch (e) {
                        toast.error((e as Error).message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                    disabled={busy}
                    className="rounded-sm border border-rule px-4 py-2 text-sm disabled:opacity-50"
                  >
                    Re-run AI review
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm("Delete this submission?")) return;
                      await adminDeleteSubmission({ data: { id: s.id } });
                      onChanged();
                    }}
                    className="rounded-sm border border-[#DE3D4D]/40 px-4 py-2 text-sm text-[#DE3D4D]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
