export type SaveRDVData = {
  groomingID: string
  userID: string
  date: Date
  serviceID: string
  collaborator: string
  phoneNumber: string

  authorizationID: string

  stripePaymentIntentID: string
  stripeTransferID: string
  paymentStatus: string

  duration: number
}

export async function saveRDV(
  data: SaveRDVData
) {
  const apiURL =
    process.env.NEXT_PUBLIC_API_URL ??
    "https://zoove-backend-0977a844c5ec.herokuapp.com"

  const response = await fetch(
    `${apiURL}/api/rdv`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        groomingID: data.groomingID,
        userID: data.userID,
        date: data.date.toISOString(),
        serviceID: data.serviceID,
        collaborator: data.collaborator,
        phoneNumber: data.phoneNumber,

        authorizationID:
          data.authorizationID,

        stripePaymentIntentID:
          data.stripePaymentIntentID,

        stripeTransferID:
          data.stripeTransferID,

        paymentStatus:
          data.paymentStatus,

        duration: data.duration
      })
    }
  )

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
      result?.error ||
      rawResponse ||
      `Erreur HTTP ${response.status}`
    )
  }

  return result
}
