import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="serif text-xl">AI Engineer Accelerator</div>
          <Link to="/admin/login" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
            Admin
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20 md:py-32">
        <div className="label-eyebrow mb-8">Cohort applications — open</div>
        <h1 className="display text-6xl md:text-8xl leading-[0.95]">
          Apply to the next<br />
          <em className="italic text-primary">cohort.</em>
        </h1>
        <p className="mt-8 max-w-xl text-base text-muted-foreground leading-relaxed">
          A 20-week program for engineers who want to ship real AI systems. We admit 20–25 of 100+ applicants.
          The application takes about 35 minutes — three short essays, a 60-second video, and a brief timed knowledge check.
        </p>

        <div className="mt-12 flex items-center gap-6">
          <Link
            to="/apply"
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Begin application
            <span aria-hidden>→</span>
          </Link>
          <span className="text-xs text-muted-foreground">No account required.</span>
        </div>
      </section>

      <section className="border-t border-rule">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-16 md:grid-cols-3">
          <Step n="01" title="Application & essays" body="Background, GitHub, three short essays — 20 minutes." />
          <Step n="02" title="60-second video" body="A short take on a technical decision. Optional, encouraged." />
          <Step n="03" title="Timed knowledge check" body="A handful of multiple-choice questions. No pause, no AI." />
        </div>
      </section>

      <footer className="border-t border-rule">
        <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-muted-foreground">
          © AI Engineer Accelerator
        </div>
      </footer>
    </main>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <div className="label-eyebrow">{n}</div>
      <div className="serif mt-2 text-2xl">{title}</div>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
