export type GuestCartItem = {
  productId: number;
  quantity: number;
};

const KEY = "guestCart";

export function getGuestCart(): GuestCartItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as GuestCartItem[];
    return parsed.filter((item) => item.productId > 0 && item.quantity > 0);
  } catch {
    return [];
  }
}

export function saveGuestCart(items: GuestCartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function addGuestCartItem(productId: number, quantity: number) {
  const items = getGuestCart();
  const index = items.findIndex((item) => item.productId === productId);
  if (index >= 0) {
    items[index] = { ...items[index], quantity: items[index].quantity + quantity };
  } else {
    items.push({ productId, quantity });
  }
  saveGuestCart(items);
}

export function updateGuestCartItem(productId: number, quantity: number) {
  const items = getGuestCart().map((item) => (item.productId === productId ? { ...item, quantity } : item));
  saveGuestCart(items.filter((item) => item.quantity > 0));
}

export function removeGuestCartItem(productId: number) {
  saveGuestCart(getGuestCart().filter((item) => item.productId !== productId));
}

export function clearGuestCart() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

