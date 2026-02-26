"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type Product = {
  id: number;
  name: string;
  price: number;
  status: string;
  thumbnailUrl?: string;
};

type ProductPage = {
  content: Product[];
};

export default function ProductsPage() {
  const [data, setData] = useState<ProductPage>({ content: [] });

  useEffect(() => {
    apiGet<ProductPage>("/api/products?page=0&size=20&sort=createdAt,DESC").then(setData);
  }, []);

  return (
    <section>
      <h2>상품 목록</h2>
      <div className="grid">
        {data.content.map((p) => (
          <Link key={p.id} href={`/products/${p.id}`} className="card">
            <strong>{p.name}</strong>
            <p>{p.price.toLocaleString()}원</p>
            <small>{p.status}</small>
          </Link>
        ))}
      </div>
    </section>
  );
}
