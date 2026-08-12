export type CustomerPortalData = {
  stripeCustomerID: string
}

export async function customerPortal(
  data: CustomerPortalData
) {
  const apiURL =
    process.env.NEXT_PUBLIC_API_URL ??
    "https://zoove-backend-0977a844c5ec.herokuapp.com"

  const response = await fetch(
    `${apiURL}/stripe/customer-portal`,
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
        "Impossible d'ouvrir le portail Stripe."
    )
  }

  return json
}
