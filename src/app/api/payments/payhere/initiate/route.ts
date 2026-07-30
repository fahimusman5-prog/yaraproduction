// The checkout route owns the shared server-side cart, coupon, shipping,
// inventory, idempotency, and order transaction. Card checkout calls this
// explicit provider endpoint; offline methods continue to use /api/checkout.
export { POST } from "@/app/api/checkout/route";
