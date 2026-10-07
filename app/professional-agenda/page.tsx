"use client"

import {
  useEffect,
  useMemo,
  useState
} from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"

import type { Language } from "@/context/LanguageContext"
import { useAuth } from "@/context/AuthContext"

import ProfessionalBookingModal from "@/components/ProfessionalBookingModal"

import {
  type Appointment,
  fetchProfessionalAppointments
} from "@/services/appointments"

import {
  fetchServicesForProfessional
} from "@/services/fetchProfessionalById"

import {
  fetchClientById
} from "@/services/fetchClientUser"

import {
  translate
} from "@/translations/translations"

import "./ProfessionalAgenda.css"


type ProfessionalAccountType =
  | "sitter"
  | "grooming"
  | "healthcare"

type AgendaView =
  | "day"
  | "week"
  | "month"

type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "inProgress"
  | "completed"
  | "cancelled"
  | "absent"

type PaymentStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "refunded"

type Collaborator = {
  id: string
  name: string
  role?: string
}

type Availability = {
  day: string
  enabled: boolean
  start: string
  end: string
}

type AnimalClient =
  NonNullable<
    Awaited<
      ReturnType<
        typeof fetchClientById
      >
    >
  >

type AgendaService = {
  id: string
  name: string
  description?: string
  price?: number
  duration?: number
  devise?: string
  bookingMode?: string
  requiredInformations?: string[]
  customQuestions?: string[]
}


const HOURS = Array.from(
  { length: 13 },
  (_, index) => index + 7
)

const STATUS_LABELS: Record<
  AppointmentStatus,
  string
> = {
  pending: "En attente",
  confirmed: "Confirmé",
  inProgress: "En cours",
  completed: "Terminé",
  cancelled: "Annulé",
  absent: "Absent"
}

const PAYMENT_LABELS: Record<
  PaymentStatus,
  string
> = {
  pending: "Paiement en attente",
  authorized: "Paiement autorisé",
  captured: "Paiement capturé",
  refunded: "Paiement remboursé"
}

const HOUR_HEIGHT = 88


function normalizeLanguage(
  value: unknown
): Language {
  if (
    value === "fr" ||
    value === "en" ||
    value === "es" ||
    value === "it" ||
    value === "pt" ||
    value === "de" ||
    value === "ar"
  ) {
    return value
  }

  return "fr"
}


function pad(
  value: number
) {
  return String(
    value
  ).padStart(
    2,
    "0"
  )
}


function toDateInputValue(
  date: Date
) {
  return [
    date.getFullYear(),
    pad(
      date.getMonth() + 1
    ),
    pad(
      date.getDate()
    )
  ].join("-")
}


function addDays(
  date: Date,
  numberOfDays: number
) {
  const result =
    new Date(date)

  result.setDate(
    result.getDate() +
      numberOfDays
  )

  return result
}


function startOfWeek(
  date: Date
) {
  const result =
    new Date(date)

  const day =
    result.getDay()

  const difference =
    day === 0
      ? -6
      : 1 - day

  result.setDate(
    result.getDate() +
      difference
  )

  result.setHours(
    0,
    0,
    0,
    0
  )

  return result
}


function endOfWeek(
  date: Date
) {
  return addDays(
    startOfWeek(date),
    6
  )
}


function startOfMonth(
  date: Date
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  )
}


function isSameDay(
  firstDate: Date,
  secondDate: Date
) {
  return (
    firstDate.getFullYear() ===
      secondDate.getFullYear() &&
    firstDate.getMonth() ===
      secondDate.getMonth() &&
    firstDate.getDate() ===
      secondDate.getDate()
  )
}


function formatLongDate(
  date: Date,
  language: Language
) {
  const locale =
    language === "fr"
      ? "fr-FR"
      : language === "en"
        ? "en-US"
        : language === "es"
          ? "es-ES"
          : language === "it"
            ? "it-IT"
            : language === "pt"
              ? "pt-PT"
              : language === "de"
                ? "de-DE"
                : "ar"

  return new Intl.DateTimeFormat(
    locale,
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  ).format(date)
}


function formatMonth(
  date: Date,
  language: Language
) {
  const locale =
    language === "fr"
      ? "fr-FR"
      : language === "en"
        ? "en-US"
        : language === "es"
          ? "es-ES"
          : language === "it"
            ? "it-IT"
            : language === "pt"
              ? "pt-PT"
              : language === "de"
                ? "de-DE"
                : "ar"

  return new Intl.DateTimeFormat(
    locale,
    {
      month: "long",
      year: "numeric"
    }
  ).format(date)
}


function formatDuration(
  minutes: number,
  language: Language
) {
  const hours =
    Math.floor(
      minutes / 60
    )

  const remainingMinutes =
    minutes % 60

  if (
    hours > 0 &&
    remainingMinutes > 0
  ) {
    return `${hours} ${translate(
      language,
      "h"
    )} ${remainingMinutes} ${translate(
      language,
      "min"
    )}`
  }

  if (hours > 0) {
    return `${hours} ${translate(
      language,
      "h"
    )}`
  }

  return `${remainingMinutes} ${translate(
    language,
    "min"
  )}`
}


