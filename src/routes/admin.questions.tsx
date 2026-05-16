import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/questions")({ component: Questions });

type Q = {
  id: string;
  question: string;
  choices: string[];
  correct_index: number;
  time_limit_seconds: number;
  order_index: number;
  active: boolean;
};

function Questions() {
  const [items, setItems] = useState<Q[]>([]);
  const load = async () => {
    const { data } = await supabase.from("quiz_questions").select("*").order("order_index");
    setItems((data ?? []).map((q) => ({
      ...q, choices: Array.isArray(q.choices) ? (q.choices as string[]) : [],
    })) as Q[]);
  };
  useEffect(() => { load(); }, []);

  const save = async (q: Q) => {
    const { error } = await supabase.from("quiz_questions").update({
      question: q.question, choices: q.choices, correct_index: q.correct_index,
      time_limit_seconds: q.time_limit_seconds, order_index: q.order_index, active: q.active,
    }).eq("id", q.id);
    if (error) toast.error(error.message); else toast.success("Saved.");
  };
  const del = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    await supabase.from("quiz_questions").delete().eq("id", id);
    load();
  };
  const add = async () => {
    const { error } = await supabase.from("quiz_questions").insert({
      question: "New question",
      choices: ["Option A", "Option B", "Option C", "Option D"],
      correct_index: 0,
      time_limit_seconds: 30,
      order_index: items.length + 1,
      active: true,
    });
    if (error) toast.error(error.message); else load();
  };

  return (
    <section className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="label-eyebrow">Quiz</div>
          <h1 className="display text-5xl mt-2">Knowledge check questions</h1>
        </div>
        <button onClick={add} className="rounded-sm bg-primary px-4 py-2 text-sm text-primary-foreground">+ Add question</button>
      </div>

      <div className="space-y-6">
        {items.map((q) => (
          <div key={q.id} className="rounded-sm border border-rule bg-card p-6 space-y-4">
            <Textarea value={q.question} onChange={(e) => setItems(items.map((x) => x.id === q.id ? { ...x, question: e.target.value } : x))} className="min-h-[70px] serif text-lg" />
            <div className="space-y-2">
              {q.choices.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={q.correct_index === i}
                    onChange={() => setItems(items.map((x) => x.id === q.id ? { ...x, correct_index: i } : x))}
                  />
                  <Input value={c} onChange={(e) => setItems(items.map((x) => x.id === q.id ? {
                    ...x, choices: x.choices.map((cc, ii) => ii === i ? e.target.value : cc),
                  } : x))} />
                  <button onClick={() => setItems(items.map((x) => x.id === q.id ? { ...x, choices: x.choices.filter((_, ii) => ii !== i) } : x))} className="text-xs text-muted-foreground">×</button>
                </div>
              ))}
              <button onClick={() => setItems(items.map((x) => x.id === q.id ? { ...x, choices: [...x.choices, "New option"] } : x))} className="text-xs underline underline-offset-4">+ Add option</button>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-2">
                Time limit (s):
                <Input type="number" value={q.time_limit_seconds} onChange={(e) => setItems(items.map((x) => x.id === q.id ? { ...x, time_limit_seconds: parseInt(e.target.value) || 30 } : x))} className="w-20 h-8" />
              </label>
              <label className="flex items-center gap-2">
                Order:
                <Input type="number" value={q.order_index} onChange={(e) => setItems(items.map((x) => x.id === q.id ? { ...x, order_index: parseInt(e.target.value) || 0 } : x))} className="w-20 h-8" />
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={q.active} onChange={(e) => setItems(items.map((x) => x.id === q.id ? { ...x, active: e.target.checked } : x))} />
                Active
              </label>
              <div className="ml-auto flex gap-2">
                <button onClick={() => save(q)} className="rounded-sm bg-primary px-3 py-1.5 text-primary-foreground">Save</button>
                <button onClick={() => del(q.id)} className="text-destructive">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
