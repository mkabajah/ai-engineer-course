// Support inbox visuals shared by the projector and the challenge page:
// severity chips, the "new ticket" emergency light and an optional siren.
import { useEffect, useRef, useState } from "react";
import type { Severity, Ticket } from "@/lib/obp/obp.functions";

export const SEVERITY: Record<
  Severity,
  { label: string; chip: string; dark: string; dot: string }
> = {
  P1: {
    label: "P1 · critical",
    chip: "bg-primary text-primary-foreground",
    dark: "bg-[#E5484D] text-white",
    dot: "#E5484D",
  },
  P2: {
    label: "P2 · high",
    chip: "bg-amber-500 text-white",
    dark: "bg-[#F5A524] text-[#1A1206]",
    dot: "#F5A524",
  },
  P3: {
    label: "P3 · normal",
    chip: "bg-muted text-muted-foreground",
    dark: "bg-white/15 text-white/80",
    dot: "#8B93A7",
  },
};

export function SeverityChip({ s, dark = false }: { s: Severity; dark?: boolean }) {
  const meta = SEVERITY[s] ?? SEVERITY.P3;
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${dark ? meta.dark : meta.chip}`}
    >
      {s}
    </span>
  );
}

/** A ticket that arrived after the stage started (the first batch at the start is not "new"). */
export function isLateTicket(t: Ticket, stageStartedAt: string | null | undefined) {
  if (!stageStartedAt) return true;
  return new Date(t.released_at).getTime() - new Date(stageStartedAt).getTime() > 30_000;
}

/** Released less than `ms` ago AND after the stage's first batch. */
export function isFreshTicket(
  t: Ticket,
  now: number,
  stageStartedAt: string | null | undefined,
  ms = 90_000,
) {
  return isLateTicket(t, stageStartedAt) && now - new Date(t.released_at).getTime() < ms;
}

/**
 * Detects tickets that arrive while the page is open (not the first batch at the stage start,
 * not the ones already there on load). Returns the ticket to alert about and until when.
 */
export function useNewTicketAlert(
  tickets: Ticket[] | undefined,
  now: number,
  stageStartedAt: string | null | undefined,
  holdMs = 12_000,
) {
  const seen = useRef<Set<string> | null>(null);
  const [alert, setAlert] = useState<{ ticket: Ticket; until: number } | null>(null);
  useEffect(() => {
    if (!tickets) return;
    if (seen.current === null) {
      // first load: a late ticket released in the last 20 s still deserves the siren
      seen.current = new Set(
        tickets.filter((t) => !isFreshTicket(t, now, stageStartedAt, 20_000)).map((t) => t.id),
      );
    }
    const fresh = tickets.filter(
      (t) => !seen.current!.has(t.id) && isLateTicket(t, stageStartedAt),
    );
    tickets.forEach((t) => seen.current!.add(t.id));
    if (fresh.length) {
      // the most severe of the new ones wins
      const pick = [...fresh].sort((a, b) => a.severity.localeCompare(b.severity))[0];
      setAlert({ ticket: pick, until: Date.now() + holdMs });
    }
  }, [tickets, now, stageStartedAt, holdMs]);
  useEffect(() => {
    if (!alert) return;
    const t = setTimeout(() => setAlert(null), Math.max(0, alert.until - Date.now()));
    return () => clearTimeout(t);
  }, [alert]);
  return alert;
}

/** A two-tone siren with the Web Audio API (only after a click: browsers block autoplay). */
export function useSiren() {
  const ctx = useRef<AudioContext | null>(null);
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const unlock = () => {
      if (ctx.current) return;
      try {
        ctx.current = new AudioContext();
        setEnabled(true);
      } catch {
        /* no audio */
      }
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);
  const play = (seconds = 2.4) => {
    const ac = ctx.current;
    if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sawtooth";
    const t0 = ac.currentTime;
    for (let i = 0; i < seconds / 0.6; i++) {
      osc.frequency.setValueAtTime(660, t0 + i * 0.6);
      osc.frequency.linearRampToValueAtTime(990, t0 + i * 0.6 + 0.3);
      osc.frequency.linearRampToValueAtTime(660, t0 + i * 0.6 + 0.6);
    }
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.12, t0 + 0.05);
    gain.gain.setValueAtTime(0.12, t0 + seconds - 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + seconds);
  };
  return { enabled, play };
}

/** Keyframes for the beacon (rotating light), the flashing frame and the sweep. */
export function EmergencyStyles() {
  return (
    <style>{`
      @keyframes obp-beacon-spin { to { transform: rotate(360deg); } }
      @keyframes obp-flash { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
      @keyframes obp-glow { 0%, 100% { background-color: rgba(229,72,77,0.35); } 50% { background-color: rgba(229,72,77,0.08); } }
      @keyframes obp-frame {
        0%, 100% { box-shadow: inset 0 0 0 6px rgba(229,72,77,0.95), inset 0 0 120px rgba(229,72,77,0.55); }
        50% { box-shadow: inset 0 0 0 6px rgba(229,72,77,0.15), inset 0 0 40px rgba(229,72,77,0.1); }
      }
      @keyframes obp-sweep { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
      @keyframes obp-pop { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      .obp-beacon {
        background: conic-gradient(from 0deg, rgba(229,72,77,0) 0deg, rgba(229,72,77,0.95) 40deg,
          rgba(229,72,77,0) 90deg, rgba(229,72,77,0) 180deg, rgba(229,72,77,0.95) 220deg, rgba(229,72,77,0) 270deg);
        animation: obp-beacon-spin 1.1s linear infinite;
        filter: blur(18px);
      }
      .obp-flash { animation: obp-flash 0.9s ease-in-out infinite; }
      .obp-glow { animation: obp-glow 0.9s ease-in-out infinite; }
      .obp-frame { animation: obp-frame 0.9s ease-in-out infinite; }
      .obp-pop { animation: obp-pop 0.35s ease-out both; }
      .obp-sweep::after {
        content: ""; position: absolute; inset: 0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
        animation: obp-sweep 1.6s linear infinite;
      }
      @media (prefers-reduced-motion: reduce) {
        .obp-beacon, .obp-flash, .obp-glow, .obp-frame, .obp-sweep::after { animation: none; }
      }
    `}</style>
  );
}

/** A small rotating warning light (inline). */
export function Beacon({ size = 28 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full"
      style={{ width: size, height: size, background: "#3A0D12" }}
    >
      <span className="obp-beacon absolute -inset-1 rounded-full" />
      <span
        className="relative rounded-full"
        style={{ width: size * 0.42, height: size * 0.42, background: "#FFD3D5" }}
      />
    </span>
  );
}
