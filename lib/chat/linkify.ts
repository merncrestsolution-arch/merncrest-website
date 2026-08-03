/** Split message text into plain segments and URL segments for link rendering. */
export type TextSegment = { type: "text"; value: string } | { type: "link"; value: string; href: string };

const URL_RE =
  /(?:https?:\/\/|www\.)[^\s<]+[^\s<.,;:!?'")\]}>]|(?:https?:\/\/)?merncrest\.lk[^\s<]*/gi;

function normalizeHref(raw: string): string {
  const trimmed = raw.replace(/[.,;:!?)]+$/, "");
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
  if (/^merncrest\.lk/i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

export function splitTextWithLinks(text: string): TextSegment[] {
  if (!text) return [];

  const segments: TextSegment[] = [];
  let lastIndex = 0;
  const re = new RegExp(URL_RE.source, URL_RE.flags);

  for (const match of text.matchAll(re)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, start) });
    }
    const raw = match[0];
    segments.push({ type: "link", value: raw, href: normalizeHref(raw) });
    lastIndex = start + raw.length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments.length ? segments : [{ type: "text", value: text }];
}
