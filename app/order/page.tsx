"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { removeGuestCartItem } from "@/lib/cart";

type Product = {
  id: number;
  name: string;
  price: number;
  status: "ON_SALE" | "SOLD_OUT" | "HIDDEN";
};

type ProductPage = {
  content: Product[];
};

type CheckoutDraftItem = {
  productId: number;
  quantity: number;
};

type OrderResponse = {
  id: number;
  orderNo: string;
  totalAmount: number;
};

type OrdererForm = {
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  receiverName: string;
  receiverPhone: string;
  receiverZipcode: string;
  receiverAddress1: string;
  receiverAddress2: string;
  deliveryRequest: string;
};

const initialForm: OrdererForm = {
  buyerName: "비회원고객",
  buyerPhone: "01012345678",
  buyerEmail: "guest@example.com",
  receiverName: "수령인",
  receiverPhone: "01012345678",
  receiverZipcode: "12345",
  receiverAddress1: "서울시 강남구",
  receiverAddress2: "101호",
  deliveryRequest: "문 앞에 놓아주세요."
};

export default function OrderPage() {
  const searchParams = useSearchParams();
  const productIdFromQuery = searchParams.get("productId");
  const quantityFromQuery = searchParams.get("quantity");
  const fromCart = searchParams.get("from") === "cart";

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [checkoutDraft, setCheckoutDraft] = useState<CheckoutDraftItem[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [form, setForm] = useState<OrdererForm>(initialForm);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    if (!fromCart) {
      setCheckoutDraft([]);
      return;
    }
    const raw = sessionStorage.getItem("checkoutDraft");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as CheckoutDraftItem[];
      const normalized = parsed.filter((item) => item.productId > 0 && item.quantity > 0);
      setCheckoutDraft(normalized);
    } catch {
      setCheckoutDraft([]);
    }
  }, [fromCart]);

  useEffect(() => {
    const queryQuantity = Number(quantityFromQuery);
    if (queryQuantity >= 1 && queryQuantity <= 10) {
      setQuantity(queryQuantity);
    }
  }, [quantityFromQuery]);

  useEffect(() => {
    apiGet<ProductPage>("/api/products?status=ON_SALE&page=0&size=20&sort=createdAt,DESC")
      .then((data) => {
        setProducts(data.content);
        if (data.content.length > 0) {
          const queryId = Number(productIdFromQuery);
          const exists = data.content.some((product) => product.id === queryId);
          setSelectedProductId(exists ? queryId : data.content[0].id);
        }
      })
      .catch((e: Error) => setError(e.message || "상품을 불러오지 못했습니다."));
  }, [productIdFromQuery]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId),
    [products, selectedProductId]
  );

  async function createOrder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!fromCart && !selectedProductId) {
      setError("주문할 상품을 선택해주세요.");
      return;
    }
    if (fromCart && checkoutDraft.length === 0) {
      setError("장바구니에서 주문할 상품을 선택해주세요.");
      return;
    }

    setIsCreating(true);
    setMessage("");
    setError("");

    try {
      const created = await apiPost<OrderResponse>("/api/orders", {
        ...form,
        items: fromCart ? checkoutDraft : [{ productId: selectedProductId, quantity }]
      });
      setOrder(created);
      setMessage("주문이 생성되었습니다. 아래 결제하기 버튼을 눌러주세요.");
      if (fromCart) {
        const hasToken = !!localStorage.getItem("accessToken");
        if (hasToken) {
          await Promise.all(checkoutDraft.map((item) => apiDelete(`/api/my/cart/${item.productId}`)));
        } else {
          checkoutDraft.forEach((item) => removeGuestCartItem(item.productId));
        }
        sessionStorage.removeItem("checkoutDraft");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "주문 생성에 실패했습니다.");
    } finally {
      setIsCreating(false);
    }
  }

  async function payNow() {
    if (!order) return;
    setIsPaying(true);
    setMessage("");
    setError("");

    try {
      await apiPost("/api/payments/toss/ready", { orderId: order.id });
      await apiPost("/api/payments/toss/confirm", {
        paymentKey: `pay_${order.orderNo}`,
        orderId: order.orderNo,
        amount: order.totalAmount
      });
      setMessage("결제 승인 완료");
    } catch (err) {
      setError(err instanceof Error ? err.message : "결제 승인에 실패했습니다.");
    } finally {
      setIsPaying(false);
    }
  }

  return (
    <section className="stack">
      <article className="card stack">
        <h2>주문/결제</h2>
        <p className="muted">배송비 3,000원 / 50,000원 이상 무료</p>
      </article>

      <article className="card stack">
        <h3>상품 및 수량</h3>
        {fromCart ? (
          <>
            {checkoutDraft.length === 0 && <p className="muted">선택된 장바구니 상품이 없습니다.</p>}
            {checkoutDraft.map((item) => {
              const product = products.find((p) => p.id === item.productId);
              if (!product) return null;
              return (
                <div key={item.productId} className="admin-item">
                  <strong>{product.name}</strong>
                  <p className="muted">
                    {product.price.toLocaleString()}원 x {item.quantity}개 ={" "}
                    {(product.price * item.quantity).toLocaleString()}원
                  </p>
                </div>
              );
            })}
          </>
        ) : (
          <>
            <div className="form-row">
              <label className="field">
                <span>상품 선택</span>
                <select value={selectedProductId ?? ""} onChange={(e) => setSelectedProductId(Number(e.target.value))}>
                  {products.length === 0 && <option value="">선택 가능한 상품이 없습니다.</option>}
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.price.toLocaleString()}원)
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>수량</span>
                <select value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}>
                  {Array.from({ length: 10 }, (_, idx) => idx + 1).map((value) => (
                    <option key={value} value={value}>
                      {value}개
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {selectedProduct && (
              <p className="muted">예상 상품 금액: {(selectedProduct.price * quantity).toLocaleString()}원</p>
            )}
          </>
        )}
      </article>

      <article className="card stack">
        <h3>주문자/수령인 정보</h3>
        <form className="stack" onSubmit={createOrder}>
          <div className="form-row">
            <label className="field">
              <span>주문자 이름</span>
              <input
                value={form.buyerName}
                onChange={(e) => setForm((prev) => ({ ...prev, buyerName: e.target.value }))}
                required
              />
            </label>
            <label className="field">
              <span>주문자 연락처</span>
              <input
                value={form.buyerPhone}
                onChange={(e) => setForm((prev) => ({ ...prev, buyerPhone: e.target.value }))}
                required
              />
            </label>
          </div>
          <label className="field">
            <span>주문자 이메일</span>
            <input
              type="email"
              value={form.buyerEmail}
              onChange={(e) => setForm((prev) => ({ ...prev, buyerEmail: e.target.value }))}
            />
          </label>
          <div className="form-row">
            <label className="field">
              <span>수령인 이름</span>
              <input
                value={form.receiverName}
                onChange={(e) => setForm((prev) => ({ ...prev, receiverName: e.target.value }))}
                required
              />
            </label>
            <label className="field">
              <span>수령인 연락처</span>
              <input
                value={form.receiverPhone}
                onChange={(e) => setForm((prev) => ({ ...prev, receiverPhone: e.target.value }))}
                required
              />
            </label>
          </div>
          <div className="form-row">
            <label className="field">
              <span>우편번호</span>
              <input
                value={form.receiverZipcode}
                onChange={(e) => setForm((prev) => ({ ...prev, receiverZipcode: e.target.value }))}
                required
              />
            </label>
            <label className="field">
              <span>상세 주소</span>
              <input
                value={form.receiverAddress2}
                onChange={(e) => setForm((prev) => ({ ...prev, receiverAddress2: e.target.value }))}
              />
            </label>
          </div>
          <label className="field">
            <span>주소</span>
            <input
              value={form.receiverAddress1}
              onChange={(e) => setForm((prev) => ({ ...prev, receiverAddress1: e.target.value }))}
              required
            />
          </label>
          <label className="field">
            <span>배송 요청사항</span>
            <textarea
              rows={3}
              value={form.deliveryRequest}
              onChange={(e) => setForm((prev) => ({ ...prev, deliveryRequest: e.target.value }))}
            />
          </label>
          <button type="submit" className="btn-primary" disabled={isCreating || products.length === 0}>
            {isCreating ? "주문 생성중..." : "주문 생성"}
          </button>
        </form>
      </article>

      {order && (
        <article className="card stack">
          <h3>결제</h3>
          <p>주문번호: {order.orderNo}</p>
          <p>결제금액: {order.totalAmount.toLocaleString()}원</p>
          <button type="button" className="btn-primary" onClick={payNow} disabled={isPaying}>
            {isPaying ? "결제 처리중..." : "결제하기"}
          </button>
        </article>
      )}

      {message && <p>{message}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}
