"use client"

import Link from "next/link"

import {
  useCallback,
  useEffect,
  useRef,
  useState
} from "react"

import {
  Html5Qrcode
} from "html5-qrcode"

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

import {
  configureCloudKit
} from "@/services/cloudkit"

import "./ScanQRCode.css"

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

type ScannedQRCode = {
  type: string
  rdvID: string
}

type Appointment = {
  id: string
  groomingID: string
  userID: string
  date: string | number
  serviceID: string
  collaborator: string
  phoneNumber: string
  duration: number
  stripePaymentIntentID: string
  stripeTransferID: string
  paymentStatus: PaymentStatus
}

type ScanResponse = {
  success: boolean
  action:
    | "authorize_payment"
    | "wait_for_payment"
    | "sitting_started"
    | "capture_and_transfer"
    | "wait_for_transfer"
    | "already_completed"
    | "canceled"
    | "payment_failed"
    | "refunded"
    | "invalid_status"

  scanType?: "start" | "end"
  rdvID: string
  paymentIntentID?: string
  paymentStatus: PaymentStatus
  alreadyProcessed?: boolean
  message?: string
}

type CaptureResponse = {
  success: boolean
  alreadyProcessed?: boolean
  paymentIntentID: string
  chargeID: string
  transferID: string
  totalAmount: number
  commissionAmount: number
  commissionRate: number
  sitterAmount: number
  currency: string
  message?: string
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001"

const QR_READER_ID =
  "zoove-qr-reader"

async function parseResponse<T>(
  response: Response
): Promise<T> {
  const rawResponse =
    await response.text()

  let result: any = null

  try {
    result =
      rawResponse
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

async function fetchAppointment(
  rdvID: string,
  signal?: AbortSignal
): Promise<Appointment> {
  const response =
    await fetch(
      `${API_URL}/api/rdv/${encodeURIComponent(
        rdvID
      )}`,
      {
        method: "GET",
        cache: "no-store",
        signal
      }
    )

  const result =
    await parseResponse<any>(
      response
    )

  const appointment =
    result?.appointment ??
    result?.rdv ??
    result

  return {
    id:
      String(
        appointment?.id ??
        rdvID
      ),

    groomingID:
      String(
        appointment
          ?.groomingID ?? ""
      ),

    userID:
      String(
        appointment
          ?.userID ?? ""
      ),

    date:
      appointment?.date ?? "",

    serviceID:
      String(
        appointment
          ?.serviceID ?? ""
      ),

    collaborator:
      String(
        appointment
          ?.collaborator ?? ""
      ),

    phoneNumber:
      String(
        appointment
          ?.phoneNumber ?? ""
      ),

    duration:
      Number(
        appointment
          ?.duration ?? 0
      ),

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
          ?.paymentStatus ??
        "pending"
      ) as PaymentStatus
  }
}

async function sendScan(
  rdvID: string,
  sitterID: string
): Promise<ScanResponse> {
  const response =
    await fetch(
      `${API_URL}/stripe/sitting/scan`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          rdvID,
          sitterID
        })
      }
    )

  return parseResponse<ScanResponse>(
    response
  )
}

async function captureAndTransfer(
  rdvID: string,
  paymentIntentID: string
): Promise<CaptureResponse> {
  const response =
    await fetch(
      `${API_URL}/stripe/sitting/capture-and-transfer`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          rdvID,
          paymentIntentID
        })
      }
    )

  return parseResponse<CaptureResponse>(
    response
  )
}

function extractArrivalTime(
  serviceID: string
): string | null {
  const match =
    /HEURE_ARRIVEE\((\d{2}:\d{2})\)/
      .exec(serviceID)

  return match?.[1] ?? null
}

function hasDepartureTime(
  serviceID: string
): boolean {
  return serviceID.includes(
    "HEURE_DEPART("
  )
}

function currentTimeString(): string {
  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }
  ).format(new Date())
}

