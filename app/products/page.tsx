"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type Product = {
  id: number;
  name: string;
  price: number;
  status: "ON_SALE" | "SOLD_OUT" | "HIDDEN";
  thumbnailUrl?: string;
};

type ProductPage = {
  content: Product[];
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

export default function ProductsPage() {
  const [data, setData] = useState<ProductPage>({ content: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    apiGet<ProductPage>("/api/products?page=0&size=20&sort=createdAt,DESC")
      .then(setData)
      .catch((e: Error) => setError(e.message || "상품 목록을 불러오지 못했습니다."))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <p className="muted">상품을 불러오는 중...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <section className="stack">
      <h2>상품 목록</h2>
      <div className="grid">
        {data.content.map((product) => (
          <Link key={product.id} href={`/products/${product.id}`} className="card product-card">
            {product.thumbnailUrl ? (
              <img src={product.thumbnailUrl} alt={product.name} className="thumbnail" />
            ) : (
              <div className="thumbnail muted" style={{ display: "grid", placeItems: "center" }}>
                이미지 준비중
              </div>
            )}
            <strong>{product.name}</strong>
            <span className="price">{product.price.toLocaleString()}원</span>
            <span className={statusClass[product.status]}>{statusLabel[product.status]}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
