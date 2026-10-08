import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bug, GraduationCap, Hammer, Rocket, Siren, Trophy, type LucideIcon } from "lucide-react";
import type { Announcement, Stage } from "@/lib/obp/obp.functions";
import { Markdown } from "./Markdown";

export const STAGE_META: Record<number, { icon: LucideIcon; short: string; tag: string }> = {
  1: { icon: Bug, short: "Bug Bounty", tag: "Stage 1" },
  4: { icon: GraduationCap, short: "The Arena", tag: "Exam" },
  2: { icon: Hammer, short: "The Forge", tag: "Stage 2" },
  3: { icon: Rocket, short: "Ship It", tag: "Stage 3" },
};

export const CODE_KEY = "obp-personal-code";

export function readCode(): string | null {
  try {
    return localStorage.getItem(CODE_KEY);
  } catch {
    return null;
  }
}
export function writeCode(code: string | null) {
  try {
    if (code) localStorage.setItem(CODE_KEY, code);
    else localStorage.removeItem(CODE_KEY);
  } catch {
    /* private mode: the code just isn't remembered */
  }
}

/** Calls `fn` now and every `ms` while the tab is visible. Returns a manual refresh. */
export function usePoll(fn: () => Promise<void> | void, ms: number, deps: unknown[] = []) {
  const ref = useRef(fn);
  ref.current = fn;
  const run = useCallback(() => {
    void Promise.resolve(ref.current()).catch(() => {});
  }, []);
  useEffect(() => {
    run();
    const t = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") run();
    }, ms);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms, run, ...deps]);
  return run;
}

/** Ticking "now" corrected by the server clock offset. */
export function useServerNow(serverNow: string | undefined, tickMs = 1000) {
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (serverNow) setOffset(new Date(serverNow).getTime() - Date.now());
  }, [serverNow]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(t);
  }, [tickMs]);
  return now + offset;
}

export function fmtClock(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h > 0 ? `${h}:` : ""}${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function timeAgo(iso: string | null | undefined, now = Date.now()) {
  if (!iso) return "—";
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ago`;
}

export function orderedStages(stages: Stage[]) {
  return [...stages].sort((a, b) => a.position - b.position);
}

export function currentStage(stages: Stage[], current: number) {
  return stages.find((s) => s.id === current) ?? null;
}

export function StageTimeline({
  stages,
  current,
  now,
}: {
  stages: Stage[];
  current: number;
  now: number;
}) {
  const list = orderedStages(stages);
  if (!list.length) return null;
  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {list.map((s) => {
        const meta = STAGE_META[s.id];
        const Icon = meta?.icon ?? Siren;
        const live = s.status === "open" && s.id === current;
        const left = live && s.ends_at ? new Date(s.ends_at).getTime() - now : 0;
        return (
          <li
            key={s.id}
            className={`relative overflow-hidden rounded-md border p-3 transition-colors ${
              live
                ? "border-primary bg-primary/[0.06]"
                : s.status === "closed"
                  ? "border-rule bg-card opacity-70"
                  : "border-rule bg-card"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {meta?.tag ?? `Stage ${s.id}`}
              </span>
              <span
                className={`font-mono text-[10px] uppercase tracking-widest ${live ? "text-primary" : s.status === "closed" ? "text-muted-foreground" : "text-muted-foreground/70"}`}
              >
                {live ? "● live" : s.status === "closed" ? "done" : "locked"}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Icon className={`h-4 w-4 ${live ? "text-primary" : "text-muted-foreground"}`} />
              <span className="text-sm font-semibold">{s.title}</span>
            </div>
            <div className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">
              {live
                ? left > 0
                  ? `${fmtClock(left)} left`
                  : "time's up"
                : `${s.duration_minutes} min`}
            </div>
            {live && s.started_at && s.ends_at && (
              <div className="absolute inset-x-0 bottom-0 h-1 bg-primary/15">
                <div
                  className="h-full bg-primary transition-[width] duration-1000"
                  style={{
                    width: `${Math.min(100, Math.max(0, ((now - new Date(s.started_at).getTime()) / (new Date(s.ends_at).getTime() - new Date(s.started_at).getTime())) * 100))}%`,
                  }}
                />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

const ANN_STYLE: Record<Announcement["kind"], string> = {
  info: "border-sky-300/60 bg-sky-50 text-sky-950 dark:bg-sky-950/30 dark:text-sky-100",
  alert: "border-amber-300/70 bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100",
  win: "border-emerald-300/70 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-100",
  twist: "border-primary bg-primary text-primary-foreground",
};

export function Announcements({ items, max = 2 }: { items: Announcement[]; max?: number }) {
  if (!items.length) return null;
  return (
    <div className="space-y-2">
      {items.slice(0, max).map((a) => (
        <div key={a.id} className={`rounded-md border px-4 py-3 text-sm ${ANN_STYLE[a.kind]}`}>
          <div className="mb-1 font-mono text-[10px] uppercase tracking-widest opacity-75">
            {a.kind === "twist"
              ? "🌪️ plot twist"
              : a.kind === "win"
                ? "🏆 shout-out"
                : a.kind === "alert"
                  ? "⚠️ heads up"
                  : "📣 announcement"}{" "}
            ·{" "}
            {new Date(a.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
          <Markdown text={a.message_md} />
        </div>
      ))}
    </div>
  );
}

export function ObpNav({ active }: { active: "mission" | "exam" | "leaderboard" }) {
  const item = (
    to: "/broken-prod" | "/broken-prod/exam" | "/broken-prod/leaderboard",
    key: typeof active,
    label: string,
    Icon: LucideIcon,
  ) => (
    <Link
      to={to}
      className={`flex items-center gap-1.5 text-xs uppercase tracking-widest transition-colors ${active === key ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/broken-prod" className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          <span className="serif text-lg leading-none">Operation: Broken Prod</span>
        </Link>
        <nav className="flex items-center gap-5">
          {item("/broken-prod", "mission", "Mission", Siren)}
          {item("/broken-prod/exam", "exam", "Exam", GraduationCap)}
          {item("/broken-prod/leaderboard", "leaderboard", "Leaderboard", Trophy)}
        </nav>
      </div>
    </header>
  );
}

export function errMsg(e: unknown) {
  const m = e instanceof Error ? e.message : String(e);
  return m.replace(/^.*?ERROR:\s*/, "");
}
