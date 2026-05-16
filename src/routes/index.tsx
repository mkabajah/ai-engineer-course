import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({ component: Landing });

const STACK = [
  "MCP", "LangGraph", "Claude Agent SDK", "RAG + Reranking", "AWS Bedrock",
  "Pydantic v2", "FastAPI", "pgvector", "LangSmith", "OWASP LLM Top 10",
  "Computer Use", "Realtime Voice", "Prompt Caching", "Skills", "AgentCore",
];

const PHASES = [
  { n: "01", title: "Engineering Foundations", weeks: "Weeks 1–4", body: "Python, FastAPI, design patterns, CI/CD, spec-driven dev — backend discipline before AI complexity." },
  { n: "02", title: "GenAI & Measurable RAG", weeks: "Weeks 5–9", body: "Hybrid retrieval, reranking, citation grounding, RAGAS evals, prompt caching, cost dashboards." },
  { n: "03", title: "Agents & MCP", weeks: "Weeks 10–13", body: "LangGraph orchestration, MCP servers, Claude Agent SDK + Skills, HITL governance, trajectory evals." },
  { n: "04", title: "Cloud, Cost & Security", weeks: "Weeks 14–16", body: "AWS Bedrock + AgentCore, observability, OWASP LLM Top 10, red-team your own capstone." },
  { n: "05", title: "Interview Mastery & Capstone", weeks: "Weeks 17–20", body: "7 mock interviews calibrated to real bars + Capstone Demo Day with industry panel." },
];

const STATS = [
  { k: "20", label: "weeks" },
  { k: "40", label: "sessions" },
  { k: "210", label: "hours total" },
  { k: "7", label: "mock interviews" },
];

function Landing() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Nav />
      <Hero />
      <Marquee />
      <Problem />
      <Phases />
      <Capstone />
      <CTA />
      <footer className="border-t border-rule">
        <div className="mx-auto max-w-6xl px-6 py-8 flex items-center justify-between text-xs text-muted-foreground">
          <span>© AI Engineer Career Accelerator</span>
          <span className="font-mono">Updated for May 2026</span>
        </div>
      </footer>
    </main>
  );
}

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`sticky top-0 z-50 backdrop-blur-md transition-colors ${scrolled ? "bg-background/80 border-b border-rule" : "bg-transparent"}`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="serif text-xl flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
          AI Engineer Accelerator
        </div>
        <div className="flex items-center gap-6">
          <Link to="/apply" className="text-xs uppercase tracking-widest hover:text-primary transition-colors">
            Apply
          </Link>
          <Link to="/admin/login" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            Admin
          </Link>
        </div>
      </div>
    </motion.header>
  );
}

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <section ref={ref} className="relative overflow-hidden">
      {/* Animated gradient blob */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full opacity-30 blur-3xl"
        style={{
          background: "radial-gradient(circle, var(--primary), transparent 70%)",
        }}
        animate={{ scale: [1, 1.2, 1], x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }}
        animate={{ scale: [1.1, 1, 1.1], x: [0, -30, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Grid backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <motion.div style={{ y, opacity }} className="relative mx-auto max-w-6xl px-6 pt-20 pb-28 md:pt-32 md:pb-40">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="label-eyebrow mb-8 flex items-center gap-3"
        >
          <span className="inline-block h-px w-8 bg-primary" />
          Production AI Systems · Hiring Conversion · 20 weeks
        </motion.div>

        <h1 className="display text-[14vw] md:text-[8.5rem] leading-[0.88]">
          <AnimatedLine delay={0.15}>Stop building</AnimatedLine>
          <AnimatedLine delay={0.3}><em className="italic text-primary">tutorials.</em></AnimatedLine>
          <AnimatedLine delay={0.45}>Start shipping</AnimatedLine>
          <AnimatedLine delay={0.6}>production AI.</AnimatedLine>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.6 }}
          className="mt-10 max-w-xl text-base md:text-lg text-muted-foreground leading-relaxed"
        >
          A 20-week, 40-session program that turns engineers into production AI engineers — RAG with eval gates,
          agents with MCP, cloud deployments on AWS, and 7 mock interviews calibrated to real hiring bars.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-12 flex flex-wrap items-center gap-6"
        >
          <Link
            to="/apply"
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-sm bg-primary px-7 py-4 text-sm font-medium text-primary-foreground"
          >
            <span className="relative z-10">Begin application</span>
            <motion.span
              aria-hidden
              className="relative z-10"
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >→</motion.span>
            <span className="absolute inset-0 bg-foreground/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </Link>
          <span className="text-xs text-muted-foreground">~35 minutes · No account required</span>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-rule pt-8"
        >
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 + i * 0.08, duration: 0.5 }}
            >
              <div className="display text-5xl md:text-6xl">{s.k}</div>
              <div className="label-eyebrow mt-2">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

