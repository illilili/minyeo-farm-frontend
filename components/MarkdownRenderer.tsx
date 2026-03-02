"use client";

import { useMemo } from "react";
import { renderMarkdown } from "@/lib/markdown";

export default function MarkdownRenderer({ content, className }: { content: string; className?: string }) {
  const html = useMemo(() => renderMarkdown(content || ""), [content]);
  return <div className={`markdown-body ${className ?? ""}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

