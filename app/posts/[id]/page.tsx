"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type Post = {
  id: number;
  category: string;
  title: string;
  content: string;
};

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<Post | null>(null);
  useEffect(() => {
    apiGet<Post>(`/api/posts/${params.id}`).then(setPost);
  }, [params.id]);
  if (!post) return <p>로딩중...</p>;
  return (
    <section className="card">
      <h2>[{post.category}] {post.title}</h2>
      <p>{post.content}</p>
    </section>
  );
}