function calculateDurationMinutes(
  arrivalTime: string
): number {
  const [
    arrivalHour,
    arrivalMinute
  ] =
    arrivalTime
      .split(":")
      .map(Number)

  if (
    !Number.isInteger(arrivalHour) ||
    !Number.isInteger(arrivalMinute)
  ) {
    return 0
  }

  const now =
    new Date()

  const arrival =
    new Date(now)

  arrival.setHours(
    arrivalHour,
    arrivalMinute,
    0,
    0
  )

  /*
   * Cas d’une garde traversant minuit :
   * arrivée 23:00, départ 01:00.
   */
  if (
    arrival.getTime() >
    now.getTime()
  ) {
    arrival.setDate(
      arrival.getDate() - 1
    )
  }

  return Math.max(
    0,
    Math.floor(
      (
        now.getTime() -
        arrival.getTime()
      ) /
      60_000
    )
  )
}

async function updateRDVFields(
  rdvID: string,
  updates: {
    serviceID?: string
    duration?: number
    paymentStatus?: PaymentStatus
    stripeTransferID?: string
  }
): Promise<void> {
  const database =
    await configureCloudKit()

  const response =
    await database.fetchRecords([
      rdvID
    ])

  const record =
    response.records?.find(
      (item: any) =>
        item.recordName === rdvID &&
        !item.serverErrorCode
    )

  if (!record) {
    throw new Error(
      "Rendez-vous CloudKit introuvable."
    )
  }

  const fields = {
    ...record.fields
  }

  if (
    updates.serviceID !==
    undefined
  ) {
    fields.serviceID = {
      value:
        updates.serviceID,
      type:
        "STRING"
    }
  }

  if (
    updates.duration !==
    undefined
  ) {
    fields.duration = {
      value:
        updates.duration,
      type:
        "INT64"
    }
  }

  if (
    updates.paymentStatus !==
    undefined
  ) {
    fields.paymentStatus = {
      value:
        updates.paymentStatus,
      type:
        "STRING"
    }
  }

  if (
    updates.stripeTransferID !==
    undefined
  ) {
    fields.stripeTransferID = {
      value:
        updates.stripeTransferID,
      type:
        "STRING"
    }
  }

  const saveResponse =
    await database.saveRecords([
      {
        ...record,
        fields
      }
    ])

  const savedRecord =
    saveResponse.records?.find(
      (item: any) =>
        !item.serverErrorCode
    )

  if (!savedRecord) {
    throw new Error(
      "Impossible de mettre à jour le rendez-vous."
    )
  }
}

