import { CartItemClient } from "./cart.types"

export function upsertItem(
  items: CartItemClient[],
  item: CartItemClient
) {
  const normalizedVariantId = item.variantId ?? null

  const existingIndex = items.findIndex(
    (i) => i.productId === item.productId && (i.variantId ?? null) === normalizedVariantId
  )

  if (existingIndex >= 0) {
    return items.map((i, idx) =>
      idx === existingIndex ? { ...i, quantity: i.quantity + item.quantity } : i
    )
  }

  return [...items, { ...item, variantId: normalizedVariantId }]
}
