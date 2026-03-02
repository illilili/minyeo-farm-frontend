"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { toOrderStatusLabel } from "@/lib/labels";

type Me = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  role: "USER" | "ADMIN";
  provider: "NAVER";
};

type OrderSummary = {
  id: number;
  orderNo: string;
  orderStatus: string;
  totalAmount: number;
  createdAt: string;
};

type OrderPage = { content: OrderSummary[] };

type OrderItem = {
  orderItemId: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineAmount: number;
  reviewWritable: boolean;
};

type OrderDetail = {
  id: number;
  orderNo: string;
  orderStatus: string;
  subtotalAmount: number;
  shippingFee: number;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
};

export default function MyPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [ratingByItem, setRatingByItem] = useState<Record<number, number>>({});
  const [contentByItem, setContentByItem] = useState<Record<number, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refreshOrders() {
    const data = await apiGet<OrderPage>("/api/my/orders?page=0&size=20");
    setOrders(data.content);
    if (!selectedOrderId && data.content.length > 0) {
      setSelectedOrderId(data.content[0].id);
    }
  }

  async function refreshDetail(orderId: number) {
    const data = await apiGet<OrderDetail>(`/api/my/orders/${orderId}`);
    setDetail(data);
  }

  useEffect(() => {
    apiGet<Me>("/api/me").then(setMe).catch(() => setMe(null));
    refreshOrders().catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!selectedOrderId) return;
    refreshDetail(selectedOrderId).catch((e: Error) => setError(e.message));
  }, [selectedOrderId]);

  async function submitReview(event: FormEvent<HTMLFormElement>, orderItemId: number) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const rating = ratingByItem[orderItemId] ?? 5;
      const content = (contentByItem[orderItemId] ?? "").trim();
      if (!content) {
        setError("후기 내용을 입력해주세요.");
        return;
      }

      await apiPost("/api/reviews", {
        orderItemId,
        rating,
        content
      });

      setMessage("후기가 등록되었습니다.");
      setContentByItem((prev) => ({ ...prev, [orderItemId]: "" }));
      if (selectedOrderId) await refreshDetail(selectedOrderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "후기 등록에 실패했습니다.");
    }
  }

  async function cancelOrder(orderId: number) {
    if (!confirm("주문을 취소하시겠습니까?")) return;
    setMessage("");
    setError("");
    try {
      await apiPatch(`/api/my/orders/${orderId}/cancel`, {});
      setMessage("주문이 취소되었습니다.");
      await refreshOrders();
      if (selectedOrderId) {
        await refreshDetail(selectedOrderId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "주문 취소에 실패했습니다.");
    }
  }

  const summary = useMemo(() => {
    const paid = orders.filter((order) => order.orderStatus === "PAID").length;
    const shipping = orders.filter((order) => order.orderStatus === "SHIPPING").length;
    const delivered = orders.filter((order) => order.orderStatus === "DELIVERED").length;
    const writable =
      detail?.items.filter((item) => item.reviewWritable).length ?? 0;
    return {
      totalOrders: orders.length,
      paid,
      shipping,
      delivered,
      writable
    };
  }, [orders, detail]);

  return (
    <section className="stack">
      <h2>마이페이지</h2>
      <div className="mypage-grid">
        <aside className="stack">
          <article className="card stack mypage-profile-card">
            <h3>내 정보</h3>
            {!me && <p className="muted">회원 정보를 불러오는 중...</p>}
            {me && (
              <div className="mypage-profile-inline">
                <strong>{me.name} 님</strong>
                <div className="mypage-profile-meta muted">
                  <span>이메일: {me.email || "-"}</span>
                  <span className="meta-divider">|</span>
                  <span>연락처: {me.phone || "-"}</span>
                  <span className="meta-divider">|</span>
                  <span>연동: {me.provider}</span>
                </div>
              </div>
            )}
          </article>
        </aside>

        <div className="stack">
          <article className="card stack">
            <h3>주문 요약</h3>
            <div className="mypage-summary-grid">
              <div className="mypage-summary-card">
                <span>전체 주문</span>
                <strong>{summary.totalOrders}</strong>
              </div>
              <div className="mypage-summary-card">
                <span>결제완료</span>
                <strong>{summary.paid}</strong>
              </div>
              <div className="mypage-summary-card">
                <span>배송중</span>
                <strong>{summary.shipping}</strong>
              </div>
              <div className="mypage-summary-card">
                <span>배송완료</span>
                <strong>{summary.delivered}</strong>
              </div>
            </div>
          </article>

          <article className="card stack">
            <h3>주문 내역</h3>
            {orders.length === 0 && <p className="muted">주문 내역이 없습니다.</p>}
            {orders.length > 0 && (
              <div className="mypage-orders-list">
                <div className="mypage-orders-head">
                  <span>주문번호</span>
                  <span>상태</span>
                  <span>주문일</span>
                  <span>결제금액</span>
                </div>
                {orders.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    className={`mypage-order-button ${selectedOrderId === order.id ? "active" : ""}`}
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <strong>{order.orderNo}</strong>
                    <span>{toOrderStatusLabel(order.orderStatus)}</span>
                    <span>{new Date(order.createdAt).toLocaleDateString("ko-KR")}</span>
                    <span>{order.totalAmount.toLocaleString()}원</span>
                  </button>
                ))}
              </div>
            )}
          </article>

          {detail && (
            <article className="card stack">
              <h3>선택 주문 상세</h3>
              <p className="muted">
                주문번호: {detail.orderNo} | 상태: {toOrderStatusLabel(detail.orderStatus)}
              </p>
              <p className="muted">
                결제금액: {detail.totalAmount.toLocaleString()}원 (상품 {detail.subtotalAmount.toLocaleString()}원 + 배송비{" "}
                {detail.shippingFee.toLocaleString()}원)
              </p>
              {(detail.orderStatus === "PENDING" || detail.orderStatus === "PAID") && (
                <div className="admin-actions">
                  <button type="button" onClick={() => cancelOrder(detail.id)}>
                    주문 취소
                  </button>
                </div>
              )}
              <p className="muted">작성 가능한 후기: {summary.writable}건</p>

              {detail.items.map((item) => (
                <div key={item.orderItemId} className="admin-item stack">
                  <strong>{item.productName}</strong>
                  <p className="muted">
                    {item.quantity}개 x {item.unitPrice.toLocaleString()}원 = {item.lineAmount.toLocaleString()}원
                  </p>
                  {item.reviewWritable ? (
                    <form className="stack" onSubmit={(e) => submitReview(e, item.orderItemId)}>
                      <label className="field">
                        <span>평점</span>
                        <select
                          value={ratingByItem[item.orderItemId] ?? 5}
                          onChange={(e) =>
                            setRatingByItem((prev) => ({ ...prev, [item.orderItemId]: Number(e.target.value) }))
                          }
                        >
                          {[5, 4, 3, 2, 1].map((score) => (
                            <option key={score} value={score}>
                              {score}점
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span>후기 내용</span>
                        <textarea
                          rows={3}
                          value={contentByItem[item.orderItemId] ?? ""}
                          onChange={(e) =>
                            setContentByItem((prev) => ({ ...prev, [item.orderItemId]: e.target.value }))
                          }
                          placeholder="상품 후기를 작성해주세요."
                        />
                      </label>
                      <button type="submit" className="btn-primary">
                        후기 작성
                      </button>
                    </form>
                  ) : (
                    <p className="muted">후기 작성 대상이 아니거나 이미 작성 완료된 상품입니다.</p>
                  )}
                </div>
              ))}
            </article>
          )}

          {message && <p>{message}</p>}
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    </section>
  );
}
