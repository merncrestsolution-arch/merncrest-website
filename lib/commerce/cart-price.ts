/** Resolve cart line unit price — Sales override wins over catalog. */
export function cartItemUnitPriceCents(item: {
  unitPriceCents?: number | null;
  product: { priceCents: number };
}) {
  return item.unitPriceCents != null ? item.unitPriceCents : item.product.priceCents;
}

export function cartItemLineTotalCents(item: {
  quantity: number;
  unitPriceCents?: number | null;
  product: { priceCents: number };
}) {
  return cartItemUnitPriceCents(item) * item.quantity;
}

export function cartSubtotalCents(
  items: {
    quantity: number;
    unitPriceCents?: number | null;
    product: { priceCents: number };
  }[]
) {
  return items.reduce((sum, i) => sum + cartItemLineTotalCents(i), 0);
}

export const CUSTOM_PROJECT_PRODUCT_SLUG = "custom-project-service";
