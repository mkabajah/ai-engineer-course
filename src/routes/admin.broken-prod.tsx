import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  ArrowUpRight,
  Bot,
  Check,
  ClipboardCopy,
  Eye,
  FileUp,
  GraduationCap,
  KeyRound,
  Loader2,
  Megaphone,
  Monitor,
  Play,
  RefreshCw,
  Snowflake,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { Markdown } from "@/components/obp/Markdown";
import {
  STAGE_META,
  errMsg,
  fmtClock,
  orderedStages,
  timeAgo,
  usePoll,
  useServerNow,
} from "@/components/obp/shared";
import {
  obpAdminAdjust,
  obpAdminAnnounce,
  obpAdminAwardBadge,
  obpAdminDeleteAnnouncement,
  obpAdminExamExtend,
  obpAdminExamFinalize,
  obpAdminExtendStage,
  obpAdminFreeze,
  obpAdminImportContent,
  obpAdminOpenStage,
  obpAdminOverview,
  obpAdminPackUploadUrl,
  obpAdminRegrade,
  obpAdminRemoveParticipant,
  obpAdminResetEvent,
  obpAdminReviewSubmission,
  obpAdminScreenshotUrls,
  obpAdminUpdateSettings,
  type AdminOverview,
} from "@/lib/obp/obp.functions";

export const Route = createFileRoute("/admin/broken-prod")({
  head: () => ({
    meta: [{ title: "Broken Prod — Host console" }, { name: "robots", content: "noindex" }],
  }),
  component: HostConsole,
});

type Tab = "run" | "participants" | "reports" | "submissions" | "exam" | "setup";

