export type SaveCampaignData = {
  structId: string
  name: string
  icon: string
  type: string
  status: string
  startDate: Date
  endDate: Date
}

export async function saveCampaign(
  data: SaveCampaignData
) {
  const apiURL =
    process.env.NEXT_PUBLIC_API_URL ??
    "https://zoove-backend-0977a844c5ec.herokuapp.com"

  const response = await fetch(
    `${apiURL}/api/campaigns`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        structId: data.structId,
        name: data.name,
        icon: data.icon,
        type: data.type,
        status: data.status,
        startDate:
          data.startDate.toISOString(),
        endDate:
          data.endDate.toISOString()
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
