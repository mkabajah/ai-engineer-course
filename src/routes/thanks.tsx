import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/thanks")({
  validateSearch: (s) => z.object({ id: z.string().optional() }).parse(s),
  head: () => ({ meta: [
    { title: "Application Received — Hasoub AI Accelerator" },
    { name: "description", content: "Your AI Engineer Accelerator application has been received." },
    { property: "og:title", content: "Application Received — Hasoub AI Accelerator" },
    { property: "og:description", content: "Your AI Engineer Accelerator application has been received." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ThanksPage,
});

function ThanksPage() {
  const { id } = Route.useSearch();
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-2xl px-6 py-32 text-center">
        <div className="label-eyebrow">Received</div>
        <h1 className="display mt-4 text-6xl">Thank you.</h1>
        <p className="mt-6 text-muted-foreground">
          Your application is in. You'll hear from us within two weeks. We review every submission carefully — we read essays, watch videos, and look at portfolios in detail.
        </p>
        {id && <p className="mt-6 font-mono text-xs text-muted-foreground">Reference: {id}</p>}
        <div className="mt-12">
          <Link to="/" className="text-sm underline underline-offset-4">
            ← Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
