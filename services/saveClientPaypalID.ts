type SaveClientPaypalIDParams = {
  userID: string
  paypalID: string
}

type SaveClientPaypalIDResponse = {
  success: boolean
  paypalID?: string
  recordName?: string
  error?: string
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://zoove-backend-0977a844c5ec.herokuapp.com"

export async function saveClientPaypalID({
  userID,
  paypalID
}: SaveClientPaypalIDParams): Promise<string> {
  const response = await fetch(
    `${API_BASE_URL}/save-paypal`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userID,
        paypalID
      })
    }
  )

  const data =
    (await response.json()) as SaveClientPaypalIDResponse

  if (!response.ok || !data.success) {
    throw new Error(
      data.error ??
        "Impossible d'enregistrer l'adresse PayPal."
    )
  }

  if (!data.paypalID) {
    throw new Error(
      "Le serveur n'a retourné aucune adresse PayPal."
    )
  }

  return data.paypalID
}
