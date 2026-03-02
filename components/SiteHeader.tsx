"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type Me = {
  id: number;
  name: string;
  role: "USER" | "ADMIN";
};

export default function SiteHeader() {
  const [me, setMe] = useState<Me | null>(null);
  const syncMe = useCallback(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setMe(null);
      return;
    }
    apiGet<Me>("/api/me")
      .then(setMe)
      .catch(() => {
        localStorage.removeItem("accessToken");
        setMe(null);
      });
  }, []);

  useEffect(() => {
    syncMe();

    function onAuthChanged() {
      syncMe();
    }

    function onStorage(event: StorageEvent) {
      if (event.key === "accessToken") {
        syncMe();
      }
    }

    window.addEventListener("auth-changed", onAuthChanged);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("auth-changed", onAuthChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, [syncMe]);

  function logout() {
    localStorage.removeItem("accessToken");
    setMe(null);
    window.dispatchEvent(new Event("auth-changed"));
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="site-title">
          미녀농장
        </Link>

        <nav className="site-nav">
          <Link href="/products" className="nav-link">
            상품
          </Link>
          <Link href="/posts" className="nav-link">
            소식
          </Link>
          {me?.role === "ADMIN" && (
            <Link href="/admin" className="nav-link">
              관리자
            </Link>
          )}
        </nav>

        <div className="auth-controls">
          {me ? (
            <>
              <span className="auth-label">{me.name}님</span>
              <Link href="/mypage" className="nav-link">
                마이페이지
              </Link>
              <Link href="/cart" className="nav-link">
                장바구니
              </Link>
              <button type="button" onClick={logout}>
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/cart" className="nav-link">
                장바구니
              </Link>
              <Link href="/login" className="btn btn-primary">
                로그인
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
