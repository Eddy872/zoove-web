"use client"

import {
  FormEvent,
  useEffect,
  useMemo,
  useState
} from "react"

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe
} from "@stripe/react-stripe-js"

import {
  loadStripe
} from "@stripe/stripe-js"

import {
  translate
} from "@/translations/translations"
import type { Language } from "@/context/LanguageContext"

const stripePromise =
  loadStripe(
    process.env
      .NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
      ""
  )

type CreatePaymentIntentResponse = {
  success: boolean
  paymentIntentID: string
  clientSecret: string
  status: string
  totalAmount: number
  commissionRate: number
  commissionAmount: number
  sitterAmount: number
  currency: string
  message?: string
}

type VerifyAuthorizationResponse = {
  success: boolean
  authorized: boolean
  paymentIntentID: string
  status: string
  paymentStatus?: string
  amount: number
  amountCapturable: number
  captureBefore?: string | null
  message?: string
}

type SittingPaymentFormProps = {
  rdvID: string
  ownerID: string
  sitterID: string

  /*
   * Montant total dans l’unité attendue
   * par ton backend.
   *
   * Si ton backend attend 75 €,
   * passe 75.
   *
   * S’il attend déjà les centimes,
   * passe 7500.
   */
  totalAmount: number

  currency: string
  sitterPackage: number
  stripeAccountID: string
  language: Language

  onAuthorized?: (
    result: VerifyAuthorizationResponse
  ) => void

  onCancel?: () => void
}

type PaymentFormContentProps = {
  paymentIntentID: string
  language: Language

  onAuthorized?: (
    result: VerifyAuthorizationResponse
  ) => void

  onCancel?: () => void
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://zoove-backend-0977a844c5ec.herokuapp.com"

async function parseJSONResponse<T>(
  response: Response
): Promise<T> {
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

  return result as T
}

async function createSittingPaymentIntent(
  data: {
    rdvID: string
    ownerID: string
    sitterID: string
    totalAmount: number
    currency: string
    sitterPackage: number
    stripeAccountID: string
  }
): Promise<CreatePaymentIntentResponse> {
  const amountInCents =
    Math.round(
      data.totalAmount * 100
    )

  if (
    !Number.isInteger(amountInCents) ||
    amountInCents <= 0
  ) {
    throw new Error(
      "Le montant du paiement est invalide."
    )
  }

  const response =
    await fetch(
      `${API_URL}/stripe/sitting/payment-intent`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          rdvID:
            data.rdvID,

          ownerID:
            data.ownerID,

          sitterID:
            data.sitterID,

          amount:
            amountInCents,

          currency:
            data.currency,

          sitterPackage:
            data.sitterPackage,

          stripeConnectedAccountID:
            data.stripeAccountID
        })
      }
    )

  const result =
    await parseJSONResponse<CreatePaymentIntentResponse>(
      response
    )

  if (
    !result.success ||
    !result.paymentIntentID ||
    !result.clientSecret
  ) {
    throw new Error(
      result.message ??
      "Impossible de préparer le paiement Stripe."
    )
  }

  return result
}

async function verifySittingAuthorization(
  paymentIntentID: string
): Promise<VerifyAuthorizationResponse> {
  const response =
    await fetch(
      `${API_URL}/stripe/sitting/verify-authorization`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          paymentIntentID
        })
      }
    )

  return parseJSONResponse<VerifyAuthorizationResponse>(
    response
  )
}