function getAppointmentDuration(
  appointment: Appointment
) {
  return Math.max(
    Number(
      appointment.duration ??
      15
    ),
    15
  )
}


function getAppointmentHeight(
  appointment: Appointment
) {
  return Math.max(
    64,
    (
      getAppointmentDuration(
        appointment
      ) / 60
    ) * HOUR_HEIGHT
  )
}


function getAppointmentEndDate(
  appointment: Appointment
) {
  return new Date(
    appointment.date.getTime() +
      getAppointmentDuration(
        appointment
      ) *
        60_000
  )
}


function getAppointmentTopOffset(
  appointment: Appointment
) {
  return (
    appointment.date
      .getMinutes() /
    60
  ) * HOUR_HEIGHT
}


function getAppointmentStatus(
  appointment: Appointment
): AppointmentStatus {
  const rawAppointment =
    appointment as unknown as
      Record<
        string,
        unknown
      >

  const status =
    rawAppointment.status

  if (
    status === "pending" ||
    status === "confirmed" ||
    status === "inProgress" ||
    status === "completed" ||
    status === "cancelled" ||
    status === "absent"
  ) {
    return status
  }

  const paymentStatus =
    String(
      appointment.paymentStatus ??
      ""
    )

  if (
    paymentStatus === "captured"
  ) {
    return "completed"
  }

  if (
    paymentStatus === "authorized"
  ) {
    return "confirmed"
  }

  return "pending"
}


function getPaymentStatus(
  appointment: Appointment
): PaymentStatus | null {
  const value =
    String(
      appointment.paymentStatus ??
      ""
    )

  if (
    value === "pending" ||
    value === "authorized" ||
    value === "captured" ||
    value === "refunded"
  ) {
    return value
  }

  return null
}


function getOptionalAppointmentString(
  appointment: Appointment,
  key: string
) {
  const raw =
    appointment as unknown as
      Record<
        string,
        unknown
      >

  const value =
    raw[key]

  return typeof value ===
    "string"
    ? value
    : ""
}


function normalizeCollaborators(
  value: unknown
): Collaborator[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map(
      (
        item,
        index
      ): Collaborator | null => {
        if (
          typeof item ===
          "string"
        ) {
          const name =
            item.trim()

          if (!name) {
            return null
          }

          return {
            id: name,
            name,
            role: ""
          }
        }

        if (
          item &&
          typeof item ===
            "object"
        ) {
          const collaborator =
            item as Record<
              string,
              unknown
            >

          const name =
            String(
              collaborator.name ??
              collaborator.pseudo ??
              collaborator.fullName ??
              collaborator.collaborator ??
              ""
            ).trim()

          if (!name) {
            return null
          }

          return {
            id:
              String(
                collaborator.id ??
                collaborator.recordName ??
                `${name}-${index}`
              ),

            name,

            role:
              typeof collaborator.role ===
                "string"
                ? collaborator.role
                : ""
          }
        }

        return null
      }
    )
    .filter(
      (
        item
      ): item is Collaborator =>
        item !== null
    )
}

const SITTER_SERVICE_NAMES:
  Record<string, string> = {
    garde: "Garde",
    visites: "Visites",
    promenades: "Promenades",
    hebergement: "Hébergement",
    transport: "Transport"
  }

