import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getSignedVideoUrl, rescoreApplication, updateApplicationStage } from "@/lib/applications.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/applications/$id")({ component: Detail });

type App = Record<string, unknown> & { id: string; full_name: string };
type Score = { dimension: string; score: number; rationale: string };

function Detail() {
  const { id } = Route.useParams();
  const signFn = useServerFn(getSignedVideoUrl);
  const rescoreFn = useServerFn(rescoreApplication);
  const stageFn = useServerFn(updateApplicationStage);

  const [app, setApp] = useState<App | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [rescoring, setRescoring] = useState(false);

  const load = async () => {
    const { data: a } = await supabase.from("applications").select("*").eq("id", id).maybeSingle();
    setApp(a as App | null);
    setNotes(((a as App | null)?.admin_notes as string | null) ?? "");
    const { data: s } = await supabase.from("ai_scores").select("dimension, score, rationale").eq("application_id", id);
    setScores((s ?? []) as Score[]);
    if (a?.video_path) {
      try {
        const { url } = await signFn({ data: { path: a.video_path as string } });
        setVideoUrl(url);
      } catch (e) { console.error(e); }
    } else {
      setVideoUrl(null);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  if (!app) return <div className="p-12 text-sm text-muted-foreground">Loading…</div>;

  const rescore = async () => {
    setRescoring(true);
    toast.message("Rescoring with AI…");
    try { await rescoreFn({ data: { id } }); toast.success("Rescored."); await load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setRescoring(false); }
  };
  const setStage = async (stage: string) => {
    try {
      await stageFn({ data: { id, stage: stage as "applied" } });
      await load();
      toast.success(`Marked as ${stage}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };
  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      await stageFn({ data: { id, admin_notes: notes } });
      toast.success("Notes saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setSavingNotes(false); }
  };

  const createdAt = app.created_at ? new Date(String(app.created_at)).toLocaleString() : "—";

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <Link to="/admin/dashboard" className="text-xs text-muted-foreground underline underline-offset-4">← All candidates</Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 max-w-full">
          <div className="label-eyebrow truncate max-w-md">{String(app.email)}</div>
          <h1 className="display text-4xl md:text-5xl mt-2 break-words">{app.full_name}</h1>
          <div className="mt-2 text-xs text-muted-foreground">Submitted {createdAt}</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["applied", "interview", "admitted", "rejected"].map((s) => (
            <button key={s} onClick={() => setStage(s)}
              className={`rounded-sm border border-rule px-3 py-1.5 text-xs uppercase tracking-wider ${app.stage === s ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8 min-w-0">
          <Card title="Essays">
            <EssayBlock title="Shipping" body={app.essay_shipping as string} />
            <EssayBlock title="Curiosity" body={app.essay_curiosity as string} />
            <EssayBlock title="Fit" body={app.essay_fit as string} />
          </Card>

          <Card title="Background & portfolio">
            <Grid>
              <Field k="GitHub" v={app.github_url as string} link />
              <Field k="Project link" v={app.portfolio_url as string} link />
              <Field k="Programming languages" v={app.languages as string} />
              <Field k="Phone" v={app.phone as string} />
              <Field k="City" v={app.city as string} />
              <Field k="Time commitment" v={app.time_commitment_ok ? "Confirmed 15–20h/week" : "Not confirmed"} />
            </Grid>
            {Boolean(app.english_sample) && (
              <div className="mt-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Short bio (English)</div>
                <div className="rounded-sm border border-rule bg-background/50 p-4 text-sm italic leading-relaxed whitespace-pre-wrap break-words">
                  "{String(app.english_sample)}"
                </div>
              </div>
            )}
            {Boolean(app.time_commitment_note) && (
              <div className="mt-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Time commitment note</div>
                <p className="text-sm whitespace-pre-wrap break-words">{String(app.time_commitment_note)}</p>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6 min-w-0">
          <div className="rounded-sm border border-rule bg-card p-6">
            <div className="label-eyebrow">AI evaluation</div>
            <div className="display text-7xl mt-2">{app.total_score != null ? Number(app.total_score).toFixed(1) : "—"}</div>
            <div className="text-xs text-muted-foreground">Composite / 10</div>
            <button
              onClick={rescore}
              disabled={rescoring}
              className="mt-4 text-xs underline underline-offset-4 text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {rescoring ? "Rescoring…" : "Rescore with AI"}
            </button>
            <div className="mt-6 space-y-4">
              {scores.map((s) => (
                <div key={s.dimension}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">{s.dimension}</span>
                    <span className="font-mono text-sm">{s.score.toFixed(1)}</span>
                  </div>
                  <div className="mt-1 h-[2px] bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${(s.score / 10) * 100}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-snug break-words">{s.rationale}</p>
                </div>
              ))}
              {scores.length === 0 && <p className="text-xs text-muted-foreground">No scores yet.</p>}
            </div>
          </div>

          <div className="rounded-sm border border-rule bg-card p-6">
            <div className="label-eyebrow mb-3">Video</div>
            {videoUrl ? (
              <video src={videoUrl} controls className="w-full rounded-sm" />
            ) : (
              <p className="text-sm text-muted-foreground">No video submitted.</p>
            )}
          </div>

          <div className="rounded-sm border border-rule bg-card p-6">
            <div className="label-eyebrow mb-3">Admin notes</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 5000))}
              rows={6}
              placeholder="Interview notes, red flags, follow-ups…"
              className="w-full resize-y rounded-sm border border-input bg-background p-3 text-sm"
            />
            <div className="mt-1 text-right text-[10px] text-muted-foreground">{notes.length}/5000</div>
            <button
              onClick={saveNotes}
              disabled={savingNotes}
              className="mt-2 rounded-sm bg-primary px-4 py-2 text-xs uppercase tracking-wider text-primary-foreground disabled:opacity-50"
            >
              {savingNotes ? "Saving…" : "Save notes"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-rule bg-card p-6 min-w-0">
      <div className="label-eyebrow mb-4">{title}</div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
function EssayBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="min-w-0">
      <div className="serif text-lg">{title}</div>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">{body}</p>
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}
function Field({ k, v, link }: { k: string; v: string; link?: boolean }) {
  if (!v) return (
    <div className="min-w-0"><div className="text-xs uppercase tracking-wider text-muted-foreground">{k}</div><div className="text-sm">—</div></div>
  );
  return (
    <div className="min-w-0">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{k}</div>
      {link ? (
        <a href={v.startsWith("http") ? v : `https://${v}`} target="_blank" rel="noreferrer" className="text-sm underline underline-offset-4 break-all">
          {v}
        </a>
      ) : <div className="text-sm break-words">{v}</div>}
    </div>
  );
}
