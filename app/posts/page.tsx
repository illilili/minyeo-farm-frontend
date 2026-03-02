"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type Post = {
  id: number;
  category: string;
  title: string;
  authorName: string;
  viewCount: number;
  createdAt: string;
};
type PostPage = { content: Post[] };

const categoryLabel: Record<string, string> = {
  NOTICE: "공지",
  HARVEST: "수확",
  SHIPPING: "배송",
  RESTOCK: "재입고"
};

export default function PostsPage() {
  const [posts, setPosts] = useState<PostPage>({ content: [] });
  useEffect(() => {
    apiGet<PostPage>("/api/posts?page=0&size=20").then(setPosts);
  }, []);
  return (
    <section className="stack">
      <h2>소식</h2>
      <article className="card">
        <div className="board-head">
          <span>제목</span>
          <span>작성자</span>
          <span>작성일</span>
          <span>조회수</span>
        </div>
        {posts.content.map((post) => (
          <Link key={post.id} href={`/posts/${post.id}`} className="board-row">
            <strong>
              [{categoryLabel[post.category] ?? post.category}] {post.title}
            </strong>
            <span>{post.authorName}</span>
            <span>{new Date(post.createdAt).toLocaleDateString("ko-KR")}</span>
            <span>{post.viewCount.toLocaleString()}</span>
          </Link>
        ))}
      </article>
    </section>
  );
}
