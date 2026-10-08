import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, BrainCircuit, Code2, Clock3, Monitor, Radio, Siren, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminListChallenges, type AdminChallengeSummary } from "@/lib/challenge.functions";

export const Route = createFileRoute("/admin/challenges")({
  head: () => ({
    meta: [
      { title: "Challenges — Hasoub AI Accelerator Admin" },
      { name: "description", content: "Browse and manage every live training challenge." },
      { property: "og:title", content: "Challenges — Hasoub AI Accelerator Admin" },
      { property: "og:description", content: "Browse and manage every live training challenge." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChallengesLibrary,
});

const STATE_LABEL: Record<string, string> = {
  not_started: "Ready",
  live: "Live now",
  paused: "Paused",
  finished: "Finished",
};

function ChallengesLibrary() {
  const [items, setItems] = useState<AdminChallengeSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await adminListChallenges());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load challenges");
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 8000);
    return () => clearInterval(timer);
  }, [load]);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-6">
      <div className="max-w-2xl">
        <div className="label-eyebrow text-primary">Live learning control</div>
        <h1 className="display mt-2 text-5xl sm:text-6xl">Challenges</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Choose a challenge to prepare it, run the shared clock, and review participant work.
        </p>
      </div>

      {error && <p className="mt-6 rounded-sm border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}

      {!items ? (
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {[0, 1].map((n) => <div key={n} className="h-64 animate-pulse rounded-md bg-muted" />)}
        </div>
      ) : (
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {items.map((challenge, index) => (
            <article key={challenge.id} className="challenge-project group flex min-h-72 flex-col border border-rule bg-card p-6" style={{ animationDelay: `${index * 90}ms` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-primary/10 text-primary">
                  {challenge.kind === "orbit" ? <Siren className="h-5 w-5" /> : challenge.kind === "exam" ? <BrainCircuit className="h-5 w-5" /> : <Code2 className="h-5 w-5" />}
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${challenge.state === "live" ? "border-primary/30 bg-primary/10 text-primary" : "border-rule text-muted-foreground"}`}>
                  {challenge.state === "live" && <Radio className="h-3 w-3 animate-pulse" />}
                  {STATE_LABEL[challenge.state] ?? challenge.state}
                </span>
              </div>

              <div className="mt-6 text-[11px] uppercase tracking-widest text-muted-foreground">
                {challenge.kind === "orbit" ? "3-hour solo mission · live scoring" : challenge.kind === "exam" ? "Interactive exam" : "Open-source sprint"}
              </div>
              <h2 className="serif mt-1 text-3xl leading-tight">{challenge.title}</h2>
              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{challenge.goal ?? challenge.description}</p>

              <div className="mt-auto flex flex-wrap items-center gap-4 pt-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{challenge.duration_minutes} minutes</span>
                <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{challenge.participant_count} participants</span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-rule pt-5">
                {challenge.kind === "orbit" ? (
                  <><Button asChild><Link to="/admin/broken-prod">Host console <ArrowUpRight /></Link></Button><Button asChild variant="outline"><a href="/broken-prod/screen" target="_blank" rel="noreferrer">Projector <Monitor /></a></Button></>
                ) : challenge.kind === "exam" ? (
                  <><Button asChild><Link to="/admin/exam">Manage challenge <ArrowUpRight /></Link></Button><Button asChild variant="outline"><Link to="/admin/exam/questions">Questions <ArrowUpRight /></Link></Button></>
                ) : (
                  <Button asChild><Link to="/admin/challenge">Manage challenge <ArrowUpRight /></Link></Button>
                )}
                <Button asChild variant="outline">
                  <a href={challenge.public_path} target="_blank" rel="noreferrer">Participant page <ArrowUpRight /></a>
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}