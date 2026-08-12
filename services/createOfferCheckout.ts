export type CreateOfferCheckoutData = {
  userID: string
  accountType:
    | "sitter"
    | "grooming"
    | "healthcare"
  offerID:
    | "organisation"
    | "visibility"
    | "ambassador"
  package: 1 | 2 | 3
  email: string
  stripeCustomerID?: string
  boostStructId?: string
}

export async function createOfferCheckout(
  data: CreateOfferCheckoutData
) {
  const apiURL =
    process.env.NEXT_PUBLIC_API_URL ??
    "https://zoove-backend-0977a844c5ec.herokuapp.com"

  const response = await fetch(
    `${apiURL}/stripe/create-offer-checkout`,
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
