import fs from 'fs';
import path from 'path';

/** Renders a legal draft from content/legal at build time. Supports the Markdown the drafts use. */
function inline(s: string): string {
  return s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" class="underline">$1</a>');
}

function toHtml(md: string): string {
  const out: string[] = [];
  const lines = md.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^\|/.test(l)) {
      const rows: string[][] = [];
      while (i < lines.length && /^\|/.test(lines[i])) {
        if (!/^\|\s*:?-/.test(lines[i])) rows.push(lines[i].split('|').slice(1, -1).map((c) => inline(c.trim())));
        i++;
      }
      i--;
      out.push(`<table><thead><tr>${rows[0].map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
    } else if (/^#{1,3} /.test(l)) {
      const n = l.match(/^#+/)![0].length;
      out.push(`<h${n + 1}>${inline(l.slice(n + 1))}</h${n + 1}>`);
    } else if (/^\s*([*-]|\d+\.) /.test(l)) {
      out.push(`<li>${inline(l.replace(/^\s*([*-]|\d+\.) /, ''))}</li>`);
    } else if (/^---\s*$/.test(l)) {
      out.push('<hr/>');
    } else if (l.trim()) {
      out.push(`<p>${inline(l)}</p>`);
    }
  }
  return out.join('\n').replace(/(<li>[^\n]*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
}

export default function LegalDoc({ file }: { file: 'privacy' | 'terms' }) {
  const md = fs.readFileSync(path.join(process.cwd(), 'content', 'legal', `${file}.md`), 'utf8');
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-ink [&_code]:rounded [&_code]:bg-paper2 [&_code]:px-1 [&_h2]:mt-2 [&_h2]:text-4xl [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h4]:mt-6 [&_h4]:font-semibold [&_hr]:my-6 [&_li]:ml-5 [&_li]:list-disc [&_p]:my-3 [&_p]:leading-relaxed [&_table]:my-4 [&_table]:w-full [&_table]:text-sm [&_td]:border [&_td]:border-line [&_td]:p-2 [&_th]:border [&_th]:border-line [&_th]:bg-paper [&_th]:p-2 [&_th]:text-left">
      <a href="/" className="font-display text-lg text-ink">Nestora</a>
      <div dangerouslySetInnerHTML={{ __html: toHtml(md) }} />
      <p className="mt-10 border-t border-line pt-4 text-sm text-muted">Questions about this? <a href="/contact" className="text-terra underline">Contact us</a>.</p>
    </main>
  );
}
