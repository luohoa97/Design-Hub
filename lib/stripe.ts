import "server-only"
import type Stripe from "stripe"

// Lazy initialization to avoid build-time env errors
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const StripeLib = require("stripe")
    _stripe = new StripeLib.default(process.env.STRIPE_SECRET_KEY!)
  }
  return _stripe!
}

// Keep legacy export for backward compatibility with existing actions
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string, unknown>)[prop as string]
  },
})

// Platform fee: 10% of gross sale price
export const PLATFORM_FEE_PERCENT = 0.1

// Impact allocation: 10% of platform commission (1% of gross)
export const IMPACT_ALLOCATION_PERCENT = 0.1

export function calcFees(priceCents: number): {
  platformFeeCents: number
  creatorAmountCents: number
  impactAllocationCents: number
} {
  const platformFeeCents = Math.round(priceCents * PLATFORM_FEE_PERCENT)
  const creatorAmountCents = priceCents - platformFeeCents
  const impactAllocationCents = Math.round(platformFeeCents * IMPACT_ALLOCATION_PERCENT)
  return { platformFeeCents, creatorAmountCents, impactAllocationCents }
}
