import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Snowflake } from "lucide-react";
import { Board } from "@/components/obp/Board";
import {
  Announcements,
  ObpNav,
  StageTimeline,
  readCode,
  timeAgo,
  usePoll,
  useServerNow,
} from "@/components/obp/shared";
import {
  obpLeaderboard,
  obpPublicState,
  obpSignIn,
  type Leaderboard,
  type PublicState,
} from "@/lib/obp/obp.functions";

export const Route = createFileRoute("/broken-prod/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Operation: Broken Prod" },
      {
        name: "description",
        content: "Live scores: hidden tests, exam, AI-judged builds and First Blood.",
      },
      { property: "og:title", content: "Operation: Broken Prod — Leaderboard" },
      { property: "og:description", content: "Who fixed production first?" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const [board, setBoard] = useState<Leaderboard | null>(null);
  const [state, setState] = useState<PublicState | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const now = useServerNow(board?.server_now);

  usePoll(async () => {
    const [b, s] = await Promise.all([obpLeaderboard(), obpPublicState()]);
    setBoard(b);
    setState(s);
  }, 5000);
  usePoll(async () => {
    const code = readCode();
    if (code && !me) setMe((await obpSignIn({ data: { code } })).id);
  }, 60_000);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ObpNav active="leaderboard" />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="label-eyebrow text-primary">Live scores</div>
            <h1 className="display mt-2 text-5xl sm:text-6xl">Leaderboard</h1>
          </div>
          {board?.frozen && (
            <div className="flex items-center gap-2 rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-sm text-sky-900">
              <Snowflake className="h-4 w-4" /> Frozen{" "}
              {board.frozen_at ? timeAgo(board.frozen_at, now) : ""}. The final reveal is at the
              end.
            </div>
          )}
        </section>
        {state && <Announcements items={state.announcements} max={1} />}
        {state && <StageTimeline stages={state.stages} current={state.current_stage} now={now} />}

        <div className="grid grid-cols-1 [&>*]:min-w-0 gap-6 lg:grid-cols-[1fr_320px]">
          <section>
            {board ? (
              <Board rows={board.rows} highlight={me} />
            ) : (
              <div className="h-96 animate-pulse rounded-md bg-muted" />
            )}
          </section>
          <aside className="space-y-6">
            <div className="rounded-md border border-rule bg-card p-5">
              <h2 className="serif text-2xl">🩸 First Blood</h2>
              <p className="mt-1 text-xs text-muted-foreground">First to pass a nasty test: +5</p>
              <ul className="mt-3 space-y-2 text-sm">
                {(board?.first_bloods ?? []).length === 0 && (
                  <li className="text-muted-foreground">No blood drawn yet.</li>
                )}
                {(board?.first_bloods ?? []).map((f) => (
                  <li key={f.test_id} className="flex items-center gap-2">
                    <span>{f.emoji}</span>
                    <span className="flex-1 truncate">
                      <b className="font-medium">{f.name}</b>{" "}
                      <span className="text-muted-foreground">· {f.label}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border border-rule bg-card p-5">
              <h2 className="serif text-2xl">🎓 Exam</h2>
              <p className="mt-1 text-xs text-muted-foreground">Scaled score · pass at 720</p>
              <ol className="mt-3 space-y-1.5 text-sm">
                {(board?.exam ?? []).length === 0 && (
                  <li className="text-muted-foreground">No finished exams yet.</li>
                )}
                {(board?.exam ?? []).slice(0, 10).map((e, i) => (
                  <li key={e.team_id} className="flex items-center gap-2">
                    <span className="w-5 font-mono text-xs text-muted-foreground">{i + 1}</span>
                    <span>{e.emoji}</span>
                    <span className="flex-1 truncate">{e.name}</span>
                    <span
                      className={`font-mono tabular-nums ${e.passed ? "text-emerald-700" : ""}`}
                    >
                      {e.scaled}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
