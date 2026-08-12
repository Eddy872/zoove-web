"use client"

import {
  useEffect,
  useRef,
  useState
} from "react"

import {
  useRouter
} from "next/navigation"

export default function PayPalSuccessPage() {
  const router = useRouter()

  const hasStarted =
    useRef(false)

  const [message, setMessage] =
    useState(
      "Validation du paiement..."
    )

  useEffect(() => {
    if (hasStarted.current) {
      return
    }

    hasStarted.current = true

    async function finalizeAuthorization() {
      try {
        const rawPending =
          sessionStorage.getItem(
            "zoovePayPalPending"
          )

        if (!rawPending) {
          throw new Error(
            "Aucune autorisation PayPal en attente."
          )
        }

        const pending =
          JSON.parse(rawPending) as {
            appointmentID: string
            orderID: string
          }

        if (
          !pending.appointmentID ||
          !pending.orderID
        ) {
          throw new Error(
            "Les informations PayPal en attente sont invalides."
          )
        }

        const apiURL =
          process.env.NEXT_PUBLIC_API_URL ??
          "http://localhost:3001"

        if (!apiURL) {
          throw new Error(
            "NEXT_PUBLIC_API_URL est absente."
          )
        }

        setMessage(
          "Autorisation du paiement..."
        )

        const authorizeResponse =
          await fetch(
            `${apiURL}/authorize-order`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                orderID:
                  pending.orderID
              })
            }
          )

        const authorizeResult =
          await authorizeResponse.json()

        if (
          !authorizeResponse.ok ||
          !authorizeResult.authorizationID
        ) {
          throw new Error(
            authorizeResult.error ||
            "Impossible d'autoriser le paiement."
          )
        }

        setMessage(
          "Enregistrement de l’autorisation..."
        )

        const saveResponse =
          await fetch(
            `${apiURL}/api/rdv/${pending.appointmentID}/authorization`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                authorizationID:
                  authorizeResult
                    .authorizationID
              })
            }
          )

        const saveResult =
          await saveResponse.json()

        if (!saveResponse.ok) {
          throw new Error(
            saveResult.error ||
            "Impossible d'enregistrer l'autorisation."
          )
        }

        sessionStorage.removeItem(
          "zoovePayPalPending"
        )

        setMessage(
          "Autorisation enregistrée."
        )

        router.replace(
          `/appointments/${pending.appointmentID}/qrcode`
        )
      } catch (error) {
        console.error(
          "Erreur finalisation PayPal :",
          error
        )

        setMessage(
          error instanceof Error
            ? error.message
            : "Une erreur est survenue."
        )
      }
    }

    finalizeAuthorization()
  }, [router])

  return (
    <main>
      <p>{message}</p>
    </main>
  )
}
