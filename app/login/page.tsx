"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";

type LoginUrlResponse = {
  loginUrl: string;
};

type GuestOrder = {
  orderNo: string;
  orderStatus: string;
  totalAmount: number;
  createdAt: string;
};

const LOGIN_MESSAGE_TYPE = "MINYEO_AUTH_SUCCESS";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [orderNo, setOrderNo] = useState("");
  const [phone, setPhone] = useState("");
  const [guestOrder, setGuestOrder] = useState<GuestOrder | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const apiBase = useMemo(() => {
    return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
  }, []);

  const apiOrigin = useMemo(() => {
    return new URL(apiBase).origin;
  }, [apiBase]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== apiOrigin) return;
      if (!event.data || event.data.type !== LOGIN_MESSAGE_TYPE) return;
      if (!event.data.accessToken) return;

      localStorage.setItem("accessToken", event.data.accessToken);
      window.dispatchEvent(new Event("auth-changed"));
      setMessage("로그인이 완료되었습니다.");
      setError("");
      router.push("/");
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [apiOrigin, router]);

  async function startNaverLogin() {
    setLoading(true);
    setError("");

    try {
      const loginResponse = await fetch(`${apiBase}/api/auth/naver/login`, {
        method: "GET",
        cache: "no-store"
      });
      if (!loginResponse.ok) {
        throw new Error("로그인 URL 생성에 실패했습니다.");
      }

      const raw = await loginResponse.text();
      let loginUrl = "";
      try {
        const parsed = JSON.parse(raw) as LoginUrlResponse;
        loginUrl = parsed.loginUrl;
      } catch {
        loginUrl = raw;
      }

      if (!loginUrl.startsWith("http")) {
        throw new Error("로그인 URL 응답 형식이 올바르지 않습니다.");
      }

      const popup = window.open(loginUrl, "minyeo-naver-login", "width=520,height=720");
      if (!popup) {
        setError("팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "로그인 URL 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function lookupGuestOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLookupLoading(true);
    setError("");
    setMessage("");

    try {
      const query = new URLSearchParams({
        orderNo: orderNo.trim(),
        phone: phone.trim()
      }).toString();
      const data = await apiGet<GuestOrder>(`/api/orders/guest?${query}`);
      setGuestOrder(data);
      setMessage("비회원 주문 정보를 불러왔습니다.");
    } catch (e) {
      setGuestOrder(null);
      setError(e instanceof Error ? e.message : "비회원 주문 조회에 실패했습니다.");
    } finally {
      setLookupLoading(false);
    }
  }

  return (
    <section className="stack">
      <article className="card stack">
        <h2>로그인</h2>
        <p className="muted">회원/관리자는 네이버 로그인으로 이용할 수 있습니다.</p>
        <div className="hero-actions">
          <button type="button" className="btn btn-primary" onClick={startNaverLogin} disabled={loading}>
            {loading ? "로그인 준비중..." : "네이버 로그인"}
          </button>
          <Link href="/products" className="btn">
            비회원 이용
          </Link>
        </div>
      </article>

      <article className="card stack">
        <h3>비회원 주문 조회</h3>
        <form className="stack" onSubmit={lookupGuestOrder}>
          <label className="field">
            <span>주문번호</span>
            <input
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value)}
              placeholder="예: O202602280001"
              required
            />
          </label>
          <label className="field">
            <span>연락처</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="예: 01012345678"
              required
            />
          </label>
          <button type="submit" disabled={lookupLoading}>
            {lookupLoading ? "조회중..." : "비회원 주문 조회"}
          </button>
        </form>

        {guestOrder && (
          <div className="card">
            <p>주문번호: {guestOrder.orderNo}</p>
            <p>상태: {guestOrder.orderStatus}</p>
            <p>결제금액: {guestOrder.totalAmount.toLocaleString()}원</p>
            <p className="muted">주문일시: {new Date(guestOrder.createdAt).toLocaleString("ko-KR")}</p>
          </div>
        )}
      </article>

      {message && <p>{message}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}

