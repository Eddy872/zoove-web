export async function sendNotificationToAll({
  iphoneToken,
  webToken,
  title,
  body,
  data = {}
}: {
  iphoneToken?: string | null
  webToken?: string | null
  title: string
  body: string
  data?: Record<string, string>
}) {

  const cleanIphoneToken =
    iphoneToken?.trim() || ""

  const cleanWebToken =
    webToken?.trim() || ""


  if (
    !cleanIphoneToken &&
    !cleanWebToken
  ) {
    console.log(
      "⚠️ Aucun token iOS ou Web"
    )

    return null
  }


  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/send-test-all`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        iphoneToken:
          cleanIphoneToken,

        webToken:
          cleanWebToken,

        title,

        body,

        data
      })
    }
  )


  const result =
    await response.json()


  if (!response.ok) {

    console.error(
      "❌ Erreur notification :",
      result
    )

    throw new Error(
      result.error ||
      "Impossible d'envoyer la notification."
    )
  }


  console.log(
    "✅ Notification iOS/Web envoyée :",
    result
  )


  return result
}
