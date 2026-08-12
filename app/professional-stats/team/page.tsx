"use client"

import {
  useEffect,
  useMemo,
  useState
} from "react"

import {
  useRouter
} from "next/navigation"

import {
  ArrowLeft,
  CalendarDays,
  ChartNoAxesCombined,
  Store,
  Users
} from "lucide-react"

import {
  useAuth
} from "@/context/AuthContext"

import {
  fetchProAppointments,
  type Appointment
} from "@/services/appointments"

import {
  fetchServicesForProfessional
} from "@/services/fetchProfessionalById"

import {
  translate
} from "@/translations/translations"

import TeamStatsModal, {
  type TeamModalService,
  type TeamModalStatistic
} from "@/app/professional-stats/components/TeamStatsModal"

import "./TeamStats.css"

type TeamStatsTab =
  | "appointments"
  | "revenue"
  | "clients"

type ProfessionalService = {
  id: string
  name: string
  price: number
  duration: number
}

type EnrichedAppointment =
  Appointment & {
    service:
      | ProfessionalService
      | null

    amount: number
  }

type CollaboratorStatistic = {
  collaborator: string
  appointmentsCount: number
  revenue: number
  clientsCount: number
  appointments: EnrichedAppointment[]
}

const USE_FAKE_APPOINTMENTS = false

const fakeAppointments: Appointment[] = [
  {
    id: "rdv-1",
    groomingID: "demo",
    userID: "animal-1",
    date: new Date("2026-06-02T09:00:00"),
    serviceID: "F2224FF9-5EDC-499A-A012-89B8294010D7",
    collaborator: "Fcdx",
    phoneNumber: "",
    authorizationID: "",
    duration: 60,
    stripePaymentIntentID: "",
    stripeTransferID: "",
    paymentStatus: "pending",
    serviceName: ""
  },
  {
    id: "rdv-2",
    groomingID: "demo",
    userID: "animal-2",
    date: new Date("2026-06-03T10:30:00"),
    serviceID: "817BEEF3-EBAD-45D8-9BA8-BC917109DD08",
    collaborator: "Fcdx",
    phoneNumber: "",
    authorizationID: "",
    duration: 45,
    stripePaymentIntentID: "",
    stripeTransferID: "",
    paymentStatus: "pending",
    serviceName: ""
  },
  {
    id: "rdv-3",
    groomingID: "demo",
    userID: "animal-3",
    date: new Date("2026-06-04T14:00:00"),
    serviceID: "817BEEF3-EBAD-45D8-9BA8-BC917109DD08",
    collaborator: "Fcdx",
    phoneNumber: "",
    authorizationID: "",
    duration: 60,
    stripePaymentIntentID: "",
    stripeTransferID: "",
    paymentStatus: "pending",
    serviceName: ""
  }
]

function normalizeCollaboratorName(
  collaborator: unknown
): string {
  if (
    typeof collaborator ===
    "string"
  ) {
    return collaborator.trim()
  }

  if (
    collaborator &&
    typeof collaborator ===
    "object"
  ) {
    const value =
      collaborator as Record<
        string,
        unknown
      >

    const possibleName =
      value.name ??
      value.pseudo ??
      value.fullName ??
      value.collaborator ??
      value.nom

    if (
      typeof possibleName ===
      "string"
    ) {
      return possibleName.trim()
    }
  }

  return ""
}

