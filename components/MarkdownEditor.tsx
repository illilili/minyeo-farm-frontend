"use client";

import { ChangeEvent, ClipboardEvent, useRef, useState } from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { apiUploadImage } from "@/lib/api";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
};

export default function MarkdownEditor({ label, value, onChange, placeholder, rows = 10 }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  function openPicker() {
    inputRef.current?.click();
  }

  function insertAtCursor(markdownText: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(`${value}\n${markdownText}\n`);
      return;
    }

    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const nextValue = `${value.slice(0, start)}${markdownText}${value.slice(end)}`;
    onChange(nextValue);
  }

  async function uploadAndInsertImages(files: File[]) {
    if (files.length === 0) return;
    setUploading(true);
    setError("");

    try {
      for (const file of files) {
        const { url } = await apiUploadImage("/api/admin/media/upload", file);
        insertAtCursor(`\n![이미지](${url})\n`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadAndInsertImages([file]);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const items = Array.from(event.clipboardData?.items ?? []);
    const imageFiles = items
      .filter((item) => item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);

    if (imageFiles.length === 0) return;

    event.preventDefault();
    await uploadAndInsertImages(imageFiles);
  }

  return (
    <div className="field stack">
      <span>{label}</span>
      <div className="admin-actions">
        <button type="button" onClick={openPicker} disabled={uploading}>
          {uploading ? "이미지 업로드중..." : "본문 이미지 삽입"}
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={uploadImage} />
      <div className="markdown-editor-grid">
        <textarea
          ref={textareaRef}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePaste}
          placeholder={placeholder}
          className="markdown-input"
        />
        <div className="markdown-preview">
          <MarkdownRenderer content={value || "미리보기가 여기에 표시됩니다."} />
        </div>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
