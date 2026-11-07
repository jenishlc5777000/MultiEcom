import Link from "next/link";
import { Fragment } from "react";

/**
 * Renders a blog post body written with simple formatting. Builds React
 * elements (never raw HTML), so anything typed is shown as text.
 *
 *   ## Heading / ### Smaller heading
 *   - list item  (or 1. numbered)
 *   > quote
 *   ![alt text](https://picture-url)
 *   **bold**, *italic*, [link text](https://…)
 *   blank line = new paragraph
 */
const SAFE_URL = /^(https:\/\/|\/(?!\/))/;

function inline(text: string, key: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const rx = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = rx.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${n++}`;
    if (m[1]) out.push(<strong key={k}>{m[1]}</strong>);
    else if (m[2]) out.push(<em key={k}>{m[2]}</em>);
    else if (m[3] && m[4] && SAFE_URL.test(m[4])) {
      out.push(
        m[4].startsWith("/") ? (
          <Link key={k} href={m[4]} className="text-accent underline underline-offset-4">{m[3]}</Link>
        ) : (
          <a key={k} href={m[4]} target="_blank" rel="noopener noreferrer nofollow" className="text-accent underline underline-offset-4">{m[3]}</a>
        ),
      );
    } else out.push(m[0]);
    last = rx.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Block =
  | { t: "h2" | "h3" | "p" | "quote"; text: string }
  | { t: "ul" | "ol"; items: string[] }
  | { t: "img"; alt: string; url: string };

export function parseBody(body: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ t: "p", text: para.join(" ") });
    para = [];
  };
  for (const raw of body.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    const img = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    const ul = line.match(/^[-*]\s+(.*)$/);
    const ol = line.match(/^\d+[.)]\s+(.*)$/);
    const prev = blocks[blocks.length - 1];
    if (!line) flush();
    else if (line.startsWith("### ")) {
      flush();
      blocks.push({ t: "h3", text: line.slice(4) });
    } else if (line.startsWith("## ") || line.startsWith("# ")) {
      flush();
      blocks.push({ t: "h2", text: line.replace(/^#+\s/, "") });
    } else if (line.startsWith("> ")) {
      flush();
      blocks.push({ t: "quote", text: line.slice(2) });
    } else if (img && SAFE_URL.test(img[2]!)) {
      flush();
      blocks.push({ t: "img", alt: img[1]!, url: img[2]! });
    } else if (ul) {
      flush();
      if (prev?.t === "ul" && !para.length) prev.items.push(ul[1]!);
      else blocks.push({ t: "ul", items: [ul[1]!] });
    } else if (ol) {
      flush();
      if (prev?.t === "ol") prev.items.push(ol[1]!);
      else blocks.push({ t: "ol", items: [ol[1]!] });
    } else para.push(line);
  }
  flush();
  return blocks;
}

export function PostBody({ body }: { body: string }) {
  return (
    <div className="space-y-6 text-[17px] leading-relaxed text-ink/90">
      {parseBody(body).map((b, i) => {
        const k = String(i);
        switch (b.t) {
          case "h2":
            return <h2 key={k} className="pt-4 text-h3 text-ink">{inline(b.text, k)}</h2>;
          case "h3":
            return <h3 key={k} className="pt-2 text-lg font-semibold text-ink">{inline(b.text, k)}</h3>;
          case "quote":
            return <blockquote key={k} className="border-l-2 border-accent pl-5 font-display text-xl italic text-ink">{inline(b.text, k)}</blockquote>;
          case "ul":
          case "ol": {
            const List = b.t;
            return (
              <List key={k} className={`space-y-2 pl-6 ${b.t === "ul" ? "list-disc" : "list-decimal"}`}>
                {b.items.map((it, j) => <li key={j}>{inline(it, `${k}-${j}`)}</li>)}
              </List>
            );
          }
          case "img":
            return (
              <figure key={k} className="space-y-2">
                {/* Plain <img>: pictures may come from any https address the owner pastes. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.url} alt={b.alt} loading="lazy" className="w-full rounded-lg bg-surface" />
                {b.alt && <figcaption className="text-sm text-muted">{b.alt}</figcaption>}
              </figure>
            );
          default:
            return <p key={k}>{inline(b.text, k).map((x, j) => <Fragment key={j}>{x}</Fragment>)}</p>;
        }
      })}
    </div>
  );
}

/** Rough reading time in minutes. */
export function readingMinutes(body: string) {
  return Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200));
}