function HostConsole() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("run");
  const now = useServerNow(data?.server_now);
  const refresh = usePoll(async () => {
    try {
      setData(await obpAdminOverview());
      setError(null);
    } catch (e) {
      setError(errMsg(e));
    }
  }, 4000);

  const act = useCallback(
    async (label: string, fn: () => Promise<unknown>) => {
      try {
        await fn();
        toast.success(label);
        refresh();
      } catch (e) {
        toast.error(errMsg(e));
      }
    },
    [refresh],
  );

  const pendingSubs = data?.submissions.filter((s) => s.status === "pending").length ?? 0;
  const tabs: [Tab, string, number?][] = [
    ["run", "Run the event"],
    ["participants", "Participants", data?.participants.filter((p) => p.registered_at).length],
    ["reports", "Reports"],
    ["submissions", "Submissions", pendingSubs || undefined],
    ["exam", "Exam"],
    ["setup", "Setup"],
  ];

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/admin/challenges" className="label-eyebrow hover:text-foreground">
            ← Challenges
          </Link>
          <h1 className="display mt-2 text-5xl">Operation: Broken Prod</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Host console: stages, scoring, exam proctoring and the AI judge.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a href="/broken-prod/screen" target="_blank" rel="noreferrer">
              <Monitor /> Projector
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href="/broken-prod" target="_blank" rel="noreferrer">
              Participant page <ArrowUpRight />
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href="/broken-prod/leaderboard" target="_blank" rel="noreferrer">
              Leaderboard <ArrowUpRight />
            </a>
          </Button>
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-sm border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <nav className="mt-6 flex flex-wrap gap-1 border-b border-rule">
        {tabs.map(([id, label, n]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`-mb-px border-b-2 px-3 py-2 text-xs uppercase tracking-widest ${tab === id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {label}
            {n ? (
              <span className="ml-1.5 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                {n}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      {!data ? (
        <div className="mt-8 h-96 animate-pulse rounded-md bg-muted" />
      ) : (
        <div className="mt-6">
          {tab === "run" && <RunTab data={data} now={now} act={act} />}
          {tab === "participants" && <ParticipantsTab data={data} now={now} act={act} />}
          {tab === "reports" && <ReportsTab data={data} now={now} />}
          {tab === "submissions" && <SubmissionsTab data={data} act={act} />}
          {tab === "exam" && <ExamTab data={data} now={now} act={act} />}
          {tab === "setup" && <SetupTab data={data} act={act} />}
        </div>
      )}
    </main>
  );
}

type Act = (label: string, fn: () => Promise<unknown>) => Promise<void>;

function Panel({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  icon?: typeof Play;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-md border border-rule bg-card p-5 ${className}`}>
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        {Icon && <Icon className="h-4 w-4" />} {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/* ───────────────────────────── run ───────────────────────────── */

const SCHEDULE_HINT: Record<number, string> = {
  0: "Kickoff: projector shows the event code",
  1: "0:10 · 45 min",
  4: "0:55 · 40 min (exam 30 + sprint 10)",
  2: "1:35 · 30 min",
  3: "2:10 · 42 min (twist 2:27, freeze 2:40)",
  99: "2:57 · awards",
};

function RunTab({ data, now, act }: { data: AdminOverview; now: number; act: Act }) {
  const s = data.settings;
  const [code, setCode] = useState(s.event_code);
  const [kind, setKind] = useState<"info" | "twist" | "alert" | "win">("info");
  const [msg, setMsg] = useState("");
  const stages = orderedStages(data.stages);
  const current = data.stages.find((x) => x.id === s.current_stage);
  const left =
    current?.status === "open" && current.ends_at
      ? new Date(current.ends_at).getTime() - now
      : null;
  const steps: { id: number; title: string }[] = [
    { id: 0, title: "Lobby" },
    ...stages.map((x) => ({ id: x.id, title: x.title })),
    { id: 99, title: "Finish" },
  ];

  return (
    <div className="grid grid-cols-1 [&>*]:min-w-0 gap-5 lg:grid-cols-[1.4fr_1fr]">
      <Panel title="Stages" icon={Play} className="lg:col-span-2">
        {stages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No stages yet: import the content pack in Setup first.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 [&>*]:min-w-0 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {steps.map((st) => {
                const active = s.current_stage === st.id;
                const Icon = STAGE_META[st.id]?.icon;
                return (
                  <button
                    key={st.id}
                    onClick={() => {
                      if (active) return;
                      if (
                        window.confirm(
                          `Switch to "${st.title}"? ${st.id !== 0 && st.id !== 99 ? "Its clock starts now and any other open stage closes." : ""}`,
                        )
                      )
                        void act(`${st.title} is live`, () =>
                          obpAdminOpenStage({ data: { stage: st.id } }),
                        );
                    }}
                    className={`rounded-md border p-3 text-left transition-colors ${active ? "border-primary bg-primary/[0.07]" : "border-rule bg-background hover:border-foreground/30"}`}
                  >
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                      {Icon && <Icon className="h-4 w-4" />}
                      {st.title}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {SCHEDULE_HINT[st.id] ?? ""}
                    </div>
                    {active && (
                      <div className="mt-1 font-mono text-[11px] text-primary">● current</div>
                    )}
                  </button>
                );
              })}
            </div>
            {current && (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-rule bg-background px-4 py-3">
                <span className="text-sm">
                  <b>{current.title}</b>
                </span>
                <span
                  className={`font-mono text-2xl tabular-nums ${left !== null && left < 5 * 60_000 ? "text-primary" : ""}`}
                >
                  {left !== null ? fmtClock(left) : "—"}
                </span>
                <span className="text-xs text-muted-foreground">left</span>
                <div className="ml-auto flex gap-1">
                  {[-1, 1, 5].map((m) => (
                    <Button
                      key={m}
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        act(`Clock ${m > 0 ? "+" : ""}${m} min`, () =>
                          obpAdminExtendStage({ data: { stage: current.id, minutes: m } }),
                        )
                      }
                    >
                      {m > 0 ? "+" : ""}
                      {m} min
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </Panel>

      <Panel title="Announcements" icon={Megaphone}>
        <div className="flex gap-2">
          {(["info", "alert", "win", "twist"] as const).map((k) => (
            <Button
              key={k}
              size="sm"
              variant={kind === k ? "default" : "outline"}
              onClick={() => setKind(k)}
            >
              {k === "twist" ? "🌪️ twist" : k}
            </Button>
          ))}
        </div>
        <Textarea
          className="mt-3"
          rows={kind === "twist" ? 8 : 3}
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder={
            kind === "twist"
              ? "Paste the text from organizer/PLOT_TWIST.md at 2:27. It takes over the projector for 3 minutes."
              : "Markdown supported"
          }
        />
        <Button
          className="mt-2"
          disabled={!msg.trim()}
          onClick={() =>
            act("Posted", async () => {
              await obpAdminAnnounce({ data: { kind, message_md: msg } });
              setMsg("");
            })
          }
        >
          <Megaphone /> Post {kind === "twist" ? "the twist" : ""}
        </Button>
        <ul className="mt-4 space-y-2">
          {data.announcements.map((a) => (
            <li
              key={a.id}
              className="flex items-start gap-2 rounded-sm border border-rule bg-background p-2 text-sm"
            >
              <span className="font-mono text-[10px] uppercase text-muted-foreground">
                {a.kind}
              </span>
              <Markdown text={a.message_md} className="line-clamp-3 flex-1" />
              <button
                title="Delete"
                onClick={() =>
                  act("Deleted", () => obpAdminDeleteAnnouncement({ data: { id: a.id } }))
                }
              >
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="space-y-5">
        <Panel title="Registration" icon={KeyRound}>
          <div className="flex items-center justify-between">
            <span className="text-sm">Registration open</span>
            <Switch
              checked={s.registration_open}
              onCheckedChange={(v) =>
                act(v ? "Registration open" : "Registration closed", () =>
                  obpAdminUpdateSettings({ data: { registration_open: v } }),
                )
              }
            />
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="font-mono"
            />
            <Button
              variant="outline"
              disabled={code === s.event_code || code.trim().length < 3}
              onClick={() =>
                act("Event code saved", () =>
                  obpAdminUpdateSettings({ data: { event_code: code.trim() } }),
                )
              }
            >
              Save code
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {data.participants.filter((p) => p.registered_at).length} registered. The code shows on
            the projector only in the Lobby.
          </p>
        </Panel>

        <Panel title="Leaderboard" icon={Snowflake}>
          <p className="text-sm text-muted-foreground">
            {s.leaderboard_frozen
              ? `Frozen ${timeAgo(s.frozen_at, now)}. Scores still count in the background.`
              : "Live. Freeze it at 2:40 for a blind finish."}
          </p>
          <Button
            className="mt-3"
            variant={s.leaderboard_frozen ? "default" : "outline"}
            onClick={() =>
              act(s.leaderboard_frozen ? "Revealed!" : "Frozen", () =>
                obpAdminFreeze({ data: { frozen: !s.leaderboard_frozen } }),
              )
            }
          >
            {s.leaderboard_frozen ? <Eye /> : <Snowflake />}{" "}
            {s.leaderboard_frozen ? "Reveal final scores" : "Freeze leaderboard"}
          </Button>
        </Panel>

        <Panel title="Health" icon={Activity}>
          <ul className="space-y-2 text-sm">
            <Health
              ok={Boolean(data.health.ai)}
              label={
                data.health.ai
                  ? `AI judge: ${data.health.ai}`
                  : "AI judge: no provider (LOVABLE_API_KEY missing)"
              }
            />
            <Health
              ok={data.health.organizer_secret}
              label={
                data.health.organizer_secret
                  ? "Organizer secret set (verifier can connect)"
                  : "ORBIT_ORGANIZER_SECRET missing: the verifier can't connect"
              }
            />
            <Health
              ok={
                data.health.pending_reports === 0 ||
                (data.health.oldest_pending_at !== null &&
                  now - new Date(data.health.oldest_pending_at).getTime() < 90_000)
              }
              label={
                data.health.pending_reports === 0
                  ? "Verifier queue empty"
                  : `${data.health.pending_reports} snapshot(s) waiting · oldest ${timeAgo(data.health.oldest_pending_at, now)}${
                      data.health.oldest_pending_at &&
                      now - new Date(data.health.oldest_pending_at).getTime() > 90_000
                        ? ": is the verifier running?"
                        : ""
                    }`
              }
            />
            <Health
              ok={data.content.active_questions > 0}
              label={`${data.content.challenges} challenges · ${data.content.rubrics} rubrics · ${data.content.active_questions} exam questions`}
            />
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function Health({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-start gap-2">
      <span
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${ok ? "bg-emerald-500" : "bg-primary"}`}
      />
      <span>{label}</span>
    </li>
  );
}

/* ───────────────────────────── participants ───────────────────────────── */

function ParticipantsTab({ data, now, act }: { data: AdminOverview; now: number; act: Act }) {
  const [q, setQ] = useState("");
  const list = data.participants
    .filter(
      (p) => !q || `${p.name} ${p.email} ${p.join_code}`.toLowerCase().includes(q.toLowerCase()),
    )
    .sort((a, b) => b.score - a.score);
  return (
    <Panel title={`Participants (${data.participants.length})`} icon={Users}>
      <Input
        placeholder="Search name, email or code"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-sm"
      />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[11px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Code</th>
              <th className="text-right">Score</th>
              <th className="text-right">Reports</th>
              <th>Last report</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {list.map((p) => (
              <tr key={p.id}>
                <td className="py-2">
                  {p.emoji} {p.name}
                </td>
                <td className="text-muted-foreground">{p.email}</td>
                <td className="font-mono">{p.join_code}</td>
                <td className="text-right font-mono font-semibold">{p.score}</td>
                <td className="text-right font-mono">{p.reports}</td>
                <td className="text-xs text-muted-foreground">
                  {timeAgo(p.last_report_at, now)}{" "}
                  {p.last_status && <span className="font-mono">· {p.last_status}</span>}
                </td>
                <td className="whitespace-nowrap text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const pts = window.prompt(`Points for ${p.name} (negative = penalty)`, "5");
                      if (!pts) return;
                      const reason = window.prompt("Reason (shown in the audit)", "Bonus");
                      if (!reason) return;
                      void act("Adjusted", () =>
                        obpAdminAdjust({ data: { team: p.id, points: Number(pts), reason } }),
                      );
                    }}
                  >
                    ±pts
                  </Button>
                  <select
                    className="h-8 rounded-sm border border-rule bg-background px-1 text-xs"
                    value=""
                    onChange={(e) =>
                      e.target.value &&
                      act("Badge awarded", () =>
                        obpAdminAwardBadge({ data: { team: p.id, badge: e.target.value } }),
                      )
                    }
                  >
                    <option value="">badge…</option>
                    {data.badges.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.emoji} {b.title}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Remove participant"
                    onClick={() =>
                      window.confirm(`Remove ${p.name} and all their scores?`) &&
                      act("Removed", () => obpAdminRemoveParticipant({ data: { team: p.id } }))
                    }
                  >
                    <Trash2 />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* ───────────────────────────── reports ───────────────────────────── */

function ReportsTab({ data, now }: { data: AdminOverview; now: number }) {
  return (
    <Panel title="Reporter feed (latest 80)" icon={Activity}>
      <ul className="divide-y divide-rule text-sm">
        {data.reports.map((r) => (
          <li key={r.id} className="flex items-start gap-3 py-2">
            <span>
              {r.kind === "bug"
                ? "🐛"
                : r.status === "verified"
                  ? "✅"
                  : r.status === "error"
                    ? "⚠️"
                    : r.status === "superseded"
                      ? "⏭️"
                      : "⏳"}
            </span>
            <span className="w-44 shrink-0 truncate">
              {r.emoji} {r.name}
            </span>
            <span className="flex-1">
              {r.kind === "bug" ? (
                <>
                  <b>{r.note?.title}</b>{" "}
                  {r.note?.root_cause && (
                    <span className="text-muted-foreground">· {r.note.root_cause}</span>
                  )}
                </>
              ) : r.status === "verified" ? (
                r.verified_stage ? (
                  `${r.verified_total} pts on the stage ${r.verified_stage === 3 ? "Ship It" : "Bug Bounty"} suite`
                ) : (
                  "stored (no scored suite in this stage)"
                )
              ) : r.status === "error" ? (
                <span className="text-primary">{r.verify_error}</span>
              ) : (
                r.status
              )}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {r.snapshot_bytes ? `${Math.round(r.snapshot_bytes / 1024)} KB · ` : ""}
              {timeAgo(r.created_at, now)}
            </span>
          </li>
        ))}
        {data.reports.length === 0 && (
          <li className="py-6 text-center text-muted-foreground">No reports yet.</li>
        )}
      </ul>
    </Panel>
  );
}

/* ───────────────────────────── submissions ───────────────────────────── */

function SubmissionsTab({ data, act }: { data: AdminOverview; act: Act }) {
  const [filter, setFilter] = useState<"all" | "pending" | "judged">("all");
  const [challenge, setChallenge] = useState("");
  const ids = useMemo(
    () => Array.from(new Set(data.submissions.map((s) => s.challenge_id))).sort(),
    [data.submissions],
  );
  const list = data.submissions.filter(
    (s) =>
      (filter === "all" ||
        (filter === "pending" ? s.status === "pending" : s.status !== "pending")) &&
      (!challenge || s.challenge_id === challenge),
  );
  return (
    <Panel title="Submissions" icon={Bot}>
      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "judged"] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
          >
            {f}
          </Button>
        ))}
        <select
          className="h-8 rounded-sm border border-rule bg-background px-2 text-xs"
          value={challenge}
          onChange={(e) => setChallenge(e.target.value)}
        >
          <option value="">all challenges</option>
          {ids.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>
      <ul className="mt-4 space-y-3">
        {list.map((s) => (
          <SubmissionRow key={s.id} s={s} act={act} />
        ))}
        {list.length === 0 && (
          <li className="py-6 text-center text-sm text-muted-foreground">Nothing here.</li>
        )}
      </ul>
    </Panel>
  );
}

function SubmissionRow({ s, act }: { s: AdminOverview["submissions"][number]; act: Act }) {
  const [open, setOpen] = useState(false);
  const [pts, setPts] = useState(String(s.points_awarded));
  const [note, setNote] = useState("");
  const [shots, setShots] = useState<{ path: string | null; url: string | null }[] | null>(null);
  const [busy, setBusy] = useState(false);
  const images = Object.values(s.payload).flatMap((v) =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string" && /\.(png|jpe?g|gif|webp)$/i.test(x))
      : [],
  );
  return (
    <li className="rounded-md border border-rule bg-background p-3 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-xs">{s.challenge_id}</span>
        <span className="font-medium">
          {s.team_emoji} {s.team_name}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{s.status}</span>
        <span className="font-mono">
          {s.points_awarded}/{s.points_max}
        </span>
        {s.ai_score !== null && (
          <span className="text-xs text-muted-foreground">AI {s.ai_score}</span>
        )}
        <button
          className="ml-auto text-xs underline underline-offset-2"
          onClick={() => setOpen(!open)}
        >
          {open ? "hide" : "open"}
        </button>
      </div>
      {s.reviewer_note && <p className="mt-1 text-xs text-muted-foreground">{s.reviewer_note}</p>}
      {open && (
        <div className="mt-3 space-y-3 border-t border-rule pt-3">
          {Object.entries(s.payload).map(([k, v]) =>
            Array.isArray(v) ? null : (
              <div key={k}>
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  {k}
                </div>
                <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap rounded-sm bg-muted p-2 font-mono text-[12px]">
                  {String(v)}
                </pre>
              </div>
            ),
          )}
          {images.length > 0 &&
            (shots ? (
              <div className="flex flex-wrap gap-2">
                {shots.map((x, i) =>
                  x.url ? (
                    <a key={i} href={x.url} target="_blank" rel="noreferrer">
                      <img src={x.url} alt="" className="h-32 rounded-sm border border-rule" />
                    </a>
                  ) : null,
                )}
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    setShots(await obpAdminScreenshotUrls({ data: { paths: images } }));
                  } catch (e) {
                    toast.error(errMsg(e));
                  }
                }}
              >
                <Eye /> Show {images.length} screenshot(s)
              </Button>
            ))}
          <div className="flex flex-wrap items-center gap-2">
            <Input
              className="w-24 font-mono"
              value={pts}
              onChange={(e) => setPts(e.target.value)}
            />
            <Input
              className="min-w-60 flex-1"
              placeholder="Note to the participant (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button
              size="sm"
              onClick={() =>
                act("Score saved", () =>
                  obpAdminReviewSubmission({
                    data: { id: s.id, points: Number(pts) || 0, note: note || undefined },
                  }),
                )
              }
            >
              <Check /> Set score
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                await act("Re-graded", () => obpAdminRegrade({ data: { id: s.id } }));
                setBusy(false);
              }}
            >
              {busy ? <Loader2 className="animate-spin" /> : <RefreshCw />} Re-grade with AI
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

/* ───────────────────────────── exam ───────────────────────────── */

function ExamTab({ data, now, act }: { data: AdminOverview; now: number; act: Act }) {
  const s = data.settings;
  const [minutes, setMinutes] = useState(String(s.exam_minutes));
  const started = data.exam_progress.filter((p) => p.started_at);
  const done = started.filter((p) => p.submitted_at);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 [&>*]:min-w-0 gap-5 lg:grid-cols-3">
        <Panel title="Exam window" icon={GraduationCap}>
          <div className="flex items-center justify-between text-sm">
            <span>Participants can start</span>
            <Switch
              checked={s.exam_open}
              onCheckedChange={(v) =>
                act(v ? "Exam open" : "Exam closed", () =>
                  obpAdminUpdateSettings({ data: { exam_open: v } }),
                )
              }
            />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Input
              className="w-20 font-mono"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
            <span className="text-sm text-muted-foreground">minutes per attempt</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                act("Saved", () =>
                  obpAdminUpdateSettings({ data: { exam_minutes: Number(minutes) || 30 } }),
                )
              }
            >
              Save
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Each person gets the full time from when they press Start.
          </p>
        </Panel>
        <Panel title="Grading" icon={Check}>
          <p className="text-sm text-muted-foreground">
            {done.length}/{started.length} submitted. Attempts submit themselves at 00:00. Use this
            at the end of the window.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                act("Graded expired attempts", () =>
                  obpAdminExamFinalize({ data: { force: false } }),
                )
              }
            >
              Grade expired
            </Button>
            <Button
              size="sm"
              onClick={() =>
                window.confirm("End and grade EVERY open attempt now?") &&
                act("All attempts graded", () => obpAdminExamFinalize({ data: { force: true } }))
              }
            >
              End all now
            </Button>
          </div>
        </Panel>
        <Panel title="Answer review" icon={Eye}>
          <div className="flex items-center justify-between text-sm">
            <span>Show answers + explanations</span>
            <Switch
              checked={s.exam_review_open}
              onCheckedChange={(v) =>
                act(v ? "Review open" : "Review closed", () =>
                  obpAdminUpdateSettings({ data: { exam_review_open: v } }),
                )
              }
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Open it only after everyone has finished (e.g. at the break).
          </p>
        </Panel>
      </div>
      <Panel title="Proctor view" icon={Monitor}>
        <table className="w-full text-sm">
          <thead className="text-left text-[11px] uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="py-2">Name</th>
              <th>Status</th>
              <th className="text-right">Answered</th>
              <th className="text-right">Flagged</th>
              <th className="text-right">Tab switches</th>
              <th className="text-right">Score</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {data.exam_progress.map((p) => {
              const left = p.ends_at ? new Date(p.ends_at).getTime() - now : null;
              return (
                <tr key={p.team_id}>
                  <td className="py-2">
                    {p.emoji} {p.name}
                  </td>
                  <td className="font-mono text-xs">
                    {!p.started_at
                      ? "not started"
                      : p.submitted_at
                        ? "submitted"
                        : left !== null && left > 0
                          ? `${fmtClock(left)} left`
                          : "time up"}
                  </td>
                  <td className="text-right font-mono">
                    {p.started_at ? `${p.answered}/${p.total}` : ""}
                  </td>
                  <td className="text-right font-mono">{p.started_at ? p.flagged : ""}</td>
                  <td
                    className={`text-right font-mono ${(p.tab_switches ?? 0) >= 3 ? "font-bold text-primary" : ""}`}
                  >
                    {p.tab_switches ?? ""}
                  </td>
                  <td className="text-right font-mono">
                    {p.scaled ?? ""} {p.passed ? "🎓" : ""}
                  </td>
                  <td className="text-right">
                    {p.started_at && !p.submitted_at && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          act(`+5 min for ${p.name}`, () =>
                            obpAdminExamExtend({ data: { team: p.team_id, minutes: 5 } }),
                          )
                        }
                      >
                        +5 min
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

/* ───────────────────────────── setup ───────────────────────────── */

function SetupTab({ data, act }: { data: AdminOverview; act: Act }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [reset, setReset] = useState("");
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const api = `${origin}/api/orbit`;

  const importPack = async (file: File | undefined) => {
    if (!file) return;
    setBusy("content");
    try {
      const counts = await obpAdminImportContent({ data: { pack: await file.text() } });
      toast.success(
        `Imported: ${Object.entries(counts)
          .map(([k, v]) => `${v} ${k}`)
          .join(", ")}`,
      );
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(null);
    }
  };

  const uploadPack = async (file: File | undefined) => {
    if (!file) return;
    if (!file.name.endsWith(".zip"))
      return toast.error("Upload the .zip made by build-mission-pack.mjs");
    setBusy("pack");
    try {
      const signed = await obpAdminPackUploadUrl({ data: { size: file.size } });
      const { error } = await supabase.storage
        .from(signed.bucket)
        .uploadToSignedUrl(signed.path, signed.token, file, {
          contentType: "application/zip",
          upsert: true,
        });
      if (error) throw new Error(error.message);
      await obpAdminUpdateSettings({
        data: { download_url: `${signed.public_url}?v=${Date.now()}` },
      });
      toast.success("Mission pack uploaded: the Download button is live");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(null);
    }
  };

  const copy = (t: string) => {
    void navigator.clipboard.writeText(t).then(() => toast.success("Copied"));
  };

  return (
    <div className="grid grid-cols-1 [&>*]:min-w-0 gap-5 lg:grid-cols-2">
      <Panel title="1 · Content pack (exam, rubrics, hints)" icon={FileUp}>
        <p className="text-sm text-muted-foreground">
          On your laptop:{" "}
          <code className="font-mono">node organizer/scripts/make-content-pack.mjs</code>, then
          upload <code className="font-mono">dist/obp-content-pack.json</code>. It holds the exam
          answers, so it never goes into this repo or Lovable chat. Re-importing updates everything
          in place.
        </p>
        <FilePick
          accept=".json,application/json"
          busy={busy === "content"}
          label="Import content pack"
          onFile={importPack}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Loaded: {data.content.challenges} challenges · {data.content.rubrics} AI rubrics ·{" "}
          {data.content.questions} questions ({data.content.active_questions} active) ·{" "}
          {data.content.hints} hints
        </p>
      </Panel>

      <Panel title="2 · Mission pack (zip participants download)" icon={Upload}>
        <p className="text-sm text-muted-foreground">
          On your laptop:
          <br />
          <code className="break-all font-mono text-xs">
            node organizer/scripts/build-mission-pack.mjs --api {api}
          </code>
          <br />
          then upload <code className="font-mono">dist/orbit-shop-mission-pack.zip</code>.
        </p>
        <FilePick
          accept=".zip,application/zip"
          busy={busy === "pack"}
          label="Upload mission pack"
          onFile={uploadPack}
        />
        <p className="mt-3 break-all text-xs text-muted-foreground">
          {data.settings.download_url ? `Live: ${data.settings.download_url}` : "Not uploaded yet."}
        </p>
      </Panel>

      <Panel title="3 · Verifier on your laptop" icon={KeyRound}>
        <p className="text-sm text-muted-foreground">
          Add a secret named <code className="font-mono">ORBIT_ORGANIZER_SECRET</code> (any long
          random string) in Lovable → Cloud → Secrets. Then run:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-md bg-[#0F1B30] p-3 font-mono text-[12px] text-[#E8EDF7]">
          {`ORBIT_SITE=${origin} ORBIT_ORGANIZER_SECRET=<the secret> \\
  node organizer/scripts/verify-snapshots.mjs`}
        </pre>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span
            className={`h-2 w-2 rounded-full ${data.health.organizer_secret ? "bg-emerald-500" : "bg-primary"}`}
          />
          {data.health.organizer_secret ? "Secret is set" : "Secret not set yet"}
          <Button size="sm" variant="ghost" onClick={() => copy(api)}>
            <ClipboardCopy /> API URL
          </Button>
        </div>
      </Panel>

      <Panel title="4 · Reset before the real event" icon={Trash2}>
        <p className="text-sm text-muted-foreground">
          Deletes every participant, report, submission, exam attempt and announcement. Content and
          settings stay.
        </p>
        <div className="mt-3 flex gap-2">
          <Input
            placeholder='Type "RESET"'
            value={reset}
            onChange={(e) => setReset(e.target.value)}
            className="max-w-40 font-mono"
          />
          <Button
            variant="destructive"
            disabled={reset !== "RESET"}
            onClick={() =>
              act("Event reset", async () => {
                await obpAdminResetEvent({ data: { confirm: "RESET" } });
                setReset("");
              })
            }
          >
            Reset event
          </Button>
        </div>
      </Panel>
    </div>
  );
}

function FilePick({
  accept,
  busy,
  label,
  onFile,
}: {
  accept: string;
  busy: boolean;
  label: string;
  onFile: (f: File | undefined) => void;
}) {
  return (
    <label className="mt-4 inline-flex">
      <span className="relative inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}{" "}
        {label}
        <input
          type="file"
          accept={accept}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={busy}
          onChange={(e) => {
            onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </span>
    </label>
  );
}
