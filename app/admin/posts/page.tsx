"use client";

import { FormEvent, useEffect, useState } from "react";
import AdminTabs from "@/components/AdminTabs";
import MarkdownEditor from "@/components/MarkdownEditor";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";

type PostCategory = "NOTICE" | "HARVEST" | "SHIPPING" | "RESTOCK";

type Post = {
  id: number;
  category: PostCategory;
  title: string;
  content: string;
  createdAt: string;
  published?: boolean;
};

type PostForm = {
  category: PostCategory;
  title: string;
  content: string;
  published: boolean;
};

const initialForm: PostForm = {
  category: "NOTICE",
  title: "",
  content: "",
  published: true
};

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [editing, setEditing] = useState<Post | null>(null);
  const [form, setForm] = useState<PostForm>(initialForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    const data = await apiGet<Post[]>("/api/admin/posts");
    setPosts(data);
  }

  useEffect(() => {
    refresh().catch((e: Error) => setError(e.message));
  }, []);

  function startEdit(post: Post) {
    setEditing(post);
    setForm({
      category: post.category,
      title: post.title,
      content: post.content,
      published: post.published ?? true
    });
    setMessage("");
    setError("");
  }

  function resetForm() {
    setEditing(null);
    setForm(initialForm);
  }

  async function savePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const payload = {
        category: form.category,
        title: form.title.trim(),
        content: form.content.trim(),
        published: form.published
      };

      if (editing) {
        await apiPut(`/api/admin/posts/${editing.id}`, payload);
        setMessage("소식이 수정되었습니다.");
      } else {
        await apiPost("/api/admin/posts", payload);
        setMessage("소식이 등록되었습니다.");
      }
      resetForm();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "소식 저장에 실패했습니다.");
    }
  }

  async function deletePost(id: number) {
    if (!confirm("이 소식을 삭제할까요?")) return;
    setMessage("");
    setError("");
    try {
      await apiDelete(`/api/admin/posts/${id}`);
      setMessage("소식이 삭제되었습니다.");
      if (editing?.id === id) resetForm();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "소식 삭제에 실패했습니다.");
    }
  }

  return (
    <section className="stack">
      <article className="card stack">
        <h2>소식 관리</h2>
        <AdminTabs />
      </article>

      <article className="card stack">
        <h3>{editing ? "소식 수정" : "소식 추가"}</h3>
        <form className="stack" onSubmit={savePost}>
          <label className="field">
            <span>카테고리</span>
            <select
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as PostCategory }))}
            >
              <option value="NOTICE">공지</option>
              <option value="HARVEST">수확</option>
              <option value="SHIPPING">배송</option>
              <option value="RESTOCK">재입고</option>
            </select>
          </label>
          <label className="field">
            <span>제목</span>
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </label>
          <MarkdownEditor
            label="내용 (Markdown)"
            value={form.content}
            onChange={(next) => setForm((prev) => ({ ...prev, content: next }))}
            placeholder={"## 이번 주 농장 소식\n\n내용을 마크다운으로 작성하세요."}
            rows={14}
          />
          <label className="field" style={{ gridAutoFlow: "column", alignItems: "center", justifyContent: "start" }}>
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm((prev) => ({ ...prev, published: e.target.checked }))}
              style={{ width: "auto" }}
            />
            <span>공개 상태</span>
          </label>

          <div className="admin-actions">
            <button type="submit" className="btn-primary">
              {editing ? "수정 저장" : "소식 등록"}
            </button>
            {editing && (
              <button type="button" onClick={resetForm}>
                취소
              </button>
            )}
          </div>
        </form>
      </article>

      <article className="card stack">
        <h3>소식 목록</h3>
        {posts.map((post) => (
          <div key={post.id} className="admin-item">
            <div>
              <strong>
                [{post.category}] {post.title}
              </strong>
              <p className="muted">{new Date(post.createdAt).toLocaleString("ko-KR")}</p>
            </div>
            <div className="admin-actions">
              <button type="button" onClick={() => startEdit(post)}>
                수정
              </button>
              <button type="button" onClick={() => deletePost(post.id)}>
                삭제
              </button>
            </div>
          </div>
        ))}
      </article>

      {message && <p>{message}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}
