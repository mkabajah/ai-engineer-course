import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getSignedVideoUrl, rescoreApplication, updateApplicationStage } from "@/lib/applications.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/applications/$id")({ component: Detail });

type App = Record<string, unknown> & { id: string; full_name: string };
type Score = { dimension: string; score: number; rationale: string };
type QuizResp = {
  id: string;
  question_id: string;
  selected_index: number | null;
  time_taken_seconds: number;
  is_correct: boolean | null;
};
type Question = { id: string; question: string; choices: string[]; correct_index: number };

function Detail() {
  const { id } = Route.useParams();
  const signFn = useServerFn(getSignedVideoUrl);
  const rescoreFn = useServerFn(rescoreApplication);
  const stageFn = useServerFn(updateApplicationStage);

  const [app, setApp] = useState<App | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [quiz, setQuiz] = useState<{ resp: QuizResp; q: Question | null }[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const load = async () => {
    const { data: a } = await supabase.from("applications").select("*").eq("id", id).maybeSingle();
    setApp(a as App | null);
    setNotes(((a as App | null)?.admin_notes as string | null) ?? "");
    const { data: s } = await supabase.from("ai_scores").select("dimension, score, rationale").eq("application_id", id);
    setScores((s ?? []) as Score[]);
    const { data: qr } = await supabase
      .from("quiz_responses")
      .select("id, question_id, selected_index, time_taken_seconds, is_correct")
      .eq("application_id", id);
    const qIds = (qr ?? []).map((r) => r.question_id);
    let questions: Question[] = [];
    if (qIds.length) {
      const { data: qs } = await supabase
        .from("quiz_questions")
        .select("id, question, choices, correct_index")
        .in("id", qIds);
      questions = (qs ?? []).map((q) => ({
        id: q.id,
        question: q.question,
        choices: Array.isArray(q.choices) ? (q.choices as string[]) : [],
        correct_index: q.correct_index,
      }));
    }
    setQuiz((qr ?? []).map((r) => ({ resp: r as QuizResp, q: questions.find((x) => x.id === r.question_id) ?? null })));
    if (a?.video_path) {
      try {
        const { url } = await signFn({ data: { path: a.video_path as string } });
        setVideoUrl(url);
      } catch (e) { console.error(e); }
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  if (!app) return <div className="p-12 text-sm text-muted-foreground">Loading…</div>;

  const rescore = async () => {
    toast.message("Rescoring with AI…");
    try { await rescoreFn({ data: { id } }); toast.success("Rescored."); load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };
  const setStage = async (stage: string) => {
    await stageFn({ data: { id, stage: stage as "applied" } });
    load();
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

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <Link to="/admin/dashboard" className="text-xs text-muted-foreground underline underline-offset-4">← All candidates</Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="label-eyebrow">{String(app.email)}</div>
          <h1 className="display text-5xl mt-2">{app.full_name}</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["applied", "takehome", "interview", "admitted", "rejected"].map((s) => (
            <button key={s} onClick={() => setStage(s)}
              className={`rounded-sm border border-rule px-3 py-1.5 text-xs uppercase tracking-wider ${app.stage === s ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card title="Essays">
            <EssayBlock title="Shipping" body={app.essay_shipping as string} />
            <EssayBlock title="Curiosity" body={app.essay_curiosity as string} />
            <EssayBlock title="Fit" body={app.essay_fit as string} />
          </Card>

          <Card title="Knowledge check">
            {quiz.length === 0 ? (
              <p className="text-sm text-muted-foreground">No quiz responses.</p>
            ) : (
              <ul className="space-y-4">
                {quiz.map(({ resp, q }) => (
                  <li key={resp.id} className="rounded-sm border border-rule p-4">
                    <div className="text-sm">{q?.question ?? "(question removed)"}</div>
                    <div className="mt-2 text-xs text-muted-foreground flex gap-4">
                      <span>Answer: <strong className={resp.is_correct ? "text-primary" : "text-destructive"}>
                        {q && resp.selected_index !== null ? q.choices[resp.selected_index] : "—"}
                      </strong></span>
                      {q && <span>Correct: {q.choices[q.correct_index]}</span>}
                      <span>Time: {resp.time_taken_seconds.toFixed(1)}s</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Background">
            <Grid>
              <Field k="GitHub" v={app.github_url as string} link />
              <Field k="LinkedIn" v={app.linkedin_url as string} link />
              <Field k="Project" v={app.portfolio_url as string} link />
              <Field k="Languages" v={app.languages as string} />
              <Field k="Education" v={`${app.education_degree ?? ""} ${app.education_institution ? "— " + app.education_institution : ""}`} />
              <Field k="Employment" v={`${app.employment_status ?? ""} ${app.employment_role ? "— " + app.employment_role : ""}`} />
              <Field k="LLM experience" v={app.llm_experience ? `Yes — ${app.llm_experience_desc ?? ""}` : "No"} />
              <Field k="English level" v={String(app.english_level ?? "—")} />
            </Grid>
            {Boolean(app.english_sample) && (
              <div className="mt-4 rounded-sm border border-rule p-4 text-sm italic">"{String(app.english_sample)}"</div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <div className="rounded-sm border border-rule bg-card p-6">
            <div className="label-eyebrow">AI score</div>
            <div className="display text-7xl mt-2">{app.total_score != null ? Number(app.total_score).toFixed(1) : "—"}</div>
            <button onClick={rescore} className="mt-4 text-xs underline underline-offset-4 text-muted-foreground hover:text-foreground">
              Rescore with AI
            </button>
            <div className="mt-6 space-y-4">
              {scores.map((s) => (
                <div key={s.dimension}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">{s.dimension}</span>
                    <span className="font-mono text-sm">{s.score.toFixed(1)}</span>
                  </div>
                  <div className="mt-1 h-[2px] bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${(s.score / 10) * 100}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-snug">{s.rationale}</p>
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
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              placeholder="Interview notes, red flags, follow-ups…"
              className="w-full rounded-sm border border-input bg-background p-3 text-sm"
            />
            <button
              onClick={saveNotes}
              disabled={savingNotes}
              className="mt-3 rounded-sm bg-primary px-4 py-2 text-xs uppercase tracking-wider text-primary-foreground disabled:opacity-50"
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
    <div className="rounded-sm border border-rule bg-card p-6">
      <div className="label-eyebrow mb-4">{title}</div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
function EssayBlock({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <div className="serif text-lg">{title}</div>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{body}</p>
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}
function Field({ k, v, link }: { k: string; v: string; link?: boolean }) {
  if (!v) return (
    <div><div className="text-xs uppercase tracking-wider text-muted-foreground">{k}</div><div className="text-sm">—</div></div>
  );
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{k}</div>
      {link ? (
        <a href={v.startsWith("http") ? v : `https://${v}`} target="_blank" rel="noreferrer" className="text-sm underline underline-offset-4 break-all">
          {v}
        </a>
      ) : <div className="text-sm break-words">{v}</div>}
    </div>
  );
}
