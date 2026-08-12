"use client"

import {
  useEffect,
  useMemo,
  useState
} from "react"

import {
  ArrowLeft,
  CalendarClock,
  Car,
  ChartNoAxesCombined,
  DoorOpen,
  Footprints,
  House,
  PawPrint,
  Pill,
  Store,
  Sun,
  Users
} from "lucide-react"

import {
  useRouter
} from "next/navigation"

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

import PerformanceStatsModal, {
  type PerformanceModalStatistic
} from "@/app/professional-stats/components/PerformanceStatsModal"

import "./PerformanceStats.css"

type PerformanceTab =
  | "appointments"
  | "profit"
  | "clients"

type ProfessionalService = {
  id: string
  name: string
  description: string
  price: number
  duration: number
  currency: string
}

type EnrichedAppointment =
  Appointment & {
    service:
      | ProfessionalService
      | null

    amount: number
  }

type ServiceStatistic = {
  serviceID: string
  name: string
  description: string

  reservationCount: number
  totalRevenue: number
  averageBasket: number

  duration: number
  averageDuration: number

  uniqueClients: number
}

const USE_FAKE_APPOINTMENTS = false

const fakeAppointments: Appointment[] = [
  {
    id: "rdv-1",
    groomingID: "demo",
    userID: "4448977B-C4B7-4FE8-9E7F-327475E865CE",
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
    userID: "4448977B-C4B7-4FE8-9E7F-327475E865CE",
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
    userID: "4448977B-C4B7-4FE8-9E7F-327475E865CE",
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

function normalizeAppointmentDate(
  value: unknown
): Date | null {
  if (
    value instanceof Date
  ) {
    return Number.isNaN(
      value.getTime()
    )
      ? null
      : value
  }

  if (
    typeof value === "number" ||
    typeof value === "string"
  ) {
    const date =
      new Date(value)

    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date
  }

  return null
}

function normalizeService(
  service: unknown,
  index: number,
  defaultCurrency: string
): ProfessionalService {
  if (
    typeof service === "string"
  ) {
    return {
      id: service,
      name: service,
      description: service,
      price: 0,
      duration: 0,
      currency:
        defaultCurrency
    }
  }

  if (
    service &&
    typeof service === "object"
  ) {
    const value =
      service as Record<
        string,
        unknown
      >

    return {
      id: String(
        value.id ??
        value.recordName ??
        value.serviceID ??
        `service-${index}`
      ),

      name: String(
        value.name ??
        value.title ??
        value.serviceName ??
        value.id ??
        `Service ${index + 1}`
      ),

      description:
        String(
          value.description ??
          value.infos ??
          value.name ??
          value.title ??
          ""
        ),

      price:
        Number(
          value.price ??
          value.tarif ??
          0
        ),

      duration:
        Number(
          value.duration ??
          0
        ),

      currency:
        String(
          value.devise ??
          value.currency ??
          defaultCurrency
        )
    }
  }

  return {
    id: `service-${index}`,
    name: `Service ${index + 1}`,
    description: "",
    price: 0,
    duration: 0,
    currency:
      defaultCurrency
  }
}

function calculateAverageFrequency(
  appointments: Appointment[]
): number {
  const dates =
    appointments
      .map(
        appointment =>
          normalizeAppointmentDate(
            appointment.date
          )
      )
      .filter(
        (
          date
        ): date is Date =>
          date !== null
      )
      .sort(
        (
          first,
          second
        ) =>
          first.getTime() -
          second.getTime()
      )

  if (
    dates.length < 2
  ) {
    return 0
  }

  let totalDays = 0

  for (
    let index = 1;
    index < dates.length;
    index += 1
  ) {
    const difference =
      dates[index].getTime() -
      dates[
        index - 1
      ].getTime()

    totalDays += Math.floor(
      difference /
      (
        1000 *
        60 *
        60 *
        24
      )
    )
  }

  return Math.floor(
    totalDays /
    (
      dates.length -
      1
    )
  )
}

function calculateDaysSinceLastAppointment(
  appointments: Appointment[]
): number | null {
  const now =
    new Date()

  const dates =
    appointments
      .map(
        appointment =>
          normalizeAppointmentDate(
            appointment.date
          )
      )
      .filter(
        (
          date
        ): date is Date =>
          date !== null &&
          date.getTime() <=
            now.getTime()
      )

  if (
    dates.length === 0
  ) {
    return null
  }

  const lastTimestamp =
    Math.max(
      ...dates.map(
        date =>
          date.getTime()
      )
    )

  const difference =
    now.getTime() -
    lastTimestamp

  return Math.max(
    0,
    Math.floor(
      difference /
      (
        1000 *
        60 *
        60 *
        24
      )
    )
  )
}

export default function PerformanceStatsPage() {
  const router =
    useRouter()

  const {
    session
  } =
    useAuth()

  const language =
    session?.user?.language ??
    "fr"

  const accountType =
    session?.accountType ?? ""
    
    const isSitter =
      accountType ===
      "sitter"

  const professionalID =
    session?.user?.id ??
    ""

    const currency =
      session?.accountType === "sitter"
        ? session.user.devise
        : "EUR"

  const sessionUser =
    session?.user

  const [
    services,
    setServices
  ] =
    useState<
      ProfessionalService[]
    >([])

  const [
    appointments,
    setAppointments
  ] =
    useState<
      Appointment[]
    >([])

  const [
    selectedTab,
    setSelectedTab
  ] =
    useState<PerformanceTab>(
      "appointments"
    )

  const [
    selectedService,
    setSelectedService
  ] =
    useState<
      ServiceStatistic | null
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

  useEffect(() => {
    if (
      !professionalID
    ) {
      setServices([])
      setAppointments([])
      setSelectedService(
        null
      )
      setIsLoading(false)

      return
    }

    let isCancelled =
      false

    async function loadPerformance() {
      try {
        setIsLoading(true)
        setError("")
        setSelectedService(
          null
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

          if (
            session?.accountType === "sitter"
          ) {
            const rawSitterServices =
              session.user.services

            const sitterServices =
              Array.isArray(
                rawSitterServices
              )
                ? rawSitterServices
                    .map(
                      (
                        service: unknown,
                        index: number
                      ) =>
                        normalizeService(
                          service,
                          index,
                          currency
                        )
                    )
                    .filter(
                      service =>
                        Boolean(
                          service.id
                        )
                    )
                : []

            setServices(
              sitterServices
            )

            setAppointments(
              fetchedAppointments
            )

            return
          }

        const fetchedServices =
          await fetchServicesForProfessional(
            professionalID
          )

        if (
          isCancelled
        ) {
          return
        }

        const normalizedServices =
          Array.isArray(
            fetchedServices
          )
            ? fetchedServices
                .map(
                  (
                    service:
                      unknown,
                    index:
                      number
                  ) =>
                    normalizeService(
                      service,
                      index,
                      currency
                    )
                )
                .filter(
                  service =>
                    Boolean(
                      service.id
                    )
                )
            : []

        setServices(
          normalizedServices
        )

        setAppointments(
          fetchedAppointments
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
          "Erreur lors du chargement des performances :",
          loadError
        )

        setServices([])
        setAppointments([])
        setSelectedService(
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

    loadPerformance()

    return () => {
      isCancelled =
        true
    }
  }, [
    professionalID,
    isSitter,
    currency,
    language,
    session?.accountType === "sitter"
      ? session.user.services
      : null
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
          if (
            isSitter
          ) {
            const [
              ,
              ,
              price
            ] =
              String(
                appointment.serviceID ??
                ""
              ).split("-")

            return {
              ...appointment,

              service:
                null,

              amount:
                Number(
                  price
                ) ||
                0
            }
          }

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
      isSitter,
      servicesByID
    ])

  const totalIncome =
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
        appointments
          .map(
            appointment =>
              appointment.userID
          )
          .filter(Boolean)
      ).size
    }, [
      appointments
    ])

  const averageIncome =
    appointments.length >
    0
      ? totalIncome /
        appointments.length
      : 0

  const totalDuration =
    useMemo(() => {
      if (
        !isSitter
      ) {
        return 0
      }

      return appointments.reduce(
        (
          total,
          appointment
        ) => {
          const [
            ,
            duration
          ] =
            String(
              appointment.serviceID ??
              ""
            ).split("-")

          const parsedDuration =
            Number(
              duration
            )

          return (
            total +
            (
              parsedDuration ||
              Number(
                appointment.duration ??
                  0
              )
            )
          )
        },
        0
      )
    }, [
      appointments,
      isSitter
    ])

  const averageFrequency =
    useMemo(
      () =>
        calculateAverageFrequency(
          appointments
        ),
      [
        appointments
      ]
    )

  const daysSinceLastAppointment =
    useMemo(
      () =>
        calculateDaysSinceLastAppointment(
          appointments
        ),
      [
        appointments
      ]
    )

  const serviceStatistics =
    useMemo<
      ServiceStatistic[]
    >(() => {
      if (
        isSitter
      ) {
        return []
      }

      return services
        .map(
          service => {
            const serviceAppointments =
              enrichedAppointments.filter(
                appointment =>
                  appointment.serviceID ===
                  service.id
              )

            const reservationCount =
              serviceAppointments.length

            const totalRevenue =
              serviceAppointments.reduce(
                (
                  total,
                  appointment
                ) =>
                  total +
                  appointment.amount,
                0
              )

            const uniqueClients =
              new Set(
                serviceAppointments
                  .map(
                    appointment =>
                      appointment.userID
                  )
                  .filter(Boolean)
              ).size

            const totalDuration =
              serviceAppointments.reduce(
                (
                  total,
                  appointment
                ) =>
                  total +
                  Number(
                    appointment.duration ??
                    service.duration ??
                    0
                  ),
                0
              )

            return {
              serviceID:
                service.id,

              name:
                service.name,

              description:
                service.description,

              reservationCount,

              totalRevenue,

              averageBasket:
                reservationCount >
                0
                  ? totalRevenue /
                    reservationCount
                  : 0,

              duration:
                service.duration,

              averageDuration:
                reservationCount >
                0
                  ? Math.round(
                      totalDuration /
                      reservationCount
                    )
                  : service.duration,

              uniqueClients
            }
          }
        )
        .filter(
          statistic =>
            statistic
              .reservationCount >
            0
        )
    }, [
      services,
      enrichedAppointments,
      isSitter
    ])

  const displayedServiceStatistics =
    useMemo(() => {
      return [
        ...serviceStatistics
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
                second.reservationCount -
                first.reservationCount
              )

            case "profit":
              return (
                second.totalRevenue -
                first.totalRevenue
              )

            case "clients":
              return (
                second.uniqueClients -
                first.uniqueClients
              )

            default:
              return 0
          }
        }
      )
    }, [
      serviceStatistics,
      selectedTab
    ])

  const selectedModalStatistic =
    useMemo<
      PerformanceModalStatistic | null
    >(() => {
      if (
        !selectedService
      ) {
        return null
      }

      return {
        serviceID:
          selectedService.serviceID,

        name:
          selectedService.name,

        description:
          selectedService.description,

        reservationCount:
          selectedService.reservationCount,

        totalRevenue:
          selectedService.totalRevenue,

        averageBasket:
          selectedService.averageBasket,

        duration:
          selectedService.duration,

        averageDuration:
          selectedService.averageDuration,

        uniqueClients:
          selectedService.uniqueClients
      }
    }, [
      selectedService
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
            0,

          maximumFractionDigits:
            1
        }
      ).format(value)
    } catch {
      return `${value.toFixed(
        1
      )} ${currency}`
    }
  }

  function getServiceValue(
    statistic:
      ServiceStatistic
  ) {
    switch (
      selectedTab
    ) {
      case "appointments":
        return String(
          statistic
            .reservationCount
        )

      case "profit":
        return formatMoney(
          statistic
            .totalRevenue
        )

      case "clients":
        return String(
          statistic
            .uniqueClients
        )

      default:
        return ""
    }
  }

  function getServiceIcon(
    serviceName: string
  ) {
    const normalizedName =
      serviceName.toLocaleLowerCase(
        "fr-FR"
      )

    if (
      normalizedName.includes(
        "hébergement"
      ) ||
      normalizedName.includes(
        "hebergement"
      ) ||
      normalizedName.includes(
        "boarding"
      )
    ) {
      return (
        <House
          size={24}
        />
      )
    }

    if (
      normalizedName.includes(
        "promenade"
      ) ||
      normalizedName.includes(
        "walk"
      )
    ) {
      return (
        <Footprints
          size={24}
        />
      )
    }

    if (
      normalizedName.includes(
        "visite"
      ) ||
      normalizedName.includes(
        "visit"
      )
    ) {
      return (
        <DoorOpen
          size={24}
        />
      )
    }

    if (
      normalizedName.includes(
        "garderie"
      ) ||
      normalizedName.includes(
        "day"
      )
    ) {
      return (
        <Sun
          size={24}
        />
      )
    }

    if (
      normalizedName.includes(
        "transport"
      )
    ) {
      return (
        <Car
          size={24}
        />
      )
    }

    if (
      normalizedName.includes(
        "médicament"
      ) ||
      normalizedName.includes(
        "medicament"
      ) ||
      normalizedName.includes(
        "medicine"
      )
    ) {
      return (
        <Pill
          size={24}
        />
      )
    }

    return (
      <PawPrint
        size={24}
      />
    )
  }

  function openPerformanceModal(
    statistic:
      ServiceStatistic
  ) {
    if (
      isSitter
    ) {
      return
    }

    setSelectedService(
      statistic
    )
  }

  function handleServiceKeyDown(
    event:
      React.KeyboardEvent<HTMLElement>,
    statistic:
      ServiceStatistic
  ) {
    if (
      event.key ===
        "Enter" ||
      event.key === " "
    ) {
      event.preventDefault()

      openPerformanceModal(
        statistic
      )
    }
  }

  if (
    !session?.user
  ) {
    return (
      <main className="performanceStatsPage">
        <p className="performanceStatsState">
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
      <main className="performanceStatsPage">
        <header className="performanceStatsHeader">
          <button
            type="button"
            className="performanceStatsBackButton"
            onClick={() =>
              router.back()
            }
            aria-label={translate(
              language,
              "Retour"
            )}
          >
            <ArrowLeft
              size={28}
              strokeWidth={2.4}
            />
          </button>

          <div className="performanceStatsHeaderText">
            <h1>
              {translate(
                language,
                "Performance"
              )}
            </h1>

            <p>
              {translate(
                language,
                "Vue d'ensemble de votre activité"
              )}
            </p>
          </div>

          <ChartNoAxesCombined
            className="performanceStatsHeaderIcon"
            size={62}
            strokeWidth={2.2}
            aria-hidden="true"
          />
        </header>

        {isLoading && (
          <p className="performanceStatsState">
            {translate(
              language,
              "Chargement des statistiques..."
            )}
          </p>
        )}

        {!isLoading &&
          error && (
            <p className="performanceStatsState performanceStatsError">
              {error}
            </p>
          )}

        {!isLoading &&
          !error && (
            <>
              <section className="performanceStatsKPIGrid">
                <article className="performanceStatsKPICard">
                  <strong>
                    {isSitter
                      ? appointments.length
                      : services.length}
                  </strong>

                  <span>
                    {translate(
                      language,
                      isSitter
                        ? "Gardes"
                        : "Prestations"
                    )}
                  </span>
                </article>

                <article className="performanceStatsKPICard">
                  <strong>
                    {isSitter
                      ? uniqueClientsCount
                      : appointments.length}
                  </strong>

                  <span>
                    {translate(
                      language,
                      isSitter
                        ? "Clients"
                        : "Visites"
                    )}
                  </span>
                </article>

                <article className="performanceStatsKPICard">
                  <strong>
                    {formatMoney(
                      totalIncome
                    )}
                  </strong>

                  <span>
                    {translate(
                      language,
                      "Revenus"
                    )}
                  </span>
                </article>

                <article className="performanceStatsKPICard">
                  <strong>
                    {isSitter
                      ? totalDuration
                      : formatMoney(
                          averageIncome
                        )}
                  </strong>

                  <span>
                    {translate(
                      language,
                      isSitter
                        ? "Heure(s)"
                        : "Revenu moyen"
                    )}
                  </span>
                </article>
              </section>

              <section className="performanceStatsInfoGrid">
                <article className="performanceStatsInfoCard">
                  <span>
                    {translate(
                      language,
                      "Fréquence moyenne"
                    )}
                  </span>

                  <strong>
                    {averageFrequency >
                    0
                      ? translate(
                          language,
                          "_ jours"
                        ).replace(
                          "_",
                          String(
                            averageFrequency
                          )
                        )
                      : "-"}
                  </strong>
                </article>

                <article className="performanceStatsInfoCard">
                  <span>
                    {translate(
                      language,
                      isSitter
                        ? "Dernière garde"
                        : "Dernière visite"
                    )}
                  </span>

                  <strong>
                    {daysSinceLastAppointment ===
                    null
                      ? "-"
                      : translate(
                          language,
                          "Il y a _ jours"
                        ).replace(
                          "_",
                          String(
                            daysSinceLastAppointment
                          )
                        )}
                  </strong>
                </article>
              </section>

              {isSitter ? (
                <section className="performanceStatsServicesSection">
                  <h2>
                    {translate(
                      language,
                      "Services proposés"
                    )}
                  </h2>

                  <div className="performanceStatsServiceList">
                    {services.length ===
                    0 ? (
                      <div className="performanceStatsEmpty">
                        <PawPrint
                          size={34}
                        />

                        <strong>
                          {translate(
                            language,
                            "Aucun service proposé"
                          )}
                        </strong>
                      </div>
                    ) : (
                      services.map(
                        service => (
                          <article
                            key={
                              service.id
                            }
                            className="performanceStatsSitterServiceRow"
                          >
                            <div className="performanceStatsServiceIcon">
                              {getServiceIcon(
                                service.name
                              )}
                            </div>

                            <div className="performanceStatsServiceContent">
                              <strong>
                                {translate(
                                  language,
                                  service.name
                                )}
                              </strong>

                              <span>
                                {translate(
                                  language,
                                  service.description ||
                                    service.name
                                )}
                              </span>
                            </div>
                          </article>
                        )
                      )
                    )}
                  </div>
                </section>
              ) : (
                <>
                  <nav
                    className="performanceStatsTabs"
                    aria-label={translate(
                      language,
                      "Classement des prestations"
                    )}
                  >
                    <button
                      type="button"
                      className={
                        selectedTab ===
                        "appointments"
                          ? "performanceStatsTab performanceStatsTabActive"
                          : "performanceStatsTab"
                      }
                      onClick={() =>
                        setSelectedTab(
                          "appointments"
                        )
                      }
                    >
                      <CalendarClock
                        size={23}
                      />

                      <span>
                        {translate(
                          language,
                          "RDV"
                        )}
                      </span>
                    </button>

                    <button
                      type="button"
                      className={
                        selectedTab ===
                        "profit"
                          ? "performanceStatsTab performanceStatsTabActive"
                          : "performanceStatsTab"
                      }
                      onClick={() =>
                        setSelectedTab(
                          "profit"
                        )
                      }
                    >
                      <ChartNoAxesCombined
                        size={24}
                      />

                      <span>
                        {translate(
                          language,
                          "Profit"
                        )}
                      </span>
                    </button>

                    <button
                      type="button"
                      className={
                        selectedTab ===
                        "clients"
                          ? "performanceStatsTab performanceStatsTabActive"
                          : "performanceStatsTab"
                      }
                      onClick={() =>
                        setSelectedTab(
                          "clients"
                        )
                      }
                    >
                      <Users
                        size={24}
                      />

                      <span>
                        {translate(
                          language,
                          "Clients"
                        )}
                      </span>
                    </button>
                  </nav>

                  <section className="performanceStatsRanking">
                    {displayedServiceStatistics.length ===
                    0 ? (
                      <div className="performanceStatsEmpty">
                        <Store
                          size={36}
                        />

                        <strong>
                          {translate(
                            language,
                            "Aucune donnée de performance"
                          )}
                        </strong>

                        <p>
                          {translate(
                            language,
                            "Les statistiques de vos prestations apparaîtront ici."
                          )}
                        </p>
                      </div>
                    ) : (
                      displayedServiceStatistics.map(
                        (
                          statistic,
                          index
                        ) => (
                          <article
                            key={
                              statistic.serviceID
                            }
                            className="performanceStatsRankingRow performanceStatsRankingRow--clickable"
                            role="button"
                            tabIndex={0}
                            aria-label={`${translate(
                              language,
                              "Afficher les performances de"
                            )} ${translate(
                              language,
                              statistic.name
                            )}`}
                            onClick={() =>
                              openPerformanceModal(
                                statistic
                              )
                            }
                            onKeyDown={event =>
                              handleServiceKeyDown(
                                event,
                                statistic
                              )
                            }
                          >
                            <span className="performanceStatsRank">
                              {index + 1}
                            </span>

                            <div className="performanceStatsServiceIcon">
                              {getServiceIcon(
                                statistic.name
                              )}
                            </div>

                            <div className="performanceStatsServiceContent">
                              <strong>
                                {translate(
                                  language,
                                  statistic.name
                                )}
                              </strong>

                              {statistic.description && (
                                <span>
                                  {translate(
                                    language,
                                    statistic.description
                                  )}
                                </span>
                              )}
                            </div>

                            <strong className="performanceStatsRankingValue">
                              {getServiceValue(
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
            </>
          )}
      </main>

      {!isSitter &&
        selectedService &&
        selectedModalStatistic && (
          <PerformanceStatsModal
            statistic={
              selectedModalStatistic
            }
            appointments={
              appointments
            }
            services={
              services
            }
            language={
              language
            }
            currency={
              currency
            }
            accountType={
              accountType
            }
            onClose={() =>
              setSelectedService(
                null
              )
            }
          />
        )}
    </>
  )
}