function SittingPaymentFormContent({
  paymentIntentID,
  language,
  onAuthorized,
  onCancel
}: PaymentFormContentProps) {
  const stripe =
    useStripe()

  const elements =
    useElements()

  const [
    isPaymentElementReady,
    setIsPaymentElementReady
  ] = useState(false)

  const [
    isSubmitting,
    setIsSubmitting
  ] = useState(false)

  const [
    paymentError,
    setPaymentError
  ] = useState("")

  const handleSubmit =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault()

      if (
        !stripe ||
        !elements ||
        isSubmitting
      ) {
        return
      }

      try {
        setIsSubmitting(true)
        setPaymentError("")

        /*
         * Vérifie d’abord que les champs
         * du Payment Element sont valides.
         */
        const {
          error: submitError
        } =
          await elements.submit()

        if (submitError) {
          throw new Error(
            submitError.message ??
            translate(
              language,
              "Vérifiez vos informations de paiement."
            )
          )
        }

        /*
         * Confirme le PaymentIntent.
         *
         * redirect: "if_required" évite
         * une redirection pour une carte
         * classique, mais Stripe pourra
         * tout de même gérer une étape
         * obligatoire.
         */
        const {
          error: confirmationError,
          paymentIntent
        } =
          await stripe.confirmPayment({
            elements,

            redirect:
              "if_required",

            confirmParams: {
              return_url:
                `${window.location.origin}` +
                `/appointments/${encodeURIComponent(
                  paymentIntentID
                )}/qrcode`
            }
          })

        if (confirmationError) {
          throw new Error(
            confirmationError.message ??
            translate(
              language,
              "Le paiement n'a pas pu être autorisé."
            )
          )
        }

        console.log(
          "💳 PaymentIntent confirmé :",
          {
            id:
              paymentIntent?.id,

            status:
              paymentIntent?.status,

            amount:
              paymentIntent?.amount
          }
        )

        /*
         * Avec capture_method: "manual",
         * le statut attendu après autorisation
         * est requires_capture.
         */
        const confirmedIntentID =
          paymentIntent?.id ??
          paymentIntentID

        const verification =
          await verifySittingAuthorization(
            confirmedIntentID
          )

        console.log(
          "✅ Vérification autorisation :",
          verification
        )

        if (
          !verification.success ||
          !verification.authorized
        ) {
          throw new Error(
            verification.message ??
            translate(
              language,
              "Le paiement n'a pas été autorisé."
            )
          )
        }

        /*
         * Ton backend enregistre maintenant :
         *
         * stripePaymentIntentID = pi_...
         * paymentStatus = in_progress
         *
         * Le polling de la page QR détectera
         * awaiting_payment → in_progress.
         */
        onAuthorized?.(
          verification
        )
      } catch (error) {
        console.error(
          "Erreur autorisation Stripe :",
          error
        )

        setPaymentError(
          error instanceof Error
            ? error.message
            : translate(
                language,
                "Impossible d'autoriser le paiement."
              )
        )
      } finally {
        setIsSubmitting(false)
      }
    }

  return (
    <form
      className="sittingPaymentForm"
      onSubmit={handleSubmit}
    >
      <div className="sittingPaymentElementContainer">
        <PaymentElement
          onReady={() => {
            setIsPaymentElementReady(
              true
            )
          }}
          onLoadError={(event) => {
            console.error(
              "Erreur Payment Element :",
              event.error
            )

            setPaymentError(
              event.error.message ??
              translate(
                language,
                "Impossible de charger le formulaire Stripe."
              )
            )
          }}
          options={{
            layout: {
              type: "tabs",
              defaultCollapsed: false
            }
          }}
        />
      </div>

      {paymentError && (
        <p
          className="sittingPaymentError"
          role="alert"
        >
          {paymentError}
        </p>
      )}

      <div className="sittingPaymentActions">
        {onCancel && (
          <button
            type="button"
            className="sittingPaymentCancelButton"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            {translate(
              language,
              "Plus tard"
            )}
          </button>
        )}

        <button
          type="submit"
          className="sittingPaymentConfirmButton"
          disabled={
            !stripe ||
            !elements ||
            !isPaymentElementReady ||
            isSubmitting
          }
        >
          {isSubmitting
            ? translate(
                language,
                "Autorisation en cours..."
              )
            : translate(
                language,
                "Autoriser le paiement"
              )}
        </button>
      </div>
    </form>
  )
}

