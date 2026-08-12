export type GroomingProfileUpdates = {
  name?: string
  infos?: string
  adress?: string
  city?: string
  country?: string
  phoneNumber?: string

  schedules?: string[]

  collaborators?: string[]
  collaboratorsDispos?: string[]

  package?: number
  packageStart?: string
  packageEnd?: string
  autoRenew?: number

  stripeCustomerID?: string
  stripeSubscriptionID?: string
  stripeAccountID?: string
}

type UpdateGroomingResponse = {
  success?: boolean
  grooming?: unknown
  error?: string
}

export async function updateGroomingProfile(
  groomingID: string,
  updates: GroomingProfileUpdates
) {
  if (!groomingID?.trim()) {
    throw new Error(
      "L'identifiant du toiletteur est obligatoire."
    )
  }

  if (Object.keys(updates).length === 0) {
    throw new Error(
      "Aucune modification à enregistrer."
    )
  }

  console.log(
    "Mise à jour Grooming :",
    updates
  )

  const backendURL =
    process.env.NEXT_PUBLIC_API_URL

  if (!backendURL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL n'est pas configurée."
    )
  }

  const response = await fetch(
    `${backendURL}/api/professionals/grooming-users/${encodeURIComponent(
      groomingID
    )}`,
    {
      method: "PUT",
      headers: {
        "Content-Type":
          "application/json"
      },
      body: JSON.stringify(updates)
    }
  )

  const responseText =
    await response.text()

  console.log(
    "Réponse update grooming :",
    response.status,
    responseText
  )

  let data: UpdateGroomingResponse = {}

  if (responseText.trim()) {
    try {
      data = JSON.parse(
        responseText
      ) as UpdateGroomingResponse
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
        `Impossible de mettre à jour le toiletteur (${response.status}).`
    )
  }

  return data.grooming
}
