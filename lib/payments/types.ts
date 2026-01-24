// lib/payments/types.ts
export type RazorpayOrderPayload = {
  id: string
  amount: number
  currency: string
  receipt: string
}
