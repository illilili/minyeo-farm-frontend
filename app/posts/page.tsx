"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type Post = {
  id: number;
  category: string;
  title: string;
  createdAt: string;
};
type PostPage = { content: Post[] };

export default function PostsPage() {
  const [posts, setPosts] = useState<PostPage>({ content: [] });
  useEffect(() => {
    apiGet<PostPage>("/api/posts?page=0&size=20").then(setPosts);
  }, []);
  return (
    <section>
      <h2>소식</h2>
      {posts.content.map((post) => (
        <Link key={post.id} href={`/posts/${post.id}`} className="card">
          <strong>[{post.category}] {post.title}</strong>
          <p>{post.createdAt}</p>
        </Link>
      ))}
    </section>
  );
}
