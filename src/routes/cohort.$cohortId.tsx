import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowUpRight,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Code2,
  GitPullRequest,
  Layers3,
  Route as RouteIcon,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import logoAsset from "@/assets/hasoub-labs.png.asset.json";

const CURRENT_SESSION = 13;
const TOTAL_SESSIONS = 33;
const PROGRESS = Math.round((CURRENT_SESSION / TOTAL_SESSIONS) * 100);

export const Route = createFileRoute("/cohort/$cohortId")({
  head: () => ({
    meta: [
      { title: "Cohort 01 Impact — HasoubLabs AI Engineer Accelerator" },
      { name: "description", content: "Explore the verified progress, delivery model, and live outcomes of HasoubLabs AI Engineer Accelerator Cohort 01." },
      { property: "og:title", content: "Cohort 01 Impact — HasoubLabs" },
      { property: "og:description", content: "A transparent look at 33 sessions, six teams, open-source contributions, AI-powered challenges, and early hiring outcomes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CohortImpact,
});

const OUTCOMES = [
  { value: "2", label: "Already hired", detail: "Career outcomes achieved while training is still underway.", icon: BriefcaseBusiness },
  { value: "39", label: "Open-source contributions", detail: "Useful work contributed to well-known public projects.", icon: GitPullRequest },
  { value: "6", label: "Delivery teams", detail: "Small teams practicing collaboration, ownership, and delivery.", icon: Users },
  { value: "100%", label: "AI-powered challenges", detail: "Every challenge uses AI for evaluation, feedback, or simulation.", icon: Bot },
];

const MOMENTUM = [
  { value: `${PROGRESS}%`, label: "Program delivered", note: `${CURRENT_SESSION} of ${TOTAL_SESSIONS} sessions complete`, icon: RouteIcon },
  { value: "3.0", label: "Contributions per session", note: `39 contributions across ${CURRENT_SESSION} delivered sessions`, icon: GitPullRequest },
  { value: "2×", label: "Learning cadence", note: "Two instructor-led sessions every week", icon: CalendarDays },
  { value: "26", label: "Sessions still ahead", note: "More time for projects, practice, and career outcomes", icon: Target },
];

const MODEL = [
  { title: "Learn", copy: "Structured sessions build practical foundations across AI engineering, cloud, agents, RAG, MCP, and modern development workflows.", icon: Layers3 },
  { title: "Practice", copy: "AI-powered simulations turn knowledge into decisions, architecture work, and evidence-based technical feedback.", icon: Bot },
  { title: "Contribute", copy: "Participants work on public open-source projects, creating visible proof of collaboration and engineering ability.", icon: Code2 },
  { title: "Transition", copy: "Team delivery, public work, and interview-ready evidence connect learning to real employment opportunities.", icon: BriefcaseBusiness },
];

const JOURNEY = [
  { session: "01", label: "Journey started", state: "done" },
  { session: "13", label: "We are here", state: "now" },
  { session: "17", label: "Halfway mark", state: "next" },
  { session: "25", label: "Final stretch", state: "next" },
  { session: "33", label: "Final session", state: "finish" },
] as const;

const NEXT_METRICS = [
  "Attendance and retention rate",
  "Projects shipped",
  "AI evaluations completed",
  "Certifications earned",
  "Interviews secured",
  "Pull requests merged",
  "Mentor and volunteer hours",
  "Employer and NGO partners",
];

function CohortImpact() {
  return (
    <main className="cohort-page min-h-screen overflow-x-hidden bg-background text-foreground">
      <CohortHeader label="Cohort 01 impact" />

      <section className="relative border-b border-rule">
        <div aria-hidden className="cohort-grid absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-16 pt-14 sm:px-6 md:pb-20 md:pt-20 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="label-eyebrow flex items-center gap-3 text-primary">
              <span className="h-px w-8 bg-primary" /> Cohort 01 · Live impact story
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.65 }} className="display mt-6 max-w-3xl text-6xl sm:text-7xl lg:text-8xl">
              Building careers,<br /><em className="text-primary">one session at a time.</em>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-7 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              A live, transparent account of an AI engineering program built around practice, teamwork, public contribution, and employability—not attendance alone.
            </motion.p>
          </div>

          <motion.aside initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18, duration: 0.65 }} className="border-l-2 border-primary bg-card p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div><div className="label-eyebrow">Current position</div><div className="mt-2 flex items-end gap-2"><span className="display text-7xl text-primary">{CURRENT_SESSION}</span><span className="mb-2 font-mono text-sm text-muted-foreground">/ {TOTAL_SESSIONS}</span></div></div>
              <span className="cohort-live-dot mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary"><Sparkles className="h-4 w-4" /></span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Two sessions every week. The final session takes place on <strong className="font-medium text-foreground">04 December 2026</strong>.</p>
          </motion.aside>
        </div>
      </section>

      <section className="border-b border-rule bg-card/50">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 md:py-16">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><div className="label-eyebrow">33-session route</div><h2 className="serif mt-2 text-4xl sm:text-5xl">The road so far</h2></div><div className="font-mono text-sm text-muted-foreground">{PROGRESS}% complete</div></div>
          <div className="mt-10" role="progressbar" aria-label="Cohort session progress" aria-valuemin={0} aria-valuemax={TOTAL_SESSIONS} aria-valuenow={CURRENT_SESSION}>
            <div className="relative h-3 overflow-hidden rounded-full bg-muted"><motion.div initial={{ width: 0 }} whileInView={{ width: `${PROGRESS}%` }} viewport={{ once: true }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-y-0 left-0 rounded-full bg-primary" /></div>
            <div className="relative mt-8 grid grid-cols-2 gap-y-8 sm:grid-cols-5">
              {JOURNEY.map((point, index) => <motion.div key={point.session} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }} className={index === JOURNEY.length - 1 ? "col-span-2 text-right sm:col-span-1" : ""}><div className={`font-mono text-xs ${point.state === "now" ? "text-primary" : "text-muted-foreground"}`}>SESSION {point.session}</div><div className={`mt-1 text-sm font-medium ${point.state === "now" ? "text-primary" : "text-foreground"}`}>{point.label}</div></motion.div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 md:py-24">
        <div className="max-w-2xl"><div className="label-eyebrow">Verified outcomes</div><h2 className="display mt-3 text-5xl sm:text-6xl">Progress you can point to.</h2><p className="mt-5 text-muted-foreground">These figures reflect confirmed results reported during the active cohort.</p></div>
        <div className="mt-12 grid border-l border-t border-rule sm:grid-cols-2 lg:grid-cols-4">
          {OUTCOMES.map((item, index) => { const Icon = item.icon; return <motion.article key={item.label} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: index * 0.09 }} className="group min-h-64 border-b border-r border-rule bg-background p-6 transition-colors hover:bg-card"><div className="flex items-start justify-between gap-4"><span className="display text-6xl text-primary">{item.value}</span><Icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" /></div><h3 className="mt-9 text-2xl">{item.label}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.detail}</p></motion.article>; })}
        </div>
      </section>

      <section className="border-y border-rule bg-card/60">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-end"><div><div className="label-eyebrow">Derived momentum</div><h2 className="serif mt-3 text-4xl sm:text-5xl">What the numbers already tell us</h2><p className="mt-5 text-sm leading-relaxed text-muted-foreground">Calculated from the verified figures above. No survey estimates or projected outcomes are included.</p></div><div className="grid gap-px bg-rule sm:grid-cols-2">{MOMENTUM.map((item) => { const Icon = item.icon; return <article key={item.label} className="bg-background p-6"><div className="flex items-center justify-between"><span className="display text-5xl text-primary">{item.value}</span><Icon className="h-5 w-5 text-muted-foreground" /></div><h3 className="mt-5 text-lg">{item.label}</h3><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.note}</p></article>; })}</div></div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 md:py-24">
        <div className="max-w-3xl"><div className="label-eyebrow">A model NGOs can replicate</div><h2 className="display mt-3 text-5xl sm:text-6xl">From learning to visible opportunity.</h2><p className="mt-5 max-w-2xl leading-relaxed text-muted-foreground">The course connects technical instruction to public evidence of ability. This makes progress easier for learners, funders, employers, and delivery partners to see.</p></div>
        <div className="mt-12 grid gap-px bg-rule md:grid-cols-2 lg:grid-cols-4">{MODEL.map((step, index) => { const Icon = step.icon; return <motion.article key={step.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }} className="min-h-72 bg-background p-6"><div className="flex items-center justify-between"><span className="font-mono text-xs text-muted-foreground">0{index + 1}</span><Icon className="h-5 w-5 text-primary" /></div><h3 className="mt-12 text-3xl">{step.title}</h3><p className="mt-4 text-sm leading-relaxed text-muted-foreground">{step.copy}</p></motion.article>; })}</div>
      </section>

      <section className="border-y border-rule bg-foreground text-background">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-6 md:grid-cols-[0.8fr_1.2fr] md:py-20">
          <div><RouteIcon className="h-7 w-7 text-primary" /><div className="label-eyebrow mt-6 text-background/60">Evidence framework</div><h2 className="serif mt-3 text-4xl sm:text-5xl">What we will measure next</h2><p className="mt-5 max-w-md text-sm leading-relaxed text-background/65">These are future measurements, not current claims. Publishing them over time will create a stronger case for replication, funding, and partnership.</p></div>
          <div className="grid gap-px bg-background/20 sm:grid-cols-2">{NEXT_METRICS.map((metric, index) => <motion.div key={metric} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }} className="flex min-h-16 items-center gap-3 bg-foreground px-4 py-3 text-sm"><Check className="h-4 w-4 shrink-0 text-primary" />{metric}</motion.div>)}</div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 md:py-20">
        <div className="border-l-2 border-primary bg-card p-7 sm:p-10 md:flex md:items-center md:justify-between md:gap-10"><div><div className="label-eyebrow text-primary">For NGOs and partners</div><h2 className="serif mt-3 text-4xl">Build the next opportunity pathway.</h2><p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">Use this cohort as a working model for skills development tied to public contribution, AI-supported assessment, teamwork, and employment outcomes.</p></div><Link to="/apply" className="mt-7 inline-flex shrink-0 items-center gap-2 bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 md:mt-0">Join a future cohort <ArrowUpRight className="h-4 w-4" /></Link></div>
      </section>
    </main>
  );
}

function CohortHeader({ label }: { label: string }) {
  return <header className="relative z-20 border-b border-rule bg-background/90 backdrop-blur-md"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-6"><Link to="/" className="flex min-w-0 items-center gap-3"><img src={logoAsset.url} alt="HasoubLabs" className="h-8 w-auto shrink-0" /><span className="hidden border-l border-rule pl-3 text-xs uppercase tracking-[0.18em] text-muted-foreground sm:block">{label}</span></Link><Link to="/cohort" className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest transition-colors hover:text-primary"><ArrowLeft className="h-3.5 w-3.5" />All cohorts</Link></div></header>;
}
