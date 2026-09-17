import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, Trophy } from "lucide-react";
import { ChallengeLeaderboard } from "@/components/ChallengeLeaderboard";
import { Button } from "@/components/ui/button";
import { getChallenge, getLeaderboard, type LeaderboardRow, type PublicChallenge } from "@/lib/challenge.functions";

export const Route = createFileRoute("/challenges/$slug/leaderboard")({
  component: ChallengeLeaderboardPage,
  head: () => ({
    meta: [
      { title: "Challenge #1 Leaderboard — AI Engineer Accelerator" },
      { name: "description", content: "Final rankings and review status for the open-source contribution challenge." },
      { property: "og:title", content: "Challenge #1 Leaderboard" },
      { property: "og:description", content: "Final rankings for the AI Engineer Accelerator open-source challenge." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ChallengeLeaderboardPage() {
  const { slug } = Route.useParams();
  const [challenge, setChallenge] = useState<PublicChallenge | null | undefined>(undefined);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const [nextChallenge, nextRows] = await Promise.all([
        getChallenge({ data: { slug } }),
        getLeaderboard({ data: { slug } }),
      ]).catch(() => [null, []] as const);
      if (!alive) return;
      setChallenge(nextChallenge);
      setRows(nextRows);
    };
    load();
    const interval = window.setInterval(load, 8000);
    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, [slug]);

  if (challenge === undefined) {
    return <div className="min-h-screen animate-pulse bg-background" />;
  }

  return (
    <main className="leaderboard-page min-h-screen overflow-hidden bg-background px-5 py-8 text-foreground sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <Button asChild variant="ghost" className="-ml-3">
          <Link to="/challenges/$slug" params={{ slug }}><ArrowLeft aria-hidden="true" /> Back to challenge</Link>
        </Button>

        {!challenge ? (
          <div className="py-24 text-center">
            <h1 className="text-4xl">Challenge not found</h1>
          </div>
        ) : (
          <>
            <header className="challenge-reveal pb-10 pt-10 text-center sm:pb-14">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-primary/25 bg-primary/10 text-primary">
                <Trophy className="h-6 w-6" aria-hidden="true" />
              </div>
              <p className="label-eyebrow mt-5 text-primary">Challenge results</p>
              <h1 className="display mx-auto mt-2 max-w-4xl text-5xl sm:text-7xl">Leaderboard</h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">{challenge.title}</p>
            </header>

            {challenge.state === "finished" ? (
              <ChallengeLeaderboard rows={rows} featured />
            ) : (
              <section className="challenge-reveal mx-auto max-w-2xl rounded-md border border-rule bg-card p-8 text-center sm:p-12">
                <Sparkles className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
                <h2 className="mt-4 text-3xl">Results unlock at the finish</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                  The leaderboard stays hidden during the challenge so everyone can focus on shipping useful work.
                </p>
                <Button asChild className="mt-6">
                  <Link to="/challenges/$slug" params={{ slug }}>Return to the challenge</Link>
                </Button>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}