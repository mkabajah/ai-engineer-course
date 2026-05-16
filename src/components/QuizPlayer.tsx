import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type QuizAnswer = {
  question_id: string;
  selected_index: number | null;
  time_taken_seconds: number;
};

type Question = {
  id: string;
  question: string;
  choices: string[];
  time_limit_seconds: number;
  order_index: number;
  image_url: string | null;
};

export function QuizPlayer({
  onComplete,
  completed,
}: {
  onComplete: (answers: QuizAnswer[]) => void;
  completed: boolean;
}) {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [remaining, setRemaining] = useState(0);
  const [startTs, setStartTs] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("id, question, choices, time_limit_seconds, order_index, image_url")
        .eq("active", true)
        .order("order_index", { ascending: true });
      if (error) {
        console.error(error);
        return;
      }
      const qs = (data ?? []).map((q) => ({
        id: q.id,
        question: q.question,
        choices: Array.isArray(q.choices) ? (q.choices as string[]) : [],
        time_limit_seconds: q.time_limit_seconds,
        order_index: q.order_index,
        image_url: (q as { image_url: string | null }).image_url ?? null,
      }));
      setQuestions(qs);
    })();
  }, []);

  // Timer
  useEffect(() => {
    if (!started || !questions || idx >= questions.length) return;
    setRemaining(questions[idx].time_limit_seconds);
    setStartTs(Date.now());
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(interval);
          submitAnswer(null);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, started, questions]);

  const submitAnswer = (selectedIdx: number | null) => {
    if (!questions) return;
    const q = questions[idx];
    const elapsed = (Date.now() - startTs) / 1000;
    const next: QuizAnswer = {
      question_id: q.id,
      selected_index: selectedIdx,
      time_taken_seconds: Math.min(elapsed, q.time_limit_seconds),
    };
    const newAnswers = [...answers, next];
    setAnswers(newAnswers);
    if (idx + 1 >= questions.length) {
      onComplete(newAnswers);
    } else {
      setIdx(idx + 1);
    }
  };

  if (completed) {
    return (
      <div className="rounded-sm border border-rule bg-card p-8 text-center">
        <div className="serif text-2xl">Knowledge check complete ✓</div>
        <p className="mt-2 text-sm text-muted-foreground">{answers.length} answers recorded.</p>
      </div>
    );
  }

  if (!questions) return <p className="text-sm text-muted-foreground">Loading questions…</p>;
  if (questions.length === 0)
    return <p className="text-sm text-muted-foreground">No quiz configured.</p>;

  if (!started) {
    return (
      <div className="rounded-sm border border-rule bg-card p-8 space-y-4">
        <div className="serif text-2xl">Ready when you are.</div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• {questions.length} questions, one at a time.</li>
          <li>• Each question has its own countdown. When it hits zero, we move on.</li>
          <li>• No pause, no going back. Don't use AI — we measure timing per question.</li>
        </ul>
        <button
          onClick={() => setStarted(true)}
          className="rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Start the quiz →
        </button>
      </div>
    );
  }

  const q = questions[idx];
  const pct = (remaining / q.time_limit_seconds) * 100;

  return (
    <div className="rounded-sm border border-rule bg-card p-8 space-y-6">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Question {idx + 1} of {questions.length}</span>
        <span className={`font-mono ${remaining <= 5 ? "text-destructive" : ""}`}>{remaining}s</span>
      </div>
      <div className="h-[2px] w-full bg-muted">
        <div
          className={`h-full transition-all ${remaining <= 5 ? "bg-destructive" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <h2 className="serif text-2xl leading-snug">{q.question}</h2>
      <div className="space-y-2">
        {q.choices.map((c, i) => (
          <button
            key={i}
            onClick={() => submitAnswer(i)}
            className="block w-full rounded-sm border border-rule bg-background px-4 py-3 text-left text-sm transition-colors hover:border-primary hover:bg-accent"
          >
            <span className="mr-3 font-mono text-xs text-muted-foreground">{String.fromCharCode(65 + i)}</span>
            {c}
          </button>
        ))}
      </div>
      <button
        onClick={() => submitAnswer(null)}
        className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        Skip question
      </button>
    </div>
  );
}
