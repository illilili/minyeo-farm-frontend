import Link from "next/link";
import AdminTabs from "@/components/AdminTabs";

export default function AdminHomePage() {
  return (
    <section className="stack">
      <article className="card stack">
        <h2>관리자 대시보드</h2>
        <p className="muted">상품/소식/주문을 한 곳에서 관리할 수 있습니다.</p>
        <AdminTabs />
      </article>

      <div className="grid">
        <Link href="/admin/products" className="card stack">
          <strong>상품 관리</strong>
          <p className="muted">상품 추가, 수정, 삭제 및 상태 관리를 진행합니다.</p>
        </Link>
        <Link href="/admin/posts" className="card stack">
          <strong>소식 관리</strong>
          <p className="muted">소식 게시글 작성, 수정, 공개 여부를 관리합니다.</p>
        </Link>
        <Link href="/admin/orders" className="card stack">
          <strong>주문 관리</strong>
          <p className="muted">주문 상태 변경, 택배사/운송장 입력을 처리합니다.</p>
        </Link>
      </div>
    </section>
  );
}