export default function ScanQRCodePage() {
  const {
    session,
    loading
  } = useAuth()

  const {
    language
  } = useLanguage()

  const scannerRef =
    useRef<Html5Qrcode | null>(
      null
    )

  const pollingRef =
    useRef<number | null>(
      null
    )

  const isProcessingRef =
    useRef(false)

  const [
    isScannerStarted,
    setIsScannerStarted
  ] = useState(false)

  const [
    isProcessing,
    setIsProcessing
  ] = useState(false)

  const [
    isWaitingForPayment,
    setIsWaitingForPayment
  ] = useState(false)

  const [
    successMessage,
    setSuccessMessage
  ] = useState("")

  const [
    errorMessage,
    setErrorMessage
  ] = useState("")

  const [
    statusMessage,
    setStatusMessage
  ] = useState("")

  const [
    currentAppointment,
    setCurrentAppointment
  ] = useState<Appointment | null>(
    null
  )

  const stopPolling =
    useCallback(() => {
      if (
        pollingRef.current !== null
      ) {
        window.clearInterval(
          pollingRef.current
        )

        pollingRef.current =
          null
      }
    }, [])

  const stopScanner =
    useCallback(async () => {
      const scanner =
        scannerRef.current

      if (!scanner) {
        return
      }

      try {
        if (
          scanner.getState() === 2 ||
          scanner.getState() === 3
        ) {
          await scanner.stop()
        }

        await scanner.clear()
      } catch (error) {
        console.warn(
          "Impossible d'arrêter le scanner :",
          error
        )
      } finally {
        scannerRef.current =
          null

        setIsScannerStarted(false)
      }
    }, [])

  const completeFirstScan =
    useCallback(
      async (
        appointment: Appointment
      ) => {
        const currentServiceID =
          appointment.serviceID

        if (
          extractArrivalTime(
            currentServiceID
          )
        ) {
          setIsWaitingForPayment(false)

          setSuccessMessage(
            translate(
              language,
              "Le paiement est autorisé. La garde commence."
            )
          )

          stopPolling()
          return
        }

        const arrivalTime =
          currentTimeString()

        const updatedServiceID =
          `${currentServiceID}` +
          `-HEURE_ARRIVEE(${arrivalTime})`

        await updateRDVFields(
          appointment.id,
          {
            serviceID:
              updatedServiceID,

            paymentStatus:
              "in_progress"
          }
        )

        setCurrentAppointment({
          ...appointment,
          serviceID:
            updatedServiceID,
          paymentStatus:
            "in_progress"
        })

        setIsWaitingForPayment(false)
        setStatusMessage("")

        setSuccessMessage(
          translate(
            language,
            "Le paiement est autorisé. La garde commence."
          ) +
          ` ${arrivalTime}`
        )

        stopPolling()
      },
      [
        language,
        stopPolling
      ]
    )

  const startPaymentPolling =
    useCallback(
      (
        rdvID: string,
        sitterID: string
      ) => {
        stopPolling()

        setIsWaitingForPayment(true)

        setStatusMessage(
          translate(
            language,
            "En attente de la validation du paiement par le propriétaire."
          )
        )

        const refreshStatus =
          async () => {
            try {
              const appointment =
                await fetchAppointment(
                  rdvID
                )

              console.log(
                "🔄 Polling scan web :",
                {
                  rdvID:
                    appointment.id,

                  paymentStatus:
                    appointment
                      .paymentStatus,

                  serviceID:
                    appointment
                      .serviceID
                }
              )

              if (
                appointment.groomingID !==
                sitterID
              ) {
                stopPolling()

                throw new Error(
                  translate(
                    language,
                    "Ce rendez-vous ne vous appartient pas."
                  )
                )
              }

              setCurrentAppointment(
                appointment
              )

              if (
                appointment
                  .paymentStatus ===
                "in_progress"
              ) {
                await completeFirstScan(
                  appointment
                )

                return
              }

              if (
                appointment
                  .paymentStatus ===
                "failed"
              ) {
                stopPolling()

                setIsWaitingForPayment(
                  false
                )

                setErrorMessage(
                  translate(
                    language,
                    "Le paiement n'a pas pu être autorisé."
                  )
                )
              }

              if (
                appointment
                  .paymentStatus ===
                "canceled"
              ) {
                stopPolling()

                setIsWaitingForPayment(
                  false
                )

                setErrorMessage(
                  translate(
                    language,
                    "Ce rendez-vous a été annulé."
                  )
                )
              }
            } catch (error) {
              console.error(
                "Erreur polling du paiement :",
                error
              )
            }
          }

        void refreshStatus()

        pollingRef.current =
          window.setInterval(
            () => {
              void refreshStatus()
            },
            2000
          )
      },
      [
        completeFirstScan,
        language,
        stopPolling
      ]
    )

  const handleSecondScan =
    useCallback(
      async (
        appointment: Appointment
      ) => {
        if (
          appointment.paymentStatus !==
          "in_progress"
        ) {
          throw new Error(
            translate(
              language,
              "La garde ne peut pas encore être terminée."
            )
          )
        }

        const paymentIntentID =
          appointment
            .stripePaymentIntentID
            .trim()

        if (!paymentIntentID) {
          throw new Error(
            translate(
              language,
              "Aucun paiement Stripe n'est associé à cette garde."
            )
          )
        }

        const arrivalTime =
          extractArrivalTime(
            appointment.serviceID
          )

        if (!arrivalTime) {
          throw new Error(
            translate(
              language,
              "L'heure de début de la garde est introuvable."
            )
          )
        }

        setStatusMessage(
          translate(
            language,
            "Paiement et transfert en cours..."
          )
        )

        const captureResult =
          await captureAndTransfer(
            appointment.id,
            paymentIntentID
          )

        const departureTime =
          currentTimeString()

        const durationMinutes =
          calculateDurationMinutes(
            arrivalTime
          )

        let updatedServiceID =
          appointment.serviceID

        if (
          !hasDepartureTime(
            updatedServiceID
          )
        ) {
          updatedServiceID +=
            `-HEURE_DEPART(${departureTime})`
        }

        await updateRDVFields(
          appointment.id,
          {
            serviceID:
              updatedServiceID,

            duration:
              durationMinutes,

            paymentStatus:
              "transferred",

            stripeTransferID:
              captureResult
                .transferID
          }
        )

        setCurrentAppointment({
          ...appointment,

          serviceID:
            updatedServiceID,

          duration:
            durationMinutes,

          paymentStatus:
            "transferred",

          stripeTransferID:
            captureResult
              .transferID
        })

        setStatusMessage("")

        setSuccessMessage(
          translate(
            language,
            "Garde terminée. Le paiement a été effectué."
          )
        )
      },
      [
        language
      ]
    )

  const processDecodedText =
    useCallback(
      async (
        decodedText: string
      ) => {
        if (
          isProcessingRef.current
        ) {
          return
        }

        isProcessingRef.current =
          true

        setIsProcessing(true)
        setErrorMessage("")
        setSuccessMessage("")
        setStatusMessage("")

        try {
          let qrData:
            ScannedQRCode

          try {
            qrData =
              JSON.parse(
                decodedText
              ) as ScannedQRCode
          } catch {
            throw new Error(
              translate(
                language,
                "Ce QR code n'est pas valide."
              )
            )
          }

          if (
            qrData.type !==
              "zoove_sitting" ||
            !qrData.rdvID
          ) {
            throw new Error(
              translate(
                language,
                "Ce QR code ne correspond pas à une garde Zoove."
              )
            )
          }

          const sitterID =
            String(
              session?.user?.id ?? ""
            )

          if (!sitterID) {
            throw new Error(
              translate(
                language,
                "Vous devez être connecté."
              )
            )
          }

          /*
           * On arrête la caméra après un scan
           * afin d'éviter plusieurs appels.
           */
          await stopScanner()

          const appointment =
            await fetchAppointment(
              qrData.rdvID
            )

          if (
            appointment.groomingID !==
            sitterID
          ) {
            throw new Error(
              translate(
                language,
                "Ce rendez-vous ne vous appartient pas."
              )
            )
          }

          if (
            !appointment.serviceID
              .startsWith("Sitting-")
          ) {
            throw new Error(
              translate(
                language,
                "Ce QR code ne correspond pas à une garde."
              )
            )
          }

          setCurrentAppointment(
            appointment
          )

          const arrivalTime =
            extractArrivalTime(
              appointment.serviceID
            )

          /*
           * Deuxième scan :
           * l'heure d'arrivée existe déjà.
           */
          if (arrivalTime) {
            await handleSecondScan(
              appointment
            )

            return
          }

          /*
           * Premier scan :
           * le backend passe le RDV
           * à awaiting_payment.
           */
          const scanResult =
            await sendScan(
              appointment.id,
              sitterID
            )

          console.log(
            "📷 Résultat du scan :",
            scanResult
          )

          if (
            scanResult.action ===
              "authorize_payment" ||
            scanResult.action ===
              "wait_for_payment"
          ) {
            startPaymentPolling(
              appointment.id,
              sitterID
            )

            return
          }

          if (
            scanResult.action ===
            "sitting_started"
          ) {
            const refreshedAppointment =
              await fetchAppointment(
                appointment.id
              )

            await completeFirstScan(
              refreshedAppointment
            )

            return
          }

          if (
            scanResult.action ===
            "already_completed"
          ) {
            setSuccessMessage(
              translate(
                language,
                "Cette garde est déjà terminée."
              )
            )

            return
          }

          throw new Error(
            scanResult.message ??
            translate(
              language,
              "Impossible de traiter le QR code."
            )
          )
        } catch (error) {
          console.error(
            "Erreur scan QR code :",
            error
          )

          setErrorMessage(
            error instanceof Error
              ? error.message
              : translate(
                  language,
                  "Impossible de traiter le QR code."
                )
          )
        } finally {
          setIsProcessing(false)
          isProcessingRef.current =
            false
        }
      },
      [
        completeFirstScan,
        handleSecondScan,
        language,
        session?.user?.id,
        startPaymentPolling,
        stopScanner
      ]
    )

  const startScanner =
    useCallback(async () => {
      if (
        isScannerStarted ||
        isProcessing
      ) {
        return
      }

      setErrorMessage("")
      setSuccessMessage("")

      try {
        const scanner =
          new Html5Qrcode(
            QR_READER_ID
          )

        scannerRef.current =
          scanner

        const cameras =
          await Html5Qrcode
            .getCameras()

        if (cameras.length === 0) {
          throw new Error(
            translate(
              language,
              "Aucune caméra n'est disponible."
            )
          )
        }

        const preferredCamera =
          cameras.find(
            camera =>
              /back|rear|environment/i
                .test(
                  camera.label
                )
          ) ??
          cameras[0]

        await scanner.start(
          preferredCamera.id,
          {
            fps: 10,

            qrbox: {
              width: 250,
              height: 250
            },

            aspectRatio:
              1
          },
          decodedText => {
            void processDecodedText(
              decodedText
            )
          },
          () => {
            /*
             * Les erreurs de lecture courantes
             * sont ignorées pendant le scan.
             */
          }
        )

        setIsScannerStarted(
          true
        )
      }  catch (error) {
          console.error(
            "Erreur caméra QR :",
            error
          )

          scannerRef.current = null
          setIsScannerStarted(false)

          const message =
            error instanceof Error
              ? error.message
              : ""

          if (
            message.includes(
              "not allowed"
            ) ||
            message.includes(
              "Permission"
            ) ||
            message.includes(
              "NotAllowedError"
            )
          ) {
            setErrorMessage(
              translate(
                language,
                "L'accès à la caméra est refusé. Autorisez la caméra dans les réglages du navigateur ou importez une image du QR code."
              )
            )

            return
          }

          setErrorMessage(
            translate(
              language,
              "Impossible d'ouvrir la caméra."
            )
          )
        }
    }, [
      isProcessing,
      isScannerStarted,
      language,
      processDecodedText
    ])

  const handleImageFile =
    async (
      event:
        React.ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target.files?.[0]

      event.target.value =
        ""

      if (!file) {
        return
      }

      try {
        await stopScanner()

        const scanner =
          new Html5Qrcode(
            QR_READER_ID
          )

        scannerRef.current =
          scanner

        const decodedText =
          await scanner.scanFile(
            file,
            true
          )

        await scanner.clear()

        scannerRef.current =
          null

        await processDecodedText(
          decodedText
        )
      } catch (error) {
        console.error(
          "Erreur lecture image QR :",
          error
        )

        setErrorMessage(
          translate(
            language,
            "Aucun QR code valide n'a été trouvé dans cette image."
          )
        )
      }
    }

  useEffect(() => {
    return () => {
      stopPolling()
      void stopScanner()
    }
  }, [
    stopPolling,
    stopScanner
  ])

  if (loading) {
    return (
      <main className="scanQRCodePage">
        <p>
          {translate(
            language,
            "Chargement..."
          )}
        </p>
      </main>
    )
  }

  if (
    !session ||
    session.accountType !==
      "sitter"
  ) {
    return (
      <main className="scanQRCodePage">
        <Link
          href="/professional-agenda"
          className="scanQRCodeBackButton"
        >
          ←
        </Link>

        <p>
          {translate(
            language,
            "Cette page est réservée aux pet sitters."
          )}
        </p>
      </main>
    )
  }

  return (
    <main className="scanQRCodePage">
      <div className="scanQRCodeHeader">
        <Link
          href="/professional-agenda"
          className="scanQRCodeBackButton"
        >
          ←
        </Link>

        <div>
          <h1>
            {translate(
              language,
              "Scanner un QR code"
            )}
          </h1>

          <p>
            {translate(
              language,
              "Scannez le QR code du propriétaire au début et à la fin de la garde."
            )}
          </p>
        </div>
      </div>

      <section className="scanQRCodeCard">
        <div
          id={QR_READER_ID}
          className="scanQRCodeReader"
        />

        {!isScannerStarted &&
          !isWaitingForPayment &&
          !successMessage && (
            <button
              type="button"
              className="scanQRCodePrimaryButton"
              disabled={
                isProcessing
              }
              onClick={() => {
                void startScanner()
              }}
            >
              {translate(
                language,
                "Ouvrir la caméra"
              )}
            </button>
          )}

        {isScannerStarted && (
          <button
            type="button"
            className="scanQRCodeSecondaryButton"
            onClick={() => {
              void stopScanner()
            }}
          >
            {translate(
              language,
              "Arrêter la caméra"
            )}
          </button>
        )}

        {!isWaitingForPayment &&
          !successMessage && (
            <label className="scanQRCodeFileButton">
              {translate(
                language,
                "Importer une image du QR code"
              )}

              <input
                type="file"
                accept="image/*"
                onChange={
                  handleImageFile
                }
              />
            </label>
          )}

        {isProcessing && (
          <div className="scanQRCodeStatus">
            <span className="scanQRCodeSpinner" />

            <p>
              {translate(
                language,
                "Traitement du QR code..."
              )}
            </p>
          </div>
        )}

        {isWaitingForPayment && (
          <div className="scanQRCodeWaiting">
            <span className="scanQRCodeSpinner" />

            <h2>
              {translate(
                language,
                "En attente de validation"
              )}
            </h2>

            <p>
              {translate(
                language,
                "Le propriétaire doit autoriser le paiement Stripe avant le début de la garde."
              )}
            </p>
          </div>
        )}

        {statusMessage &&
          !isWaitingForPayment && (
            <p className="scanQRCodeInformation">
              {statusMessage}
            </p>
          )}

        {errorMessage && (
          <div
            className="scanQRCodeError"
            role="alert"
          >
            <p>
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() => {
                setErrorMessage("")
                setCurrentAppointment(
                  null
                )
              }}
            >
              {translate(
                language,
                "Réessayer"
              )}
            </button>
          </div>
        )}

        {successMessage && (
          <div className="scanQRCodeSuccess">
            <div
              className="scanQRCodeSuccessIcon"
              aria-hidden="true"
            >
              ✓
            </div>

            <h2>
              {successMessage}
            </h2>

            {currentAppointment && (
              <p>
                {translate(
                  language,
                  "Rendez-vous"
                )}
                {" : "}
                {currentAppointment.id}
              </p>
            )}

            <button
              type="button"
              className="scanQRCodePrimaryButton"
              onClick={() => {
                setSuccessMessage("")
                setErrorMessage("")
                setStatusMessage("")
                setCurrentAppointment(
                  null
                )
              }}
            >
              {translate(
                language,
                "Scanner un autre QR code"
              )}
            </button>
          </div>
        )}
      </section>
    </main>
  )
}
