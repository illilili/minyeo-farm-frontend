import Link from "next/link";

export default function HomePage() {
  return (
    <section className="hero card">
      <h2>미녀농장 온라인 스토어</h2>
      <p>무화과, 고구마 제철 수확분을 산지 직송으로 보내드려요.</p>
      <div className="hero-actions">
        <Link href="/products" className="btn btn-primary">
          지금 주문하기
        </Link>
        <Link href="/posts" className="btn">
          농장 소식 보기
        </Link>
      </div>
    </section>
  );
}
