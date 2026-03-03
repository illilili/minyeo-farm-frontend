"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Script from "next/script";
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

type PaymentReadyResponse = {
  paymentId: number;
  tossOrderId: string;
  status: "READY" | "APPROVED" | "FAILED" | "CANCELED";
};

type Me = {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
};

type TossPaymentsRequestParams = {
  method: "CARD";
  amount: {
    currency: "KRW";
    value: number;
  };
  orderId: string;
  orderName: string;
  customerName: string;
  customerEmail?: string;
  successUrl: string;
  failUrl: string;
};

type TossPaymentWindow = {
  requestPayment(params: TossPaymentsRequestParams): Promise<void> | void;
};

type TossPaymentsInstance = {
  payment(params: { customerKey: string }): TossPaymentWindow;
};

type TossPaymentsFactory = (clientKey: string) => TossPaymentsInstance;

type DaumPostcodeData = {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
};

type DaumPostcodeConstructor = new (options: {
  oncomplete: (data: DaumPostcodeData) => void;
}) => {
  open: () => void;
};

declare global {
  interface Window {
    TossPayments?: TossPaymentsFactory;
    daum?: {
      Postcode: DaumPostcodeConstructor;
    };
  }
}

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
  buyerName: "",
  buyerPhone: "",
  buyerEmail: "",
  receiverName: "",
  receiverPhone: "",
  receiverZipcode: "",
  receiverAddress1: "",
  receiverAddress2: "",
  deliveryRequest: ""
};

