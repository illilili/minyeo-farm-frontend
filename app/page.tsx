import Link from "next/link";

export default function HomePage() {
  return (
    <section className="home-stack">
      <article className="card main-banner">
        <img
          className="main-banner-image"
          src="https://minyeo-farm.s3.ap-northeast-2.amazonaws.com/public/products/%EB%AC%B4%ED%99%94%EA%B3%BC+%EB%86%8D%EC%9E%A5+%EC%8D%B8%EB%84%A4%EC%9D%BC.png"
          alt="농장 대표 이미지"
        />
        <div className="main-banner-overlay">
          <h2>제철 농산물, 산지에서 바로</h2>
          <p>미녀농장이 오늘 수확한 신선함을 그대로 보내드립니다.</p>
          <div className="hero-actions">
            <Link href="/products" className="btn btn-primary">
              상품 보러가기
            </Link>
            <Link href="/posts" className="btn">
              농장 소식
            </Link>
          </div>
        </div>
      </article>

      <article className="card home-blog">
        <h3>농장 소개</h3>
        <p>
          미녀농장은 계절의 속도에 맞춰 농산물을 키웁니다. 빠르게 많이보다, 제철의 맛과 향을 지키는 데 집중합니다.
          무화과와 고구마를 중심으로 매일 아침 수확 상태를 확인하고 선별해 고객에게 전달합니다.
        </p>
        <img
          src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1400&q=80"
          alt="농장 풍경 1"
          className="home-blog-image"
        />
        <p>
          수확된 농산물은 당일 포장을 원칙으로 하며, 기온과 작물 상태에 맞는 포장 방식을 적용합니다. 좋은 상품만
          보내드리기 위해 작은 흠집이나 품질 저하가 있는 작물은 출고에서 제외합니다.
        </p>
        <img
          src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1400&q=80"
          alt="농장 풍경 2"
          className="home-blog-image"
        />
        <p>
          농장의 하루와 계절의 변화를 소식으로 공유하고, 출고 일정과 품질 안내도 정직하게 전달합니다. 미녀농장의
          농산물이 식탁에 오르는 순간까지 신선함과 신뢰를 함께 보냅니다.
        </p>
      </article>
    </section>
  );
}
