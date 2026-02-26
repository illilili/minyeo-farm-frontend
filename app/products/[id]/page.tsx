"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type Product = {
  id: number;
  name: string;
  price: number;
  status: string;
  description?: string;
};

type Review = {
  id: number;
  rating: number;
  content: string;
};

type ReviewPage = {
  content: Review[];
};

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ReviewPage>({ content: [] });

  useEffect(() => {
    apiGet<Product>(`/api/products/${params.id}`).then(setProduct);
    apiGet<ReviewPage>(`/api/products/${params.id}/reviews?page=0&size=10`).then(setReviews);
  }, [params.id]);

  if (!product) return <p>로딩중...</p>;

  return (
    <section className="card">
      <h2>{product.name}</h2>
      <p>{product.price.toLocaleString()}원</p>
      <p>{product.description}</p>
      <h3>후기</h3>
      {reviews.content.map((review) => (
        <article key={review.id} className="card">
          <strong>평점 {review.rating}/5</strong>
          <p>{review.content}</p>
        </article>
      ))}
    </section>
  );
}
