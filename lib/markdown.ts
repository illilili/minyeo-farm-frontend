function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeUrl(url: string): string {
  try {
    return encodeURI(url.trim());
  } catch {
    return url.trim();
  }
}

function applyInlineMarkdown(input: string): string {
  return input
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt: string, rawUrl: string) => {
      const safeUrl = normalizeUrl(rawUrl);
      return `<img src="${safeUrl}" alt="${alt}" class="markdown-image" />`;
    })
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text: string, rawUrl: string) => {
      const safeUrl = normalizeUrl(rawUrl);
      return `<a href="${safeUrl}" target="_blank" rel="noreferrer">${text}</a>`;
    })
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

export function renderMarkdown(markdown: string): string {
  const escaped = escapeHtml(markdown).replace(/\r\n/g, "\n");

  const codeBlocks: string[] = [];
  const withTokens = escaped.replace(/```([\s\S]*?)```/g, (_, code: string) => {
    const token = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(`<pre><code>${code.trim()}</code></pre>`);
    return token;
  });

  const parts = withTokens.split(/\n{2,}/);
  const htmlParts = parts.map((rawPart) => {
    const part = rawPart.trim();
    if (!part) return "";

    if (/^__CODE_BLOCK_\d+__$/.test(part)) return part;

    if (/^#{1,6}\s/.test(part)) {
      const level = part.match(/^#{1,6}/)?.[0].length ?? 1;
      const content = applyInlineMarkdown(part.replace(/^#{1,6}\s*/, ""));
      return `<h${level}>${content}</h${level}>`;
    }

    if (/^>\s/.test(part)) {
      const content = applyInlineMarkdown(part.replace(/^>\s*/, ""));
      return `<blockquote>${content}</blockquote>`;
    }

    if (part.split("\n").every((line) => /^-\s+/.test(line.trim()))) {
      const items = part
        .split("\n")
        .map((line) => `<li>${applyInlineMarkdown(line.trim().replace(/^-\s+/, ""))}</li>`)
        .join("");
      return `<ul>${items}</ul>`;
    }

    const paragraph = applyInlineMarkdown(part).replace(/\n/g, "<br />");
    return `<p>${paragraph}</p>`;
  });

  let html = htmlParts.join("\n");
  codeBlocks.forEach((block, index) => {
    html = html.replace(`__CODE_BLOCK_${index}__`, block);
  });

  return html;
}
