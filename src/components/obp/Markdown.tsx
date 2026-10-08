// Tiny, safe Markdown renderer for challenge cards, exam questions and announcements.
// Supports paragraphs, line breaks, # headings, - / 1. lists, ``` code blocks, `inline code`, **bold**, *italic*
// and [links](https://…). Builds React elements only (no innerHTML), so content can never inject HTML.
import { Fragment, type ReactNode } from "react";

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*)|(\[[^\]]+\]\((https?:\/\/[^)\s]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${keyBase}-${i++}`;
    if (m[1])
      out.push(
        <code
          key={k}
          className="rounded-sm bg-[color-mix(in_oklab,currentColor_14%,transparent)] px-1 py-0.5 font-mono text-[0.85em]"
        >
          {m[1].slice(1, -1)}
        </code>,
      );
    else if (m[2]) out.push(<strong key={k}>{m[2].slice(2, -2)}</strong>);
    else if (m[3]) out.push(<em key={k}>{m[3].slice(1, -1)}</em>);
    else if (m[4]) {
      const label = m[4].slice(1, m[4].indexOf("]("));
      out.push(
        <a
          key={k}
          href={m[5]}
          target="_blank"
          rel="noreferrer noopener"
          className="underline underline-offset-2 hover:text-primary"
        >
          {label}
        </a>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function withBreaks(lines: string[], keyBase: string): ReactNode[] {
  return lines.flatMap((l, i) =>
    i === 0
      ? inline(l, `${keyBase}-${i}`)
      : [<br key={`${keyBase}-br${i}`} />, ...inline(l, `${keyBase}-${i}`)],
  );
}

export function Markdown({
  text,
  className = "",
}: {
  text: string | null | undefined;
  className?: string;
}) {
  const src = String(text ?? "").replace(/\r\n/g, "\n");
  const blocks: ReactNode[] = [];
  const lines = src.split("\n");
  let i = 0;
  let b = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) code.push(lines[i++]);
      i++;
      blocks.push(
        <pre
          key={b++}
          className="overflow-x-auto rounded-md bg-[#0F1B30] p-3 font-mono text-[12.5px] leading-relaxed text-[#E8EDF7]"
          data-lang={lang || undefined}
        >
          <code>{code.join("\n")}</code>
        </pre>,
      );
      continue;
    }
    if (!line.trim()) {
      i++;
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const size = h[1].length <= 2 ? "text-lg font-semibold" : "text-base font-semibold";
      blocks.push(
        <div key={b++} className={size}>
          {inline(h[2], `h${b}`)}
        </div>,
      );
      i++;
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ""));
        i++;
        while (
          i < lines.length &&
          /^\s{2,}\S/.test(lines[i]) &&
          !/^\s*([-*]|\d+\.)\s+/.test(lines[i])
        )
          items[items.length - 1] += "\n" + lines[i++].trim();
      }
      const Tag = ordered ? "ol" : "ul";
      blocks.push(
        <Tag key={b++} className={`${ordered ? "list-decimal" : "list-disc"} space-y-1 pl-5`}>
          {items.map((it, j) => (
            <li key={j}>{withBreaks(it.split("\n"), `li${b}-${j}`)}</li>
          ))}
        </Tag>,
      );
      continue;
    }
    if (line.startsWith(">")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].startsWith(">"))
        quote.push(lines[i++].replace(/^>\s?/, ""));
      blocks.push(
        <blockquote key={b++} className="border-l-2 border-primary/50 pl-3 text-muted-foreground">
          {withBreaks(quote, `q${b}`)}
        </blockquote>,
      );
      continue;
    }
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("```") &&
      !/^(#{1,4})\s+/.test(lines[i]) &&
      !/^\s*([-*]|\d+\.)\s+/.test(lines[i]) &&
      !lines[i].startsWith(">")
    )
      para.push(lines[i++]);
    blocks.push(<p key={b++}>{withBreaks(para, `p${b}`)}</p>);
  }
  return (
    <div className={`space-y-3 leading-relaxed ${className}`}>
      {blocks.map((x, k) => (
        <Fragment key={k}>{x}</Fragment>
      ))}
    </div>
  );
}
