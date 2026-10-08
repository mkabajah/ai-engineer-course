// Projector view: open on the big screen for the whole event (dark, large type, no interaction needed).
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Board } from "@/components/obp/Board";
import { Markdown } from "@/components/obp/Markdown";
import {
  STAGE_META,
  currentStage,
  fmtClock,
  orderedStages,
  usePoll,
  useServerNow,
} from "@/components/obp/shared";
import {
  obpLeaderboard,
  obpPublicState,
  type Leaderboard,
  type PublicState,
} from "@/lib/obp/obp.functions";

export const Route = createFileRoute("/broken-prod/screen")({
  head: () => ({ meta: [{ title: "Broken Prod — Live" }, { name: "robots", content: "noindex" }] }),
  component: ScreenPage,
});

function ScreenPage() {
  const [state, setState] = useState<PublicState | null>(null);
  const [board, setBoard] = useState<Leaderboard | null>(null);
  const now = useServerNow(state?.server_now);
  usePoll(async () => {
    const [s, b] = await Promise.all([obpPublicState(), obpLeaderboard()]);
    setState(s);
    setBoard(b);
  }, 4000);

  if (!state || !board) return <div className="min-h-screen bg-[#0B1020]" />;
  const stage = currentStage(state.stages, state.current_stage);
  const left =
    stage?.status === "open" && stage.ends_at ? new Date(stage.ends_at).getTime() - now : null;
  const twist = state.announcements.find(
    (a) => a.kind === "twist" && now - new Date(a.created_at).getTime() < 3 * 60_000,
  );
  const latest = state.announcements.find(
    (a) => a.kind !== "twist" && now - new Date(a.created_at).getTime() < 10 * 60_000,
  );
  const siteUrl = typeof window === "undefined" ? "" : `${window.location.host}/broken-prod`;
  const examMode = state.current_stage === 4;

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#0B1020] text-[#EEF0F7]"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <div className="grid min-h-screen grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-10 p-12">
        <section className="flex flex-col">
          <div className="flex items-center gap-3 font-mono text-sm uppercase tracking-[0.3em] text-[#FF7A45]">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF7A45] opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-[#FF7A45]" />
            </span>
            Operation: Broken Prod
          </div>

          {state.current_stage === 0 ? (
            <div className="mt-auto mb-auto">
              <div className="font-serif text-8xl leading-[0.95]">
                Production
                <br />
                is down.
              </div>
              <div className="mt-10 font-mono text-lg uppercase tracking-[0.3em] text-white/50">
                Event code
              </div>
              <div className="mt-2 font-mono text-8xl font-bold tracking-[0.15em] text-[#FF7A45]">
                {state.event_code_now}
              </div>
              <div className="mt-8 text-2xl text-white/70">
                {siteUrl} → download →{" "}
                <span className="font-mono text-white">npm run register</span>
              </div>
              <div className="mt-6 text-3xl">
                <span className="font-mono text-5xl font-bold tabular-nums">
                  {state.registered_count}
                </span>
                <span className="ml-3 text-white/60">engineers on call</span>
              </div>
            </div>
          ) : state.current_stage === 99 ? (
            <div className="my-auto font-serif text-8xl leading-[0.95]">
              Production
              <br />
              is restored.
            </div>
          ) : (
            <div className="my-auto">
              <div className="font-mono text-xl uppercase tracking-[0.3em] text-white/50">
                {STAGE_META[state.current_stage]?.tag ?? "Stage"}
              </div>
              <div className="mt-2 font-serif text-8xl leading-none">{stage?.title}</div>
              {stage?.subtitle && (
                <div className="mt-4 max-w-xl text-2xl text-white/60">{stage.subtitle}</div>
              )}
              {left !== null && (
                <div
                  className={`mt-10 font-mono text-[9rem] font-bold leading-none tabular-nums ${left < 5 * 60_000 ? "text-[#FF7A45]" : ""}`}
                >
                  {fmtClock(left)}
                </div>
              )}
            </div>
          )}

          <ol className="mt-auto grid grid-cols-4 gap-2">
            {orderedStages(state.stages).map((s) => (
              <li
                key={s.id}
                className={`rounded-md border px-3 py-2 font-mono text-xs uppercase tracking-widest ${
                  s.status === "open"
                    ? "border-[#FF7A45] text-[#FF7A45]"
                    : s.status === "closed"
                      ? "border-white/10 text-white/30"
                      : "border-white/10 text-white/50"
                }`}
              >
                {s.title}
              </li>
            ))}
          </ol>
        </section>

        <section className="flex min-h-0 flex-col">
          <div className="flex items-center justify-between">
            <div className="font-mono text-sm uppercase tracking-[0.3em] text-white/50">
              {examMode && board.exam.length ? "Exam scores" : "Leaderboard"}
            </div>
            {board.frozen && (
              <div className="rounded-full bg-sky-400/15 px-4 py-1 font-mono text-sm text-sky-200">
                🧊 FROZEN
              </div>
            )}
          </div>
          <div className="mt-4 min-h-0 flex-1 overflow-hidden">
            {examMode && board.exam.length ? (
              <ol className="space-y-2">
                {board.exam.slice(0, 12).map((e, i) => (
                  <li
                    key={e.team_id}
                    className="flex items-center gap-4 rounded-md border border-white/10 bg-white/[0.04] px-5 py-3 text-2xl"
                  >
                    <span className="w-8 font-mono text-white/50">{i + 1}</span>
                    <span>{e.emoji}</span>
                    <span className="flex-1 truncate">{e.name}</span>
                    {e.passed && <span>🎓</span>}
                    <span className="font-mono font-bold tabular-nums">{e.scaled}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <Board rows={board.rows} big limit={12} />
            )}
          </div>
          {board.first_bloods.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {board.first_bloods.slice(-6).map((f) => (
                <span
                  key={f.test_id}
                  className="rounded-full bg-[#7A1426] px-3 py-1 font-mono text-sm"
                >
                  🩸 {f.emoji} {f.name} · {f.test_id}
                </span>
              ))}
            </div>
          )}
          {latest && (
            <div className="mt-4 rounded-md border border-white/15 bg-white/[0.06] px-5 py-4 text-xl">
              <Markdown text={latest.message_md} />
            </div>
          )}
        </section>
      </div>

      {twist && (
        <div className="absolute inset-0 z-50 flex flex-col justify-center bg-[#7A1426] p-20 text-[#FFF4F0]">
          <div className="font-mono text-2xl uppercase tracking-[0.3em] text-[#FFC2A8]">
            The client just called
          </div>
          <div className="mt-4 font-serif text-[10rem] leading-none">Plot twist.</div>
          <Markdown text={twist.message_md} className="mt-10 max-w-6xl text-3xl" />
        </div>
      )}
    </div>
  );
}
