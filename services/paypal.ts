type StartPayPalAuthorizationArguments = {
  appointmentID: string
  amount: number
  currency: string
  sitterPayPalID: string
  userPayPalID: string
}

export async function startPayPalAuthorization({
  appointmentID,
  amount,
  currency,
  sitterPayPalID,
  userPayPalID
}: StartPayPalAuthorizationArguments) {
  const apiURL =
    process.env.NEXT_PUBLIC_API_URL

  if (!apiURL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL est absente."
    )
  }

  const createResponse =
    await fetch(
      `${apiURL}/create-order`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          amount:
            amount.toFixed(2),

          currency,

          description:
            "Réservation Zoove - Pet Sitting",

          receiver_email:
            sitterPayPalID,

          user_email:
            userPayPalID
        })
      }
    )

  const createResult =
    await createResponse.json()

  if (
    !createResponse.ok ||
    !createResult.id ||
    !createResult.approvalUrl
  ) {
    throw new Error(
      createResult.error ||
      "Impossible de créer l'autorisation PayPal."
    )
  }

  sessionStorage.setItem(
    "zoovePayPalPending",
    JSON.stringify({
      appointmentID,
      orderID:
        createResult.id
    })
  )

  window.location.href =
    createResult.approvalUrl
}
