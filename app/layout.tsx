import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header className="container">
          <h1>미녀농장</h1>
          <nav style={{ display: "flex", gap: 12 }}>
            <Link href="/">홈</Link>
            <Link href="/products">상품</Link>
            <Link href="/order">주문</Link>
            <Link href="/mypage/orders">마이페이지</Link>
            <Link href="/admin/orders">관리자</Link>
            <Link href="/posts">소식</Link>
            <Link href="/policy/privacy">개인정보처리방침</Link>
          </nav>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
