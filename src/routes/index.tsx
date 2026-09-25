import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import logoAsset from "@/assets/hasoub-labs.png.asset.json";


export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "AI Engineer Accelerator — HasoubLabs" },
    { name: "description", content: "A 17-week program for engineers building production AI systems, agents, RAG, and cloud applications." },
    { property: "og:title", content: "AI Engineer Accelerator — HasoubLabs" },
    { property: "og:description", content: "Build production AI systems, agents, RAG, and cloud applications in 17 weeks." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Landing,
});

const STACK = [
  "Generative AI",
  "Agentic AI",
  "RAG",
  "MCP",
  "Claude",
  "AWS Bedrock",
  "Cloud Services",
  "Prompt Engineering",
  "LangGraph",
  "Claude Agent SDK",
  "Skills",
  "AgentCore",
  "Vector Search",
  "Fine-Tuning",
  "Evals",
  "Interview Mastery",
  "Cursor",
  "OpenAI",
  "Gemini",
  "Tool Use",
];

const PHASES = [
  {
    n: "00",
    title: "Kickoff & Project Setup",
    weeks: "Week 1",
    body: "Program orientation, capstone team formation, tooling & environment setup for the 17-week build.",
  },
  {
    n: "01",
    title: "AI Development with Claude Code",
    weeks: "Weeks 2–4",
    body: "Spec-driven development with Kiro, system design, and shipping production-quality code with Claude Code as your pair.",
  },
  {
    n: "02",
    title: "GenAI & Measurable RAG",
    weeks: "Weeks 5–8",
    body: "Hybrid retrieval, reranking, citation grounding, RAGAS evals — build a measurable RAG system end-to-end.",
  },
  {
    n: "03",
    title: "Agents & MCP",
    weeks: "Weeks 8–11",
    body: "LangGraph orchestration, MCP servers, Claude Agent SDK, HITL governance, and red-teaming your own agent.",
  },
  {
    n: "04",
    title: "AWS Cloud Practitioner",
    weeks: "Weeks 11–14",
    body: "AWS core services (Lambda, S3, RDS, DynamoDB, Bedrock, AgentCore), observability, staging deploy of your capstone.",
  },
  {
    n: "05",
    title: "Soft Skills, Leadership & Interviews",
    weeks: "Weeks 14–17",
    body: "Communication, leadership, and mock interviews conducted by AWS engineers — Demo Day closes the program.",
  },
];

