import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowLeft, ArrowUpRight, Bot, CalendarDays, GitPullRequest, Sparkles, Users } from "lucide-react";
import logoAsset from "@/assets/hasoub-labs.png.asset.json";

export const Route = createFileRoute("/cohort")({
  head: () => ({
    meta: [
      { title: "Cohorts — HasoubLabs AI Engineer Accelerator" },
      {
        name: "description",
        content: "Explore HasoubLabs AI Engineer Accelerator cohorts and their verified learning, open-source, and career outcomes.",
      },
      { property: "og:title", content: "HasoubLabs Cohorts" },
      {
        property: "og:description",
        content: "A public directory of HasoubLabs cohorts and their impact stories.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CohortDirectory,
});

const CURRENT_SESSION = 13;
const TOTAL_SESSIONS = 33;
const PROGRESS = Math.round((CURRENT_SESSION / TOTAL_SESSIONS) * 100);

function CohortDirectory() {
  return (
    <main className="cohort-page min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="relative z-20 border-b border-rule bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <img src={logoAsset.url} alt="HasoubLabs" className="h-8 w-auto shrink-0" />
            <span className="hidden border-l border-rule pl-3 text-xs uppercase tracking-[0.18em] text-muted-foreground sm:block">
              Cohort directory
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
        <div className="relative mx-auto max-w-6xl px-5 pb-14 pt-14 sm:px-6 md:pb-20 md:pt-20">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="label-eyebrow flex items-center gap-3 text-primary"
            >
              <span className="h-px w-8 bg-primary" />
              Public impact archive
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.65 }}
              className="display mt-6 max-w-3xl text-6xl sm:text-7xl lg:text-8xl"
            >
              Every cohort.<br /><em className="text-primary">One visible journey.</em>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              Follow each accelerator cohort from its first session to its final outcomes. We publish what has happened, how the model works, and what we are still learning.
            </motion.p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6 md:py-20">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><div className="label-eyebrow">1 cohort documented</div><h2 className="serif mt-2 text-4xl sm:text-5xl">Current cohorts</h2></div><div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="cohort-live-dot h-2 w-2 rounded-full bg-primary" />Updated after Session 13</div></div>

        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="mt-10 overflow-hidden border border-rule bg-background shadow-[0_24px_70px_color-mix(in_oklab,var(--ink)_10%,transparent)]">
          <div className="grid lg:grid-cols-[0.42fr_0.58fr]">
            <div className="flex min-h-96 flex-col bg-foreground p-7 text-background sm:p-10">
              <div className="flex items-center gap-2 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-primary"><Sparkles className="h-3.5 w-3.5" />Live cohort</div>
              <div className="mt-10 display text-8xl">01</div>
              <h3 className="mt-5 text-3xl">AI Engineer Accelerator</h3>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-background/65">The inaugural cohort is turning structured AI engineering training into public contributions, team delivery, and career outcomes.</p>
              <div className="mt-auto grid grid-cols-2 gap-6 border-t border-background/15 pt-7"><div><div className="text-xs uppercase tracking-wider text-background/50">Cadence</div><div className="mt-2 text-sm font-medium">2× weekly</div></div><div><div className="text-xs uppercase tracking-wider text-background/50">Final session</div><div className="mt-2 text-sm font-medium">04 Dec 2026</div></div></div>
            </div>

            <div className="flex flex-col p-7 sm:p-10">
              <div className="label-eyebrow text-primary">Live evidence</div>
              <h3 className="mt-3 max-w-xl text-4xl">A practical pathway from learning to visible opportunity.</h3>
              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">Open the cohort story to see its full session journey, verified outcomes, derived momentum, delivery model, and the evidence framework NGOs can use to assess replication.</p>
              <div className="mt-8 grid grid-cols-2 gap-px bg-rule sm:grid-cols-4">
                {[{ value: `${PROGRESS}%`, label: "complete", icon: CalendarDays }, { value: "39", label: "contributions", icon: GitPullRequest }, { value: "6", label: "teams", icon: Users }, { value: "100%", label: "AI challenges", icon: Bot }].map((metric) => { const Icon = metric.icon; return <div key={metric.label} className="bg-background p-4"><Icon className="h-4 w-4 text-primary" /><div className="mt-5 text-3xl font-medium">{metric.value}</div><div className="mt-1 text-[0.65rem] uppercase tracking-wider text-muted-foreground">{metric.label}</div></div>; })}
              </div>
              <div className="mt-auto pt-9"><Link to="/cohort/$cohortId" params={{ cohortId: "1" }} className="inline-flex items-center gap-2 bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">Explore Cohort 01 <ArrowUpRight className="h-4 w-4" /></Link></div>
            </div>
          </div>
        </motion.article>

        <div className="mt-10 flex items-center justify-between border-t border-rule pt-6"><div className="text-xs text-muted-foreground">More cohorts will appear here as they launch.</div><Link to="/apply" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline hover:underline-offset-4">Join a future cohort <ArrowUpRight className="h-4 w-4" /></Link></div>
      </section>
    </main>
  );
}