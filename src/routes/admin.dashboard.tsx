import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/dashboard")({ component: Dashboard });

type Row = {
  id: string;
  full_name: string;
  email: string;
  github_url: string | null;
  stage: string;
  status: string;
  total_score: number | null;
  quiz_correct_count: number;
  quiz_total_count: number;
  video_path: string | null;
  created_at: string;
};

function Dashboard() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<string>("all");
  const [sort, setSort] = useState<"score" | "date">("score");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("applications")
        .select("id, full_name, email, github_url, stage, status, total_score, quiz_correct_count, quiz_total_count, video_path, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      setRows((data ?? []) as Row[]);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    let r = rows;
    if (stage !== "all") r = r.filter((x) => x.stage === stage);
    if (q.trim()) {
      const t = q.toLowerCase();
      r = r.filter((x) => x.full_name.toLowerCase().includes(t) || x.email.toLowerCase().includes(t));
    }
    if (sort === "score") r = [...r].sort((a, b) => (b.total_score ?? -1) - (a.total_score ?? -1));
    else r = [...r].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return r;
  }, [rows, q, stage, sort]);

  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex items-end justify-between gap-6 mb-8">
        <div>
          <div className="label-eyebrow">Candidates</div>
          <h1 className="display text-5xl mt-2">{rows?.length ?? "—"} applicants</h1>
        </div>
        <div className="flex items-center gap-3">
          <Input placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
          <select value={stage} onChange={(e) => setStage(e.target.value)} className="h-10 rounded-sm border border-input bg-background px-3 text-sm">
            <option value="all">All stages</option>
            <option value="applied">Applied</option>
            <option value="takehome">Take-home</option>
            <option value="interview">Interview</option>
            <option value="admitted">Admitted</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as "score" | "date")} className="h-10 rounded-sm border border-input bg-background px-3 text-sm">
            <option value="score">By score</option>
            <option value="date">By date</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-sm border border-rule bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-rule bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Candidate</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Stage</th>
              <th className="px-4 py-3 text-right">Quiz</th>
              <th className="px-4 py-3 text-right">AI score</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-rule last:border-0 hover:bg-accent/50">
                <td className="px-4 py-3">
                  <div className="font-medium">{r.full_name}</div>
                  <div className="text-xs text-muted-foreground flex gap-2">
                    {r.video_path && <span>● video</span>}
                    {r.github_url && <span>● github</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{r.email}</td>
                <td className="px-4 py-3"><StageBadge stage={r.stage} /></td>
                <td className="px-4 py-3 text-right font-mono text-xs">
                  {r.quiz_total_count ? `${r.quiz_correct_count}/${r.quiz_total_count}` : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`serif text-2xl ${r.total_score == null ? "text-muted-foreground" : ""}`}>
                    {r.total_score != null ? r.total_score.toFixed(1) : "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link to="/admin/applications/$id" params={{ id: r.id }} className="text-xs underline underline-offset-4">
                    Open →
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">No candidates yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StageBadge({ stage }: { stage: string }) {
  const colors: Record<string, string> = {
    applied: "bg-muted text-muted-foreground",
    takehome: "bg-accent text-accent-foreground",
    interview: "bg-primary/15 text-primary",
    admitted: "bg-primary text-primary-foreground",
    rejected: "bg-destructive/15 text-destructive",
  };
  return <span className={`rounded-sm px-2 py-1 text-xs ${colors[stage] ?? colors.applied}`}>{stage}</span>;
}
