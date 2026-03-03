"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import AdminTabs from "@/components/AdminTabs";
import { apiGet, apiPatch } from "@/lib/api";
import { toOrderStatusLabel } from "@/lib/labels";

type OrderStatus = "PENDING" | "PAID" | "PREPARING" | "SHIPPING" | "DELIVERED" | "CANCELED";

type OrderItem = {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineAmount: number;
};

type Order = {
  id: number;
  orderNo: string;
  orderStatus: OrderStatus;
  subtotalAmount: number;
  shippingFee: number;
  totalAmount: number;
  createdAt: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  receiverName: string;
  receiverPhone: string;
  receiverZipcode: string;
  receiverAddress1: string;
  receiverAddress2?: string;
  deliveryRequest?: string;
  courierCode?: string;
  trackingNumber?: string;
  items: OrderItem[];
};

type TrackingDraft = {
  courierCode: string;
  trackingNumber: string;
};

type RefundDraft = {
  cancelReason: string;
  cancelAmount: string;
};

const statuses: OrderStatus[] = ["PENDING", "PAID", "PREPARING", "SHIPPING", "DELIVERED", "CANCELED"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<OrderStatus[]>(["PAID"]);
  const [trackingDrafts, setTrackingDrafts] = useState<Record<number, TrackingDraft>>({});
  const [editingTrackingIds, setEditingTrackingIds] = useState<Record<number, boolean>>({});
  const [refundDrafts, setRefundDrafts] = useState<Record<number, RefundDraft>>({});
  const [editingRefundIds, setEditingRefundIds] = useState<Record<number, boolean>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    const data = await apiGet<Order[]>("/api/admin/orders");
    setOrders(data);
  }

  useEffect(() => {
    refresh().catch((e: Error) => setError(e.message));
  }, []);

  function toggleStatus(status: OrderStatus, checked: boolean) {
    setSelectedStatuses((prev) => {
      if (checked) {
        return prev.includes(status) ? prev : [...prev, status];
      }
      return prev.filter((item) => item !== status);
    });
  }

  function isTrackingSaved(order: Order) {
    return !!order.courierCode && !!order.trackingNumber;
  }

  function beginTrackingEdit(order: Order) {
    setTrackingDrafts((prev) => ({
      ...prev,
      [order.id]: {
        courierCode: prev[order.id]?.courierCode ?? order.courierCode ?? "",
        trackingNumber: prev[order.id]?.trackingNumber ?? order.trackingNumber ?? ""
      }
    }));
    setEditingTrackingIds((prev) => ({ ...prev, [order.id]: true }));
  }

  function cancelTrackingEdit(orderId: number) {
    setEditingTrackingIds((prev) => ({ ...prev, [orderId]: false }));
  }

  async function changeStatus(orderId: number, orderStatus: OrderStatus) {
    setMessage("");
    setError("");

    try {
      await apiPatch(`/api/admin/orders/${orderId}/status`, { orderStatus });
      setMessage("주문 상태를 변경했습니다.");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "주문 상태 변경에 실패했습니다.");
    }
  }

  async function saveTracking(event: FormEvent<HTMLFormElement>, order: Order) {
    event.preventDefault();
    setMessage("");
    setError("");

    const values = trackingDrafts[order.id];
    if (!values?.courierCode || !values?.trackingNumber) {
      setError("택배사 코드와 운송장 번호를 모두 입력해주세요.");
      return;
    }

    try {
      await apiPatch(`/api/admin/orders/${order.id}/tracking`, values);
      setMessage(isTrackingSaved(order) ? "택배 정보를 수정했습니다." : "택배 정보를 저장했습니다.");
      setEditingTrackingIds((prev) => ({ ...prev, [order.id]: false }));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "택배 정보 저장에 실패했습니다.");
    }
  }

  async function refundOrder(event: FormEvent<HTMLFormElement>, orderId: number) {
    event.preventDefault();
    setMessage("");
    setError("");

    const draft = refundDrafts[orderId];
    const cancelReason = (draft?.cancelReason ?? "").trim();
    const cancelAmountRaw = (draft?.cancelAmount ?? "").trim();
    if (!cancelReason) {
      setError("환불 사유를 입력해주세요.");
      return;
    }

    const payload: { cancelReason: string; cancelAmount?: number } = { cancelReason };
    if (cancelAmountRaw) {
      const amount = Number(cancelAmountRaw);
      if (!Number.isFinite(amount) || amount < 1) {
        setError("부분 환불 금액은 1원 이상 숫자로 입력해주세요.");
        return;
      }
      payload.cancelAmount = amount;
    }

    try {
      await apiPatch(`/api/admin/orders/${orderId}/refund`, payload);
      setMessage(payload.cancelAmount ? "부분 환불을 처리했습니다." : "전액 환불을 처리했습니다.");
      setEditingRefundIds((prev) => ({ ...prev, [orderId]: false }));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "환불 처리에 실패했습니다.");
    }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (selectedStatuses.length === 0) return true;
      return selectedStatuses.includes(order.orderStatus);
    });
  }, [orders, selectedStatuses]);

  return (
    <section className="stack">
      <article className="card stack">
        <h2>주문 관리</h2>
        <AdminTabs />
      </article>

      <article className="card stack">
        <div className="admin-actions">
          {statuses.map((status) => (
            <label key={status} className="cart-select-all">
              <input
                type="checkbox"
                checked={selectedStatuses.includes(status)}
                onChange={(e) => toggleStatus(status, e.target.checked)}
              />
              <span>{toOrderStatusLabel(status)}</span>
            </label>
          ))}
        </div>
        <p className="muted">총 {filteredOrders.length}건</p>
      </article>

      <article className="card stack">
        {filteredOrders.map((order) => {
          const editing = !!editingTrackingIds[order.id];
          const saved = isTrackingSaved(order);
          const refundEditable = !!editingRefundIds[order.id];
          const canRefundByStatus =
            order.orderStatus === "PREPARING" || order.orderStatus === "SHIPPING" || order.orderStatus === "DELIVERED";

          return (
            <div key={order.id} className="admin-item stack">
              <div className="order-admin-head">
                <strong>{order.orderNo}</strong>
                <span className="badge">{toOrderStatusLabel(order.orderStatus)}</span>
                <span className="muted">{new Date(order.createdAt).toLocaleString("ko-KR")}</span>
              </div>

              <div className="order-admin-grid">
                <div>
                  <h4>주문 상품</h4>
                  {order.items.map((item) => (
                    <p key={`${order.id}-${item.productId}`} className="muted">
                      {item.productName} / {item.quantity}개 / {item.lineAmount.toLocaleString()}원
                    </p>
                  ))}
                </div>

                <div>
                  <h4>주문자 정보</h4>
                  <p className="muted">이름: {order.buyerName}</p>
                  <p className="muted">연락처: {order.buyerPhone}</p>
                  <p className="muted">이메일: {order.buyerEmail || "-"}</p>
                </div>

                <div>
                  <h4>수령자 정보</h4>
                  <p className="muted">이름: {order.receiverName}</p>
                  <p className="muted">연락처: {order.receiverPhone}</p>
                  <p className="muted">
                    주소: ({order.receiverZipcode}) {order.receiverAddress1} {order.receiverAddress2 || ""}
                  </p>
                  <p className="muted">요청사항: {order.deliveryRequest || "-"}</p>
                </div>

                <div>
                  <h4>결제 정보</h4>
                  <p className="muted">상품합계: {order.subtotalAmount.toLocaleString()}원</p>
                  <p className="muted">배송비: {order.shippingFee.toLocaleString()}원</p>
                  <p>
                    <strong>총 결제금액: {order.totalAmount.toLocaleString()}원</strong>
                  </p>
                </div>
              </div>

              <div className="order-admin-controls">
                <div className="admin-actions">
                  <label className="field" style={{ minWidth: 180 }}>
                    <span>주문 상태</span>
                    <select
                      value={order.orderStatus}
                      onChange={(e) => changeStatus(order.id, e.target.value as OrderStatus)}
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {toOrderStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="stack">
                  <p className="muted">현재 택배사 코드: {order.courierCode || "-"}</p>
                  <p className="muted">현재 운송장 번호: {order.trackingNumber || "-"}</p>

                  {order.orderStatus === "PREPARING" && !editing && (
                    <button type="button" onClick={() => beginTrackingEdit(order)}>
                      {saved ? "택배 정보 수정하기" : "택배 정보 입력하기"}
                    </button>
                  )}

                  {order.orderStatus === "PREPARING" && editing && (
                    <form className="admin-actions" onSubmit={(e) => saveTracking(e, order)}>
                      <input
                        style={{ width: 140 }}
                        placeholder="택배사 코드"
                        value={trackingDrafts[order.id]?.courierCode ?? ""}
                        onChange={(e) =>
                          setTrackingDrafts((prev) => ({
                            ...prev,
                            [order.id]: {
                              courierCode: e.target.value,
                              trackingNumber: prev[order.id]?.trackingNumber ?? ""
                            }
                          }))
                        }
                      />
                      <input
                        placeholder="운송장 번호"
                        value={trackingDrafts[order.id]?.trackingNumber ?? ""}
                        onChange={(e) =>
                          setTrackingDrafts((prev) => ({
                            ...prev,
                            [order.id]: {
                              courierCode: prev[order.id]?.courierCode ?? "",
                              trackingNumber: e.target.value
                            }
                          }))
                        }
                      />
                      <button type="submit">{saved ? "수정 저장" : "입력 저장"}</button>
                      <button type="button" onClick={() => cancelTrackingEdit(order.id)}>
                        취소
                      </button>
                    </form>
                  )}

                  {order.orderStatus !== "PREPARING" && (
                    <p className="muted">택배 정보 입력/수정은 '상품 준비중' 상태에서만 가능합니다.</p>
                  )}
                </div>

                {canRefundByStatus && !refundEditable && (
                  <button type="button" onClick={() => setEditingRefundIds((prev) => ({ ...prev, [order.id]: true }))}>
                    환불 처리하기
                  </button>
                )}

                {canRefundByStatus && refundEditable && (
                  <form className="admin-actions" onSubmit={(e) => refundOrder(e, order.id)}>
                    <input
                      style={{ width: 220 }}
                      placeholder="환불 사유 (필수)"
                      value={refundDrafts[order.id]?.cancelReason ?? ""}
                      onChange={(e) =>
                        setRefundDrafts((prev) => ({
                          ...prev,
                          [order.id]: {
                            cancelReason: e.target.value,
                            cancelAmount: prev[order.id]?.cancelAmount ?? ""
                          }
                        }))
                      }
                    />
                    <input
                      style={{ width: 180 }}
                      placeholder="부분 환불 금액(선택)"
                      inputMode="numeric"
                      value={refundDrafts[order.id]?.cancelAmount ?? ""}
                      onChange={(e) =>
                        setRefundDrafts((prev) => ({
                          ...prev,
                          [order.id]: {
                            cancelReason: prev[order.id]?.cancelReason ?? "",
                            cancelAmount: e.target.value.replace(/\D/g, "")
                          }
                        }))
                      }
                    />
                    <button type="submit">환불 요청</button>
                    <button
                      type="button"
                      onClick={() => setEditingRefundIds((prev) => ({ ...prev, [order.id]: false }))}
                    >
                      취소
                    </button>
                  </form>
                )}

                {order.orderStatus === "CANCELED" && <p className="muted">환불 처리 완료 주문입니다.</p>}
              </div>
            </div>
          );
        })}
      </article>

      {message && <p>{message}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}
