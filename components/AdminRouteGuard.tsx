"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";

type MeResponse = {
  role: "USER" | "ADMIN";
};

export default function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkAccess() {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      try {
        const me = await apiGet<MeResponse>("/api/me");
        if (!mounted) return;
        if (me.role !== "ADMIN") {
          router.replace("/");
          return;
        }
        setAllowed(true);
      } catch {
        localStorage.removeItem("accessToken");
        if (mounted) {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        }
      } finally {
        if (mounted) setChecking(false);
      }
    }

    checkAccess();
    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  if (checking) {
    return <p className="muted">관리자 권한 확인 중...</p>;
  }

  if (!allowed) return null;
  return <>{children}</>;
}

