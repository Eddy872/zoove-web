export type CancelSubscriptionData = {
  userID: string
  accountType:
    | "sitter"
    | "grooming"
    | "healthcare"
  stripeSubscriptionID: string
}

export async function cancelSubscription(
  data: CancelSubscriptionData
) {
  const apiURL =
    process.env.NEXT_PUBLIC_API_URL ??
    "https://zoove-backend-0977a844c5ec.herokuapp.com"

  const response = await fetch(
    `${apiURL}/stripe/cancel-subscription`,
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
        "Impossible d'annuler le renouvellement automatique."
    )
  }

  return json
}