const STATS = [
  { k: "17", label: "weeks" },
  { k: "33", label: "core sessions" },
  { k: "86", label: "live hours" },
  { k: "9", label: "F2F blocks" },
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
          <span>© HasoubLabs · AI Engineer Career Accelerator</span>
          <span className="font-mono">Cohort · Aug 14 → Dec 04, 2026</span>

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
        <Link to="/" className="flex items-center gap-3">
          <img src={logoAsset.url} alt="HasoubLabs" className="h-8 w-auto" />
          <span className="hidden sm:inline text-xs uppercase tracking-[0.2em] text-muted-foreground border-l border-rule pl-3">
            AI Engineer Accelerator
          </span>
        </Link>

        <div className="flex items-center gap-4 sm:gap-6">
          <Link to="/cohort" className="text-xs uppercase tracking-widest hover:text-primary transition-colors">
            Cohort
          </Link>
          <Link to="/apply" className="text-xs uppercase tracking-widest hover:text-primary transition-colors">
            Apply
          </Link>
          <Link
            to="/admin/login"
            className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            Admin
          </Link>
        </div>
      </div>
    </motion.header>
  );
}

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const rocketRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const [adjust, setAdjust] = useState({ x: 0, scale: 1 });

  useEffect(() => {
    const SAFE_GAP = 24;
    const measure = () => {
      const h = headlineRef.current;
      const r = rocketRef.current;
      if (!h || !r) return;
      // Reset before measuring to get natural positions
      r.style.transform = "translate(0px, -50%) scale(1)";
      const hRect = h.getBoundingClientRect();
      const rRect = r.getBoundingClientRect();
      const overlap = hRect.right + SAFE_GAP - rRect.left;
      if (overlap > 0) {
        const maxShift = Math.max(0, rRect.width * 0.4);
        const x = Math.min(overlap, maxShift);
        const remaining = overlap - x;
        const scale = remaining > 0 ? Math.max(0.55, 1 - remaining / rRect.width) : 1;
        setAdjust({ x, scale });
      } else {
        setAdjust({ x: 0, scale: 1 });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (headlineRef.current) ro.observe(headlineRef.current);
    if (ref.current) ro.observe(ref.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

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

      <motion.div
        style={{ y, opacity }}
        className="relative mx-auto max-w-6xl px-6 pt-8 pb-10 md:pt-12 md:pb-16 min-h-[calc(100vh-80px)] flex flex-col justify-center"
      >
        <Rocket rocketRef={rocketRef} adjust={adjust} />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="label-eyebrow mb-6 flex items-center gap-3"
        >
          <span className="inline-block h-px w-8 bg-primary" />
          Production AI Systems · Hiring Conversion · 17 weeks
        </motion.div>

        <h1
          ref={headlineRef}
          className="display text-[10vw] sm:text-[8vw] md:text-[5rem] lg:text-[6rem] leading-[0.9] max-w-[70%] sm:max-w-[68%] md:max-w-[65%] lg:max-w-[62%] transition-[max-width,font-size] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        >
          <AnimatedLine delay={0.15}>Go beyond</AnimatedLine>
          <AnimatedLine delay={0.3}>
            <em className="italic text-primary">tutorials.</em>
          </AnimatedLine>
          <AnimatedLine delay={0.45}>Become industry-</AnimatedLine>
          <AnimatedLine delay={0.6}>ready.</AnimatedLine>
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-8 flex flex-wrap items-center gap-6"
        >
          <Link
            to="/apply"
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-sm bg-primary px-7 py-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow"
          >
            <span className="relative z-10">Begin application</span>
            <motion.span
              aria-hidden
              className="relative z-10"
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              →
            </motion.span>
            <span className="absolute inset-0 bg-foreground/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </Link>
          <span className="text-xs text-muted-foreground">~35 minutes · No account required</span>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-10 grid grid-cols-4 gap-6 border-t border-rule pt-6"
        >
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 + i * 0.08, duration: 0.5 }}
            >
              <div className="display text-3xl md:text-4xl">{s.k}</div>
              <div className="label-eyebrow mt-1.5">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

function AnimatedLine({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <span className="block mx-0 my-[8px] overflow-hidden">
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
          <span
            key={i}
            className="font-mono text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-12"
          >
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
    {
      stat: "0",
      label: "AI-system experience",
      body: "CS programs cover algorithms — not RAG pipelines, agents, or MCP.",
    },
    {
      stat: "1/12",
      label: "Interview-to-offer rate",
      body: "Strong graduates fail interviews that test system design and AI judgment.",
    },
    {
      stat: "6+ mo.",
      label: "Time-to-employability",
      body: "Self-study works, but takes too long and misses the patterns hiring managers test for.",
    },
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
            <h2 className="display text-5xl md:text-7xl">6 modules · 33 sessions.</h2>
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

function PhaseRow({
  n,
  title,
  weeks,
  body,
  index,
}: {
  n: string;
  title: string;
  weeks: string;
  body: string;
  index: number;
}) {
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
      >
        →
      </motion.span>
    </motion.div>
  );
}

function Capstone() {
  const tracks = [
    {
      tag: "Subsystem 1",
      title: "Intelligent Candidate Intake",
      body: "RAG-powered onboarding: resume parsing, skill extraction, and grounded candidate profiles.",
    },
    {
      tag: "Subsystem 2",
      title: "Matching & Ranking Engine",
      body: "Hybrid retrieval + rerankers to match candidates to roles with measurable relevance metrics.",
    },
    {
      tag: "Subsystem 3",
      title: "Agentic Interview Coach",
      body: "Claude Agent SDK + MCP tools running mock interviews, scoring, and structured feedback.",
    },
    {
      tag: "Subsystem 4",
      title: "Employer Insights Console",
      body: "Analytics, evals dashboards, and cost/observability panels for the hiring team.",
    },
    {
      tag: "Subsystem 5",
      title: "Cloud, Security & Ops",
      body: "AWS deploy (Lambda, S3, RDS, Bedrock), OWASP LLM Top 10 hardening, red-team review.",
    },
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
          Teams of 4–6 · one integrated platform: <em className="italic text-primary">Hasoub Talent Bridge.</em>
        </h2>
      </motion.div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        Every capstone ships: production LLM service · measurable RAG · agent + MCP · cloud deployment · cost model ·
        security review · Demo Day
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
          The objective is not theoretical AI knowledge.
          <br />
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
            <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
              →
            </motion.span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function Rocket({
  rocketRef,
  adjust,
}: {
  rocketRef: React.RefObject<HTMLDivElement | null>;
  adjust: { x: number; scale: number };
}) {
  return (
    <div
      ref={rocketRef}
      aria-hidden
      style={{ transform: `translate(${adjust.x}px, -50%) scale(${adjust.scale})`, transformOrigin: "right center" }}
      className="pointer-events-none absolute right-[4%] sm:right-[6%] md:right-[8%] lg:right-[10%] xl:right-[12%] top-[42%] sm:top-[40%] md:top-[38%] z-10 w-[120px] sm:w-[150px] md:w-[180px] lg:w-[220px] xl:w-[260px] transition-[width,right,top,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: [10, -10, 10], opacity: 1, rotate: [-2, 2, -2] }}
        transition={{
          y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 1 },
        }}
        className="relative"
      >
        {/* Exhaust trail */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 top-full w-3 origin-top"
          animate={{ scaleY: [0.8, 1.4, 0.9, 1.3, 0.8], opacity: [0.7, 1, 0.8, 1, 0.7] }}
          transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            height: 220,
            background:
              "linear-gradient(to bottom, var(--primary), color-mix(in oklab, var(--primary) 60%, orange), transparent)",
            filter: "blur(6px)",
            borderRadius: "50%",
          }}
        />
        {/* Sparks */}
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            className="absolute left-1/2 top-full block h-1.5 w-1.5 rounded-full bg-primary"
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{
              x: (i - 2) * 14,
              y: 140 + i * 8,
              opacity: 0,
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.18,
              ease: "easeOut",
            }}
          />
        ))}

        {/* Rocket SVG */}
        <svg
          viewBox="0 0 120 200"
          fill="none"
          className="relative w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        >
          {/* Body */}
          <path
            d="M60 8 C 80 28, 90 70, 90 110 L 90 150 L 30 150 L 30 110 C 30 70, 40 28, 60 8 Z"
            fill="url(#bodyGrad)"
            stroke="var(--foreground)"
            strokeWidth="1.5"
          />
          {/* Window */}
          <circle cx="60" cy="78" r="14" fill="var(--background)" stroke="var(--primary)" strokeWidth="2.5" />
          <circle cx="56" cy="74" r="4" fill="var(--primary)" opacity="0.6" />
          {/* Body stripe */}
          <rect x="30" y="120" width="60" height="6" fill="var(--primary)" opacity="0.8" />
          {/* Brand */}
          <text
            x="60"
            y="108"
            textAnchor="middle"
            fill="var(--foreground)"
            fontSize="8"
            fontWeight="700"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            letterSpacing="0.5"
          >
            HasoubLabs
          </text>
          {/* Left fin */}
          <path d="M30 110 L 8 160 L 30 150 Z" fill="var(--primary)" stroke="var(--foreground)" strokeWidth="1.5" />
          {/* Right fin */}
          <path d="M90 110 L 112 160 L 90 150 Z" fill="var(--primary)" stroke="var(--foreground)" strokeWidth="1.5" />
          {/* Nozzle */}
          <path d="M38 150 L 82 150 L 76 168 L 44 168 Z" fill="var(--foreground)" opacity="0.85" />
          <defs>
            <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--background)" />
              <stop offset="100%" stopColor="var(--card)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Oxygen tether — connects astronaut to rocket */}
        <svg
          aria-hidden
          className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <motion.path
            stroke="var(--primary)"
            strokeWidth="0.8"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
            animate={{
              d: [
                "M 29 55 C 20 62, 5 58, -10 48",
                "M 29 55 C 18 66, 2 64, -10 52",
                "M 29 55 C 20 62, 5 58, -10 48",
              ],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>

        {/* Astronaut — the AI engineer (static, tether stays anchored) */}
        <div className="absolute -left-[55%] sm:-left-[60%] top-[20%] w-[55%] sm:w-[60%]">
          <svg viewBox="0 0 140 180" fill="none" className="w-full h-auto drop-shadow-[0_15px_30px_rgba(0,0,0,0.4)]">
            {/* Backpack */}
            <rect
              x="42"
              y="70"
              width="56"
              height="46"
              rx="6"
              fill="var(--card)"
              stroke="var(--foreground)"
              strokeWidth="1.5"
            />
            {/* Body / suit */}
            <path
              d="M50 70 Q 50 58, 70 58 Q 90 58, 90 70 L 90 118 Q 90 130, 80 130 L 60 130 Q 50 130, 50 118 Z"
              fill="var(--background)"
              stroke="var(--foreground)"
              strokeWidth="1.5"
            />
            {/* Chest control panel */}
            <rect x="60" y="92" width="20" height="14" rx="2" fill="var(--primary)" opacity="0.85" />
            <circle cx="65" cy="99" r="1.5" fill="var(--background)" />
            <circle cx="70" cy="99" r="1.5" fill="var(--background)" />
            <circle cx="75" cy="99" r="1.5" fill="var(--background)" />
            {/* Arms */}
            <path
              d="M50 80 Q 32 92, 36 112"
              stroke="var(--foreground)"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M90 80 Q 108 88, 112 102"
              stroke="var(--foreground)"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            {/* Gloves */}
            <circle cx="36" cy="114" r="6" fill="var(--primary)" stroke="var(--foreground)" strokeWidth="1.2" />
            <circle cx="114" cy="104" r="6" fill="var(--primary)" stroke="var(--foreground)" strokeWidth="1.2" />
            {/* Legs */}
            <path d="M60 130 L 56 158" stroke="var(--foreground)" strokeWidth="8" strokeLinecap="round" />
            <path d="M80 130 L 84 158" stroke="var(--foreground)" strokeWidth="8" strokeLinecap="round" />
            {/* Boots */}
            <ellipse
              cx="54"
              cy="162"
              rx="8"
              ry="4"
              fill="var(--primary)"
              stroke="var(--foreground)"
              strokeWidth="1.2"
            />
            <ellipse
              cx="86"
              cy="162"
              rx="8"
              ry="4"
              fill="var(--primary)"
              stroke="var(--foreground)"
              strokeWidth="1.2"
            />
            {/* Helmet */}
            <circle cx="70" cy="40" r="26" fill="var(--background)" stroke="var(--foreground)" strokeWidth="1.5" />
            {/* Visor */}
            <path
              d="M 50 38 Q 70 18, 90 38 Q 88 52, 70 56 Q 52 52, 50 38 Z"
              fill="url(#visorGrad)"
              stroke="var(--foreground)"
              strokeWidth="1.2"
            />
            {/* Visor highlight */}
            <ellipse cx="60" cy="32" rx="6" ry="3" fill="var(--background)" opacity="0.7" />
            <defs>
              <linearGradient id="visorGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--primary)" />
                <stop offset="100%" stopColor="var(--foreground)" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </motion.div>
    </div>
  );
}
