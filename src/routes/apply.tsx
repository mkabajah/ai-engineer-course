import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { submitApplication } from "@/lib/applications.functions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { VideoUploader } from "@/components/VideoUploader";
import { QuizPlayer, type QuizAnswer } from "@/components/QuizPlayer";

export const Route = createFileRoute("/apply")({ component: ApplyPage });

type FormState = {
  full_name: string;
  email: string;
  phone: string;
  city: string;
  location_pref: string;
  education_degree: string;
  education_institution: string;
  graduation_year: string;
  employment_status: string;
  employment_role: string;
  english_level: string;
  english_sample: string;
  time_commitment_ok: boolean;
  time_commitment_note: string;
  financial_ack: boolean;
  github_url: string;
  linkedin_url: string;
  portfolio_url: string;
  languages: string;
  llm_experience: boolean;
  llm_experience_desc: string;
  essay_shipping: string;
  essay_curiosity: string;
  essay_fit: string;
};

const STEPS = ["Identity", "Background", "Essays", "Video", "Knowledge check", "Review"] as const;

function ApplyPage() {
  const navigate = useNavigate();
  const submitFn = useServerFn(submitApplication);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[] | null>(null);
  const [form, setForm] = useState<FormState>({
    full_name: "", email: "", phone: "", city: "", location_pref: "",
    education_degree: "", education_institution: "", graduation_year: "",
    employment_status: "", employment_role: "", english_level: "4", english_sample: "",
    time_commitment_ok: false, time_commitment_note: "", financial_ack: true,
    github_url: "", linkedin_url: "", portfolio_url: "", languages: "",
    llm_experience: false, llm_experience_desc: "",
    essay_shipping: "", essay_curiosity: "", essay_fit: "",
  });

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const canProceed = useMemo(() => {
    if (step === 0)
      return form.full_name.length >= 2 && /\S+@\S+\.\S+/.test(form.email) && form.time_commitment_ok && form.location_pref === "confirmed";
    if (step === 1) return true;
    if (step === 2)
      return (
        form.essay_shipping.trim().length >= 50 &&
        form.essay_curiosity.trim().length >= 50 &&
        form.essay_fit.trim().length >= 50
      );
    if (step === 3) return true; // video optional
    if (step === 4) return quizAnswers !== null;
    return true;
  }, [step, form, quizAnswers]);

  const submit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone || null,
        city: form.city || null,
        location_pref: form.location_pref || null,
        education_degree: form.education_degree || null,
        education_institution: form.education_institution || null,
        graduation_year: form.graduation_year ? parseInt(form.graduation_year, 10) : null,
        employment_status: form.employment_status || null,
        employment_role: form.employment_role || null,
        english_level: form.english_level ? parseInt(form.english_level, 10) : null,
        english_sample: form.english_sample || null,
        time_commitment_ok: form.time_commitment_ok,
        time_commitment_note: form.time_commitment_note || null,
        financial_ack: form.financial_ack,
        github_url: form.github_url || null,
        linkedin_url: form.linkedin_url || null,
        portfolio_url: form.portfolio_url || null,
        languages: form.languages || null,
        llm_experience: form.llm_experience,
        llm_experience_desc: form.llm_experience_desc || null,
        essay_shipping: form.essay_shipping,
        essay_curiosity: form.essay_curiosity,
        essay_fit: form.essay_fit,
        video_path: videoPath,
        quiz: quizAnswers ?? [],
      };
      const res = await submitFn({ data: payload });
      navigate({ to: "/thanks", search: { id: res.id } });
    } catch (e: unknown) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [step]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" className="serif text-lg">AI Engineer Accelerator</Link>
          <div className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length} — {STEPS[step]}</div>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-[2px] rounded-none" />
      </header>

      <section className="mx-auto max-w-3xl px-6 py-12">
        {step === 0 && (
          <div className="space-y-8">
            <Heading eyebrow="Step 01" title="Tell us who you are" />
            <Row>
              <Field label="Full name *">
                <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
              </Field>
              <Field label="Email *">
                <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              </Field>
            </Row>
            <Row>
              <Field label="Phone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
              <Field label="City"><Input value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
            </Row>
            <div className="rounded-sm border border-rule bg-card p-4 space-y-3">
              <p className="text-sm leading-relaxed">
                The course is delivered <strong>online</strong>, with a few <strong>in-person sessions</strong> held at <strong>Hasoub Campus, Arrara</strong>. Attendance at the in-person sessions is expected.
              </p>
              <label className="flex items-start gap-3">
                <Checkbox
                  checked={form.location_pref === "confirmed"}
                  onCheckedChange={(v) => set("location_pref", v ? "confirmed" : "")}
                  className="mt-1"
                />
                <span className="text-sm">
                  I confirm I can attend the in-person sessions at Hasoub Campus, Arrara. *
                </span>
              </label>
            </div>

            <div className="rule pt-8 space-y-4">
              <label className="flex items-start gap-3">
                <Checkbox
                  checked={form.time_commitment_ok}
                  onCheckedChange={(v) => set("time_commitment_ok", !!v)}
                  className="mt-1"
                />
                <span className="text-sm">
                  I can commit <strong>15–20 hours per week for 20 weeks</strong>. *
                </span>
              </label>
              <Textarea
                placeholder="Briefly: how will you make the time?"
                value={form.time_commitment_note}
                onChange={(e) => set("time_commitment_note", e.target.value)}
                className="min-h-[70px]"
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-8">
            <Heading eyebrow="Step 02" title="Background & portfolio" />
            <Row>
              <Field label="Education — degree"><Input value={form.education_degree} onChange={(e) => set("education_degree", e.target.value)} /></Field>
              <Field label="Institution"><Input value={form.education_institution} onChange={(e) => set("education_institution", e.target.value)} /></Field>
            </Row>
            <Row>
              <Field label="Graduation year"><Input value={form.graduation_year} onChange={(e) => set("graduation_year", e.target.value)} /></Field>
              <Field label="Employment status"><Input value={form.employment_status} onChange={(e) => set("employment_status", e.target.value)} placeholder="e.g. employed, freelance, student" /></Field>
            </Row>
            <Field label="Current role (if any)"><Input value={form.employment_role} onChange={(e) => set("employment_role", e.target.value)} /></Field>
            <Row>
              <Field label="English level (1–5)">
                <select
                  value={form.english_level}
                  onChange={(e) => set("english_level", e.target.value)}
                  className="h-10 w-full rounded-sm border border-input bg-background px-3 text-sm"
                >
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </Field>
              <Field label="GitHub URL"><Input value={form.github_url} onChange={(e) => set("github_url", e.target.value)} placeholder="https://github.com/..." /></Field>
            </Row>
            <Row>
              <Field label="LinkedIn"><Input value={form.linkedin_url} onChange={(e) => set("linkedin_url", e.target.value)} /></Field>
              <Field label="Project link (deploy/repo/video)"><Input value={form.portfolio_url} onChange={(e) => set("portfolio_url", e.target.value)} /></Field>
            </Row>
            <Field label="Programming languages used in a project >1 month"><Input value={form.languages} onChange={(e) => set("languages", e.target.value)} placeholder="e.g. Python, TypeScript, Go" /></Field>
            <Field label="Short bio — why should we choose you for this course? (in English)">
              <Textarea
                value={form.english_sample}
                onChange={(e) => set("english_sample", e.target.value)}
                className="min-h-[140px]"
                placeholder="Tell us who you are, what drives you, and why you're the right fit for this cohort."
              />
            </Field>
            <label className="flex items-start gap-3">
              <Checkbox
                checked={form.llm_experience}
                onCheckedChange={(v) => set("llm_experience", !!v)}
                className="mt-1"
              />
              <span className="text-sm">I have called an LLM API or built something with AI.</span>
            </label>
            {form.llm_experience && (
              <Textarea
                placeholder="Briefly: what did you build?"
                value={form.llm_experience_desc}
                onChange={(e) => set("llm_experience_desc", e.target.value)}
                className="min-h-[80px]"
              />
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10">
            <Heading eyebrow="Step 03" title="Three short essays" subtitle="~150–250 words each. Specific over vague." />
            <Essay
              prompt="Describe one thing you have built and shipped end-to-end. What did you choose to cut to ship it?"
              value={form.essay_shipping}
              onChange={(v) => set("essay_shipping", v)}
            />
            <Essay
              prompt="What is the most interesting thing you've learned about how AI systems actually work in production — not from tutorials?"
              value={form.essay_curiosity}
              onChange={(v) => set("essay_curiosity", v)}
            />
            <Essay
              prompt="Why this program specifically, and what would make it a waste of your time?"
              value={form.essay_fit}
              onChange={(v) => set("essay_fit", v)}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <Heading
              eyebrow="Step 04"
              title="60-second video"
              subtitle="Optional. Tell us about a technical decision you made and what you would do differently now. Up to 2 minutes."
            />
            <VideoUploader
              videoPath={videoPath}
              onUploaded={setVideoPath}
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <Heading
              eyebrow="Step 05"
              title="Timed knowledge check"
              subtitle="One question at a time. Each has its own timer. You can't pause — that's the point."
            />
            <QuizPlayer onComplete={setQuizAnswers} completed={quizAnswers !== null} />
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <Heading eyebrow="Step 06" title="Review & submit" />
            <Summary form={form} videoPath={videoPath} quizAnswers={quizAnswers} />
          </div>
        )}

        <div className="mt-12 flex items-center justify-between border-t border-rule pt-6">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || submitting}
            className="text-sm text-muted-foreground disabled:opacity-30 hover:text-foreground"
          >
            ← Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed}
              className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit application"}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

