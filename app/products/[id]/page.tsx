"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { addGuestCartItem } from "@/lib/cart";

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
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = params?.id;
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ReviewPage>({ content: [] });
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

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

  async function addToCart() {
    if (!product) return;
    setError("");
    setMessage("");
    try {
      const hasToken = !!localStorage.getItem("accessToken");
      if (hasToken) {
        await apiPost("/api/my/cart", { productId: product.id, quantity });
        setMessage("계정 장바구니에 담겼습니다.");
      } else {
        addGuestCartItem(product.id, quantity);
        setMessage("비회원 장바구니에 담겼습니다.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "장바구니 담기에 실패했습니다.");
    }
  }

  async function orderNow() {
    if (!product) return;
    router.push(`/order?productId=${product.id}&quantity=${quantity}`);
  }

  if (error) return <p className="error">{error}</p>;
  if (!product) return <p className="muted">로딩 중...</p>;

  return (
    <section className="stack">
      <article className="card product-summary">
        <div className="product-summary-image">
          {product.thumbnailUrl ? (
            <img src={product.thumbnailUrl} alt={product.name} className="thumbnail product-main-thumbnail" />
          ) : (
            <div className="thumbnail muted" style={{ display: "grid", placeItems: "center" }}>
              이미지 준비중
            </div>
          )}
        </div>
        <div className="product-summary-info stack">
          <h2>{product.name}</h2>
          <span className={statusClass[product.status]}>{statusLabel[product.status]}</span>
          <p className="muted">배송비 3,000원 (50,000원 이상 무료)</p>
          <p className="price product-main-price">{product.price.toLocaleString()}원</p>
          <label className="field" style={{ maxWidth: 150 }}>
            <span>수량</span>
            <select
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            >
              {Array.from({ length: 10 }, (_, idx) => idx + 1).map((value) => (
                <option key={value} value={value}>
                  {value}개
                </option>
              ))}
            </select>
          </label>
          <div className="admin-actions">
            <button type="button" onClick={addToCart}>
              장바구니
            </button>
            <button type="button" className="btn btn-primary" onClick={orderNow}>
              주문하기
            </button>
          </div>
          {message && <p>{message}</p>}
          {error && <p className="error">{error}</p>}
        </div>
      </article>

      <nav className="card product-detail-tabs">
        <a href="#product-detail" className="product-tab-link">
          상세 정보
        </a>
        <a href="#product-reviews" className="product-tab-link">
          후기 {reviews.content.length > 0 ? `(${reviews.content.length})` : ""}
        </a>
      </nav>

      <article id="product-detail" className="card stack">
        <h3>상품 상세 정보</h3>
        <MarkdownRenderer
          content={product.description || "상품 설명이 아직 등록되지 않았습니다."}
          className="detail-markdown-center"
        />
      </article>

      <article id="product-reviews" className="card stack">
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
