import { useMemo, useState } from "react";
import { Award, Medal, Trophy } from "lucide-react";
import type { LeaderboardRow } from "@/lib/challenge.functions";
import { Button } from "@/components/ui/button";

type SortKey = "points" | "name" | "status";

const EVAL_LABEL: Record<string, string> = {
  awaiting: "Awaiting review",
  evaluating: "Evaluating",
  evaluated: "Evaluated",
  needs_review: "Needs attention",
};

const EVAL_STYLE: Record<string, string> = {
  awaiting: "bg-muted text-muted-foreground border-rule",
  evaluating: "bg-secondary text-secondary-foreground border-rule",
  evaluated: "bg-emerald-100 text-emerald-700 border-emerald-200",
  needs_review: "bg-amber-100 text-amber-800 border-amber-200",
};

type Props = {
  rows: LeaderboardRow[];
  highlightId?: string | null;
  featured?: boolean;
};

function Score({ row, large = false }: { row: LeaderboardRow; large?: boolean }) {
  if (row.points == null) return <span className="text-muted-foreground">Pending</span>;
  return (
    <span className={`font-mono font-semibold ${large ? "text-3xl" : "text-base"}`}>
      {row.points}<span className="text-xs text-muted-foreground">/100</span>
      {row.is_final && <span className="ml-1.5 text-[10px] uppercase text-primary">final</span>}
    </span>
  );
}

export function ChallengeLeaderboard({ rows, highlightId, featured = false }: Props) {
  const [sort, setSort] = useState<SortKey>("points");
  const [asc, setAsc] = useState(false);

  const ranked = useMemo(
    () => [...rows].sort((a, b) => (b.points ?? -1) - (a.points ?? -1) || a.participant_name.localeCompare(b.participant_name)),
    [rows],
  );

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let difference = 0;
      if (sort === "points") difference = (a.points ?? -1) - (b.points ?? -1);
      else if (sort === "name") difference = a.participant_name.localeCompare(b.participant_name);
      else difference = a.eval_status.localeCompare(b.eval_status);
      if (difference === 0) difference = (a.points ?? -1) - (b.points ?? -1);
      return asc ? difference : -difference;
    });
    return copy;
  }, [rows, sort, asc]);

  function toggle(key: SortKey) {
    if (key === sort) setAsc((value) => !value);
    else {
      setSort(key);
      setAsc(key === "name");
    }
  }

  const arrow = (key: SortKey) => (sort === key ? (asc ? "↑" : "↓") : "");
  const podium = ranked.slice(0, 3);

  return (
    <section className="challenge-reveal rounded-md border border-rule bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="label-eyebrow flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" /> Leaderboard
        </h2>
        <span className="text-xs text-muted-foreground">
          {rows.length} participant{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      {featured && podium.length > 0 && (
        <div className="leaderboard-podium mt-6 grid items-end gap-3 sm:grid-cols-3">
          {podium.map((row, index) => {
            const place = index + 1;
            return (
              <article
                key={row.id}
                className={`leaderboard-podium-card border border-rule bg-background p-4 text-center ${place === 1 ? "sm:order-2 sm:pb-7 sm:pt-7" : place === 2 ? "sm:order-1" : "sm:order-3"}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`mx-auto grid place-items-center rounded-full border border-primary/25 bg-primary/10 text-primary ${place === 1 ? "h-14 w-14" : "h-11 w-11"}`}>
                  {place === 1 ? <Trophy className="h-6 w-6" /> : place === 2 ? <Medal className="h-5 w-5" /> : <Award className="h-5 w-5" />}
                </div>
                <p className="mt-3 text-xs font-semibold uppercase text-muted-foreground">#{place}</p>
                <h3 className="mt-1 truncate text-xl">{row.participant_name}</h3>
                <p className="truncate text-xs text-muted-foreground">@{row.github_username}</p>
                <div className="mt-3"><Score row={row} large={place === 1} /></div>
              </article>
            );
          })}
        </div>
      )}

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No submissions are on the board yet.</p>
      ) : (
        <div className="-mx-5 mt-6 overflow-x-auto sm:mx-0">
          <table className="w-full min-w-[540px] text-left text-sm">
            <thead>
              <tr className="border-b border-rule text-xs uppercase text-muted-foreground">
                <th className="px-3 py-2 font-medium">Rank</th>
                <th className="px-3 py-2 font-medium">
                  <Button type="button" variant="ghost" size="sm" onClick={() => toggle("name")} className="-ml-3">
                    Participant {arrow("name")}
                  </Button>
                </th>
                <th className="px-3 py-2 font-medium">Project</th>
                <th className="px-3 py-2 font-medium">
                  <Button type="button" variant="ghost" size="sm" onClick={() => toggle("status")} className="-ml-3">
                    Status {arrow("status")}
                  </Button>
                </th>
                <th className="px-3 py-2 text-right font-medium">
                  <Button type="button" variant="ghost" size="sm" onClick={() => toggle("points")} className="-mr-3">
                    Points {arrow("points")}
                  </Button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr key={row.id} className={`border-b border-rule/60 last:border-0 ${row.id === highlightId ? "bg-primary/5" : ""}`}>
                  <td className="px-3 py-3 font-mono text-xs text-muted-foreground">
                    #{ranked.findIndex((candidate) => candidate.id === row.id) + 1}
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium">{row.participant_name}</div>
                    <div className="text-xs text-muted-foreground">@{row.github_username}</div>
                  </td>
                  <td className="max-w-48 truncate px-3 py-3 text-xs text-muted-foreground">{row.repo_full_name ?? "—"}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${EVAL_STYLE[row.eval_status] ?? "border-rule bg-muted text-muted-foreground"}`}>
                      {EVAL_LABEL[row.eval_status] ?? row.eval_status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right"><Score row={row} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 px-1 text-xs text-muted-foreground">
        AI scores are provisional until your instructor confirms them — confirmed marks are labelled final.
      </p>
    </section>
  );
}