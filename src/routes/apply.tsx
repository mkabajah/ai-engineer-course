import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { submitApplication } from "@/lib/applications.functions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { VideoUploader } from "@/components/VideoUploader";
import hasoubLogoAsset from "@/assets/hasoub-labs.png.asset.json";
const hasoubLogo = hasoubLogoAsset.url;

export const Route = createFileRoute("/apply")({ component: ApplyPage });

type FormState = {
  full_name: string;
  email: string;
  phone: string;
  city: string;
  location_pref: string;
  time_commitment_ok: boolean;
  time_commitment_note: string;
  github_url: string;
  portfolio_url: string;
  languages: string;
  english_sample: string;
  essay_shipping: string;
  essay_curiosity: string;
  essay_fit: string;
};

const STEPS = ["Identity", "Background", "Essays", "Video", "Review"] as const;

function ApplyPage() {
  const navigate = useNavigate();
  const submitFn = useServerFn(submitApplication);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    full_name: "", email: "", phone: "", city: "", location_pref: "",
    time_commitment_ok: false, time_commitment_note: "",
    github_url: "", portfolio_url: "", languages: "", english_sample: "",
    essay_shipping: "", essay_curiosity: "", essay_fit: "",
  });

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const isValidUrl = (v: string) => v === "" || /^https?:\/\/[^\s]+\.[^\s]+/i.test(v.trim());
  const githubOk = isValidUrl(form.github_url);
  const portfolioOk = isValidUrl(form.portfolio_url);

  const canProceed = useMemo(() => {
    if (step === 0)
      return (
        form.full_name.trim().length >= 2 &&
        form.full_name.trim().length <= 120 &&
        /^\S+@\S+\.\S+$/.test(form.email.trim()) &&
        form.email.trim().length <= 200 &&
        form.time_commitment_ok &&
        form.location_pref === "confirmed"
      );
    if (step === 1)
      return (
        form.english_sample.trim().length >= 30 &&
        form.english_sample.trim().length <= 1500 &&
        githubOk &&
        portfolioOk
      );
    if (step === 2)
      return (
        form.essay_shipping.trim().length >= 50 &&
        form.essay_shipping.length <= 3000 &&
        form.essay_curiosity.trim().length >= 50 &&
        form.essay_curiosity.length <= 3000 &&
        form.essay_fit.trim().length >= 50 &&
        form.essay_fit.length <= 3000
      );
    if (step === 3) return videoPath !== null;
    return true;
  }, [step, form, videoPath, githubOk, portfolioOk]);

  const submit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone || null,
        city: form.city || null,
        location_pref: form.location_pref || null,
        education_degree: null,
        education_institution: null,
        graduation_year: null,
        employment_status: null,
        employment_role: null,
        english_level: null,
        english_sample: form.english_sample || null,
        time_commitment_ok: form.time_commitment_ok,
        time_commitment_note: form.time_commitment_note || null,
        financial_ack: true,
        github_url: form.github_url || null,
        linkedin_url: null,
        portfolio_url: form.portfolio_url || null,
        languages: form.languages || null,
        llm_experience: false,
        llm_experience_desc: null,
        essay_shipping: form.essay_shipping,
        essay_curiosity: form.essay_curiosity,
        essay_fit: form.essay_fit,
        video_path: videoPath,
        quiz: [],
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

  const pct = ((step + 1) / STEPS.length) * 100;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* ambient gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-32 h-[520px] w-[520px] rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 h-[520px] w-[520px] rounded-full bg-[#182A47]/25 blur-[140px]" />
      </div>

      {/* Sticky header with progress */}
      <header className="sticky top-0 z-20 border-b border-rule/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={hasoubLogo} alt="HasoubLabs" className="h-7 w-auto" />
          </Link>
          <div className="flex items-center gap-3 text-xs">
            <span className="hidden sm:inline text-muted-foreground">Step</span>
            <span className="font-mono tabular-nums">{String(step + 1).padStart(2, "0")}</span>
            <span className="text-muted-foreground">/ {String(STEPS.length).padStart(2, "0")}</span>
            <span className="text-foreground/80">— {STEPS[step]}</span>
          </div>
        </div>
        <div className="h-[3px] w-full bg-rule/40">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/60"
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </header>

      {/* Stepper pills */}
      <div className="mx-auto max-w-3xl px-6 pt-8">
        <div className="flex items-center gap-2">
          {STEPS.map((label, i) => {
            const active = i === step;
            const done = i < step;
            return (
              <button
                key={label}
                onClick={() => i < step && setStep(i)}
                className={`group flex flex-1 items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-wider transition-all ${
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : done
                      ? "border-rule text-muted-foreground hover:text-foreground"
                      : "border-rule/60 text-muted-foreground/60"
                }`}
              >
                <span
                  className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-mono ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : done
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <section className="mx-auto max-w-3xl px-6 py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 0 && (
              <div className="space-y-8">
                <Heading eyebrow="Step 01" title="Tell us who you are" />
                <Row>
                  <Field label="Full name *">
                    <Input maxLength={120} value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
                  </Field>
                  <Field label="Email *">
                    <Input type="email" maxLength={200} value={form.email} onChange={(e) => set("email", e.target.value)} />
                  </Field>
                </Row>
                <Row>
                  <Field label="Phone"><Input maxLength={40} value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
                  <Field label="City"><Input maxLength={120} value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
                </Row>

                <Card>
                  <p className="text-sm leading-relaxed">
                    The course is delivered <strong>online</strong>, with a few <strong>in-person sessions</strong> held at <strong>Hasoub Campus, Arrara</strong>. Attendance at the in-person sessions is expected.
                  </p>
                  <label className="mt-3 flex items-start gap-3">
                    <Checkbox
                      checked={form.location_pref === "confirmed"}
                      onCheckedChange={(v) => set("location_pref", v ? "confirmed" : "")}
                      className="mt-1"
                    />
                    <span className="text-sm">
                      I confirm I can attend the in-person sessions at Hasoub Campus, Arrara. *
                    </span>
                  </label>
                </Card>

                <Card>
                  <label className="flex items-start gap-3">
                    <Checkbox
                      checked={form.time_commitment_ok}
                      onCheckedChange={(v) => set("time_commitment_ok", !!v)}
                      className="mt-1"
                    />
                    <span className="text-sm">
                      I can commit <strong>15–20 hours per week for the full program</strong>. *
                    </span>
                  </label>
                  <Textarea
                    placeholder="Briefly: how will you make the time?"
                    value={form.time_commitment_note}
                    onChange={(e) => set("time_commitment_note", e.target.value.slice(0, 600))}
                    className="mt-3 min-h-[70px]"
                    maxLength={600}
                  />
                </Card>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-8">
                <Heading
                  eyebrow="Step 02"
                  title="Background & portfolio"
                  subtitle="Just the essentials — links and a short bio."
                />
                <Row>
                  <Field label="GitHub URL">
                    <Input
                      maxLength={300}
                      value={form.github_url}
                      onChange={(e) => set("github_url", e.target.value)}
                      placeholder="https://github.com/…"
                      aria-invalid={!githubOk}
                      className={!githubOk ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {!githubOk && <p className="text-xs text-destructive">Must be a full URL starting with http(s)://</p>}
                  </Field>
                  <Field label="Project link (deploy / repo / video)">
                    <Input
                      maxLength={300}
                      value={form.portfolio_url}
                      onChange={(e) => set("portfolio_url", e.target.value)}
                      placeholder="https://…"
                      aria-invalid={!portfolioOk}
                      className={!portfolioOk ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                    {!portfolioOk && <p className="text-xs text-destructive">Must be a full URL starting with http(s)://</p>}
                  </Field>
                </Row>
                <Field label="Programming languages used in a project >1 month">
                  <Input
                    maxLength={300}
                    value={form.languages}
                    onChange={(e) => set("languages", e.target.value)}
                    placeholder="e.g. Python, TypeScript, Go"
                  />
                </Field>
                <Field label="Short bio — why should we choose you for this course? (in English) *">
                  <Textarea
                    value={form.english_sample}
                    onChange={(e) => set("english_sample", e.target.value.slice(0, 1500))}
                    className="min-h-[160px]"
                    placeholder="Who you are, what drives you, and why you're the right fit for this cohort."
                    maxLength={1500}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className={form.english_sample.trim().length < 30 ? "text-destructive" : ""}>
                      {form.english_sample.trim().length} chars {form.english_sample.trim().length < 30 ? "(min 30)" : ""}
                    </span>
                    <span>{form.english_sample.length}/1500</span>
                  </div>
                </Field>
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
                  title="60–120 second video *"
                  subtitle="Required. Introduce yourself and tell us about a technical decision you made — and what you'd do differently now."
                />
                <VideoUploader videoPath={videoPath} onUploaded={setVideoPath} />
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <Heading eyebrow="Step 05" title="Review & submit" />
                <Summary form={form} videoPath={videoPath} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

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
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-[0_10px_40px_-10px_hsl(var(--primary))] transition-all hover:shadow-[0_20px_60px_-10px_hsl(var(--primary))] disabled:opacity-40 disabled:shadow-none"
            >
              Continue
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-[0_10px_40px_-10px_hsl(var(--primary))] disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit application →"}
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
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-rule bg-card/60 p-5 backdrop-blur-sm">
      {children}
    </div>
  );
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
  const chars = value.length;
  const inRange = words >= 150 && words <= 250;
  const tooShort = value.trim().length < 50;
  return (
    <div className="space-y-3">
      <p className="serif text-xl italic leading-snug">“{prompt}”</p>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 3000))}
        maxLength={3000}
        className="min-h-[200px] font-sans"
      />
      <div className="flex justify-between text-xs">
        <span className={tooShort ? "text-destructive" : inRange ? "text-primary" : "text-muted-foreground"}>
          {words} words {tooShort ? "(min 50 chars)" : ""}
        </span>
        <span className="text-muted-foreground">{chars}/3000 · target ~150–250 words</span>
      </div>

        <span className="text-muted-foreground">target ~150–250</span>
      </div>
    </div>
  );
}

function Summary({ form, videoPath }: { form: FormState; videoPath: string | null }) {
  return (
    <div className="space-y-4 rounded-2xl border border-rule bg-card/60 p-6 text-sm backdrop-blur-sm">
      <Line k="Name" v={form.full_name} />
      <Line k="Email" v={form.email} />
      <Line k="GitHub" v={form.github_url || "—"} />
      <Line k="Project" v={form.portfolio_url || "—"} />
      <Line k="Languages" v={form.languages || "—"} />
      <Line k="Video" v={videoPath ? "Uploaded ✓" : "Missing"} />
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
