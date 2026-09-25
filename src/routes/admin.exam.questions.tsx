import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Check, Eye, EyeOff, Plus, Save, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  adminDeleteExamQuestion,
  adminGetExamQuestions,
  adminSaveExamQuestion,
  type AdminExamQuestion,
} from "@/lib/exam.functions";

export const Route = createFileRoute("/admin/exam/questions")({
  head: () => ({ meta: [
    { title: "Exam Questions — Hasoub AI Accelerator Admin" },
    { name: "description", content: "View and edit the Claude Code Architect exam question bank." },
    { property: "og:title", content: "Exam Questions — Hasoub AI Accelerator Admin" },
    { property: "og:description", content: "View and edit the Claude Code Architect exam question bank." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ExamQuestionsPage,
});

const SLUG = "claude-architect";
const DOMAINS = {
  agentic: "Agentic architecture",
  tools_mcp: "Tools & MCP",
  claude_code: "Claude Code",
  prompting: "Prompt engineering",
  context: "Context & reliability",
} as const;
const KINDS = { single: "Single choice", multi: "Multiple choice", ordering: "Ordering", task: "Hands-on task" } as const;

function ExamQuestionsPage() {
  const [items, setItems] = useState<AdminExamQuestion[]>([]);
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setItems(await adminGetExamQuestions({ data: { slug: SLUG } })); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not load questions"); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => items.filter((q) => {
    const text = `${q.id} ${q.prompt} ${q.domain_label}`.toLowerCase();
    return (showInactive || q.active) && (domain === "all" || q.domain === domain) && text.includes(query.toLowerCase());
  }), [items, query, domain, showInactive]);

  const update = (id: string, patch: Partial<AdminExamQuestion>) =>
    setItems((all) => all.map((q) => q.id === id ? { ...q, ...patch } : q));

  const save = async (q: AdminExamQuestion) => {
    setBusyId(q.id);
    try {
      await adminSaveExamQuestion({ data: {
        id: q.id, exam_slug: SLUG, kind: q.kind, domain: q.domain as keyof typeof DOMAINS,
        prompt: q.prompt, choices: q.kind === "task" ? null : q.choices ?? [],
        correct_answer: q.kind === "task" ? null : q.correct_answer,
        scenario: q.scenario ?? null, rubric: q.rubric ?? null, explanation: q.explanation,
        points: q.points, presentation: q.presentation ?? null, exhibit: q.exhibit ?? null,
        starter: q.starter ?? null, order_index: q.order_index, active: q.active,
      } });
      toast.success(`${q.id.toUpperCase()} saved`);
      await load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save question"); }
    finally { setBusyId(null); }
  };

  const add = () => {
    const id = `custom-${Date.now()}`;
    const next: AdminExamQuestion = {
      id, kind: "single", domain: "claude_code", domain_label: DOMAINS.claude_code,
      prompt: "Write the new question here", choices: ["Correct answer", "Distractor", "Distractor", "Distractor"],
      correct_answer: 0, explanation: "Explain why the selected answer is correct.", points: 1,
      order_index: Math.max(0, ...items.map((q) => q.order_index)) + 1, active: true,
    };
    setItems((all) => [...all, next]);
    setExpanded(id);
  };

  const remove = async (q: AdminExamQuestion) => {
    if (!confirm(`Remove ${q.id.toUpperCase()} from the exam? Existing answers stay saved.`)) return;
    setBusyId(q.id);
    try { await adminDeleteExamQuestion({ data: { slug: SLUG, id: q.id } }); toast.success("Question removed from the exam"); await load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not remove question"); }
    finally { setBusyId(null); }
  };

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-6">
      <Link to="/admin/exam" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Exam control room</Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="label-eyebrow text-primary">Challenge #2 · Private answer key</div>
          <h1 className="display mt-2 text-5xl">Exam questions</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">Edit every question, simulation, answer, explanation, and AI grading rubric.</p>
        </div>
        <Button onClick={add}><Plus /> Add question</Button>
      </div>

      <div className="mt-7 border-l-4 border-primary bg-primary/5 px-4 py-3 text-sm">
        Changes apply immediately, including during a live exam. Existing answers remain saved by question ID.
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_220px_auto]">
        <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search 75 questions…" className="pl-9" /></div>
        <Select value={domain} onValueChange={setDomain}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All topics</SelectItem>{Object.entries(DOMAINS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select>
        <Button variant="outline" onClick={() => setShowInactive((v) => !v)}>{showInactive ? <EyeOff /> : <Eye />}{showInactive ? "Hide removed" : "Show removed"}</Button>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>{filtered.length} questions shown · {items.filter((q) => q.active).length} active</span>
        <span>{items.filter((q) => q.active).reduce((sum, q) => sum + q.points, 0)} total points</span>
      </div>

      <div className="mt-4 space-y-3">
        {filtered.map((q) => {
          const open = expanded === q.id;
          return <article key={q.id} className={`border border-rule bg-card ${!q.active ? "opacity-60" : ""}`}>
            <button type="button" onClick={() => setExpanded(open ? null : q.id)} className="flex w-full items-start gap-4 p-4 text-left">
              <span className="mt-0.5 min-w-12 font-mono text-xs font-bold text-primary">{q.id.toUpperCase()}</span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-medium leading-relaxed">{q.prompt}</span><span className="mt-1 block text-[11px] uppercase tracking-widest text-muted-foreground">{KINDS[q.kind]} · {DOMAINS[q.domain as keyof typeof DOMAINS]} · {q.points} pt</span></span>
              {!q.active && <span className="text-xs text-destructive">Removed</span>}
            </button>
            {open && <QuestionEditor q={q} update={(patch) => update(q.id, patch)} save={() => save(q)} remove={() => remove(q)} busy={busyId === q.id} />}
          </article>;
        })}
      </div>
    </main>
  );
}

function QuestionEditor({ q, update, save, remove, busy }: { q: AdminExamQuestion; update: (p: Partial<AdminExamQuestion>) => void; save: () => void; remove: () => void; busy: boolean }) {
  const setKind = (kind: AdminExamQuestion["kind"]) => update({
    kind, choices: kind === "task" ? undefined : q.choices?.length ? q.choices : ["Option A", "Option B"],
    correct_answer: kind === "task" ? null : kind === "single" ? 0 : kind === "ordering" ? [0, 1] : [0],
    scenario: kind === "task" ? q.scenario ?? "Describe the scenario." : undefined,
    rubric: kind === "task" ? q.rubric ?? "Describe the scoring criteria." : undefined,
  });
  const choices = q.choices ?? [];
  const answerArray = Array.isArray(q.correct_answer) ? q.correct_answer : [];
  return <div className="space-y-5 border-t border-rule p-4 sm:p-6">
    <div className="grid gap-4 sm:grid-cols-3">
      <label className="space-y-1 text-xs font-medium">Format<Select value={q.kind} onValueChange={(v) => setKind(v as AdminExamQuestion["kind"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(KINDS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></label>
      <label className="space-y-1 text-xs font-medium">Topic<Select value={q.domain} onValueChange={(v) => update({ domain: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(DOMAINS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></label>
      <label className="space-y-1 text-xs font-medium">Points<Input type="number" min={0.5} max={100} step={0.5} value={q.points} onChange={(e) => update({ points: Number(e.target.value) })} /></label>
    </div>
    <label className="block space-y-1 text-xs font-medium">Question<Textarea className="min-h-24 text-base" value={q.prompt} onChange={(e) => update({ prompt: e.target.value })} /></label>
    {q.kind === "task" ? <>
      <label className="block space-y-1 text-xs font-medium">Scenario<Textarea className="min-h-32 font-mono" value={q.scenario ?? ""} onChange={(e) => update({ scenario: e.target.value })} /></label>
      <label className="block space-y-1 text-xs font-medium">Starter workspace<Textarea className="min-h-32 font-mono" value={q.starter ?? ""} onChange={(e) => update({ starter: e.target.value })} /></label>
      <label className="block space-y-1 text-xs font-medium">Private AI grading rubric<Textarea className="min-h-32" value={q.rubric ?? ""} onChange={(e) => update({ rubric: e.target.value })} /></label>
    </> : <div className="space-y-2">
      <div className="text-xs font-medium">Answers {q.kind === "ordering" && <span className="font-normal text-muted-foreground">— arrange them in the correct order</span>}</div>
      {choices.map((choice, index) => {
        const selected = q.kind === "single" ? q.correct_answer === index : answerArray.includes(index);
        const orderPosition = q.kind === "ordering" ? answerArray.indexOf(index) : -1;
        return <div key={index} className="flex items-center gap-2">
          {q.kind === "single" ? <input aria-label={`Correct answer ${index + 1}`} type="radio" checked={selected} onChange={() => update({ correct_answer: index })} /> : q.kind === "multi" ? <Checkbox aria-label={`Correct answer ${index + 1}`} checked={selected} onCheckedChange={(on) => update({ correct_answer: on ? [...answerArray, index] : answerArray.filter((v) => v !== index) })} /> : <span className="flex w-7 justify-center font-mono text-xs font-bold text-primary">{orderPosition + 1}</span>}
          <Input value={choice} onChange={(e) => update({ choices: choices.map((c, i) => i === index ? e.target.value : c) })} />
          {q.kind === "ordering" && <><Button type="button" size="icon" variant="ghost" title="Move earlier" disabled={orderPosition <= 0} onClick={() => { const next = [...answerArray]; [next[orderPosition - 1], next[orderPosition]] = [next[orderPosition], next[orderPosition - 1]]; update({ correct_answer: next }); }}><ArrowUp /></Button><Button type="button" size="icon" variant="ghost" title="Move later" disabled={orderPosition < 0 || orderPosition >= answerArray.length - 1} onClick={() => { const next = [...answerArray]; [next[orderPosition + 1], next[orderPosition]] = [next[orderPosition], next[orderPosition + 1]]; update({ correct_answer: next }); }}><ArrowDown /></Button></>}
          <Button type="button" size="icon" variant="ghost" title="Remove answer" disabled={choices.length <= 2} onClick={() => update({ choices: choices.filter((_, i) => i !== index), correct_answer: q.kind === "single" ? 0 : answerArray.filter((v) => v !== index).map((v) => v > index ? v - 1 : v) })}><Trash2 /></Button>
        </div>;
      })}
      <Button type="button" size="sm" variant="outline" onClick={() => update({ choices: [...choices, "New option"], correct_answer: q.kind === "ordering" ? [...answerArray, choices.length] : q.correct_answer })}><Plus /> Add answer</Button>
      <label className="block space-y-1 pt-2 text-xs font-medium">Visual exhibit or code snippet<Textarea className="min-h-28 font-mono" value={q.exhibit ?? ""} onChange={(e) => update({ exhibit: e.target.value })} /></label>
    </div>}
    <label className="block space-y-1 text-xs font-medium">Explanation shown after the exam<Textarea className="min-h-24" value={q.explanation} onChange={(e) => update({ explanation: e.target.value })} /></label>
    <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-4">
      <label className="flex items-center gap-2 text-sm"><Checkbox checked={q.active} onCheckedChange={(active) => update({ active: active === true })} /> Active</label>
      <label className="ml-auto flex items-center gap-2 text-xs">Order<Input type="number" className="w-20" value={q.order_index} onChange={(e) => update({ order_index: Number(e.target.value) })} /></label>
      <Button variant="outline" onClick={remove} disabled={busy || !q.active}><Trash2 /> Remove</Button>
      <Button onClick={save} disabled={busy}><Save /> {busy ? "Saving…" : "Save question"}</Button>
    </div>
  </div>;
}