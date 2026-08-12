"use client"

import Link from "next/link"
import {
  useEffect,
  useMemo,
  useState
} from "react"

import { useAuth } from "@/context/AuthContext"
import {
  useLanguage,
  type Language
} from "@/context/LanguageContext"
import { translate } from "@/translations/translations"


import {
  Appointment,
  fetchUserAppointments
} from "@/services/appointments"

import "./Appointments.css"

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
    case "pt":
      return "pt"

    case "ar":
      return "ar"

    default:
      return "en-US"
  }
}

export default function AppointmentsPage() {
    const { session } = useAuth()

    const animal =
      session?.accountType === "animal"
        ? session.user
        : null
  const { language } = useLanguage()

  const [appointments, setAppointments] =
    useState<Appointment[]>([])

  const [isLoading, setIsLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  useEffect(() => {
    let cancelled = false

    const loadAppointments =
      async () => {
        if (!animal?.id) {
          setAppointments([])
          setIsLoading(false)
          return
        }

        try {
          setIsLoading(true)
          setError("")

          const results =
            await fetchUserAppointments(
              animal.id
            )

          if (!cancelled) {
            setAppointments(results)
          }
        } catch (loadError) {
          console.error(
            "Erreur de chargement des RDV :",
            loadError
          )

          if (!cancelled) {
            setError(
              "Impossible de charger vos rendez-vous."
            )
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false)
          }
        }
      }

    loadAppointments()

    return () => {
      cancelled = true
    }
  }, [animal?.id])

  const sortedAppointments =
    useMemo(() => {
      return [...appointments].sort(
        (a, b) =>
          a.date.getTime() -
          b.date.getTime()
      )
    }, [appointments])

  const locale =
    localeForLanguage(language)

  if (!animal) {
    return (
      <main className="appointmentsPage">
        <div className="appointmentsHeader">
          <Link
            href="/"
            className="backButton"
          >
            ←
          </Link>

          <h1>
            {translate(
              language,
              "Mes RDV"
            )}
          </h1>
        </div>

        <p>
          {translate(
            language,
            "Vous devez être connecté."
          )}
        </p>
      </main>
    )
  }

  return (
    <main className="appointmentsPage">
      <div className="appointmentsHeader">
        <Link
          href="/"
          className="backButton"
        >
          ←
        </Link>

        <h1>
          {translate(
            language,
            "Mes RDV"
          )}
        </h1>
      </div>

      {isLoading && (
        <p>
          {translate(
            language,
            "Chargement..."
          )}
        </p>
      )}

      {error && (
        <p className="appointmentsError">
          {error}
        </p>
      )}

      {!isLoading &&
        !error &&
        sortedAppointments.length ===
          0 && (
          <p>
            {translate(
              language,
              "Vous n'avez aucun rendez-vous."
            )}
          </p>
        )}

      {!isLoading &&
        !error &&
        sortedAppointments.length >
          0 && (
          <div className="appointmentsList">
            {sortedAppointments.map(
              (appointment) => {
                const isPast =
                  appointment.date.getTime() <
                  Date.now()

                return (
                  <Link
                    href={`/appointments/${appointment.id}`}
                    key={appointment.id}
                    className="appointmentCard"
                  >
                    <div>
                      <strong>
                        {appointment.date.toLocaleDateString(
                          locale,
                          {
                            weekday:
                              "long",
                            day: "2-digit",
                            month: "long",
                            year: "numeric"
                          }
                        )}
                      </strong>

                      <span>
                        {appointment.date.toLocaleTimeString(
                          locale,
                          {
                            hour:
                              "2-digit",
                            minute:
                              "2-digit"
                          }
                        )}
                      </span>
                    </div>

                    <div>
                      <p>
                        {
                          appointment.collaborator
                        }
                      </p>

                      <span className="appointmentStatus">
                        {isPast
                          ? translate(
                              language,
                              "Terminé"
                            )
                          : translate(
                              language,
                              "Confirmé"
                            )}
                      </span>
                    </div>
                  </Link>
                )
              }
            )}
          </div>
        )}
    </main>
  )
}