export default function TeamStatsPage() {
  const router =
    useRouter()

  const {
    session
  } =
    useAuth()

  const language =
    session?.user?.language ??
    "fr"

  const professionalID =
    session?.user?.id ??
    ""

    const currency =
      session?.accountType === "sitter"
        ? session.user.devise
        : "EUR"

  const [
    appointments,
    setAppointments
  ] =
    useState<
      Appointment[]
    >([])

  const [
    services,
    setServices
  ] =
    useState<
      ProfessionalService[]
    >([])

  const [
    selectedTab,
    setSelectedTab
  ] =
    useState<TeamStatsTab>(
      "appointments"
    )

  const [
    selectedCollaborator,
    setSelectedCollaborator
  ] =
    useState<
      CollaboratorStatistic | null
    >(null)

  const [
    isLoading,
    setIsLoading
  ] =
    useState(true)

  const [
    error,
    setError
  ] =
    useState("")

    const sessionCollaborators =
      session?.accountType === "grooming" ||
      session?.accountType === "healthcare"
        ? session.user.collaborators
        : []

    const collaborators =
      useMemo(() => {
        const normalizedSessionCollaborators =
          sessionCollaborators
            .map(
              normalizeCollaboratorName
            )
            .filter(Boolean)

        const fakeCollaborators =
          USE_FAKE_APPOINTMENTS
            ? fakeAppointments
                .map(
                  appointment =>
                    normalizeCollaboratorName(
                      appointment.collaborator
                    )
                )
                .filter(Boolean)
            : []

        return Array.from(
          new Set([
            ...normalizedSessionCollaborators,
            ...fakeCollaborators
          ])
        )
      }, [
        sessionCollaborators
      ])

  useEffect(() => {
    if (
      !professionalID
    ) {
      setAppointments([])
      setServices([])
      setSelectedCollaborator(
        null
      )
      setIsLoading(false)

      return
    }

    let isCancelled =
      false

    async function loadStats() {
      try {
        setIsLoading(true)
        setError("")
        setSelectedCollaborator(
          null
        )

          const fetchedServices =
            await fetchServicesForProfessional(
              professionalID
            )

          const fetchedAppointments =
            USE_FAKE_APPOINTMENTS
              ? fakeAppointments
              : await fetchProAppointments(
                  professionalID
                )

        if (
          isCancelled
        ) {
          return
        }

        const normalizedServices =
          fetchedServices
            .map(
              (
                service: unknown
              ): ProfessionalService => {
                const value =
                  service as Record<
                    string,
                    unknown
                  >

                return ({
                id:
                  String(
                    value.id ??
                    value.recordName ??
                    ""
                  ),

                name:
                  String(
                    value.name ??
                    value.title ??
                    value.serviceName ??
                    ""
                  ),

                price:
                  Number(
                    value.price ??
                    0
                  ),

                duration:
                  Number(
                    value.duration ??
                    0
                  )
              })
              }
            )
            .filter(
              (
                service: ProfessionalService
              ) =>
                Boolean(
                  service.id
                )
            )

        setAppointments(
          fetchedAppointments
        )

        setServices(
          normalizedServices
        )
      } catch (
        loadError
      ) {
        if (
          isCancelled
        ) {
          return
        }

        console.error(
          "Erreur lors du chargement des statistiques équipe :",
          loadError
        )

        setAppointments([])
        setServices([])
        setSelectedCollaborator(
          null
        )

        setError(
          translate(
            language,
            "Impossible de charger les statistiques."
          )
        )
      } finally {
        if (
          !isCancelled
        ) {
          setIsLoading(false)
        }
      }
    }

    loadStats()

    return () => {
      isCancelled =
        true
    }
  }, [
    professionalID,
    language
  ])

  const servicesByID =
    useMemo(() => {
      return new Map(
        services.map(
          service => [
            service.id,
            service
          ]
        )
      )
    }, [
      services
    ])

  const enrichedAppointments =
    useMemo<
      EnrichedAppointment[]
    >(() => {
      return appointments.map(
        appointment => {
          const service =
            servicesByID.get(
              appointment.serviceID
            ) ??
            null

          return {
            ...appointment,

            service,

            amount:
              Number(
                service?.price ??
                0
              )
          }
        }
      )
    }, [
      appointments,
      servicesByID
    ])

  const collaboratorStatistics =
    useMemo<
      CollaboratorStatistic[]
    >(() => {
      const statisticsMap =
        new Map<
          string,
          EnrichedAppointment[]
        >()

      collaborators.forEach(
        collaborator => {
          statisticsMap.set(
            collaborator,
            []
          )
        }
      )

      enrichedAppointments.forEach(
        appointment => {
          const collaborator =
            appointment.collaborator
              ?.trim()

          if (
            !collaborator
          ) {
            return
          }

          const officialName =
            collaborators.find(
              item =>
                item.localeCompare(
                  collaborator,
                  undefined,
                  {
                    sensitivity:
                      "accent"
                  }
                ) === 0
            )

          if (
            !officialName
          ) {
            return
          }

          const currentAppointments =
            statisticsMap.get(
              officialName
            ) ??
            []

          currentAppointments.push(
            appointment
          )

          statisticsMap.set(
            officialName,
            currentAppointments
          )
        }
      )

      return Array.from(
        statisticsMap.entries()
      ).map(
        ([
          collaborator,
          collaboratorAppointments
        ]) => {
          const revenue =
            collaboratorAppointments.reduce(
              (
                total,
                appointment
              ) =>
                total +
                appointment.amount,
              0
            )

          const clientsCount =
            new Set(
              collaboratorAppointments
                .map(
                  appointment =>
                    appointment.userID
                )
                .filter(Boolean)
            ).size

          return {
            collaborator,

            appointmentsCount:
              collaboratorAppointments.length,

            revenue,

            clientsCount,

            appointments:
              collaboratorAppointments
          }
        }
      )
    }, [
      collaborators,
      enrichedAppointments
    ])

  const teamRevenue =
    useMemo(() => {
      return enrichedAppointments.reduce(
        (
          total,
          appointment
        ) =>
          total +
          appointment.amount,
        0
      )
    }, [
      enrichedAppointments
    ])

  const uniqueClientsCount =
    useMemo(() => {
      return new Set(
        enrichedAppointments
          .map(
            appointment =>
              appointment.userID
          )
          .filter(Boolean)
      ).size
    }, [
      enrichedAppointments
    ])

  const prestationsCount =
    enrichedAppointments.length

  const collaboratorsCount =
    collaborators.length

  const averageBasket =
    collaboratorsCount >
    0
      ? teamRevenue /
        collaboratorsCount
      : 0

  const sortedCollaboratorStatistics =
    useMemo(() => {
      return [
        ...collaboratorStatistics
      ].sort(
        (
          first,
          second
        ) => {
          switch (
            selectedTab
          ) {
            case "appointments":
              return (
                second.appointmentsCount -
                first.appointmentsCount
              )

            case "revenue":
              return (
                second.revenue -
                first.revenue
              )

            case "clients":
              return (
                second.clientsCount -
                first.clientsCount
              )

            default:
              return 0
          }
        }
      )
    }, [
      collaboratorStatistics,
      selectedTab
    ])

  const selectedModalStatistic =
    useMemo<
      TeamModalStatistic | null
    >(() => {
      if (
        !selectedCollaborator
      ) {
        return null
      }

      const collaboratorAppointments =
        selectedCollaborator
          .appointments

      const collaboratorAverageBasket =
        selectedCollaborator
          .appointmentsCount >
        0
          ? selectedCollaborator
              .revenue /
            selectedCollaborator
              .appointmentsCount
          : 0

      return {
        collaborator:
          selectedCollaborator
            .collaborator,

        collaboratorName:
          selectedCollaborator
            .collaborator,

        appointmentsCount:
          selectedCollaborator
            .appointmentsCount,

        revenue:
          selectedCollaborator
            .revenue,

        clientsCount:
          selectedCollaborator
            .clientsCount,

        averageBasket:
          collaboratorAverageBasket,

        appointments:
          collaboratorAppointments
      }
    }, [
      selectedCollaborator
    ])

  const modalServices =
    useMemo<
      TeamModalService[]
    >(() => {
      return services.map(
        service => ({
          id:
            service.id,

          name:
            service.name,

          price:
            service.price,

          duration:
            service.duration,

          currency
        })
      )
    }, [
      services,
      currency
    ])

  function formatMoney(
    value: number
  ) {
    try {
      return new Intl.NumberFormat(
        language === "fr"
          ? "fr-FR"
          : language,
        {
          style:
            "currency",

          currency,

          minimumFractionDigits:
            2,

          maximumFractionDigits:
            2
        }
      ).format(value)
    } catch {
      return `${value.toFixed(
        2
      )} ${currency}`
    }
  }

  function getCollaboratorValue(
    statistic:
      CollaboratorStatistic
  ) {
    switch (
      selectedTab
    ) {
      case "appointments":
        return `${statistic.appointmentsCount} ${
          statistic.appointmentsCount >
          1
            ? translate(
                language,
                "prestations"
              )
            : translate(
                language,
                "prestation"
              )
        }`

      case "revenue":
        return formatMoney(
          statistic.revenue
        )

      case "clients":
        return `${statistic.clientsCount} ${
          statistic.clientsCount >
          1
            ? translate(
                language,
                "clients"
              )
            : translate(
                language,
                "client"
              )
        }`

      default:
        return ""
    }
  }

  function getCollaboratorInitials(
    collaborator: string
  ) {
    const words =
      collaborator
        .trim()
        .split(/\s+/)
        .filter(Boolean)

    if (
      words.length === 0
    ) {
      return "?"
    }

    return words
      .slice(
        0,
        2
      )
      .map(
        word =>
          word
            .charAt(0)
            .toUpperCase()
      )
      .join("")
  }

  function openTeamModal(
    statistic:
      CollaboratorStatistic
  ) {
    setSelectedCollaborator(
      statistic
    )
  }

  function handleCollaboratorKeyDown(
    event:
      React.KeyboardEvent<HTMLElement>,
    statistic:
      CollaboratorStatistic
  ) {
    if (
      event.key ===
        "Enter" ||
      event.key ===
        " "
    ) {
      event.preventDefault()

      openTeamModal(
        statistic
      )
    }
  }

  if (
    !session?.user
  ) {
    return (
      <main className="teamStatsPage">
        <p className="teamStatsState">
          {translate(
            language,
            "Vous devez être connecté."
          )}
        </p>
      </main>
    )
  }

  return (
    <>
      <main className="teamStatsPage">
        <header className="teamStatsHeader">
          <button
            type="button"
            className="teamStatsBackButton"
            onClick={() =>
              router.back()
            }
            aria-label={translate(
              language,
              "Retour"
            )}
          >
            <ArrowLeft
              size={30}
              strokeWidth={2.4}
            />
          </button>

          <div className="teamStatsHeaderText">
            <h1>
              {translate(
                language,
                "Équipe"
              )}
            </h1>

            <p>
              {translate(
                language,
                "Analysez l’activité de vos collaborateurs."
              )}
            </p>
          </div>

          <div
            className="teamStatsHeaderIcon"
            aria-hidden="true"
          >
            <Store
              size={55}
              strokeWidth={2.1}
            />
          </div>
        </header>

        {isLoading && (
          <p className="teamStatsState">
            {translate(
              language,
              "Chargement des statistiques..."
            )}
          </p>
        )}

        {!isLoading &&
          error && (
            <p className="teamStatsState teamStatsError">
              {error}
            </p>
          )}

        {!isLoading &&
          !error && (
            <>
              <section className="teamStatsSummary">
                <article className="teamStatsSummaryCard">
                  <strong>
                    {formatMoney(
                      teamRevenue
                    )}
                  </strong>

                  <span>
                    {translate(
                      language,
                      "CA équipe"
                    )}
                  </span>
                </article>

                <article className="teamStatsSummaryCard">
                  <strong>
                    {
                      uniqueClientsCount
                    }
                  </strong>

                  <span>
                    {translate(
                      language,
                      "Clients"
                    )}
                  </span>
                </article>

                <article className="teamStatsSummaryCard">
                  <strong>
                    {
                      prestationsCount
                    }
                  </strong>

                  <span>
                    {translate(
                      language,
                      "Prestations"
                    )}
                  </span>
                </article>

                <article className="teamStatsSummaryCard">
                  <strong>
                    {formatMoney(
                      averageBasket
                    )}
                  </strong>

                  <span>
                    {translate(
                      language,
                      "Panier moyen"
                    )}
                  </span>
                </article>
              </section>

              <nav
                className="teamStatsTabs"
                aria-label={translate(
                  language,
                  "Classement de l’équipe"
                )}
              >
                <button
                  type="button"
                  className={
                    selectedTab ===
                    "appointments"
                      ? "teamStatsTab teamStatsTabActive"
                      : "teamStatsTab"
                  }
                  onClick={() =>
                    setSelectedTab(
                      "appointments"
                    )
                  }
                >
                  <CalendarDays
                    size={25}
                  />

                  <span>
                    {translate(
                      language,
                      "Prestations"
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  className={
                    selectedTab ===
                    "revenue"
                      ? "teamStatsTab teamStatsTabActive"
                      : "teamStatsTab"
                  }
                  onClick={() =>
                    setSelectedTab(
                      "revenue"
                    )
                  }
                >
                  <ChartNoAxesCombined
                    size={27}
                  />

                  <span>
                    {translate(
                      language,
                      "Revenu"
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  className={
                    selectedTab ===
                    "clients"
                      ? "teamStatsTab teamStatsTabActive"
                      : "teamStatsTab"
                  }
                  onClick={() =>
                    setSelectedTab(
                      "clients"
                    )
                  }
                >
                  <Users
                    size={27}
                  />

                  <span>
                    {translate(
                      language,
                      "Clients"
                    )}
                  </span>
                </button>
              </nav>

              <section className="teamStatsRanking">
                {sortedCollaboratorStatistics.length ===
                0 ? (
                  <div className="teamStatsEmpty">
                    <Users
                      size={38}
                    />

                    <strong>
                      {translate(
                        language,
                        "Aucune donnée d’équipe"
                      )}
                    </strong>

                    <p>
                      {translate(
                        language,
                        "Les statistiques de vos collaborateurs apparaîtront ici."
                      )}
                    </p>
                  </div>
                ) : (
                  sortedCollaboratorStatistics.map(
                    (
                      statistic,
                      index
                    ) => (
                      <article
                        key={
                          statistic.collaborator
                        }
                        className="teamStatsRankingRow teamStatsRankingRow--clickable"
                        role="button"
                        tabIndex={0}
                        aria-label={`${translate(
                          language,
                          "Afficher les statistiques de"
                        )} ${
                          statistic.collaborator
                        }`}
                        onClick={() =>
                          openTeamModal(
                            statistic
                          )
                        }
                        onKeyDown={event =>
                          handleCollaboratorKeyDown(
                            event,
                            statistic
                          )
                        }
                      >
                        <span className="teamStatsRank">
                          {index + 1}
                        </span>

                        <div className="teamStatsAvatar">
                          {getCollaboratorInitials(
                            statistic.collaborator
                          )}
                        </div>

                        <div className="teamStatsCollaboratorInfo">
                          <strong>
                            {
                              statistic.collaborator
                            }
                          </strong>

                          <span>
                            {translate(
                              language,
                              "Collaborateur"
                            )}
                          </span>
                        </div>

                        <strong className="teamStatsRankingValue">
                          {getCollaboratorValue(
                            statistic
                          )}
                        </strong>
                      </article>
                    )
                  )
                )}
              </section>
            </>
          )}
      </main>

      {selectedCollaborator &&
        selectedModalStatistic && (
          <TeamStatsModal
            statistic={
              selectedModalStatistic
            }
            appointments={
              appointments
            }
            services={
              modalServices
            }
            language={
              language
            }
            currency={
              currency
            }
            onClose={() =>
              setSelectedCollaborator(
                null
              )
            }
          />
        )}
    </>
  )
}
