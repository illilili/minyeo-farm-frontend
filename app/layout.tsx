import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";
import SiteHeader from "@/components/SiteHeader";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <SiteHeader />
        <main className="container page-main">{children}</main>
        <footer className="site-footer">
          <div className="container footer-inner">
            <small>© Minyeo Farm</small>
            <Link href="/policy/privacy" className="footer-link">
              개인정보처리방침
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}