function Heading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div>
      <div className="label-eyebrow">{eyebrow}</div>
      <h1 className="display mt-3 text-4xl md:text-5xl">{title}</h1>
      {subtitle && <p className="mt-3 max-w-xl text-sm text-muted-foreground leading-relaxed">{subtitle}</p>}
    </div>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-5 md:grid-cols-2">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Essay({ prompt, value, onChange }: { prompt: string; value: string; onChange: (v: string) => void }) {
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  return (
    <div className="space-y-3">
      <p className="serif text-xl italic leading-snug">“{prompt}”</p>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} className="min-h-[200px] font-sans" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{words} words</span>
        <span>target ~150–250</span>
      </div>
    </div>
  );
}

function Summary({ form, videoPath, quizAnswers }: { form: FormState; videoPath: string | null; quizAnswers: QuizAnswer[] | null }) {
  return (
    <div className="space-y-4 rounded-sm border border-rule bg-card p-6 text-sm">
      <Line k="Name" v={form.full_name} />
      <Line k="Email" v={form.email} />
      <Line k="GitHub" v={form.github_url || "—"} />
      <Line k="Project" v={form.portfolio_url || "—"} />
      <Line k="Video" v={videoPath ? "Uploaded ✓" : "Skipped"} />
      <Line k="Quiz" v={quizAnswers ? `${quizAnswers.length} answers submitted` : "Not done"} />
      <p className="rule pt-4 text-xs text-muted-foreground">
        By submitting you confirm your answers are your own work.
      </p>
    </div>
  );
}
function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{k}</span>
      <span className="truncate text-right">{v}</span>
    </div>
  );
}

void supabase;
