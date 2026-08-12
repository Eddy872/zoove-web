export type SitterAvailability = {
  day: string
  enabled: boolean
  start: string
  end: string
}

export type SitterProfileUpdates = {
  tarif?: number
  devise?: string
  services?: string[]
  acceptedSpecies?: string[]
  availability?: SitterAvailability[]

  bio?: string
  city?: string
  country?: string
  phoneNumber?: string
  paypalID?: string

  package?: number
  packageStart?: string
  packageEnd?: string
  autoRenew?: number

  stripeCustomerID?: string
  stripeSubscriptionID?: string
  stripeAccountID?: string
}

type UpdateSitterResponse = {
  success?: boolean
  sitter?: unknown
  error?: string
}

export async function updateSitterProfile(
  sitterID: string,
  updates: SitterProfileUpdates
) {
  if (!sitterID?.trim()) {
    throw new Error(
      "L'identifiant du pet sitter est obligatoire."
    )
  }

  if (Object.keys(updates).length === 0) {
    throw new Error(
      "Aucune modification à enregistrer."
    )
  }
    console.log(process.env.NEXT_PUBLIC_API_URL)
    console.log(updates.availability)
  const backendURL =
    process.env.NEXT_PUBLIC_API_URL

  if (!backendURL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL n'est pas configurée."
    )
  }

  const response = await fetch(
    `${backendURL}/api/professionals/sitter-users/${encodeURIComponent(
      sitterID
    )}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    }
  )

  const responseText =
    await response.text()

  console.log(
    "Réponse update sitter :",
    response.status,
    responseText
  )

  let data: UpdateSitterResponse = {}

  if (responseText.trim()) {
    try {
      data = JSON.parse(
        responseText
      ) as UpdateSitterResponse
    } catch {
      throw new Error(
        `Le serveur a renvoyé une réponse invalide (${response.status}) : ${responseText.slice(
          0,
          200
        )}`
      )
    }
  }

  if (!response.ok || !data.success) {
    throw new Error(
      data.error ||
        `Impossible de mettre à jour le pet sitter (${response.status}).`
    )
  }

  return data.sitter
}
