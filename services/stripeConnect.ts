const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001"

async function parseResponse(
  response: Response
) {
  const rawResponse =
    await response.text()

  let result: any = null

  try {
    result = rawResponse
      ? JSON.parse(rawResponse)
      : null
  } catch {
    result = null
  }

  if (!response.ok) {
    throw new Error(
      result?.message ??
      result?.error ??
      rawResponse ??
      `Erreur HTTP ${response.status}`
    )
  }

  return result
}

export type CreateStripeConnectAccountData = {
  userID: string
  country: string
  email?: string
}

export async function createStripeConnectAccount(
  data: CreateStripeConnectAccountData
): Promise<{
  success: boolean
  stripeAccountID: string
}> {
  const response = await fetch(
    `${API_URL}/stripe/connect/account`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        userID:
          data.userID,

        country:
          data.country,

        email:
          data.email?.trim() ||
          undefined
      })
    }
  )

  const result =
    await parseResponse(response)

  if (!result?.stripeAccountID) {
    throw new Error(
      "Stripe n'a retourné aucun identifiant de compte."
    )
  }

  return result
}

export async function createStripeConnectAccountLink(
  stripeAccountID: string
): Promise<{
  success: boolean
  url: string
  expiresAt?: number
}> {
  const normalizedAccountID =
    stripeAccountID.trim()

  if (
    !normalizedAccountID ||
    !normalizedAccountID.startsWith(
      "acct_"
    )
  ) {
    throw new Error(
      "Identifiant Stripe Connect invalide."
    )
  }

  const response = await fetch(
    `${API_URL}/stripe/connect/account-link`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        stripeAccountID:
          normalizedAccountID
      })
    }
  )

  const result =
    await parseResponse(response)

  if (!result?.url) {
    throw new Error(
      "Stripe n'a retourné aucun lien de configuration."
    )
  }

  return result
}

export async function createStripeConnectLoginLink(
  stripeAccountID: string
): Promise<{
  success: boolean
  stripeAccountID: string
  url: string
  created?: number
}> {
  const normalizedAccountID =
    stripeAccountID.trim()

  if (
    !normalizedAccountID ||
    !normalizedAccountID.startsWith(
      "acct_"
    )
  ) {
    throw new Error(
      "Identifiant Stripe Connect invalide."
    )
  }

  const response = await fetch(
    `${API_URL}/stripe/connect/login-link`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        stripeAccountID:
          normalizedAccountID
      })
    }
  )

  const result =
    await parseResponse(response)

  if (!result?.url) {
    throw new Error(
      "Stripe n'a retourné aucun lien de connexion."
    )
  }

  return result
}
