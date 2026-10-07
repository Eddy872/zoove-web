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
  fetchProfessional
} from "@/services/fetchProfessionalById"

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
    
    const [
      professionalNames,
      setProfessionalNames
    ] = useState<
      Record<string, string>
    >({})

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
    
    useEffect(() => {
      let cancelled = false

      async function loadProfessionals() {
        const professionalIDs = [
          ...new Set(
            appointments
              .map(
                appointment =>
                  appointment.groomingID
              )
              .filter(Boolean)
          )
        ]

        if (
          professionalIDs.length === 0
        ) {
          setProfessionalNames({})
          return
        }

        try {
          const results =
            await Promise.all(
              professionalIDs.map(
                async professionalID => {
                  const professional =
                    await fetchProfessional(
                      professionalID
                    )

                  return {
                    id: professionalID,
                    name:
                      professional?.name ??
                      ""
                  }
                }
              )
            )

          if (cancelled) {
            return
          }

          setProfessionalNames(
            Object.fromEntries(
              results.map(
                professional => [
                  professional.id,
                  professional.name
                ]
              )
            )
          )
        } catch (error) {
          console.error(
            "Erreur chargement des professionnels :",
            error
          )
        }
      }

      loadProfessionals()

      return () => {
        cancelled = true
      }
    }, [appointments])

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
                          <strong>
                            {professionalNames[
                              appointment.groomingID
                            ] || "Professionnel"}
                          </strong>

                          {appointment.collaborator && (
                            <p>
                              {translate(
                                language,
                                "Avec"
                              )}{" "}
                              {appointment.collaborator}
                            </p>
                          )}

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
