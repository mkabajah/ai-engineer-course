import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { adminControl, getChallenge, type PublicChallenge } from "@/lib/challenge.functions";
import { adminClearExam, adminDeleteAttempt, adminGetExam, adminGradeAllOpen, adminGradeAttempt } from "@/lib/exam.functions";

export const Route = createFileRoute("/admin/exam")({
  head: () => ({
    meta: [
      { title: "Claude Architect Exam — Hasoub Admin" },
      { name: "description", content: "Manage the Claude Code Architect simulation." },
      { property: "og:title", content: "Claude Architect Exam — Hasoub Admin" },
      { property: "og:description", content: "Manage the Claude Code Architect simulation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminExamPage,
});

const SLUG = "claude-architect";

type Row = Awaited<ReturnType<typeof adminGetExam>>[number];

function fmt(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const STATUS: Record<string, string> = {
  in_progress: "In progress",
  grading: "Grading",
  graded: "Graded",
  needs_review: "Needs review",
};

function AdminExamPage() {
  const [exam, setExam] = useState<PublicChallenge | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, r] = await Promise.all([getChallenge({ data: { slug: SLUG } }), adminGetExam({ data: { slug: SLUG } })]);
      if (c) {
        setExam(c);
        setOffset(new Date(c.server_now).getTime() - Date.now());
      }
      setRows(r);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    const tick = setInterval(() => setNow(Date.now()), 500);
    return () => {
      clearInterval(t);
      clearInterval(tick);
    };
  }, [load]);

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };
  const control = (action: string, minutes?: number) =>
    act(() => adminControl({ data: { slug: SLUG, action, minutes } }), `Exam: ${action}`);

  const remaining = exam?.state === "live" && exam.end_at ? new Date(exam.end_at).getTime() - (now + offset) : exam?.remaining_ms ?? 0;
  const graded = rows.filter((r) => r.total_score !== null);
  const passCount = graded.filter((r) => r.passed).length;
  const avg = graded.length ? Math.round((graded.reduce((s, r) => s + Number(r.total_score), 0) / graded.length) * 10) / 10 : null;

  const exportCsv = () => {
    const head = ["Name", "Email", "Status", "Answered", "MCQ (70)", "Hands-on (30)", "Total", "Passed", "Submitted"];
    const lines = rows.map((r) =>
      [r.participant_name, r.email, STATUS[r.status] ?? r.status, r.answered, r.mcq_points ?? "", r.task_points ?? "", r.total_score ?? "", r.passed === null ? "" : r.passed ? "yes" : "no", r.submitted_at ?? ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "claude-architect-exam.csv";
    a.click();
  };

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/admin/challenges" className="mb-3 block text-xs text-muted-foreground underline underline-offset-4">← All challenges</Link>
          <div className="label-eyebrow text-primary">Challenge #2</div>
          <h1 className="serif text-3xl">Claude Code Architect Exam</h1>
          <Link to="/exams/$slug" params={{ slug: SLUG }} target="_blank" className="text-sm text-muted-foreground underline underline-offset-4">
            Open participant page: /exams/{SLUG}
          </Link>
        </div>
        <div className="text-right">
          <div className="font-mono text-4xl font-bold tabular-nums">{fmt(remaining)}</div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{exam?.state.replace("_", " ") ?? "…"}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-md border border-rule bg-card p-4">
        <Button disabled={busy} onClick={() => control("start")}>{exam?.state === "not_started" ? "Start exam (90 min)" : "Restart timer"}</Button>
        <Button disabled={busy || exam?.state !== "live"} variant="outline" onClick={() => control("pause")}>Pause</Button>
        <Button disabled={busy || exam?.state !== "paused"} variant="outline" onClick={() => control("resume")}>Resume</Button>
        <Button disabled={busy} variant="outline" onClick={() => control("extend", 5)}>+5 min</Button>
        <Button disabled={busy} variant="outline" onClick={() => control("end")}>End now</Button>
        <div className="flex-1" />
        <Button disabled={busy} variant="outline" onClick={() => act(() => adminGradeAllOpen({ data: { slug: SLUG } }), "Graded open attempts")}>Grade unsubmitted</Button>
        <Button asChild variant="outline"><Link to="/admin/exam/questions">Edit questions</Link></Button>
        <Button variant="outline" onClick={exportCsv} disabled={!rows.length}>Export CSV</Button>
        <Button
          variant="destructive"
          disabled={busy}
          onClick={() => {
            if (!confirm("Delete ALL attempts and reset the timer?")) return;
            if (!confirm("This cannot be undone. Continue?")) return;
            act(() => adminClearExam({ data: { slug: SLUG } }), "Exam cleared");
          }}
        >
          Clear all
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[["Joined", rows.length], ["Submitted", graded.length], ["Passed", `${passCount}/${graded.length}`], ["Average", avg ?? "—"]].map(([k, v]) => (
          <div key={k} className="rounded-md border border-rule bg-card p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{k}</div>
            <div className="mt-1 text-2xl font-semibold">{v}</div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-md border border-rule bg-card">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="border-b border-rule text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="p-3">Participant</th>
              <th className="p-3">Status</th>
              <th className="p-3">Progress</th>
              <th className="p-3">MCQ /70</th>
              <th className="p-3">Hands-on /30</th>
              <th className="p-3">Total</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-rule align-top last:border-0">
                <td className="p-3">
                  <div className="font-medium">{r.participant_name}</div>
                  <div className="text-xs text-muted-foreground">{r.email}</div>
                </td>
                <td className="p-3">{STATUS[r.status] ?? r.status}</td>
                <td className="p-3 font-mono">{r.answered}/{r.total_questions}</td>
                <td className="p-3 font-mono">{r.mcq_points ?? "—"}</td>
                <td className="p-3">
                  <div className="font-mono">{r.task_points ?? "—"}</div>
                  {r.task_feedback && (
                    <details className="text-xs text-muted-foreground">
                      <summary className="cursor-pointer">Feedback</summary>
                      {Object.entries(r.task_feedback as Record<string, { score: number | null; feedback: string }>).map(([k, f]) => (
                        <p key={k} className="mt-1 max-w-xs"><strong>{k.toUpperCase()} {f.score ?? "?"}/6:</strong> {f.feedback}</p>
                      ))}
                    </details>
                  )}
                </td>
                <td className="p-3">
                  {r.total_score !== null ? (
                    <span className={`rounded-full px-2 py-0.5 font-mono text-xs font-semibold ${r.passed ? "bg-primary text-primary-foreground" : "bg-destructive/10 text-destructive"}`}>
                      {r.total_score} {r.passed ? "PASS" : "FAIL"}
                    </span>
                  ) : "—"}
                </td>
                <td className="space-x-2 whitespace-nowrap p-3 text-right">
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => act(() => adminGradeAttempt({ data: { id: r.id } }), "Regraded")}>
                    {r.status === "in_progress" ? "Grade" : "Regrade"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => confirm(`Delete ${r.participant_name}'s attempt? They can rejoin.`) && act(() => adminDeleteAttempt({ data: { id: r.id } }), "Deleted")}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No one has joined yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
