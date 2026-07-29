import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { exportApplicationsCsv, deleteApplication } from "@/lib/admins.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/dashboard")({ component: Dashboard });

type Row = {
  id: string;
  full_name: string;
  email: string;
  github_url: string | null;
  portfolio_url: string | null;
  stage: string;
  status: string;
  total_score: number | null;
  video_path: string | null;
  created_at: string;
};

function Dashboard() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<string>("all");
  const [sort, setSort] = useState<"score" | "date">("score");
  const [exporting, setExporting] = useState(false);
  const exportFn = useServerFn(exportApplicationsCsv);
  const deleteFn = useServerFn(deleteApplication);

  const doDelete = async (r: Row) => {
    if (!confirm(`Delete application from ${r.full_name}? This cannot be undone.`)) return;
    try {
      await deleteFn({ data: { id: r.id } });
      setRows((prev) => (prev ?? []).filter((x) => x.id !== r.id));
      toast.success("Application deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("applications")
        .select("id, full_name, email, github_url, portfolio_url, stage, status, total_score, video_path, created_at")
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

  const doExport = async (which: "admitted" | "current" | "all") => {
    setExporting(true);
    try {
      const stageArg = which === "admitted" ? "admitted" : which === "current" ? stage : "all";
      const { csv, count } = await exportFn({ data: { stage: stageArg } });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `applicants-${stageArg}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${count} row(s)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex items-end justify-between gap-6 mb-8 flex-wrap">
        <div>
          <div className="label-eyebrow">Candidates</div>
          <h1 className="display text-5xl mt-2">{rows?.length ?? "—"} applicants</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Input placeholder="Search name or email…" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
          <select value={stage} onChange={(e) => setStage(e.target.value)} className="h-10 rounded-sm border border-input bg-background px-3 text-sm">
            <option value="all">All stages</option>
            <option value="applied">Applied</option>
            <option value="takehome">Take-home</option>
            <option value="interview">Interview</option>
            <option value="passed">Passed</option>
            <option value="admitted">Admitted</option>
            <option value="accepted_paid">Accepted (Paid)</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as "score" | "date")} className="h-10 rounded-sm border border-input bg-background px-3 text-sm">
            <option value="score">By score</option>
            <option value="date">By date</option>
          </select>
          <button
            onClick={() => doExport("admitted")}
            disabled={exporting}
            className="h-10 rounded-sm bg-primary px-4 text-xs uppercase tracking-wider text-primary-foreground disabled:opacity-50"
          >
            Export admitted
          </button>
          <button
            onClick={() => doExport("current")}
            disabled={exporting}
            className="h-10 rounded-sm border border-rule bg-card px-4 text-xs uppercase tracking-wider hover:bg-accent disabled:opacity-50"
          >
            Export view
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-sm border border-rule bg-card">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-rule bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Candidate</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Stage</th>
              <th className="px-4 py-3 text-left">Submitted</th>
              <th className="px-4 py-3 text-right">AI score</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-rule last:border-0 hover:bg-accent/50">
                <td className="px-4 py-3 max-w-[240px]">
                  <div className="font-medium truncate">{r.full_name}</div>
                  <div className="text-xs text-muted-foreground flex gap-2">
                    {r.video_path && <span>● video</span>}
                    {r.github_url && <span>● github</span>}
                    {r.portfolio_url && <span>● project</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground max-w-[220px] truncate">{r.email}</td>
                <td className="px-4 py-3"><StageBadge stage={r.stage} /></td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(r.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`serif text-2xl ${r.total_score == null ? "text-muted-foreground" : ""}`}>
                    {r.total_score != null ? r.total_score.toFixed(1) : "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                    <Link to="/admin/applications/$id" params={{ id: r.id }} className="text-xs underline underline-offset-4">
                      Open →
                    </Link>
                    <button
                      onClick={() => doDelete(r)}
                      className="text-xs text-destructive hover:underline underline-offset-4"
                      aria-label={`Delete ${r.full_name}`}
                    >
                      Delete
                    </button>
                  </div>
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

const STAGE_COLORS: Record<string, string> = {
  applied: "bg-slate-100 text-slate-600 border-slate-200",
  takehome: "bg-amber-100 text-amber-700 border-amber-200",
  interview: "bg-violet-100 text-violet-700 border-violet-200",
  passed: "bg-sky-100 text-sky-700 border-sky-200",
  admitted: "bg-[#DE3D4D]/15 text-[#DE3D4D] border-[#DE3D4D]/25",
  accepted_paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

function StageBadge({ stage }: { stage: string }) {
  const label = stage === "accepted_paid" ? "accepted (paid)" : stage;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium uppercase tracking-wide ${STAGE_COLORS[stage] ?? STAGE_COLORS.applied}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
