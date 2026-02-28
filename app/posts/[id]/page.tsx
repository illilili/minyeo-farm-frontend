"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiGet } from "@/lib/api";

type Post = {
  id: number;
  category: string;
  title: string;
  content: string;
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
        [{post.category}] {post.title}
      </h2>
      <p>{post.content}</p>
    </section>
  );
}

