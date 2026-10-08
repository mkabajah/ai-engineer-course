import { useEffect, useRef, useState } from "react";
import type { BoardRow } from "@/lib/obp/obp.functions";

/** Ranked list with FLIP-style movement when positions change. `big` = projector sizing. */
export function Board({
  rows,
  big = false,
  limit,
  highlight,
}: {
  rows: BoardRow[];
  big?: boolean;
  limit?: number;
  highlight?: string | null;
}) {
  const list = (limit ? rows.slice(0, limit) : rows).map((r, i, all) => ({
    ...r,
    rank: 1 + all.filter((x) => Number(x.score) > Number(r.score)).length,
    index: i,
  }));
  const prev = useRef(new Map<string, number>());
  const [moved, setMoved] = useState<Record<string, "up" | "down">>({});
  useEffect(() => {
    const m: Record<string, "up" | "down"> = {};
    for (const r of list) {
      const before = prev.current.get(r.team_id);
      if (before !== undefined && before !== r.index)
        m[r.team_id] = r.index < before ? "up" : "down";
    }
    prev.current = new Map(list.map((r) => [r.team_id, r.index]));
    if (Object.keys(m).length) {
      setMoved(m);
      const t = setTimeout(() => setMoved({}), 2500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.map((r) => `${r.team_id}:${r.score}`).join("|")]);

  if (!list.length)
    return (
      <p
        className={`rounded-md border border-dashed p-8 text-center ${big ? "border-white/20 text-white/60" : "border-rule text-muted-foreground"}`}
      >
        No one on the board yet.
      </p>
    );

  const top = Math.max(1, ...list.map((r) => Number(r.score)));
  return (
    <ol className={big ? "space-y-2" : "space-y-1.5"}>
      {list.map((r) => {
        const medal = r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : null;
        const mv = moved[r.team_id];
        return (
          <li
            key={r.team_id}
            className={`relative flex items-center gap-3 overflow-hidden rounded-md border transition-all duration-700 ${
              big ? "border-white/10 bg-white/[0.04] px-5 py-3" : "border-rule bg-card px-4 py-2.5"
            } ${mv === "up" ? (big ? "bg-emerald-400/15" : "bg-emerald-50") : ""} ${highlight === r.team_id ? "ring-2 ring-primary" : ""}`}
          >
            <span
              className={`absolute inset-y-0 left-0 ${big ? "bg-white/[0.04]" : "bg-primary/[0.05]"} transition-[width] duration-1000`}
              style={{ width: `${Math.max(0, (Number(r.score) / top) * 100)}%` }}
            />
            <span
              className={`relative w-10 text-center font-mono tabular-nums ${big ? "text-2xl" : "text-sm"} ${r.rank <= 3 ? "" : big ? "text-white/50" : "text-muted-foreground"}`}
            >
              {medal ?? r.rank}
            </span>
            <span className={`relative ${big ? "text-3xl" : "text-xl"}`}>{r.emoji}</span>
            <span
              className={`relative min-w-0 flex-1 truncate font-medium ${big ? "text-2xl" : "text-sm"}`}
            >
              {r.name}
              {mv === "up" && <span className="ml-2 text-emerald-500">▲</span>}
            </span>
            {r.badges?.length > 0 && (
              <span
                className={`relative hidden gap-0.5 sm:flex ${big ? "text-xl" : "text-sm"}`}
                title={r.badges.map((b) => b.title).join(", ")}
              >
                {r.badges.slice(0, 5).map((b, i) => (
                  <span key={i}>{b.emoji}</span>
                ))}
              </span>
            )}
            {!big && (
              <span className="relative hidden gap-1 font-mono text-[10px] text-muted-foreground md:flex">
                {Number(r.hidden_test_points) !== 0 && <Chip>tests {r.hidden_test_points}</Chip>}
                {Number(r.exam_points) !== 0 && <Chip>exam {r.exam_points}</Chip>}
                {Number(r.challenge_points) !== 0 && <Chip>judged {r.challenge_points}</Chip>}
                {Number(r.first_blood_points) !== 0 && <Chip>🩸 {r.first_blood_points}</Chip>}
                {Number(r.hint_cost) !== 0 && <Chip>hints −{r.hint_cost}</Chip>}
              </span>
            )}
            <span
              className={`relative w-20 text-right font-mono font-semibold tabular-nums ${big ? "text-3xl" : "text-base"}`}
            >
              {r.score}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-sm bg-muted px-1.5 py-0.5">{children}</span>;
}
