"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiGet } from "@/lib/api";

type Product = {
  id: number;
  name: string;
  price: number;
  status: "ON_SALE" | "SOLD_OUT" | "HIDDEN";
  description?: string;
  thumbnailUrl?: string;
};

type Review = {
  id: number;
  rating: number;
  content: string;
  createdAt: string;
};

type ReviewPage = {
  content: Review[];
};

const statusLabel: Record<Product["status"], string> = {
  ON_SALE: "판매중",
  SOLD_OUT: "품절",
  HIDDEN: "비노출"
};

const statusClass: Record<Product["status"], string> = {
  ON_SALE: "badge sale",
  SOLD_OUT: "badge soldout",
  HIDDEN: "badge hidden"
};

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const productId = params?.id;
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ReviewPage>({ content: [] });
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!productId) return;

    Promise.all([
      apiGet<Product>(`/api/products/${productId}`),
      apiGet<ReviewPage>(`/api/products/${productId}/reviews?page=0&size=10`)
    ])
      .then(([productData, reviewData]) => {
        setProduct(productData);
        setReviews(reviewData);
      })
      .catch((e: Error) => setError(e.message || "상품 정보를 불러오지 못했습니다."));
  }, [productId]);

  if (error) return <p className="error">{error}</p>;
  if (!product) return <p className="muted">로딩 중...</p>;

  return (
    <section className="stack">
      <article className="card stack">
        {product.thumbnailUrl ? (
          <img src={product.thumbnailUrl} alt={product.name} className="thumbnail" />
        ) : (
          <div className="thumbnail muted" style={{ display: "grid", placeItems: "center" }}>
            이미지 준비중
          </div>
        )}
        <h2>{product.name}</h2>
        <span className={statusClass[product.status]}>{statusLabel[product.status]}</span>
        <p className="price">{product.price.toLocaleString()}원</p>
        <p className="muted">{product.description || "상품 설명이 아직 등록되지 않았습니다."}</p>
      </article>

      <article className="card stack">
        <h3>후기</h3>
        {reviews.content.length === 0 && <p className="muted">등록된 후기가 없습니다.</p>}
        {reviews.content.map((review) => (
          <div key={review.id} className="card">
            <strong>평점 {review.rating}/5</strong>
            <p>{review.content}</p>
            <small className="muted">{new Date(review.createdAt).toLocaleString("ko-KR")}</small>
          </div>
        ))}
      </article>
    </section>
  );
}

