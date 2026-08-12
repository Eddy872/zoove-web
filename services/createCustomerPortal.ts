export type CreateCustomerPortalData = {
  userID: string
  accountType:
    | "sitter"
    | "grooming"
    | "healthcare"
  stripeCustomerID: string
  stripeSubscriptionID: string
}

type CreateCustomerPortalResponse = {
  success?: boolean
  url?: string
  message?: string
}

export async function createCustomerPortal(
  data: CreateCustomerPortalData
): Promise<string> {
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
    (await response.json()) as
      CreateCustomerPortalResponse

  if (!response.ok) {
    throw new Error(
      json.message ??
        "Impossible d'ouvrir le portail Stripe."
    )
  }

  if (
    !json.success ||
    typeof json.url !== "string" ||
    !json.url.trim()
  ) {
    throw new Error(
      json.message ??
        "URL du portail Stripe manquante."
    )
  }

  return json.url
}
