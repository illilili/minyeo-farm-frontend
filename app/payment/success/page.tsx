"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiPost } from "@/lib/api";

type PaymentResponse = {
  paymentId: number;
  tossOrderId: string;
  status: "READY" | "APPROVED" | "FAILED" | "CANCELED";
};

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const hasRequested = useRef(false);

  const [result, setResult] = useState<PaymentResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [hasAccessToken, setHasAccessToken] = useState(false);

  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = Number(searchParams.get("amount"));

  useEffect(() => {
    setHasAccessToken(!!localStorage.getItem("accessToken"));
  }, []);

  useEffect(() => {
    if (hasRequested.current) return;

    if (!paymentKey || !orderId || Number.isNaN(amount)) {
      setError("결제 승인 파라미터가 올바르지 않습니다.");
      return;
    }

    hasRequested.current = true;
    apiPost<PaymentResponse>("/api/payments/toss/confirm", {
      paymentKey,
      orderId,
      amount
    })
      .then((data) => setResult(data))
      .catch((e: Error) => setError(e.message || "결제 승인에 실패했습니다."));
  }, [amount, orderId, paymentKey]);

  return (
    <section className="card stack" style={{ textAlign: "center", placeItems: "center" }}>
      <h2>결제 결과</h2>

      {!result && !error && <p>결제 승인 확인 중입니다...</p>}

      {result && (
        <>
          <p>결제가 승인되었습니다.</p>
          <p>주문번호: {result.tossOrderId}</p>
          <Link className="btn btn-primary" href={hasAccessToken ? "/mypage" : "/login"}>
            {hasAccessToken ? "마이페이지로 이동" : "주문 조회하기"}
          </Link>
        </>
      )}

      {error && (
        <>
          <p className="error">{error}</p>
          <Link className="btn-primary" href="/payment/fail">
            실패 페이지로 이동
          </Link>
        </>
      )}
    </section>
  );
}
