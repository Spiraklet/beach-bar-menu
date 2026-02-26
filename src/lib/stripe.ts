import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
  typescript: true,
})

export async function createConnectAccount(email: string, companyName: string) {
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'GR',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'company',
    company: {
      name: companyName,
    },
  })

  return account.id
}

export async function createAccountLink(accountId: string) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?stripe=refresh`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?stripe=success`,
    type: 'account_onboarding',
  })

  return accountLink.url
}

export async function createPaymentIntent(
  amount: number, // in cents
  clientStripeAccountId: string,
  metadata: Record<string, string>
) {
  const applicationFee = Math.round(amount * 0.05) // 5% platform fee

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'eur',
    application_fee_amount: applicationFee,
    transfer_data: {
      destination: clientStripeAccountId,
    },
    metadata,
  })

  return paymentIntent
}

export async function getAccountStatus(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId)

  return {
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
  }
}
