"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  useEffect,
  useMemo,
  useState
} from "react"

import {
  Appointment,
  cancelAppointment,
  fetchAppointmentById
} from "@/services/appointments"
import {
  fetchProfessional
} from "@/services/fetchProfessionalById"
import { useAuth } from "@/context/AuthContext"
import {
  useLanguage,
  type Language
} from "@/context/LanguageContext"
import { translate } from "@/translations/translations"

import "./AppointmentDetails.css"

type SittingDetails = {
  duration: number
  totalPrice: number
}

function localeForLanguage(
  language: Language
): string {
  switch (language) {
    case "fr":
      return "fr-FR"

    case "es":
      return "es-ES"

    case "it":
      return "it-IT"

    case "de":
      return "de-DE"

    case "pt":
      return "pt-PT"

    case "ar":
      return "ar"

    default:
      return "en-US"
  }
}

function parseSittingServiceID(
  serviceID: string
): SittingDetails | null {
  const match =
    /^Sitting-(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/.exec(
      serviceID.trim()
    )

  if (!match) {
    return null
  }

  const duration = Number(match[1])
  const totalPrice = Number(match[2])

  if (
    !Number.isFinite(duration) ||
    !Number.isFinite(totalPrice)
  ) {
    return null
  }

  return {
    duration,
    totalPrice
  }
}

export default function AppointmentClientPage({
  id
}: {
  id: string
}) {
  const router = useRouter()

  const { user } = useAuth()
  const { language } = useLanguage()

  const [appointment, setAppointment] =
    useState<Appointment | null>(null)
    const [
      professionalName,
      setProfessionalName
    ] = useState("")
  const [isLoading, setIsLoading] =
    useState(true)

  const [isDeleting, setIsDeleting] =
    useState(false)

  const [error, setError] =
    useState("")

  useEffect(() => {
    let cancelled = false

    const loadAppointment = async () => {
      try {
        setIsLoading(true)
        setError("")

        const result =
          await fetchAppointmentById(id)

        if (!cancelled) {
          setAppointment(result)
        }
      } catch (loadError) {
        console.error(
          "Erreur de chargement du rendez-vous :",
          loadError
        )

        if (!cancelled) {
          setError(
            "Impossible de charger le rendez-vous."
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadAppointment()

    return () => {
      cancelled = true
    }
  }, [id])
    
    useEffect(() => {
      let cancelled = false

      async function loadProfessional() {
        if (!appointment?.groomingID) {
          setProfessionalName("")
          return
        }

        try {
          const professional =
            await fetchProfessional(
              appointment.groomingID
            )

          if (!cancelled) {
            setProfessionalName(
              professional?.name ?? ""
            )
          }
        } catch (error) {
          console.error(
            "Erreur de chargement du professionnel :",
            error
          )

          if (!cancelled) {
            setProfessionalName("")
          }
        }
      }

      loadProfessional()

      return () => {
        cancelled = true
      }
    }, [appointment?.groomingID])

  const isOwner = useMemo(() => {
    return Boolean(
      appointment &&
      user &&
      appointment.userID === user.id
    )
  }, [appointment, user])

  const isPastAppointment = useMemo(() => {
    if (!appointment) {
      return false
    }

    return (
      appointment.date.getTime() <
      Date.now()
    )
  }, [appointment])

  const sittingDetails = useMemo(() => {
    if (!appointment) {
      return null
    }

    return parseSittingServiceID(
      appointment.serviceID
    )
  }, [appointment])

  const handleCancel = async () => {
    if (
      !appointment ||
      !isOwner ||
      isPastAppointment
    ) {
      return
    }

    const confirmed = window.confirm(
      translate(
        language,
        "Voulez-vous vraiment annuler ce rendez-vous ? Cette action est définitive."
      )
    )

    if (!confirmed) {
      return
    }

    try {
      setIsDeleting(true)
      setError("")

      await cancelAppointment(
        appointment.id
      )

      router.replace("/appointments")
      router.refresh()
    } catch (cancelError) {
      console.error(
        "Erreur complète d'annulation :",
        cancelError
      )

      setError(
        cancelError instanceof Error
          ? cancelError.message
          : "Impossible d'annuler le rendez-vous."
      )

      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="appointmentDetailsPage">
        <p>
          {translate(
            language,
            "Chargement..."
          )}
        </p>
      </main>
    )
  }

  if (!appointment) {
    return (
      <main className="appointmentDetailsPage">
        <Link
          href="/appointments"
          className="backButton"
        >
          ←
        </Link>

        <p>
          {translate(
            language,
            "Rendez-vous introuvable."
          )}
        </p>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="appointmentDetailsPage">
        <Link
          href="/appointments"
          className="backButton"
        >
          ←
        </Link>

        <p>
          {translate(
            language,
            "Vous devez être connecté."
          )}
        </p>
      </main>
    )
  }

  if (!isOwner) {
    return (
      <main className="appointmentDetailsPage">
        <Link
          href="/appointments"
          className="backButton"
        >
          ←
        </Link>

        <p>
          {translate(
            language,
            "Vous ne pouvez pas consulter ce rendez-vous."
          )}
        </p>
      </main>
    )
  }

  const locale =
    localeForLanguage(language)

  const formattedDate =
    appointment.date.toLocaleDateString(
      locale,
      {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
      }
    )

  const formattedTime =
    appointment.date.toLocaleTimeString(
      locale,
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    )

  return (
    <main className="appointmentDetailsPage">
      <div className="appointmentDetailsHeader">
        <Link
          href="/appointments"
          className="backButton"
        >
          ←
        </Link>

        <h1>
          <strong>
            {translate(
              language,
              "Détails du rendez-vous"
            )}
          </strong>
        </h1>
      </div>

      <div className="appointmentDetailsCard">
          <div className="appointmentField">
            <span className="appointmentFieldLabel">
              {translate(
                language,
                "Professionnel"
              )}
            </span>

            <strong>
              {professionalName ||
                translate(
                  language,
                  "Non renseigné"
                )}
            </strong>
          </div>

        <div className="appointmentField">
          <span className="appointmentFieldLabel">
            {translate(
              language,
              "Date"
            )}
          </span>

          <strong>
            {formattedDate}
          </strong>
        </div>

        <div className="appointmentField">
          <span className="appointmentFieldLabel">
            {translate(
              language,
              "Heure"
            )}
          </span>

          <strong>
            {formattedTime}
          </strong>
        </div>

        <div className="appointmentField">
          <span className="appointmentFieldLabel">
            {translate(
              language,
              "Téléphone"
            )}
          </span>

          <strong>
            {appointment.phoneNumber ||
              translate(
                language,
                "Non renseigné"
              )}
          </strong>
        </div>

        <div className="appointmentField">
          <span className="appointmentFieldLabel">
            {translate(
              language,
              "Collaborateur"
            )}
          </span>

          <strong>
            {appointment.collaborator ||
              translate(
                language,
                "Non renseigné"
              )}
          </strong>
        </div>

        <div className="appointmentField">
          <span className="appointmentFieldLabel">
            {translate(
              language,
              "Service"
            )}
          </span>

          <strong>
            {sittingDetails
              ? translate(
                  language,
                  "Garde"
                )
              : appointment.serviceID ||
                translate(
                  language,
                  "Non renseigné"
                )}
          </strong>
        </div>

        <div className="appointmentField">
          <span className="appointmentFieldLabel">
            {translate(
              language,
              "Durée"
            )}
          </span>

          <strong>
            {sittingDetails ? (
              <>
                {sittingDetails.duration}{" "}
                {sittingDetails.duration === 1
                  ? translate(
                      language,
                      "heure"
                    )
                  : translate(
                      language,
                      "heures"
                    )}
              </>
            ) : (
              <>
                {appointment.duration}{" "}
                {translate(
                  language,
                  "minutes"
                )}
              </>
            )}
          </strong>
        </div>

        {sittingDetails && (
          <div className="appointmentField">
            <span className="appointmentFieldLabel">
              {translate(
                language,
                "Prix"
              )}
            </span>

            <strong>
              {sittingDetails.totalPrice.toFixed(
                2
              )}{" "}
              €
            </strong>
          </div>
        )}

        <div className="appointmentField">
          <span className="appointmentFieldLabel">
            {translate(
              language,
              "Statut"
            )}
          </span>

          <strong>
            {isPastAppointment
              ? translate(
                  language,
                  "Terminé"
                )
              : translate(
                  language,
                  "Confirmé"
                )}
          </strong>
        </div>

        {isPastAppointment && (
          <p className="appointmentInformation">
            {translate(
              language,
              "Ce rendez-vous est terminé et ne peut plus être annulé."
            )}
          </p>
        )}

        {error && (
          <p className="appointmentError">
            {translate(
              language,
              error
            )}
          </p>
        )}

        {!isPastAppointment && (
          <div className="appointmentActions">
            <button
              type="button"
              className="cancelAppointmentButton"
              disabled={isDeleting}
              onClick={handleCancel}
            >
              {isDeleting
                ? translate(
                    language,
                    "Annulation..."
                  )
                : translate(
                    language,
                    "Annuler le rendez-vous"
                  )}
            </button>
          </div>
        )}
          
          <Link href={`/appointments/${appointment.id}/qrcode`}
          className="generateQRCodeButton">
          {translate(
                     language,
                     "Générer le QR code"
                     )}
          </Link>
      </div>
    </main>
  )
}
