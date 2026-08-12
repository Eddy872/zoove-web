export type CreateBoostCheckoutData = {
  userID: string
  accountType: "sitter" | "grooming" | "healthcare"
  boostID: "boost-24h" | "boost-72h"
  durationHours: 24 | 72
  email: string
  stripeCustomerID?: string
}

export async function createBoostCheckout(
  data: CreateBoostCheckoutData
) {
  const apiURL =
    process.env.NEXT_PUBLIC_API_URL ??
    "https://zoove-backend-0977a844c5ec.herokuapp.com"

  const response = await fetch(
    `${apiURL}/stripe/create-boost-checkout`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(data),
    }
  )

  const json =
    await response.json()

  if (!response.ok) {
    throw new Error(
      json.message ??
        "Impossible de créer la session Stripe."
    )
  }

  return json
}
