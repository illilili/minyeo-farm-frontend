"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { clearGuestCart, getGuestCart, removeGuestCartItem, updateGuestCartItem } from "@/lib/cart";
import { toProductStatusLabel } from "@/lib/labels";

type ProductStatus = "ON_SALE" | "SOLD_OUT" | "HIDDEN";

type CartItem = {
  productId: number;
  productName: string;
  price: number;
  status: ProductStatus;
  thumbnailUrl?: string;
  quantity: number;
  lineAmount: number;
};

type ProductDetail = {
  id: number;
  name: string;
  price: number;
  status: ProductStatus;
  thumbnailUrl?: string;
};

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadServerCart() {
    const data = await apiGet<CartItem[]>("/api/my/cart");
    setItems(data);
  }

  async function loadGuestCart() {
    const guestItems = getGuestCart();
    if (guestItems.length === 0) {
      setItems([]);
      return;
    }
    const products = await Promise.all(
      guestItems.map((item) => apiGet<ProductDetail>(`/api/products/${item.productId}`).catch(() => null))
    );
    const mapped = guestItems
      .map((item) => {
        const product = products.find((p) => p?.id === item.productId);
        if (!product) return null;
        return {
          productId: product.id,
          productName: product.name,
          price: product.price,
          status: product.status,
          thumbnailUrl: product.thumbnailUrl,
          quantity: item.quantity,
          lineAmount: product.price * item.quantity
        } as CartItem;
      })
      .filter((item): item is CartItem => item !== null);
    setItems(mapped);
  }

  useEffect(() => {
    const hasToken = !!localStorage.getItem("accessToken");
    setIsLoggedIn(hasToken);

    if (hasToken) {
      const guestItems = getGuestCart();
      if (guestItems.length > 0) {
        Promise.all(
          guestItems.map((item) =>
            apiPost("/api/my/cart", {
              productId: item.productId,
              quantity: item.quantity
            }).catch(() => null)
          )
        )
          .then(() => {
            clearGuestCart();
            return loadServerCart();
          })
          .then(() => setMessage("비회원 장바구니가 계정 장바구니로 합쳐졌습니다."))
          .catch((e: Error) => setError(e.message));
      } else {
        loadServerCart().catch((e: Error) => setError(e.message));
      }
    } else {
      loadGuestCart().catch((e: Error) => setError(e.message));
    }
  }, []);

  useEffect(() => {
    setSelectedProductIds((prev) => {
      const existing = prev.filter((id) => items.some((item) => item.productId === id));
      const newOnes = items.map((item) => item.productId).filter((id) => !existing.includes(id));
      return [...existing, ...newOnes];
    });
  }, [items]);

  function toggleSelect(productId: number, checked: boolean) {
    setSelectedProductIds((prev) => {
      if (checked) {
        return prev.includes(productId) ? prev : [...prev, productId];
      }
      return prev.filter((id) => id !== productId);
    });
  }

  const allChecked = items.length > 0 && selectedProductIds.length === items.length;

  function toggleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedProductIds(items.map((item) => item.productId));
      return;
    }
    setSelectedProductIds([]);
  }

  function checkoutSelected() {
    const selected = items
      .filter((item) => selectedProductIds.includes(item.productId))
      .map((item) => ({ productId: item.productId, quantity: item.quantity }));
    if (selected.length === 0) {
      setError("주문할 상품을 선택해주세요.");
      return;
    }
    sessionStorage.setItem("checkoutDraft", JSON.stringify(selected));
    router.push("/order?from=cart");
  }

  async function updateQuantity(productId: number, quantity: number) {
    if (quantity < 1) return;
    setMessage("");
    setError("");
    try {
      if (isLoggedIn) {
        const data = await apiPatch<CartItem[]>(`/api/my/cart/${productId}`, { quantity });
        setItems(data);
      } else {
        updateGuestCartItem(productId, quantity);
        await loadGuestCart();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "수량 변경에 실패했습니다.");
    }
  }

  async function removeItem(productId: number) {
    setMessage("");
    setError("");
    try {
      if (isLoggedIn) {
        const data = await apiDelete(`/api/my/cart/${productId}`).then(() => apiGet<CartItem[]>("/api/my/cart"));
        setItems(data);
      } else {
        removeGuestCartItem(productId);
        await loadGuestCart();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "상품 삭제에 실패했습니다.");
    }
  }

  const total = useMemo(() => items.reduce((sum, item) => sum + item.lineAmount, 0), [items]);

  return (
    <section className="stack">
      <article className="card stack">
        <h2>장바구니</h2>
        <p className="muted">
          {isLoggedIn
            ? "로그인 장바구니입니다. 계정에 저장되어 다른 기기에서도 확인할 수 있습니다."
            : "비회원 장바구니입니다. 현재 브라우저에만 저장됩니다."}
        </p>
      </article>

      <article className="card stack">
        {items.length > 0 && (
          <label className="cart-select-all">
            <input type="checkbox" checked={allChecked} onChange={(e) => toggleSelectAll(e.target.checked)} />
            <span>전체 선택</span>
          </label>
        )}
        {items.length === 0 && <p className="muted">장바구니에 담긴 상품이 없습니다.</p>}
        {items.map((item) => (
          <div key={item.productId} className="admin-item">
            <div className="cart-item-row">
              <label className="cart-check">
                <input
                  type="checkbox"
                  checked={selectedProductIds.includes(item.productId)}
                  onChange={(e) => toggleSelect(item.productId, e.target.checked)}
                />
              </label>
              {item.thumbnailUrl ? (
                <img src={item.thumbnailUrl} alt={item.productName} className="cart-thumb" />
              ) : (
                <div className="cart-thumb muted" style={{ display: "grid", placeItems: "center" }}>
                  없음
                </div>
              )}
              <div className="stack" style={{ gap: 6 }}>
                <strong>{item.productName}</strong>
                <p className="muted">
                  {item.price.toLocaleString()}원 | {toProductStatusLabel(item.status)}
                </p>
                <div className="admin-actions">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
                    style={{ width: 90 }}
                  />
                  <span>{item.lineAmount.toLocaleString()}원</span>
                  <button type="button" onClick={() => removeItem(item.productId)}>
                    삭제
                  </button>
                  <Link href={`/products/${item.productId}`} className="btn btn-primary">
                    상세 보기
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </article>

      <article className="card stack">
        <strong>총 합계: {total.toLocaleString()}원</strong>
        <button type="button" className="btn-primary" onClick={checkoutSelected} disabled={items.length === 0}>
          선택 상품 주문하기
        </button>
      </article>

      {message && <p>{message}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}