export default function SittingPaymentForm({
  rdvID,
  ownerID,
  sitterID,
  totalAmount,
  currency,
  sitterPackage,
  stripeAccountID,
  language,
  onAuthorized,
  onCancel
}: SittingPaymentFormProps) {
  const [
    clientSecret,
    setClientSecret
  ] = useState("")

  const [
    paymentIntentID,
    setPaymentIntentID
  ] = useState("")

  const [
    isPreparing,
    setIsPreparing
  ] = useState(true)

  const [
    preparationError,
    setPreparationError
  ] = useState("")

  useEffect(() => {
    if (
      !rdvID ||
      !ownerID ||
      !sitterID ||
      !stripeAccountID ||
      totalAmount <= 0
    ) {
      setPreparationError(
        translate(
          language,
          "Les informations du paiement sont incomplètes."
        )
      )

      setIsPreparing(false)
      return
    }

    const controller =
      new AbortController()

    let cancelled = false

    const preparePayment =
      async () => {
        try {
          setIsPreparing(true)
          setPreparationError("")

          console.log(
            "💳 Création PaymentIntent :",
            {
              rdvID,
              ownerID,
              sitterID,
              totalAmount,
              currency,
              sitterPackage,
              stripeAccountID
            }
          )

          const result =
            await createSittingPaymentIntent({
              rdvID,
              ownerID,
              sitterID,
              totalAmount,
              currency,
              sitterPackage,
              stripeAccountID
            })

          if (cancelled) {
            return
          }

          console.log(
            "✅ PaymentIntent créé :",
            {
              paymentIntentID:
                result.paymentIntentID,

              status:
                result.status,

              totalAmount:
                result.totalAmount,

              commissionAmount:
                result.commissionAmount,

              sitterAmount:
                result.sitterAmount
            }
          )

          setClientSecret(
            result.clientSecret
          )

          setPaymentIntentID(
            result.paymentIntentID
          )
        } catch (error) {
          if (
            controller.signal.aborted
          ) {
            return
          }

          console.error(
            "Erreur création PaymentIntent :",
            error
          )

          setPreparationError(
            error instanceof Error
              ? error.message
              : translate(
                  language,
                  "Impossible de préparer le paiement."
                )
          )
        } finally {
          if (!cancelled) {
            setIsPreparing(false)
          }
        }
      }

    void preparePayment()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [
    rdvID,
    ownerID,
    sitterID,
    totalAmount,
    currency,
    sitterPackage,
    stripeAccountID,
    language
  ])

  const elementsOptions =
    useMemo(
      () => ({
        clientSecret,

        appearance: {
          theme:
            "stripe" as const,

          variables: {
            borderRadius:
              "12px",

            fontFamily:
              "inherit"
          }
        },

        loader:
          "auto" as const
      }),
      [
        clientSecret
      ]
    )

  if (isPreparing) {
    return (
      <div className="sittingPaymentLoading">
        <span
          className="sittingPaymentSpinner"
          aria-hidden="true"
        />

        <p>
          {translate(
            language,
            "Préparation du paiement..."
          )}
        </p>
      </div>
    )
  }

  if (
    preparationError ||
    !clientSecret ||
    !paymentIntentID
  ) {
    return (
      <div
        className="sittingPaymentPreparationError"
        role="alert"
      >
        <p>
          {preparationError ||
            translate(
              language,
              "Impossible de préparer le paiement."
            )}
        </p>

        {onCancel && (
          <button
            type="button"
            className="sittingPaymentCancelButton"
            onClick={onCancel}
          >
            {translate(
              language,
              "Fermer"
            )}
          </button>
        )}
      </div>
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={elementsOptions}
    >
      <SittingPaymentFormContent
        paymentIntentID={
          paymentIntentID
        }
        language={language}
        onAuthorized={
          onAuthorized
        }
        onCancel={onCancel}
      />
    </Elements>
  )
}
