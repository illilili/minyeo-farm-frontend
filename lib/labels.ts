export const productStatusLabel: Record<string, string> = {
  ON_SALE: "판매중",
  SOLD_OUT: "품절",
  HIDDEN: "숨김"
};

export const orderStatusLabel: Record<string, string> = {
  PENDING: "주문대기",
  PAID: "결제완료",
  PREPARING: "상품준비중",
  SHIPPING: "배송중",
  DELIVERED: "배송완료",
  CANCELED: "주문취소"
};

export function toProductStatusLabel(status: string): string {
  return productStatusLabel[status] ?? status;
}

export function toOrderStatusLabel(status: string): string {
  return orderStatusLabel[status] ?? status;
}

