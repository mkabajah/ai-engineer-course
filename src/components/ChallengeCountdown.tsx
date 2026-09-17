import { useEffect, useState } from "react";

type Props = {
  remainingMs: number;
  totalMs: number;
  state: "not_started" | "live" | "paused" | "finished";
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = () => setReduced(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

export function ChallengeCountdown({ remainingMs, totalMs, state }: Props) {
  const reduced = useReducedMotion();
  const clamped = Math.max(0, remainingMs);
  const pct = totalMs > 0 ? Math.max(0, Math.min(1, clamped / totalMs)) : 0;

  const totalSec = Math.ceil(clamped / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");

  const finalPush = state === "live" && clamped > 0 && clamped <= 5 * 60_000;
  const urgency =
    state === "finished" || clamped === 0
      ? "finished"
      : state === "paused"
        ? "paused"
        : finalPush
          ? "critical"
          : pct <= 0.35
            ? "urgent"
            : pct <= 0.7
              ? "focused"
              : "calm";
  const color = `var(--timer-${urgency})`;
  const animate = finalPush && !reduced;

  const R = 132;
  const C = 2 * Math.PI * R;

  return (
    <div
      className={`challenge-timer relative mx-auto w-full max-w-[440px]${animate ? " challenge-timer--critical" : ""}`}
    >
      {animate && <span className="timer-critical-glow" aria-hidden="true" />}
      {animate &&
        [0, 1, 2].map((i) => (
          <span key={i} className="timer-burst-ring" aria-hidden="true" />
        ))}
      {!animate && (
        <span className="challenge-timer-pulse pointer-events-none absolute inset-0 -z-10 rounded-full bg-primary/10" />
      )}
      <svg viewBox="0 0 300 300" className="w-full" role="img" aria-label={`Time remaining ${mm}:${ss}`}>
        <circle cx="150" cy="150" r={R} fill="none" stroke="var(--rule)" strokeWidth="10" />
        <circle
          cx="150"
          cy="150"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct)}
          transform="rotate(-90 150 150)"
          style={{ transition: reduced ? "none" : "stroke-dashoffset 0.9s linear, stroke 0.4s ease" }}
        />
        <g className={animate ? "timer-beat-text" : undefined}>
          <text
            x="150"
            y="150"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="var(--font-mono)"
            fontSize="70"
            fontWeight="500"
            fill={color}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {`${mm}:${ss}`}
          </text>
        </g>
        <text
          x="150"
          y="205"
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize="13"
          letterSpacing="3"
          fill="var(--muted-foreground)"
        >
          {state === "finished"
            ? "TIME IS UP"
            : state === "paused"
              ? "PAUSED"
              : state === "not_started"
                ? "NOT STARTED"
                : finalPush
                  ? "FINAL MINUTES"
                  : "REMAINING"}
        </text>
      </svg>
    </div>
  );
}
