import "./globals.css";
import type { ReactNode } from "react";
import SiteHeader from "@/components/SiteHeader";
import FooterLegalModals from "@/components/FooterLegalModals";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <SiteHeader />
        <main className="container page-main">{children}</main>
        <footer className="site-footer">
          <div className="container footer-inner">
            <FooterLegalModals />

            <div className="footer-meta">
              <small>상호명: 미녀농장 | 대표: 반미녀 | 사업자등록번호: 123-45-67890</small>
              <small>통신판매업신고: 2026-서울강남-0001 | 주소: 서울특별시 강남구 테헤란로 123</small>
              <small>고객센터: 02-1234-5678 | 이메일: help@minyeofarm.example</small>
              <small>운영시간: 평일 10:00 - 18:00 (주말/공휴일 휴무) | © Minyeo Farm</small>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
