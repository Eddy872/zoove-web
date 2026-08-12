export type HealthcareProfileUpdates = {
  name?: string
  infos?: string
  adress?: string
  city?: string
  country?: string
  phoneNumber?: string

  schedules?: string[]

  collaborators?: string[]
  collaboratorsDispos?: string[]

  expertise?: string[]

  package?: number
  packageStart?: string
  packageEnd?: string
  autoRenew?: number

  stripeCustomerID?: string
  stripeSubscriptionID?: string
  stripeAccountID?: string
}

type UpdateHealthcareResponse = {
  success?: boolean
  healthcare?: unknown
  error?: string
}

export async function updateHealthcareProfile(
  healthcareID: string,
  updates: HealthcareProfileUpdates
) {
  if (!healthcareID?.trim()) {
    throw new Error(
      "L'identifiant du professionnel de santé est obligatoire."
    )
  }

  if (Object.keys(updates).length === 0) {
    throw new Error(
      "Aucune modification à enregistrer."
    )
  }

  console.log(
    "Mise à jour Healthcare :",
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
    `${backendURL}/api/professionals/healthcare-users/${encodeURIComponent(
      healthcareID
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
    "Réponse update healthcare :",
    response.status,
    responseText
  )

  let data: UpdateHealthcareResponse = {}

  if (responseText.trim()) {
    try {
      data = JSON.parse(
        responseText
      ) as UpdateHealthcareResponse
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
        `Impossible de mettre à jour le professionnel de santé (${response.status}).`
    )
  }

  return data.healthcare
}
