"use client"

import {
  useEffect,
  useRef,
  useState
} from "react"

import {
  useParams
} from "next/navigation"

import QRCode from "qrcode"

import {
  useAuth
} from "@/context/AuthContext"

import {
  useLanguage,
  type Language
} from "@/context/LanguageContext"

import {
  translate
} from "@/translations/translations"

import SittingPaymentForm from "@/components/SittingPaymentForm"
import "./qrcode.css"

type PaymentStatus =
  | ""
  | "pending"
  | "awaiting_payment"
  | "authorized"
  | "in_progress"
  | "captured"
  | "transferred"
  | "canceled"
  | "failed"
  | "refunded"

type Appointment = {
  id: string
  groomingID: string
  userID: string
  date: string | number
  serviceID: string
  collaborator: string
  phoneNumber: string
  stripePaymentIntentID: string
  stripeTransferID: string
  paymentStatus: PaymentStatus
}

type Professional = {
  id: string
  type: string
  name: string
  devise: string
  price: number
  package: number
  stripeAccountID: string
}

async function fetchAppointment(
  apiURL: string,
  rdvID: string,
  signal?: AbortSignal
): Promise<Appointment> {
  const response = await fetch(
    `${apiURL}/api/rdv/${encodeURIComponent(
      rdvID
    )}`,
    {
      method: "GET",
      cache: "no-store",
      signal
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
      "Impossible de récupérer le rendez-vous."
    )
  }

  const appointment =
    result?.appointment ??
    result?.rdv ??
    result

  return {
    ...appointment,

    stripePaymentIntentID:
      String(
        appointment
          ?.stripePaymentIntentID ?? ""
      ),

    stripeTransferID:
      String(
        appointment
          ?.stripeTransferID ?? ""
      ),

    paymentStatus:
      String(
        appointment
          ?.paymentStatus ?? "pending"
      ) as PaymentStatus
  }
}

async function fetchProfessional(
  apiURL: string,
  professionalID: string,
  signal?: AbortSignal
): Promise<Professional> {
  const response = await fetch(
    `${apiURL}/api/professionals/${encodeURIComponent(
      professionalID
    )}`,
    {
      method: "GET",
      cache: "no-store",
      signal
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
      result?.error ??
      result?.message ??
      rawResponse ??
      "Impossible de récupérer le pet sitter."
    )
  }

  const professional =
    result?.professional ??
    result

  return {
    id: String(
      professional?.id ?? ""
    ),

    type: String(
      professional?.type ?? ""
    ),

    name: String(
      professional?.name ?? ""
    ),

    devise: String(
      professional?.devise ?? "EUR"
    ),

    price: Number(
      professional?.price ?? 0
    ),

    package: Number(
      professional?.package ?? 0
    ),

    stripeAccountID: String(
      professional?.stripeAccountID ?? ""
    )
  }
}

function currencyToISO(
  currency: string
): string {
  const normalized =
    String(currency)
      .trim()
      .toUpperCase()

  const currencies:
    Record<string, string> = {
      "€": "EUR",
      EUR: "EUR",
      "$": "USD",
      USD: "USD",
      "£": "GBP",
      GBP: "GBP",
      CAD: "CAD",
      AUD: "AUD"
    }

  return currencies[normalized] ?? "EUR"
}

