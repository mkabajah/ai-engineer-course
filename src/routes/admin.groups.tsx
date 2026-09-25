import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/groups")({
  head: () => ({ meta: [
    { title: "Candidate Groups — Hasoub AI Accelerator Admin" },
    { name: "description", content: "Create balanced participant groups for the accelerator." },
    { property: "og:title", content: "Candidate Groups — Hasoub AI Accelerator Admin" },
    { property: "og:description", content: "Create balanced participant groups for the accelerator." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: GroupsPage,
});

type Candidate = {
  id: string;
  full_name: string;
  email: string;
  stage: string;
  total_score: number | null;
  strength: string | null;
};

const DIMS = ["shipping", "curiosity", "fit", "communication", "portfolio"] as const;

const DIM_COLORS: Record<string, string> = {
  shipping: "bg-amber-100 text-amber-700 border-amber-200",
  curiosity: "bg-violet-100 text-violet-700 border-violet-200",
  fit: "bg-sky-100 text-sky-700 border-sky-200",
  communication: "bg-emerald-100 text-emerald-700 border-emerald-200",
  portfolio: "bg-[#DE3D4D]/15 text-[#DE3D4D] border-[#DE3D4D]/25",
  unknown: "bg-slate-100 text-slate-600 border-slate-200",
};

const ELIGIBLE_STAGES = ["passed", "admitted", "accepted_paid"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/**
 * Balanced "lottery" draft:
 * 1. Top scorers are spread one-per-group first (every group gets a strong anchor).
 * 2. Remaining candidates are drafted snake-style, preferring the strength
 *    (AI dimension) the group is still missing → complementary teams.
 * 3. Ties are broken randomly, so every draw is a fresh lottery.
 */
function buildGroups(candidates: Candidate[], groupSize: number): Candidate[][] {
  const n = candidates.length;
  if (n === 0 || groupSize < 1) return [];
  const groupCount = Math.max(1, Math.ceil(n / groupSize));
  const groups: Candidate[][] = Array.from({ length: groupCount }, () => []);

  const score = (c: Candidate) => (c.total_score ?? -1);
  // slight jitter so equal scores shuffle between draws
  const pool = shuffle(candidates).sort((a, b) => score(b) - score(a));

  // 1. anchors — highest scorer per group
  const anchors = pool.splice(0, Math.min(groupCount, pool.length));
  shuffle(anchors).forEach((c, i) => groups[i]!.push(c));

  // 2. snake draft with complementary-strength preference
  let round = 0;
  while (pool.length > 0) {
    const order = round % 2 === 0
      ? groups.map((_, i) => i)
      : groups.map((_, i) => groupCount - 1 - i);
    for (const gi of order) {
      if (pool.length === 0) break;
      const g = groups[gi]!;
      if (g.length >= groupSize && pool.length < groupCount) break;
      const have = new Set(g.map((c) => c.strength ?? "unknown"));
      let idx = pool.findIndex((c) => !have.has(c.strength ?? "unknown"));
      if (idx === -1) idx = 0;
      g.push(pool.splice(idx, 1)[0]!);
    }
    round++;
    if (round > 200) break;
  }

  return groups;
}

function GroupsPage() {
  const [rows, setRows] = useState<Candidate[] | null>(null);
  const [size, setSize] = useState(4);
  const [stageFilter, setStageFilter] = useState<string>("passed");
  const [groups, setGroups] = useState<Candidate[][] | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [revealed, setRevealed] = useState(0);
  const [ticker, setTicker] = useState<string>("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    (async () => {
      const { data: apps, error } = await supabase
        .from("applications")
        .select("id, full_name, email, stage, total_score")
        .in("stage", ELIGIBLE_STAGES)
        .limit(500);
      if (error) {
        toast.error(error.message);
        setRows([]);
        return;
      }
      const ids = (apps ?? []).map((a) => a.id);
      const strengthMap = new Map<string, string>();
      if (ids.length > 0) {
        const { data: scores } = await supabase
          .from("ai_scores")
          .select("application_id, dimension, score")
          .in("application_id", ids);
        const best = new Map<string, { dim: string; score: number }>();
        for (const s of scores ?? []) {
          const cur = best.get(s.application_id);
          if (!cur || Number(s.score) > cur.score) {
            best.set(s.application_id, { dim: s.dimension, score: Number(s.score) });
          }
        }
        for (const [k, v] of best) strengthMap.set(k, v.dim);
      }
      setRows(
        (apps ?? []).map((a) => ({
          id: a.id,
          full_name: a.full_name,
          email: a.email,
          stage: a.stage,
          total_score: a.total_score,
          strength: strengthMap.get(a.id) ?? null,
        })),
      );
    })();
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const eligible = useMemo(() => {
    if (!rows) return [];
    return stageFilter === "all" ? rows : rows.filter((r) => r.stage === stageFilter);
  }, [rows, stageFilter]);

  const groupCount = Math.max(1, Math.ceil(eligible.length / Math.max(1, size)));

  const draw = useCallback(() => {
    if (eligible.length === 0) {
      toast.error("No eligible candidates for this stage.");
      return;
    }
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setGroups(null);
    setRevealed(0);
    setDrawing(true);

    // spinning names ticker
    const names = eligible.map((c) => c.full_name);
    let tick = 0;
    const spin = setInterval(() => {
      setTicker(names[Math.floor(Math.random() * names.length)] ?? "");
      tick++;
    }, 70);

    const result = buildGroups(eligible, size);
    const t = setTimeout(() => {
      clearInterval(spin);
      setTicker("");
      setGroups(result);
      setDrawing(false);
      result.forEach((_, i) => {
        timers.current.push(setTimeout(() => setRevealed(i + 1), 320 * (i + 1)));
      });
      toast.success(`${result.length} groups drawn`);
    }, 1400);
    timers.current.push(t);
    void tick;
  }, [eligible, size]);

  const copyAll = () => {
    if (!groups) return;
    const text = groups
      .map((g, i) => `Group ${i + 1}\n` + g.map((c) => `- ${c.full_name} <${c.email}>`).join("\n"))
      .join("\n\n");
    navigator.clipboard.writeText(text).then(() => toast.success("Copied to clipboard"));
  };

  const exportCsv = () => {
    if (!groups) return;
    const lines = ["group,name,email,ai_score,strength"];
    groups.forEach((g, i) =>
      g.forEach((c) =>
        lines.push(
          [`Group ${i + 1}`, c.full_name, c.email, c.total_score?.toFixed(1) ?? "", c.strength ?? ""]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(","),
        ),
      ),
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `groups-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="label-eyebrow">Team lottery</div>
          <h1 className="display text-5xl mt-2">Split into groups</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Random draw with a balanced mix — every group gets at least one high scorer and
            complementary strengths from the AI evaluation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="h-10 rounded-sm border border-input bg-background px-3 text-sm"
          >
            <option value="passed">Passed only</option>
            <option value="admitted">Admitted</option>
            <option value="accepted_paid">Accepted (Paid)</option>
            <option value="all">All eligible</option>
          </select>
          <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            Per group
            <Input
              type="number"
              min={2}
              max={12}
              value={size}
              onChange={(e) => setSize(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
              className="w-20"
            />
          </label>
          <button
            onClick={draw}
            disabled={drawing}
            className="h-10 rounded-sm bg-primary px-5 text-xs uppercase tracking-wider text-primary-foreground shadow-[0_0_24px_-6px_hsl(var(--primary))] disabled:opacity-50"
          >
            {drawing ? "Drawing…" : groups ? "Re-draw" : "Draw groups"}
          </button>
        </div>
      </div>

      <div className="mt-4 text-xs text-muted-foreground">
        {rows === null
          ? "Loading candidates…"
          : `${eligible.length} eligible candidate(s) · ${groupCount} group(s) of ~${size}`}
      </div>

      <div className="mt-4 max-w-3xl rounded-sm border border-rule bg-card p-4 text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">AI total eval</span> is each
        applicant's composite score (0–10). It blends five AI-graded dimensions with
        these weights: <span className="text-amber-600">Shipping 30%</span> (shipped
        end-to-end work), <span className="text-violet-600">Curiosity 25%</span> (genuine AI
        insight), <span className="text-sky-600">Fit 20%</span> (self-awareness),{" "}
        <span className="text-emerald-600">Communication 15%</span> (clear English), and{" "}
        <span className="text-[#DE3D4D]">Portfolio 10%</span> (real project links). The{" "}
        <span className="font-medium text-foreground">group average</span> shown per card is
        the mean of its members' composite scores — a quick read on overall team
        strength. Each candidate's coloured tag shows their single strongest dimension.
      </div>

      <AnimatePresence>
        {drawing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="mt-8 flex h-40 items-center justify-center rounded-sm border border-rule bg-card"
          >
            <div className="text-center">
              <div className="label-eyebrow">Shuffling</div>
              <div className="serif mt-2 text-3xl">{ticker || "…"}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {groups && (
        <>
          <div className="mt-8 flex gap-3">
            <button onClick={copyAll} className="h-9 rounded-sm border border-rule bg-card px-4 text-xs uppercase tracking-wider hover:bg-accent">
              Copy
            </button>
            <button onClick={exportCsv} className="h-9 rounded-sm border border-rule bg-card px-4 text-xs uppercase tracking-wider hover:bg-accent">
              Export CSV
            </button>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 18, rotateX: -8 }}
                animate={revealed > i ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 18 }}
                transition={{ type: "spring", stiffness: 220, damping: 22 }}
                className="rounded-sm border border-rule bg-card p-5"
              >
                <div className="flex items-baseline justify-between">
                  <h2 className="serif text-2xl">Group {i + 1}</h2>
                  <span className="text-xs text-muted-foreground">
                    AI total eval{" "}
                    {(
                      g.reduce((s, c) => s + (c.total_score ?? 0), 0) / Math.max(1, g.length)
                    ).toFixed(1)}
                  </span>
                </div>
                <ul className="mt-4 space-y-3">
                  {g.map((c, j) => (
                    <motion.li
                      key={c.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={revealed > i ? { opacity: 1, x: 0 } : { opacity: 0 }}
                      transition={{ delay: 0.06 * j }}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{c.full_name}</div>
                        <div className="truncate text-xs text-muted-foreground">{c.email}</div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                          DIM_COLORS[c.strength ?? "unknown"] ?? DIM_COLORS.unknown
                        }`}
                      >
                        {c.strength ?? "—"}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {rows !== null && eligible.length === 0 && !drawing && (
        <div className="mt-10 rounded-sm border border-rule bg-card p-10 text-center text-sm text-muted-foreground">
          No candidates in this stage yet. Mark candidates as “Passed” first.
        </div>
      )}

      <div className="mt-10 flex flex-wrap gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
        {DIMS.map((d) => (
          <span key={d} className={`rounded-full border px-2 py-0.5 ${DIM_COLORS[d]}`}>{d}</span>
        ))}
      </div>
    </section>
  );
}