function AnimatedLine({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <span className="block overflow-hidden">
      <motion.span
        className="block"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

function Marquee() {
  return (
    <section className="border-y border-rule bg-card overflow-hidden py-6">
      <motion.div
        className="flex gap-12 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        {[...STACK, ...STACK].map((s, i) => (
          <span key={i} className="font-mono text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-12">
            {s}
            <span className="inline-block h-1 w-1 rounded-full bg-primary" />
          </span>
        ))}
      </motion.div>
    </section>
  );
}

function Problem() {
  const items = [
    { stat: "0", label: "AI-system experience", body: "CS programs cover algorithms — not RAG pipelines, agents, or MCP." },
    { stat: "1/12", label: "Interview-to-offer rate", body: "Strong graduates fail interviews that test system design and AI judgment." },
    { stat: "6+ mo.", label: "Time-to-employability", body: "Self-study works, but takes too long and misses the patterns hiring managers test for." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
      >
        <div className="label-eyebrow mb-6">The problem</div>
        <h2 className="display text-5xl md:text-7xl max-w-3xl">
          CS graduates are not <em className="italic text-primary">production</em> AI engineers.
        </h2>
        <p className="mt-6 max-w-xl text-muted-foreground">Tutorials teach the model. We teach the system around it.</p>
      </motion.div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-px bg-rule border border-rule">
        {items.map((it, i) => (
          <motion.div
            key={it.label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="bg-background p-8 hover:bg-card transition-colors"
          >
            <div className="display text-6xl text-primary">{it.stat}</div>
            <div className="label-eyebrow mt-4">{it.label}</div>
            <p className="mt-3 text-sm leading-relaxed">{it.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Phases() {
  return (
    <section className="border-t border-rule bg-card">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="flex flex-wrap items-end justify-between gap-6"
        >
          <div>
            <div className="label-eyebrow mb-6">Program structure</div>
            <h2 className="display text-5xl md:text-7xl">5 phases · 40 sessions.</h2>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            Every week feeds the capstone. Every assessment is an artifact you can defend in an interview.
          </p>
        </motion.div>

        <div className="mt-16 space-y-px">
          {PHASES.map((p, i) => (
            <PhaseRow key={p.n} {...p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PhaseRow({ n, title, weeks, body, index }: { n: string; title: string; weeks: string; body: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.06 }}
      whileHover={{ x: 8 }}
      className="group relative grid grid-cols-12 gap-6 border-t border-rule py-8 cursor-default"
    >
      <div className="col-span-12 md:col-span-1 font-mono text-xs text-muted-foreground">{n}</div>
      <div className="col-span-12 md:col-span-4">
        <h3 className="serif text-2xl md:text-3xl group-hover:text-primary transition-colors">{title}</h3>
        <div className="label-eyebrow mt-2">{weeks}</div>
      </div>
      <p className="col-span-12 md:col-span-6 text-sm md:text-base text-muted-foreground leading-relaxed">{body}</p>
      <motion.span
        aria-hidden
        className="absolute right-0 top-1/2 -translate-y-1/2 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
        initial={false}
      >→</motion.span>
    </motion.div>
  );
}

function Capstone() {
  const tracks = [
    { tag: "A Track", title: "Community & Social Impact", body: "Youth Career AI Advisor · Community Services Navigator · Arabic-first public-services chatbot." },
    { tag: "B Track", title: "Industry Engineering Systems", body: "AI Code Review · Root-Cause Analysis agent · Spec-to-Code · DevEx browser-use agent." },
    { tag: "C Track", title: "Open Industry Problem", body: "Sourced from a partner company. Higher bar, real stakes, possible hiring pipeline." },
  ];
  return (
    <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <div className="label-eyebrow mb-6">Capstone</div>
        <h2 className="display text-5xl md:text-7xl max-w-3xl">
          Teams of 2–3 · runs the full <em className="italic text-primary">20 weeks.</em>
        </h2>
      </motion.div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {tracks.map((t, i) => (
          <motion.div
            key={t.tag}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            whileHover={{ y: -6 }}
            className="rounded-sm border border-rule bg-card p-8 transition-colors hover:border-primary"
          >
            <div className="label-eyebrow text-primary">{t.tag}</div>
            <h3 className="serif text-2xl mt-3">{t.title}</h3>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{t.body}</p>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="mt-12 text-xs uppercase tracking-widest text-muted-foreground"
      >
        Every capstone ships: production LLM service · measurable RAG · agent + MCP · cloud deployment · cost model · security review · Demo Day
      </motion.p>
    </section>
  );
}

function CTA() {
  return (
    <section className="relative border-t border-rule overflow-hidden">
      <motion.div
        aria-hidden
        className="absolute inset-0 opacity-20"
        style={{ background: "radial-gradient(ellipse at center, var(--primary), transparent 60%)" }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative mx-auto max-w-4xl px-6 py-32 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="display text-5xl md:text-7xl"
        >
          The objective is not theoretical AI knowledge.<br />
          The objective is <em className="italic text-primary">employability.</em>
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-12"
        >
          <Link
            to="/apply"
            className="group inline-flex items-center gap-3 rounded-sm bg-primary px-8 py-4 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Apply for the next cohort
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >→</motion.span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