export default function QRCodePage() {
    
    const [
      showPaymentForm,
      setShowPaymentForm
    ] = useState(false)
    
    const [
      sitterStripeAccountID,
      setSitterStripeAccountID
    ] = useState("")

    const [
      sitterPackage,
      setSitterPackage
    ] = useState(0)

    const [
      sitterCurrency,
      setSitterCurrency
    ] = useState("EUR")
    
    const previousPaymentStatus =
      useRef<PaymentStatus | null>(null)
    
  const params =
    useParams<{
      id: string
    }>()

  const rdvID =
    String(params.id ?? "")

  const {
    user
  } = useAuth()

  const {
    language
  } = useLanguage()

  const [
    appointment,
    setAppointment
  ] = useState<Appointment | null>(
    null
  )

  const [
    qrCode,
    setQRCode
  ] = useState("")

  const [
    qrError,
    setQrError
  ] = useState("")

  const [
    statusMessage,
    setStatusMessage
  ] = useState(
    translate(
      language,
      "Préparation du QR code..."
    )
  )

  const [
    isAuthorizingPayment,
    setIsAuthorizingPayment
  ] = useState(false)

    const apiURL =
      process.env.NEXT_PUBLIC_API_URL ??
      "http://localhost:3001"

  /*
   * Charge le RDV et génère le QR.
   * Cette partie ne recommence que si
   * l'utilisateur ou l'identifiant change.
   */
  useEffect(() => {
    if (!user?.id || !rdvID) {
      return
    }

    const controller =
      new AbortController()

    let cancelled = false

    async function prepareQRCode() {
      try {
        setQrError("")

        setStatusMessage(
          translate(
            language,
            "Chargement du rendez-vous..."
          )
        )

        console.time(
          "fetchAppointment"
        )

        const loadedAppointment =
          await fetchAppointment(
            apiURL,
            rdvID,
            controller.signal
          )
          
          const professional =
            await fetchProfessional(
              apiURL,
              loadedAppointment.groomingID,
              controller.signal
            )

          if (cancelled) {
            return
          }

          if (!professional.stripeAccountID) {
            throw new Error(
              translate(
                language,
                "Le pet sitter n'a pas configuré Stripe."
              )
            )
          }

          setSitterStripeAccountID(
            professional.stripeAccountID
          )

          setSitterPackage(
            professional.package
          )

          setSitterCurrency(
            professional.devise || "EUR"
          )

        console.timeEnd(
          "fetchAppointment"
        )

        if (cancelled) {
          return
        }
          
          if (!user) {
            throw new Error(
              translate(
                language,
                "Vous devez être connecté."
              )
            )
          }

        if (
          loadedAppointment.userID !==
          user.id
        ) {
          throw new Error(
            translate(
              language,
              "Ce rendez-vous ne vous appartient pas."
            )
          )
        }

        if (
          !loadedAppointment.serviceID
            .startsWith("Sitting-")
        ) {
          throw new Error(
            translate(
              language,
              "Ce QR code est réservé aux gardes."
            )
          )
        }

        if (
          loadedAppointment
            .paymentStatus ===
          "canceled"
        ) {
          throw new Error(
            translate(
              language,
              "Ce rendez-vous a été annulé."
            )
          )
        }

        setAppointment(
          loadedAppointment
        )

        /*
         * Le QR contient uniquement
         * les informations nécessaires
         * pour retrouver le RDV.
         */
        const qrData = {
          type:
            "zoove_sitting",

          rdvID:
            loadedAppointment.id ||
            rdvID
        }

        console.time(
          "generateQRCode"
        )

        const generatedQRCode =
          await QRCode.toDataURL(
            JSON.stringify(
              qrData
            ),
            {
              errorCorrectionLevel:
                "M",

              width:
                320,

              margin:
                1
            }
          )

        console.timeEnd(
          "generateQRCode"
        )

        if (!cancelled) {
          setQRCode(
            generatedQRCode
          )

          setStatusMessage("")
        }
      } catch (error) {
        if (
          cancelled ||
          (
            error instanceof DOMException &&
            error.name === "AbortError"
          )
        ) {
          return
        }

        console.error(
          "Erreur préparation QR code :",
          error
        )

        setQRCode("")
        setStatusMessage("")

        setQrError(
          error instanceof Error
            ? error.message
            : translate(
                language,
                "Impossible de générer le QR code."
              )
        )
      }
    }

    void prepareQRCode()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [
    apiURL,
    user?.id,
    rdvID,
    language
  ])

  /*
   * Polling :
   * recharge le RDV toutes les 2 secondes.
   *
   * Cela permet de détecter le premier scan
   * effectué par le pet sitter.
   */
  useEffect(() => {
    if (
      !user?.id ||
      !rdvID ||
      qrError
    ) {
      return
    }

    let cancelled = false
    let currentController:
      AbortController | null = null

    const refreshAppointment =
      async () => {
        currentController?.abort()

        currentController =
          new AbortController()

        try {
          const refreshedAppointment =
            await fetchAppointment(
              apiURL,
              rdvID,
              currentController.signal
            )
            
            console.log(
              "🔄 Polling RDV :",
              {
                rdvID:
                  refreshedAppointment.id,

                paymentStatus:
                  refreshedAppointment
                    .paymentStatus,

                stripePaymentIntentID:
                  refreshedAppointment
                    .stripePaymentIntentID,

                stripeTransferID:
                  refreshedAppointment
                    .stripeTransferID,

                date:
                  new Date()
                    .toLocaleTimeString()
              }
            )

          if (cancelled) {
            return
          }

          if (
            refreshedAppointment.userID !==
            user.id
          ) {
            return
          }
            
            if (
              previousPaymentStatus.current !==
              refreshedAppointment.paymentStatus
            ) {
              console.log(
                "💳 Statut modifié :",
                previousPaymentStatus.current,
                "→",
                refreshedAppointment.paymentStatus
              )

              previousPaymentStatus.current =
                refreshedAppointment.paymentStatus
            }

          setAppointment(
            refreshedAppointment
          )

          /*
           * Le QR n'a plus besoin d'être
           * affiché après la fin de la garde.
           */
          if (
            refreshedAppointment
              .paymentStatus ===
            "transferred"
          ) {
            setQRCode("")
          }
        } catch (error) {
          if (
            error instanceof DOMException &&
            error.name === "AbortError"
          ) {
            return
          }

          console.error(
            "Erreur actualisation du statut du RDV :",
            error
          )
        }
      }

    /*
     * Vérification immédiate,
     * puis toutes les deux secondes.
     */
    void refreshAppointment()

    const intervalID =
      window.setInterval(
        () => {
          void refreshAppointment()
        },
        2000
      )

    return () => {
      cancelled = true

      window.clearInterval(
        intervalID
      )

      currentController?.abort()
    }
  }, [
    apiURL,
    user?.id,
    rdvID,
    qrError
  ])

  /*
   * Cette fonction sera branchée
   * sur Stripe Elements / Payment Element.
   */
    const handleAuthorizePayment = () => {
      setShowPaymentForm(true)
    }

  if (!user) {
    return (
      <main className="qrCodePage">
        <p>
          {translate(
            language,
            "Vous devez être connecté pour afficher ce QR code."
          )}
        </p>
      </main>
    )
  }

  const paymentStatus =
    appointment?.paymentStatus ??
    "pending"

  return (
    <main
      className="qrCodePage"
      style={{
        display:
          "flex",

        minHeight:
          "100vh",

        padding:
          "40px 20px",

        flexDirection:
          "column",

        alignItems:
          "center",

        justifyContent:
          "center",

        textAlign:
          "center"
      }}
    >
      <h1>
        {translate(
          language,
          "QR Code"
        )}
      </h1>

      {(
        paymentStatus === "pending" ||
        paymentStatus === ""
      ) && (
        <>
          <p>
            {translate(
              language,
              "Présente ce QR code au pet sitter pour démarrer la garde."
            )}
          </p>

          <p>
            {translate(
              language,
              "En attente du premier scan du pet sitter."
            )}
          </p>
        </>
      )}

      {paymentStatus ===
        "awaiting_payment" && (
        <div className="stripeAuthorizationCard">
          <h2>
            {translate(
              language,
              "Autorisation du paiement requise"
            )}
          </h2>

          <p>
            {translate(
              language,
              "Le pet sitter a scanné le QR code. Autorisez maintenant le paiement pour commencer la garde."
            )}
          </p>

          <button
            type="button"
            className="stripeAuthorizeButton"
            disabled={
              isAuthorizingPayment
            }
            onClick={
              handleAuthorizePayment
            }
          >
            {isAuthorizingPayment
              ? translate(
                  language,
                  "Préparation du paiement..."
                )
              : translate(
                  language,
                  "Autoriser le paiement"
                )}
          </button>
        </div>
      )}
          
          {showPaymentForm &&
            appointment && (
              <div
                className="sittingPaymentOverlay"
                role="dialog"
                aria-modal="true"
              >
                <div className="sittingPaymentModal">
                  <button
                    type="button"
                    className="sittingPaymentModalClose"
                    onClick={() =>
                      setShowPaymentForm(false)
                    }
                    aria-label={translate(
                      language,
                      "Fermer"
                    )}
                  >
                    ×
                  </button>

                  <h2>
                    {translate(
                      language,
                      "Autoriser le paiement"
                    )}
                  </h2>

                  <p>
                    {translate(
                      language,
                      "Le montant sera autorisé maintenant puis débité à la fin de la garde."
                    )}
                  </p>

                    <SittingPaymentForm
                      rdvID={appointment.id}
                      ownerID={appointment.userID}
                      sitterID={appointment.groomingID}
                      totalAmount={
                        Number(
                          appointment.serviceID
                            .split("-")[2] ?? 0
                        )
                      }
                      currency={currencyToISO(
                        sitterCurrency
                      )}
                      sitterPackage={sitterPackage}
                      stripeAccountID={
                        sitterStripeAccountID
                      }
                      language={language}
                      onAuthorized={() => {
                        console.log(
                          "✅ Paiement autorisé"
                        )

                        setShowPaymentForm(false)

                        /*
                         * Le polling détectera :
                         * awaiting_payment → in_progress
                         */
                      }}
                      onCancel={() => {
                        setShowPaymentForm(false)
                      }}
                    />
                </div>
              </div>
            )}

      {(
        paymentStatus === "authorized" ||
        paymentStatus === "in_progress"
      ) && (
        <div className="sittingStatusCard sittingStatusCardSuccess">
          <h2>
            {translate(
              language,
              "Garde en cours"
            )}
          </h2>

          <p>
            {translate(
              language,
              "Le paiement est autorisé. Présentez de nouveau ce QR code au pet sitter à la fin de la garde."
            )}
          </p>
        </div>
      )}

      {paymentStatus ===
        "captured" && (
        <div className="sittingStatusCard">
          <h2>
            {translate(
              language,
              "Paiement en cours de traitement"
            )}
          </h2>

          <p>
            {translate(
              language,
              "Le paiement a été débité. Le transfert au pet sitter est en cours."
            )}
          </p>
        </div>
      )}

      {paymentStatus ===
        "transferred" && (
        <div className="sittingStatusCard sittingStatusCardSuccess">
          <h2>
            {translate(
              language,
              "Garde terminée"
            )}
          </h2>

          <p>
            {translate(
              language,
              "Le paiement a été effectué avec succès."
            )}
          </p>
        </div>
      )}

      {paymentStatus ===
        "failed" && (
        <div className="sittingStatusCard sittingStatusCardError">
          <h2>
            {translate(
              language,
              "Paiement échoué"
            )}
          </h2>

          <p>
            {translate(
              language,
              "Le paiement n'a pas pu être autorisé."
            )}
          </p>
        </div>
      )}

      {paymentStatus ===
        "canceled" && (
        <div className="sittingStatusCard sittingStatusCardError">
          <h2>
            {translate(
              language,
              "Rendez-vous annulé"
            )}
          </h2>
        </div>
      )}

      {qrError && (
        <p
          style={{
            maxWidth:
              "520px",

            color:
              "#c62828"
          }}
        >
          {qrError}
        </p>
      )}

      {statusMessage &&
        !qrError && (
          <p>
            {statusMessage}
          </p>
        )}

      {qrCode &&
        paymentStatus !==
          "transferred" &&
        paymentStatus !==
          "canceled" && (
          <img
            src={qrCode}
            alt={translate(
              language,
              "QR Code"
            )}
            width={350}
            height={350}
            style={{
              width:
                "min(350px, 90vw)",

              height:
                "auto",

              marginTop:
                "24px"
            }}
          />
        )}
    </main>
  )
}
