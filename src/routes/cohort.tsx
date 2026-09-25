import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowUpRight,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  GitPullRequest,
  Route as RouteIcon,
  Sparkles,
  Users,
} from "lucide-react";
import logoAsset from "@/assets/hasoub-labs.png.asset.json";

export const Route = createFileRoute("/cohort")({
  head: () => ({
    meta: [
      { title: "Cohort 01 Journey — HasoubLabs AI Engineer Accelerator" },
      {
        name: "description",
        content: "Follow Cohort 01 through 33 sessions, six teams, open-source contributions, AI-powered challenges, and hiring outcomes.",
      },
      { property: "og:title", content: "Cohort 01 Journey — HasoubLabs" },
      {
        property: "og:description",
        content: "Public progress and outcomes from the first HasoubLabs AI Engineer Accelerator cohort.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CohortJourney,
});

const CURRENT_SESSION = 13;
const TOTAL_SESSIONS = 33;
const PROGRESS = Math.round((CURRENT_SESSION / TOTAL_SESSIONS) * 100);

const OUTCOMES = [
  {
    value: "2",
    label: "Already hired",
    detail: "Career outcomes while the cohort is still in progress.",
    icon: BriefcaseBusiness,
  },
  {
    value: "39",
    label: "Open-source contributions",
    detail: "Contributions to well-known public open-source projects.",
    icon: GitPullRequest,
  },
  {
    value: "6",
    label: "Delivery teams",
    detail: "Small teams learning to design, build, and ship together.",
    icon: Users,
  },
  {
    value: "100%",
    label: "AI-powered challenges",
    detail: "Every challenge uses AI for evaluation, feedback, or simulation.",
    icon: Bot,
  },
];

const JOURNEY = [
  { session: "01", label: "Journey started", state: "done" },
  { session: "13", label: "We are here", state: "now" },
  { session: "17", label: "Halfway mark", state: "next" },
  { session: "25", label: "Final stretch", state: "next" },
  { session: "33", label: "Final session", state: "finish" },
] as const;

const NEXT_METRICS = [
  "Attendance rate",
  "Projects shipped",
  "AI evaluations completed",
  "Certifications earned",
  "Interviews secured",
  "Pull requests merged",
  "Mentor hours",
  "Employer partners",
];

function CohortJourney() {
  return (
    <main className="cohort-page min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="relative z-20 border-b border-rule bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <img src={logoAsset.url} alt="HasoubLabs" className="h-8 w-auto shrink-0" />
            <span className="hidden border-l border-rule pl-3 text-xs uppercase tracking-[0.18em] text-muted-foreground sm:block">
              Cohort journey
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Program
          </Link>
        </div>
      </header>

      <section className="relative border-b border-rule">
        <div aria-hidden className="cohort-grid absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-16 pt-14 sm:px-6 md:pb-20 md:pt-20 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="label-eyebrow flex items-center gap-3 text-primary"
            >
              <span className="h-px w-8 bg-primary" />
              Cohort 01 · Live journey
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.65 }}
              className="display mt-6 max-w-3xl text-6xl sm:text-7xl lg:text-8xl"
            >
              Building careers,
              <br />
              <em className="text-primary">one session at a time.</em>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              The first AI Engineer Accelerator cohort is learning in public—shipping useful work, contributing to open source, and turning progress into opportunity.
            </motion.p>
          </div>

          <motion.aside
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18, duration: 0.65 }}
            className="border-l-2 border-primary bg-card p-6 sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="label-eyebrow">Current position</div>
                <div className="mt-2 flex items-end gap-2">
                  <span className="display text-7xl text-primary">{CURRENT_SESSION}</span>
                  <span className="mb-2 font-mono text-sm text-muted-foreground">/ {TOTAL_SESSIONS}</span>
                </div>
              </div>
              <span className="cohort-live-dot mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Two sessions every week. The final session takes place on <strong className="font-medium text-foreground">04 December 2026</strong>.
            </p>
          </motion.aside>
        </div>
      </section>

      <section className="border-b border-rule bg-card/50">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-6 md:py-16">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <div className="label-eyebrow">33-session route</div>
              <h2 className="serif mt-2 text-4xl sm:text-5xl">The road so far</h2>
            </div>
            <div className="font-mono text-sm text-muted-foreground">{PROGRESS}% complete</div>
          </div>

          <div className="mt-10" role="progressbar" aria-label="Cohort session progress" aria-valuemin={0} aria-valuemax={TOTAL_SESSIONS} aria-valuenow={CURRENT_SESSION}>
            <div className="relative h-3 overflow-hidden rounded-full bg-muted">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${PROGRESS}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-y-0 left-0 rounded-full bg-primary"
              />
            </div>
            <div className="relative mt-8 grid grid-cols-2 gap-y-8 sm:grid-cols-5">
              {JOURNEY.map((point, index) => (
                <motion.div
                  key={point.session}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className={index === JOURNEY.length - 1 ? "col-span-2 text-right sm:col-span-1" : ""}
                >
                  <div className={`font-mono text-xs ${point.state === "now" ? "text-primary" : "text-muted-foreground"}`}>
                    SESSION {point.session}
                  </div>
                  <div className={`mt-1 text-sm font-medium ${point.state === "now" ? "text-primary" : "text-foreground"}`}>
                    {point.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 md:py-24">
        <div className="max-w-2xl">
          <div className="label-eyebrow">Outcomes in motion</div>
          <h2 className="display mt-3 text-5xl sm:text-6xl">Progress you can point to.</h2>
        </div>
        <div className="mt-12 grid border-l border-t border-rule sm:grid-cols-2 lg:grid-cols-4">
          {OUTCOMES.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.label}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: index * 0.09 }}
                className="group min-h-72 border-b border-r border-rule bg-background p-6 transition-colors hover:bg-card"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="display text-6xl text-primary">{item.value}</span>
                  <Icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
                <h3 className="mt-10 text-2xl">{item.label}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-rule bg-foreground text-background">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-6 md:grid-cols-[0.8fr_1.2fr] md:py-20">
          <div>
            <RouteIcon className="h-7 w-7 text-primary" />
            <div className="label-eyebrow mt-6 text-background/60">The next layer</div>
            <h2 className="serif mt-3 text-4xl sm:text-5xl">Metrics worth following next</h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-background/65">
              These are suggested measurements for future cohort updates—not current claims. Together, they show learning quality and career momentum beyond attendance alone.
            </p>
          </div>
          <div className="grid gap-px bg-background/20 sm:grid-cols-2">
            {NEXT_METRICS.map((metric, index) => (
              <motion.div
                key={metric}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="flex min-h-16 items-center gap-3 bg-foreground px-4 py-3 text-sm"
              >
                <Check className="h-4 w-4 shrink-0 text-primary" />
                {metric}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          Next update after Session 14
        </div>
        <Link to="/apply" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline hover:underline-offset-4">
          Join a future cohort <ArrowUpRight className="h-4 w-4" />
        </Link>
      </footer>
    </main>
  );
}