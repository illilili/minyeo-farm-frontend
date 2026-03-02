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

const statuses: OrderStatus[] = ["PENDING", "PAID", "PREPARING", "SHIPPING", "DELIVERED", "CANCELED"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<OrderStatus[]>(["PAID"]);
  const [tracking, setTracking] = useState<Record<number, { courierCode: string; trackingNumber: string }>>({});
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

  async function changeStatus(orderId: number, orderStatus: OrderStatus) {
    setMessage("");
    setError("");
    try {
      await apiPatch(`/api/admin/orders/${orderId}/status`, { orderStatus });
      setMessage("주문 상태가 변경되었습니다.");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "주문 상태 변경에 실패했습니다.");
    }
  }

  async function updateTracking(event: FormEvent<HTMLFormElement>, orderId: number) {
    event.preventDefault();
    setMessage("");
    setError("");
    const values = tracking[orderId];
    if (!values?.courierCode || !values?.trackingNumber) {
      setError("택배사 코드와 운송장 번호를 모두 입력해주세요.");
      return;
    }

    try {
      await apiPatch(`/api/admin/orders/${orderId}/tracking`, values);
      setMessage("운송장 정보가 업데이트되었습니다.");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "운송장 업데이트에 실패했습니다.");
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
        {filteredOrders.map((order) => (
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
                <h4>수령인 정보</h4>
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

              <form className="admin-actions" onSubmit={(e) => updateTracking(e, order.id)}>
                <input
                  style={{ width: 140 }}
                  placeholder="택배사 코드"
                  value={tracking[order.id]?.courierCode ?? order.courierCode ?? ""}
                  onChange={(e) =>
                    setTracking((prev) => ({
                      ...prev,
                      [order.id]: {
                        courierCode: e.target.value,
                        trackingNumber: prev[order.id]?.trackingNumber ?? order.trackingNumber ?? ""
                      }
                    }))
                  }
                />
                <input
                  placeholder="운송장 번호"
                  value={tracking[order.id]?.trackingNumber ?? order.trackingNumber ?? ""}
                  onChange={(e) =>
                    setTracking((prev) => ({
                      ...prev,
                      [order.id]: {
                        courierCode: prev[order.id]?.courierCode ?? order.courierCode ?? "",
                        trackingNumber: e.target.value
                      }
                    }))
                  }
                />
                <button type="submit">택배 정보 저장</button>
              </form>
            </div>
          </div>
        ))}
      </article>

      {message && <p>{message}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}
