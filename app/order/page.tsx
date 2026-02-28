"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";

type Product = {
  id: number;
  name: string;
  price: number;
  status: "ON_SALE" | "SOLD_OUT" | "HIDDEN";
};

type ProductPage = {
  content: Product[];
};

type OrderResponse = {
  id: number;
  orderNo: string;
  totalAmount: number;
};

export default function OrderPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    apiGet<ProductPage>("/api/products?status=ON_SALE&page=0&size=20&sort=createdAt,DESC")
      .then((data) => {
        setProducts(data.content);
        if (data.content.length > 0) {
          setSelectedProductId(data.content[0].id);
        }
      })
      .catch((e: Error) => setError(e.message || "상품을 불러오지 못했습니다."));
  }, []);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId),
    [products, selectedProductId]
  );

  async function createOrder(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!selectedProductId) {
      setError("주문할 상품을 선택해주세요.");
      return;
    }

    try {
      const created = await apiPost<OrderResponse>("/api/orders", {
        buyerName: "비회원고객",
        buyerPhone: "01012345678",
        buyerEmail: "guest@example.com",
        receiverName: "수령인",
        receiverPhone: "01012345678",
        receiverZipcode: "12345",
        receiverAddress1: "서울시 강남구",
        receiverAddress2: "101호",
        deliveryRequest: "문 앞에 놓아주세요.",
        items: [{ productId: selectedProductId, quantity }]
      });
      setOrder(created);
      setMessage("주문이 생성되었습니다. 결제를 진행해주세요.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "주문 생성에 실패했습니다.");
    }
  }

  async function readyAndConfirm() {
    if (!order) return;

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
    } catch (e) {
      setError(e instanceof Error ? e.message : "결제 승인에 실패했습니다.");
    }
  }

  return (
    <section className="stack">
      <article className="card stack">
        <h2>주문/결제</h2>
        <p className="muted">배송비 3,000원 / 50,000원 이상 무료</p>
        <p className="muted">수확 상황에 따라 일부 주문은 취소될 수 있습니다.</p>

        <form onSubmit={createOrder} className="stack">
          <div className="form-row">
            <label className="field">
              <span>상품 선택</span>
              <select
                value={selectedProductId ?? ""}
                onChange={(e) => setSelectedProductId(Number(e.target.value))}
                required
              >
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
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
              />
            </label>
          </div>

          {selectedProduct && (
            <p className="muted">예상 상품 금액: {(selectedProduct.price * quantity).toLocaleString()}원</p>
          )}

          <button type="submit" className="btn-primary" disabled={products.length === 0}>
            테스트 주문 생성
          </button>
        </form>
      </article>

      {order && (
        <article className="card stack">
          <h3>생성된 주문</h3>
          <p>주문번호: {order.orderNo}</p>
          <p>결제금액: {order.totalAmount.toLocaleString()}원</p>
          <button onClick={readyAndConfirm} className="btn-primary">
            결제 ready + confirm
          </button>
        </article>
      )}

      {message && <p>{message}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}