export default function OrderPage() {
  const searchParams = useSearchParams();
  const productIdFromQuery = searchParams.get("productId");
  const quantityFromQuery = searchParams.get("quantity");
  const fromCart = searchParams.get("from") === "cart";
  const isDirectOrderFromProduct = !fromCart && productIdFromQuery !== null;

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [checkoutDraft, setCheckoutDraft] = useState<CheckoutDraftItem[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [form, setForm] = useState<OrdererForm>(initialForm);
  const [agreeCancelPolicy, setAgreeCancelPolicy] = useState(false);
  const [error, setError] = useState<string>("");
  const [isPaying, setIsPaying] = useState(false);
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setMe(null);
      return;
    }

    apiGet<Me>("/api/me")
      .then((data) => {
        setMe(data);
        setForm((prev) => ({
          ...prev,
          buyerName: prev.buyerName || data.name || "",
          buyerEmail: prev.buyerEmail || data.email || ""
        }));
      })
      .catch(() => setMe(null));
  }, []);

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
          if (isDirectOrderFromProduct && !exists) {
            setError("선택한 상품 정보를 찾을 수 없습니다.");
            return;
          }
          setSelectedProductId(exists ? queryId : data.content[0].id);
        }
      })
      .catch((e: Error) => setError(e.message || "상품을 불러오지 못했습니다."));
  }, [isDirectOrderFromProduct, productIdFromQuery]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId),
    [products, selectedProductId]
  );

  const orderName = useMemo(() => {
    if (fromCart) {
      if (checkoutDraft.length === 0) return "민여농장 상품";
      const firstProduct = products.find((p) => p.id === checkoutDraft[0].productId);
      const firstName = firstProduct?.name ?? "민여농장 상품";
      const extraCount = checkoutDraft.length - 1;
      return extraCount > 0 ? `${firstName} 외 ${extraCount}건` : firstName;
    }
    return selectedProduct?.name ?? "민여농장 상품";
  }, [checkoutDraft, fromCart, products, selectedProduct]);

  function openPostcodeSearch() {
    if (!window.daum?.Postcode) {
      setError("주소 검색 스크립트를 불러오지 못했습니다.");
      return;
    }

    new window.daum.Postcode({
      oncomplete: (data) => {
        const address = data.roadAddress || data.jibunAddress || "";
        setForm((prev) => ({
          ...prev,
          receiverZipcode: data.zonecode,
          receiverAddress1: address
        }));
      }
    }).open();
  }

  async function payNow(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!fromCart && !selectedProductId) {
      setError("주문할 상품을 선택해주세요.");
      return;
    }
    if (fromCart && checkoutDraft.length === 0) {
      setError("장바구니에서 주문할 상품을 선택해주세요.");
      return;
    }
    if (!agreeCancelPolicy) {
      setError("주문 준비 이후 환불 제한 정책에 동의해주세요.");
      return;
    }

    const tossClientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
    if (!tossClientKey) {
      setError("NEXT_PUBLIC_TOSS_CLIENT_KEY 환경변수가 필요합니다.");
      return;
    }
    if (!window.TossPayments) {
      setError("토스 결제 스크립트를 불러오지 못했습니다.");
      return;
    }

    setIsPaying(true);
    setError("");

    try {
      const created = await apiPost<OrderResponse>("/api/orders", {
        ...form,
        items: fromCart ? checkoutDraft : [{ productId: selectedProductId, quantity }]
      });

      if (fromCart) {
        const hasToken = !!localStorage.getItem("accessToken");
        if (hasToken) {
          await Promise.all(checkoutDraft.map((item) => apiDelete(`/api/my/cart/${item.productId}`)));
        } else {
          checkoutDraft.forEach((item) => removeGuestCartItem(item.productId));
        }
        sessionStorage.removeItem("checkoutDraft");
      }

      const ready = await apiPost<PaymentReadyResponse>("/api/payments/toss/ready", { orderId: created.id });
      const tossPayments = window.TossPayments(tossClientKey);
      const payment = tossPayments.payment({
        customerKey: me ? `user_${me.id}` : `guest_${created.orderNo}`
      });

      await payment.requestPayment({
        method: "CARD",
        amount: {
          currency: "KRW",
          value: created.totalAmount
        },
        orderId: ready.tossOrderId,
        orderName,
        customerName: form.buyerName || "주문자",
        customerEmail: form.buyerEmail || undefined,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "결제 요청에 실패했습니다.");
    } finally {
      setIsPaying(false);
    }
  }

  return (
    <section className="stack">
      <Script src="https://js.tosspayments.com/v2/standard" strategy="afterInteractive" />
      <Script
        src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="afterInteractive"
      />

      <article className="card stack">
        <h2>주문/결제</h2>
        <p className="muted">배송비 3,000원 / 50,000원 이상 무료</p>
      </article>

      <article className="card stack">
        <h3>상품 및 수량</h3>
        {fromCart ? (
          <>
            {checkoutDraft.length === 0 && <p className="muted">선택한 장바구니 상품이 없습니다.</p>}
            {checkoutDraft.map((item) => {
              const product = products.find((p) => p.id === item.productId);
              if (!product) return null;
              return (
                <div key={item.productId} className="admin-item">
                  <strong>{product.name}</strong>
                  <p className="muted">
                    {product.price.toLocaleString()}원 x {item.quantity}개 = {(product.price * item.quantity).toLocaleString()}원
                  </p>
                </div>
              );
            })}
          </>
        ) : isDirectOrderFromProduct ? (
          <>
            {selectedProduct ? (
              <div className="admin-item">
                <strong>{selectedProduct.name}</strong>
                <p className="muted">
                  {selectedProduct.price.toLocaleString()}원 x {quantity}개 ={" "}
                  {(selectedProduct.price * quantity).toLocaleString()}원
                </p>
              </div>
            ) : (
              <p className="muted">상품 정보를 불러오는 중입니다.</p>
            )}
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
        <h3>주문자 / 수령자 정보</h3>
        <form className="stack" onSubmit={payNow}>
          <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
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
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, buyerPhone: e.target.value.replace(/\D/g, "") }))
                }
                inputMode="numeric"
                pattern="[0-9]*"
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

          <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <label className="field">
              <span>수령자 이름</span>
              <input
                value={form.receiverName}
                onChange={(e) => setForm((prev) => ({ ...prev, receiverName: e.target.value }))}
                required
              />
            </label>
            <label className="field">
              <span>수령자 연락처</span>
              <input
                value={form.receiverPhone}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, receiverPhone: e.target.value.replace(/\D/g, "") }))
                }
                inputMode="numeric"
                pattern="[0-9]*"
                required
              />
            </label>
          </div>

          <div className="form-row">
            <label className="field">
              <span>우편번호</span>
              <input value={form.receiverZipcode} placeholder="우편번호 검색" readOnly required />
            </label>
            <button type="button" className="btn" onClick={openPostcodeSearch}>
              우편번호 검색
            </button>
          </div>

          <label className="field">
            <span>주소</span>
            <input value={form.receiverAddress1} placeholder="주소 검색으로 입력" readOnly required />
          </label>

          <label className="field">
            <span>상세 주소</span>
            <input
              value={form.receiverAddress2}
              onChange={(e) => setForm((prev) => ({ ...prev, receiverAddress2: e.target.value }))}
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

          <label className="cart-select-all">
            <input
              type="checkbox"
              checked={agreeCancelPolicy}
              onChange={(e) => setAgreeCancelPolicy(e.target.checked)}
            />
            <span>
              주문 준비중 이후 환불은 자동 처리되지 않으며, 환불 규정에 따라 고객센터 문의 후 수동 처리됩니다.
            </span>
          </label>

          <button type="submit" className="btn-primary" disabled={isPaying || products.length === 0}>
            {isPaying ? "결제 진행중.." : "결제하기"}
          </button>
        </form>
      </article>

      {error && <p className="error">{error}</p>}
    </section>
  );
}
