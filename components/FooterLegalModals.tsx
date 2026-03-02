"use client";

import { useEffect, useState } from "react";

type ModalType = "privacy" | "terms" | null;

export default function FooterLegalModals() {
  const [openModal, setOpenModal] = useState<ModalType>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenModal(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <div className="footer-links">
        <button type="button" className="footer-link-btn" onClick={() => setOpenModal("privacy")}>
          개인정보처리방침
        </button>
        <button type="button" className="footer-link-btn" onClick={() => setOpenModal("terms")}>
          이용약관
        </button>
      </div>

      {openModal && (
        <div className="legal-modal-backdrop" onClick={() => setOpenModal(null)}>
          <section className="legal-modal card" onClick={(e) => e.stopPropagation()}>
            {openModal === "privacy" ? (
              <>
                <h3>개인정보처리방침</h3>
                <p>미녀농장은 주문 처리와 배송을 위해 최소한의 개인정보를 수집/이용합니다.</p>
                <p className="muted">
                  수집 항목 예시: 이름, 연락처, 배송지, 결제 관련 정보(결제대행사 연동 데이터 포함)
                </p>
              </>
            ) : (
              <>
                <h3>이용약관</h3>
                <p>농산물 특성상 수확 상황에 따라 일부 주문이 취소될 수 있습니다.</p>
                <p className="muted">
                  주문/결제 이후에도 품질 및 재고 사정에 따라 부분 환불 또는 주문 취소가 안내될 수 있습니다.
                </p>
              </>
            )}
            <div className="hero-actions">
              <button type="button" className="btn-primary" onClick={() => setOpenModal(null)}>
                확인
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

