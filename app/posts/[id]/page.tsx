"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiGet } from "@/lib/api";
import MarkdownRenderer from "@/components/MarkdownRenderer";

type Post = {
  id: number;
  category: string;
  title: string;
  content: string;
  authorName: string;
  viewCount: number;
  createdAt: string;
};

const categoryLabel: Record<string, string> = {
  NOTICE: "공지",
  HARVEST: "수확",
  SHIPPING: "배송",
  RESTOCK: "재입고"
};

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const postId = params?.id;
  const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    if (!postId) return;
    apiGet<Post>(`/api/posts/${postId}`).then(setPost);
  }, [postId]);

  if (!post) return <p>로딩중...</p>;

  return (
    <section className="card">
      <h2>
        [{categoryLabel[post.category] ?? post.category}] {post.title}
      </h2>
      <p className="muted">
        작성자: {post.authorName} | 작성일: {new Date(post.createdAt).toLocaleDateString("ko-KR")} | 조회수:{" "}
        {post.viewCount.toLocaleString()}
      </p>
      <MarkdownRenderer content={post.content} className="detail-markdown-center" />
    </section>
  );
}
