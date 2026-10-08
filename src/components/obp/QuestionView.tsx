// Read-only rendering of an exam question with its correct answer (host views: a participant's answers, the question bank).
import { CheckCircle2, CircleDashed, Flag, XCircle } from "lucide-react";
import type { AdminQuestion } from "@/lib/obp/obp.functions";
import { Markdown } from "./Markdown";

type Props = {
  q: AdminQuestion;
  heading: string;
  /** a participant's answer (omit in the question bank) */
  mine?: string[];
  isCorrect?: boolean;
  flagged?: boolean;
  /** question bank: how many times each option/pair was picked */
  picks?: Record<string, number>;
  footer?: React.ReactNode;
};

export function QuestionView({ q, heading, mine, isCorrect, flagged, picks, footer }: Props) {
  const answered = mine !== undefined && mine.length > 0;
  const text = (id?: string) => q.options.find((o) => o.id === id)?.text ?? "—";
  const border =
    mine === undefined
      ? "border-rule"
      : !answered
        ? "border-amber-300"
        : isCorrect
          ? "border-emerald-300"
          : "border-primary/40";
  return (
    <article className={`rounded-md border bg-card p-4 ${border}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {mine !== undefined &&
          (!answered ? (
            <CircleDashed className="h-4 w-4 text-amber-600" />
          ) : isCorrect ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <XCircle className="h-4 w-4 text-primary" />
          ))}
        <span>{heading}</span>
        <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase">
          {q.kind}
        </span>
        {flagged && (
          <span className="inline-flex items-center gap-1 text-[color:var(--timer-urgent)]">
            <Flag className="h-3 w-3" /> flagged
          </span>
        )}
        {mine !== undefined && !answered && <span className="text-amber-700">not answered</span>}
      </div>
      <Markdown text={q.prompt_md} className="mt-2 text-sm" />
      {q.code && (
        <pre className="mt-2 overflow-x-auto rounded-md bg-[#0F1B30] p-3 font-mono text-[12px] text-[#E8EDF7]">
          <code>{q.code}</code>
        </pre>
      )}
      {q.image && (
        <img
          src={q.image}
          alt=""
          className="mt-2 w-full max-w-xl rounded-md border border-rule bg-white"
        />
      )}

      {(q.kind === "single" || q.kind === "multi") && (
        <ul className="mt-3 space-y-1 text-sm">
          {q.options.map((o) => {
            const correct = q.correct.includes(o.id);
            const picked = mine?.includes(o.id);
            return (
              <li
                key={o.id}
                className={`flex items-start gap-2 rounded-sm border px-2.5 py-1.5 ${
                  correct
                    ? "border-emerald-300 bg-emerald-50"
                    : picked
                      ? "border-primary/40 bg-primary/5"
                      : "border-rule"
                }`}
              >
                <span className="w-4 shrink-0 font-mono text-xs">
                  {correct ? "✓" : picked ? "✗" : "·"}
                </span>
                <span className="flex-1">
                  <Markdown text={o.text} />
                </span>
                {picked && (
                  <span className="shrink-0 text-[11px] text-muted-foreground">their answer</span>
                )}
                {picks && (
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                    {picks[o.id] ?? 0}×
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {q.kind === "order" && (
        <div className={`mt-3 grid grid-cols-1 gap-3 text-sm ${mine ? "sm:grid-cols-2" : ""}`}>
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Correct order
            </div>
            <ol className="mt-1 list-decimal space-y-0.5 pl-5">
              {q.correct.map((id) => (
                <li key={id}>
                  <Markdown text={text(id)} />
                </li>
              ))}
            </ol>
          </div>
          {mine && (
            <div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Their order
              </div>
              <ol className="mt-1 list-decimal space-y-0.5 pl-5">
                {mine.map((id, i) => (
                  <li key={id} className={q.correct[i] === id ? "" : "text-primary"}>
                    <Markdown text={text(id)} />
                  </li>
                ))}
                {mine.length === 0 && <li className="list-none text-muted-foreground">—</li>}
              </ol>
            </div>
          )}
        </div>
      )}

      {q.kind === "match" && (
        <ul className="mt-3 space-y-1 text-sm">
          {(q.items ?? []).map((item) => {
            const right = q.correct.find((c) => c.startsWith(`${item.id}:`))?.split(":")[1];
            const theirs = mine?.find((c) => c.startsWith(`${item.id}:`))?.split(":")[1];
            const ok = mine === undefined || right === theirs;
            return (
              <li
                key={item.id}
                className={`rounded-sm border px-2.5 py-1.5 ${ok ? "border-emerald-300 bg-emerald-50" : "border-primary/40 bg-primary/5"}`}
              >
                <Markdown text={`${item.text} → ${text(right)}`} />
                {mine !== undefined && !ok && (
                  <div className="text-[11px] text-muted-foreground">
                    their match: {text(theirs)}
                  </div>
                )}
                {picks && (
                  <div className="text-[11px] text-muted-foreground">
                    {picks[`${item.id}:${right}`] ?? 0}× matched correctly
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {q.explanation_md && (
        <Markdown text={q.explanation_md} className="mt-2 text-xs text-muted-foreground" />
      )}
      {footer}
    </article>
  );
}