export default function ProfessionalAgendaPage() {
  const router =
    useRouter()

  const {
    session
  } =
    useAuth()

  const language =
    normalizeLanguage(
      session?.user?.language
    )

  const accountType:
    ProfessionalAccountType =
    session?.accountType ===
      "grooming" ||
    session?.accountType ===
      "healthcare" ||
    session?.accountType ===
      "sitter"
      ? session.accountType
      : "sitter"

  const sessionUser =
    session?.user as
      | Record<
          string,
          any
        >
      | undefined

  const collaborators =
    useMemo<
      Collaborator[]
    >(() => {
      if (
        !session ||
        session.accountType ===
          "sitter"
      ) {
        return []
      }

      const rawCollaborators =
        sessionUser?.collaborators ??
        sessionUser?.collaborateurs ??
        []

      return normalizeCollaborators(
        rawCollaborators
      )
    }, [
      session,
      sessionUser
    ])


  const [
    appointments,
    setAppointments
  ] =
    useState<
      Appointment[]
    >([])


  const [
    animalsById,
    setAnimalsById
  ] =
    useState<
      Record<
        string,
        AnimalClient
      >
    >({})


  const animals =
    useMemo(
      () =>
        Object.values(
          animalsById
        ),
      [
        animalsById
      ]
    )


  const [
    services,
    setServices
  ] =
    useState<
      AgendaService[]
    >([])


  const [
    currentDate,
    setCurrentDate
  ] =
    useState(
      new Date()
    )


  const [
    agendaView,
    setAgendaView
  ] =
    useState<
      AgendaView
    >("week")


  const [
    selectedStatus,
    setSelectedStatus
  ] =
    useState<
      AppointmentStatus |
      "all"
    >("all")


  const [
    selectedCollaborator,
    setSelectedCollaborator
  ] =
    useState(
      "all"
    )


  const [
    search,
    setSearch
  ] =
    useState("")


  const [
    selectedAppointment,
    setSelectedAppointment
  ] =
    useState<
      Appointment | null
    >(null)


  const [
    isCreationOpen,
    setIsCreationOpen
  ] =
    useState(false)


  const [
    isAppointmentLimitOpen,
    setIsAppointmentLimitOpen
  ] =
    useState(false)


  const [
    showStripeRequiredModal,
    setShowStripeRequiredModal
  ] =
    useState(false)


  async function loadAppointments() {
    if (!session) {
      setAppointments([])
      return
    }

    try {
      const loadedAppointments =
        await fetchProfessionalAppointments(
          session.user.id
        )

      setAppointments(
        loadedAppointments
      )
    } catch (error) {
      console.error(
        "Erreur lors du chargement des rendez-vous :",
        error
      )

      setAppointments([])
    }
  }


  useEffect(() => {
    loadAppointments()
  }, [
    session
  ])


    /*
     * =====================================================
     * CHARGEMENT DES ANIMAUX
     * =====================================================
     */

    useEffect(() => {
      let cancelled = false

      async function loadAnimals() {
        if (!session) {
          if (!cancelled) {
            setAnimalsById({})
          }

          return
        }

        /*
         * Animaux déjà liés au professionnel.
         *
         * Grooming / Healthcare :
         * session.user.userIDs contient les IDs des animaux
         * déjà connus de l'établissement.
         */
        const professionalAnimalIDs =
          session.accountType === "grooming" ||
          session.accountType === "healthcare"
            ? Array.isArray(sessionUser?.userIDs)
              ? sessionUser.userIDs.filter(
                  (id: unknown): id is string =>
                    typeof id === "string" &&
                    Boolean(id.trim())
                )
              : []
            : []

        /*
         * Animaux présents dans les rendez-vous.
         *
         * RDV.userID = animalID
         */
        const appointmentAnimalIDs =
          appointments
            .map(
              appointment =>
                appointment.userID
            )
            .filter(
              (id): id is string =>
                typeof id === "string" &&
                Boolean(id.trim())
            )

        /*
         * On fusionne les deux sources afin de récupérer :
         *
         * - les animaux déjà connus du professionnel
         * - les animaux présents dans ses rendez-vous
         *
         * Set supprime automatiquement les doublons.
         */
        const uniqueIDs = [
          ...new Set([
            ...professionalAnimalIDs,
            ...appointmentAnimalIDs
          ])
        ]

        if (uniqueIDs.length === 0) {
          if (!cancelled) {
            setAnimalsById({})
          }

          return
        }

          const results =
            await Promise.allSettled(
              uniqueIDs.map(
                async id => {
                  try {
                    const animal =
                      await fetchClientById(id)

                    return {
                      id,
                      animal
                    }
                  } catch (error) {
                    console.warn(
                      `[AGENDA] Animal introuvable ou inaccessible : ${id}`,
                      error
                    )

                    return {
                      id,
                      animal: null
                    }
                  }
                }
              )
            )

          if (cancelled) {
            return
          }

          const map:
            Record<
              string,
              AnimalClient
            > = {}

          results.forEach(result => {
            if (
              result.status === "fulfilled" &&
              result.value.animal
            ) {
              map[result.value.id] =
                result.value.animal
            }
          })

          setAnimalsById(map)
      }

      loadAnimals()

      return () => {
        cancelled = true
      }
    }, [
      appointments,
      session,
      sessionUser
    ])


  /*
   * =====================================================
   * CHARGEMENT DES SERVICES
   * =====================================================
   */

  useEffect(() => {
    let cancelled =
      false

    async function loadServices() {
      if (
        !session ||
        session.accountType ===
          "sitter"
      ) {
        if (!cancelled) {
          setServices([])
        }

        return
      }

      try {
        const loadedServices =
          await fetchServicesForProfessional(
            session.user.id
          )

        if (!cancelled) {
          setServices(
            loadedServices
          )
        }
      } catch (error) {
        console.error(
          "Erreur lors du chargement des prestations :",
          error
        )

        if (!cancelled) {
          setServices([])
        }
      }
    }

    loadServices()

    return () => {
      cancelled = true
    }
  }, [
    session
  ])


  const hasTeam =
    accountType ===
      "grooming" ||
    accountType ===
      "healthcare"


  const weekDays =
    useMemo(
      () => {
        const firstDay =
          startOfWeek(
            currentDate
          )

        return Array.from(
          {
            length: 7
          },
          (
            _,
            index
          ) =>
            addDays(
              firstDay,
              index
            )
        )
      },
      [
        currentDate
      ]
    )


  const monthDays =
    useMemo(
      () => {
        const firstMonthDay =
          startOfMonth(
            currentDate
          )

        const firstCalendarDay =
          startOfWeek(
            firstMonthDay
          )

        return Array.from(
          {
            length: 42
          },
          (
            _,
            index
          ) =>
            addDays(
              firstCalendarDay,
              index
            )
        )
      },
      [
        currentDate
      ]
    )


  const filteredAppointments =
    useMemo(
      () => {
        const normalizedSearch =
          search
            .trim()
            .toLocaleLowerCase(
              "fr-FR"
            )

        return appointments.filter(
          appointment => {
            const status =
              getAppointmentStatus(
                appointment
              )

            if (
              selectedStatus !==
                "all" &&
              status !==
                selectedStatus
            ) {
              return false
            }

            if (
              selectedCollaborator !==
                "all" &&
              appointment.collaborator !==
                selectedCollaborator
            ) {
              return false
            }

            if (
              !normalizedSearch
            ) {
              return true
            }

            const animal =
              animalsById[
                appointment.userID
              ]

            const service =
              services.find(
                service =>
                  service.id ===
                  appointment.serviceID
              )

            return [
              animal?.name ??
                "",
              animal?.species ??
                "",
              service?.name ??
                "",
              appointment.phoneNumber ??
                "",
              appointment.collaborator ??
                ""
            ].some(
              value =>
                String(value)
                  .toLocaleLowerCase(
                    "fr-FR"
                  )
                  .includes(
                    normalizedSearch
                  )
            )
          }
        )
      },
      [
        appointments,
        animalsById,
        services,
        search,
        selectedCollaborator,
        selectedStatus
      ]
    )


  const todayAppointments =
    appointments.filter(
      appointment =>
        isSameDay(
          appointment.date,
          new Date()
        )
    )


  const pendingAppointments =
    appointments.filter(
      appointment =>
        getAppointmentStatus(
          appointment
        ) ===
        "pending"
    )


  const totalPlannedMinutes =
    todayAppointments.reduce(
      (
        total,
        appointment
      ) =>
        total +
        getAppointmentDuration(
          appointment
        ),
      0
    )


  const selectedAnimal =
    selectedAppointment
      ? animalsById[
          selectedAppointment
            .userID
        ]
      : null


  /*
   * =====================================================
   * SERVICE DU RDV SÉLECTIONNÉ
   * =====================================================
   */

  const selectedService =
    selectedAppointment
      ? services.find(
          service =>
            service.id ===
            selectedAppointment
              .serviceID
        )
      : null
    
    
    const selectedServiceName =
      selectedAppointment
        ? accountType === "sitter"
          ? SITTER_SERVICE_NAMES[
              selectedAppointment.serviceID
            ] ??
            selectedAppointment.serviceID ??
            translate(
              language,
              "Prestation"
            )
          : selectedService?.name ??
            translate(
              language,
              "Prestation"
            )
        : translate(
            language,
            "Prestation"
          )


  const bookingProfessional =
    useMemo(
      () => {
        if (
          !session ||
          !sessionUser
        ) {
          return null
        }

        return {
          id:
            String(
              sessionUser.id ??
              ""
            ),

          name:
            String(
              sessionUser.name ??
              sessionUser.pseudo ??
              ""
            ),

          tarif:
            session.accountType ===
              "sitter"
              ? Number(
                  sessionUser.tarif ??
                  0
                )
              : undefined,

          devise:
            String(
              sessionUser.devise ??
              "EUR"
            ),

          disponibilities:
            sessionUser.disponibilities,

          availability:
            sessionUser.availability,

          schedules:
            sessionUser.schedules
        }
      },
      [
        session,
        sessionUser
      ]
    )


  function navigatePrevious() {
    if (
      agendaView ===
      "day"
    ) {
      setCurrentDate(
        previous =>
          addDays(
            previous,
            -1
          )
      )

      return
    }

    if (
      agendaView ===
      "week"
    ) {
      setCurrentDate(
        previous =>
          addDays(
            previous,
            -7
          )
      )

      return
    }

    setCurrentDate(
      previous =>
        new Date(
          previous.getFullYear(),
          previous.getMonth() -
            1,
          1
        )
    )
  }


  function navigateNext() {
    if (
      agendaView ===
      "day"
    ) {
      setCurrentDate(
        previous =>
          addDays(
            previous,
            1
          )
      )

      return
    }

    if (
      agendaView ===
      "week"
    ) {
      setCurrentDate(
        previous =>
          addDays(
            previous,
            7
          )
      )

      return
    }

    setCurrentDate(
      previous =>
        new Date(
          previous.getFullYear(),
          previous.getMonth() +
            1,
          1
        )
    )
  }


  function renderAppointmentCard(
    appointment:
      Appointment,
    compact = false,
    positioned = false
  ) {
    const animal =
      animalsById[
        appointment.userID
      ]

    /*
     * On retrouve la prestation à partir
     * du serviceID du RDV.
     */
    const service =
      services.find(
        service =>
          service.id ===
          appointment.serviceID
      )

      const serviceName =
        accountType === "sitter"
          ? SITTER_SERVICE_NAMES[
              appointment.serviceID
            ] ??
            appointment.serviceID ??
            translate(
              language,
              "Prestation"
            )
          : service?.name ??
            translate(
              language,
              "Prestation"
            )

    return (
      <button
        key={
          appointment.id
        }
        type="button"
        className={[
          "agendaAppointmentCard",

          compact
            ? "agendaAppointmentCard--compact"
            : "",

          positioned
            ? "agendaAppointmentCard--positioned"
            : ""
        ]
          .filter(Boolean)
          .join(" ")}
        style={
          positioned
            ? {
                top:
                  `${getAppointmentTopOffset(
                    appointment
                  )}px`,

                height:
                  `${getAppointmentHeight(
                    appointment
                  )}px`
              }
            : undefined
        }
        onClick={() =>
          setSelectedAppointment(
            appointment
          )
        }
      >
        <span className="agendaAppointmentTime">
          {appointment.date.toLocaleTimeString(
            "fr-FR",
            {
              hour:
                "2-digit",
              minute:
                "2-digit"
            }
          )}

          {" – "}

          {getAppointmentEndDate(
            appointment
          ).toLocaleTimeString(
            "fr-FR",
            {
              hour:
                "2-digit",
              minute:
                "2-digit"
            }
          )}
        </span>

        <div className="agendaAppointmentAnimal">
          <img
            src={
              animal?.photo ??
              "/images/demo2.jpg"
            }
            alt=""
          />

          <strong>
            {animal?.name ??
              translate(
                language,
                "Animal"
              )}
          </strong>
        </div>

        <span>
          {serviceName}

          {appointment.collaborator && (
            <>
              {" - "}
              {appointment.collaborator}
            </>
          )}
        </span>

        {hasTeam &&
          !compact && (
            <span className="agendaAppointmentCollaborator">
              {
                appointment.collaborator ||
                translate(
                  language,
                  "Non renseigné"
                )
              }
            </span>
          )}
      </button>
    )
  }


  return (
    <main className="professionalAgendaPage">

      <header className="professionalAgendaHeader">
        <div>
          <div className="professionalAgendaTitleRow">
            <span className="professionalAgendaIcon">
              📅
            </span>

            <div>
              <h1>
                {translate(
                  language,
                  "Agenda professionnel"
                )}
              </h1>

              <p>
                {translate(
                  language,
                  "Gérez vos rendez-vous, vos disponibilités et votre équipe."
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="agendaActions">
          <button
            type="button"
            className="agendaPrimaryButton"
            onClick={() => {
              if (
                !session
              ) {
                return
              }

              if (
                session.accountType ===
                  "sitter" &&
                !sessionUser
                  ?.stripeAccountID
              ) {
                setShowStripeRequiredModal(
                  true
                )
                return
              }

              const packageValue =
                Number(
                  sessionUser
                    ?.package ??
                  0
                )

              const freeLimit =
                session.accountType ===
                  "sitter"
                  ? 2
                  : 10

              if (
                packageValue ===
                  0 &&
                appointments.length >=
                  freeLimit
              ) {
                setIsAppointmentLimitOpen(
                  true
                )
                return
              }

              setIsCreationOpen(
                true
              )
            }}
          >
            <span>＋</span>

            {translate(
              language,
              "Nouveau rendez-vous"
            )}
          </button>

          {session?.accountType ===
            "sitter" && (
            <Link
              href="/professional-agenda/scan"
              className="scanQRCodeButton"
            >
              <span>📷</span>

              {translate(
                language,
                "Scanner un QR code"
              )}
            </Link>
          )}
        </div>
      </header>


      <section className="agendaStatsGrid">

        <article className="agendaStatCard">
          <span>
            {translate(
              language,
              "Rendez-vous aujourd’hui"
            )}
          </span>

          <strong>
            {
              todayAppointments.length
            }
          </strong>

          <small>
            {
              todayAppointments.filter(
                appointment =>
                  getAppointmentStatus(
                    appointment
                  ) ===
                  "confirmed"
              ).length
            }{" "}
            {translate(
              language,
              "confirmés"
            )}
          </small>
        </article>


        <article className="agendaStatCard">
          <span>
            {translate(
              language,
              "En attente"
            )}
          </span>

          <strong>
            {
              pendingAppointments.length
            }
          </strong>

          <small>
            {translate(
              language,
              "À confirmer"
            )}
          </small>
        </article>


        <article className="agendaStatCard">
          <span>
            {translate(
              language,
              "Temps planifié"
            )}
          </span>

          <strong>
            {formatDuration(
              totalPlannedMinutes,
              language
            )}
          </strong>

          <small>
            {translate(
              language,
              "Pour aujourd’hui"
            )}
          </small>
        </article>

      </section>


      <section className="agendaToolbar">

        <div className="agendaDateNavigation">

          <button
            type="button"
            aria-label={translate(
              language,
              "Période précédente"
            )}
            onClick={
              navigatePrevious
            }
          >
            ‹
          </button>

          <button
            type="button"
            className="agendaTodayButton"
            onClick={() =>
              setCurrentDate(
                new Date()
              )
            }
          >
            {translate(
              language,
              "Aujourd’hui"
            )}
          </button>

          <button
            type="button"
            aria-label={translate(
              language,
              "Période suivante"
            )}
            onClick={
              navigateNext
            }
          >
            ›
          </button>

          <h2>
            {agendaView ===
              "day" &&
              formatLongDate(
                currentDate,
                language
              )}

            {agendaView ===
              "week" &&
              `${formatLongDate(
                startOfWeek(
                  currentDate
                ),
                language
              )} – ${formatLongDate(
                endOfWeek(
                  currentDate
                ),
                language
              )}`}

            {agendaView ===
              "month" &&
              formatMonth(
                currentDate,
                language
              )}
          </h2>

        </div>


        <div className="agendaViewSelector">

          <button
            type="button"
            className={
              agendaView ===
              "day"
                ? "active"
                : ""
            }
            onClick={() =>
              setAgendaView(
                "day"
              )
            }
          >
            {translate(
              language,
              "Jour"
            )}
          </button>

          <button
            type="button"
            className={
              agendaView ===
              "week"
                ? "active"
                : ""
            }
            onClick={() =>
              setAgendaView(
                "week"
              )
            }
          >
            {translate(
              language,
              "Semaine"
            )}
          </button>

          <button
            type="button"
            className={
              agendaView ===
              "month"
                ? "active"
                : ""
            }
            onClick={() =>
              setAgendaView(
                "month"
              )
            }
          >
            {translate(
              language,
              "Mois"
            )}
          </button>

        </div>

      </section>


      <section className="agendaMainCard">

        {agendaView ===
          "day" && (
          <div className="agendaDayView">

            <div className="agendaDayHeader">
              <div>
                <span>
                  {new Intl.DateTimeFormat(
                    "fr-FR",
                    {
                      weekday:
                        "long"
                    }
                  ).format(
                    currentDate
                  )}
                </span>

                <strong>
                  {
                    currentDate.getDate()
                  }
                </strong>
              </div>
            </div>


            <div className="agendaDayTimeline">

              {HOURS.map(
                hour => (
                  <div
                    key={
                      hour
                    }
                    className="agendaTimelineRow"
                  >
                    <time>
                      {
                        pad(
                          hour
                        )
                      }
                      :00
                    </time>

                    <div className="agendaTimelineContent">
                      {filteredAppointments
                        .filter(
                          appointment =>
                            isSameDay(
                              appointment.date,
                              currentDate
                            ) &&
                            appointment.date.getHours() ===
                              hour
                        )
                        .map(
                          appointment =>
                            renderAppointmentCard(
                              appointment,
                              false,
                              true
                            )
                        )}
                    </div>
                  </div>
                )
              )}

            </div>

          </div>
        )}


        {agendaView ===
          "week" && (
          <div className="agendaWeekScroll">

            <div className="agendaWeekGrid">

              <div className="agendaWeekCorner">
                {translate(
                  language,
                  "Heure"
                )}
              </div>

              {weekDays.map(
                day => (
                  <div
                    key={
                      day.toISOString()
                    }
                    className={[
                      "agendaWeekDayHeader",

                      isSameDay(
                        day,
                        new Date()
                      )
                        ? "today"
                        : ""
                    ].join(
                      " "
                    )}
                  >
                    <span>
                      {new Intl.DateTimeFormat(
                        "fr-FR",
                        {
                          weekday:
                            "short"
                        }
                      ).format(
                        day
                      )}
                    </span>

                    <strong>
                      {
                        day.getDate()
                      }
                    </strong>
                  </div>
                )
              )}


              {HOURS.map(
                hour => (
                  <div
                    key={
                      hour
                    }
                    className="agendaWeekRow"
                  >
                    <time className="agendaWeekHour">
                      {
                        pad(
                          hour
                        )
                      }
                      :00
                    </time>

                    {weekDays.map(
                      day => {
                        const dayValue =
                          toDateInputValue(
                            day
                          )

                        const dayAppointments =
                          filteredAppointments.filter(
                            appointment =>
                              appointment.date.getFullYear() ===
                                day.getFullYear() &&
                              appointment.date.getMonth() ===
                                day.getMonth() &&
                              appointment.date.getDate() ===
                                day.getDate() &&
                              appointment.date.getHours() ===
                                hour
                          )

                        return (
                          <div
                            key={`${dayValue}-${hour}`}
                            className="agendaWeekCell"
                          >
                            {dayAppointments.map(
                              appointment =>
                                renderAppointmentCard(
                                  appointment,
                                  false,
                                  true
                                )
                            )}
                          </div>
                        )
                      }
                    )}

                  </div>
                )
              )}

            </div>

          </div>
        )}


        {agendaView ===
          "month" && (
          <div className="agendaMonthGrid">

            {[
              "Lun.",
              "Mar.",
              "Mer.",
              "Jeu.",
              "Ven.",
              "Sam.",
              "Dim."
            ].map(
              day => (
                <div
                  key={
                    day
                  }
                  className="agendaMonthWeekday"
                >
                  {translate(
                    language,
                    day
                  )}
                </div>
              )
            )}


            {monthDays.map(
              day => {
                const dayAppointments =
                  filteredAppointments
                    .filter(
                      appointment =>
                        appointment.date.getFullYear() ===
                          day.getFullYear() &&
                        appointment.date.getMonth() ===
                          day.getMonth() &&
                        appointment.date.getDate() ===
                          day.getDate()
                    )
                    .sort(
                      (
                        first,
                        second
                      ) =>
                        first.date.getTime() -
                        second.date.getTime()
                    )

                const isOutsideMonth =
                  day.getMonth() !==
                  currentDate.getMonth()

                return (
                  <div
                    key={
                      day.toISOString()
                    }
                    className={[
                      "agendaMonthDay",

                      isOutsideMonth
                        ? "outside"
                        : "",

                      isSameDay(
                        day,
                        new Date()
                      )
                        ? "today"
                        : ""
                    ]
                      .filter(
                        Boolean
                      )
                      .join(
                        " "
                      )}
                  >
                    <button
                      type="button"
                      className="agendaMonthDayNumber"
                      onClick={() => {
                        setCurrentDate(
                          day
                        )

                        setAgendaView(
                          "day"
                        )
                      }}
                    >
                      {
                        day.getDate()
                      }
                    </button>


                    <div className="agendaMonthAppointments">

                      {dayAppointments
                        .slice(
                          0,
                          3
                        )
                        .map(
                          appointment =>
                            renderAppointmentCard(
                              appointment,
                              true
                            )
                        )}


                      {dayAppointments.length >
                        3 && (
                        <button
                          type="button"
                          className="agendaMoreAppointments"
                          onClick={() => {
                            setCurrentDate(
                              day
                            )

                            setAgendaView(
                              "day"
                            )
                          }}
                        >
                          +
                          {
                            dayAppointments.length -
                            3
                          }{" "}
                          {translate(
                            language,
                            "rendez-vous"
                          )}
                        </button>
                      )}

                    </div>

                  </div>
                )
              }
            )}

          </div>
        )}

      </section>


      {showStripeRequiredModal && (
        <div
          className="offerConfirmationOverlay"
          role="dialog"
          aria-modal="true"
        >
          <div className="offerConfirmationCard">

            <button
              type="button"
              className="offerConfirmationClose"
              onClick={() =>
                setShowStripeRequiredModal(
                  false
                )
              }
              aria-label={translate(
                language,
                "Fermer"
              )}
            >
              ×
            </button>

            <div className="offerConfirmationVisual orange">
              💳
            </div>

            <span className="offerConfirmationBadge">
              {translate(
                language,
                "Configuration requise"
              )}
            </span>

            <h2>
              {translate(
                language,
                "Stripe n'est pas encore configuré"
              )}
            </h2>

            <p className="offerConfirmationSubtitle">
              {translate(
                language,
                "Configurez Stripe pour recevoir les paiements avant de souscrire à une offre."
              )}
            </p>

            <div className="stripeRequiredActions">

              <button
                type="button"
                className="stripeLaterButton"
                onClick={() =>
                  setShowStripeRequiredModal(
                    false
                  )
                }
              >
                {translate(
                  language,
                  "Plus tard"
                )}
              </button>

              <button
                type="button"
                className="stripeConfigureButton"
                onClick={() => {
                  setShowStripeRequiredModal(
                    false
                  )

                  router.push(
                    "/sitter-account"
                  )
                }}
              >
                {translate(
                  language,
                  "Configurer Stripe"
                )}
              </button>

            </div>

          </div>
        </div>
      )}


      {selectedAppointment && (
        <div
          className="agendaModalOverlay"
          role="presentation"
          onMouseDown={
            event => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setSelectedAppointment(
                  null
                )
              }
            }
          }
        >
          <section
            className="agendaDetailsModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="appointment-details-title"
          >

            <header className="agendaModalHeader">

              <div className="agendaModalAnimalHeader">

                <img
                  src={
                    selectedAnimal?.photo ??
                    "/images/demo2.jpg"
                  }
                  alt={
                    selectedAnimal?.name ??
                    ""
                  }
                  className="agendaModalAnimalPhoto"
                />

                <div>

                  <span className="agendaModalEyebrow">
                    {translate(
                      language,
                      "Détails du rendez-vous"
                    )}
                  </span>

                  <h2 id="appointment-details-title">
                    {selectedAnimal?.name ??
                      translate(
                        language,
                        "Animal"
                      )}
                  </h2>

                  <p>
                       {selectedServiceName}
                  </p>

                </div>

              </div>


              <button
                type="button"
                aria-label={translate(
                  language,
                  "Fermer"
                )}
                className="agendaModalCloseButton"
                onClick={() =>
                  setSelectedAppointment(
                    null
                  )
                }
              >
                ×
              </button>

            </header>


            <div className="agendaAppointmentStatusRow">

              <span
                className={`agendaStatusBadge agendaStatusBadge--${getAppointmentStatus(
                  selectedAppointment
                )}`}
              >
                {translate(
                  language,
                  STATUS_LABELS[
                    getAppointmentStatus(
                      selectedAppointment
                    )
                  ]
                )}
              </span>


              {getPaymentStatus(
                selectedAppointment
              ) && (
                <span className="agendaPaymentBadge">
                  {translate(
                    language,
                    PAYMENT_LABELS[
                      getPaymentStatus(
                        selectedAppointment
                      ) as PaymentStatus
                    ]
                  )}
                </span>
              )}

            </div>


            <div className="agendaDetailsGrid">

              <article>
                <span>
                  {translate(
                    language,
                    "Date"
                  )}
                </span>

                <strong>
                  {formatLongDate(
                    selectedAppointment.date,
                    language
                  )}
                </strong>
              </article>


              <article>
                <span>
                  {translate(
                    language,
                    "Horaires"
                  )}
                </span>

                <strong>
                  {selectedAppointment.date.toLocaleTimeString(
                    "fr-FR",
                    {
                      hour:
                        "2-digit",
                      minute:
                        "2-digit"
                    }
                  )}

                  {" – "}

                  {getAppointmentEndDate(
                    selectedAppointment
                  ).toLocaleTimeString(
                    "fr-FR",
                    {
                      hour:
                        "2-digit",
                      minute:
                        "2-digit"
                    }
                  )}
                </strong>

                <small>
                  {formatDuration(
                    getAppointmentDuration(
                      selectedAppointment
                    ),
                    language
                  )}
                </small>
              </article>


              <article>
                <span>
                  {translate(
                    language,
                    "Prestation"
                  )}
                </span>

                <strong>
                   {selectedServiceName}
                </strong>
              </article>


              {hasTeam && (
                <article>
                  <span>
                    {translate(
                      language,
                      "Collaborateur"
                    )}
                  </span>

                  <strong>
                    {selectedAppointment.collaborator ||
                      translate(
                        language,
                        "Non renseigné"
                      )}
                  </strong>
                </article>
              )}


              <article>
                <span>
                  {translate(
                    language,
                    "Téléphone"
                  )}
                </span>

                <strong>
                  {selectedAppointment.phoneNumber ||
                    translate(
                      language,
                      "Non renseigné"
                    )}
                </strong>
              </article>

            </div>


            {getOptionalAppointmentString(
              selectedAppointment,
              "address"
            ) && (
              <div className="agendaDetailsBlock">

                <span>
                  {translate(
                    language,
                    "Adresse"
                  )}
                </span>

                <p>
                  {getOptionalAppointmentString(
                    selectedAppointment,
                    "address"
                  )}
                </p>

              </div>
            )}


            {getOptionalAppointmentString(
              selectedAppointment,
              "notes"
            ) && (
              <div className="agendaDetailsBlock">

                <span>
                  {translate(
                    language,
                    "Notes"
                  )}
                </span>

                <p>
                  {getOptionalAppointmentString(
                    selectedAppointment,
                    "notes"
                  )}
                </p>

              </div>
            )}


            <footer className="agendaModalActions">

              {selectedAppointment.phoneNumber && (
                <a
                  href={`tel:${selectedAppointment.phoneNumber.replace(
                    /\s/g,
                    ""
                  )}`}
                  className="agendaSecondaryButton"
                >
                  {translate(
                    language,
                    "Appeler"
                  )}
                </a>
              )}

              <button
                type="button"
                className="agendaPrimaryButton"
                onClick={() =>
                  setSelectedAppointment(
                    null
                  )
                }
              >
                {translate(
                  language,
                  "Fermer"
                )}
              </button>

            </footer>

          </section>
        </div>
      )}


      {isCreationOpen &&
        session &&
        bookingProfessional && (
        <ProfessionalBookingModal
          accountType={
            accountType
          }
          professional={
            bookingProfessional as any
          }
          animals={
            animals as any
          }
          services={
            services as any
          }
          collaborators={
            collaborators.map(
              collaborator =>
                collaborator.name
            )
          }
          onClose={() =>
            setIsCreationOpen(
              false
            )
          }
          onCreated={() => {
            loadAppointments()
          }}
        />
      )}


      {isAppointmentLimitOpen && (
        <div
          className="appointmentLimitOverlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="appointmentLimitTitle"
          onClick={() =>
            setIsAppointmentLimitOpen(
              false
            )
          }
        >
          <div
            className="appointmentLimitModal"
            onClick={
              event =>
                event.stopPropagation()
            }
          >

            <button
              type="button"
              className="appointmentLimitClose"
              aria-label={translate(
                language,
                "Fermer"
              )}
              onClick={() =>
                setIsAppointmentLimitOpen(
                  false
                )
              }
            >
              ×
            </button>


            <div
              className="appointmentLimitIcon"
              aria-hidden="true"
            >
              🐾
            </div>


            <span className="appointmentLimitBadge">
              {translate(
                language,
                "Offre Découverte"
              )}
            </span>


            <h2 id="appointmentLimitTitle">
              {translate(
                language,
                "Limite de réservations atteinte"
              )}
            </h2>


            <p className="appointmentLimitDescription">
              {translate(
                language,
                "Vous avez atteint le nombre maximal de réservations autorisées avec votre offre actuelle."
              )}
            </p>


            <p className="appointmentLimitDetails">
              {session?.accountType ===
              "sitter"
                ? translate(
                    language,
                    "L’offre Découverte permet jusqu’à 2 réservations."
                  )
                : translate(
                    language,
                    "L’offre Découverte permet jusqu’à 10 rendez-vous."
                  )}
            </p>


            <p className="appointmentLimitUpgradeText">
              {translate(
                language,
                "Choisissez une offre supérieure pour continuer à développer votre activité."
              )}
            </p>


            <div className="appointmentLimitActions">

              <button
                type="button"
                className="appointmentLimitSecondaryButton"
                onClick={() =>
                  setIsAppointmentLimitOpen(
                    false
                  )
                }
              >
                {translate(
                  language,
                  "Plus tard"
                )}
              </button>


              <button
                type="button"
                className="appointmentLimitPrimaryButton"
                onClick={() => {
                  setIsAppointmentLimitOpen(
                    false
                  )

                  router.push(
                    "/professional-offers"
                  )
                }}
              >
                {translate(
                  language,
                  "Découvrir les offres"
                )}

                <span aria-hidden="true">
                  →
                </span>
              </button>

            </div>

          </div>
        </div>
      )}

    </main>
  )
}
