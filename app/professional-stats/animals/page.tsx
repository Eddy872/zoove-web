"use client"

import "./AnimalsStats.css"

import Link from "next/link"
import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  ArrowLeft,
  Euro,
  Heart,
  PawPrint,
  RefreshCw,
} from "lucide-react"

import AnimalStatsModal, {
  type AnimalModalStatistic,
  type AnimalModalService,
} from "@/app/professional-stats/components/AnimalStatsModal"

import {
  fetchAnimalAccount,
  type AnimalAccount,
} from "@/services/fetchAnimalAccount"

import {
  fetchServicesForProfessional,
} from "@/services/fetchProfessionalById"

import {
  fetchProAppointments,
  type Appointment,
} from "@/services/appointments"

import { useAuth } from "@/context/AuthContext"
import { translate } from "@/translations/translations"
import type { Language } from "@/context/LanguageContext"

type StatsTab =
  | "expenses"
  | "loyalty"
  | "frequency"

type Service = {
  id: string
  name: string
  description?: string
  price: number
  duration: number
  devise: string
}

type EnrichedAppointment =
  Appointment & {
    service?: Service
    amount: number
  }

type AnimalStatistic = {
  animalID: string
  animal: AnimalAccount | null
  appointmentsCount: number
  totalExpenses: number
  averageDaysBetweenAppointments:
    | number
    | null
  appointments: EnrichedAppointment[]
}

type AnimalStats = {
  animalsCount: number
  reservationsCount: number
  totalExpenses: number
  averageExpense: number
  averageFrequency: number
  daysSinceLastVisit:
    | number
    | null
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

function parseAppointmentDate(
  value: unknown
): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(
      value.getTime()
    )
      ? null
      : value
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    const date = new Date(value)

    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date
  }

  return null
}

function startOfDay(
  date: Date
): Date {
  const result = new Date(date)

  result.setHours(
    0,
    0,
    0,
    0
  )

  return result
}

function differenceInDays(
  laterDate: Date,
  earlierDate: Date
): number {
  const millisecondsPerDay =
    1000 *
    60 *
    60 *
    24

  const later =
    startOfDay(
      laterDate
    ).getTime()

  const earlier =
    startOfDay(
      earlierDate
    ).getTime()

  return Math.max(
    0,
    Math.round(
      (
        later -
        earlier
      ) /
        millisecondsPerDay
    )
  )
}

function formatMoney(
  value: number,
  language: Language,
  currency = "EUR"
) {
  try {
    return new Intl.NumberFormat(
      language === "fr"
        ? "fr-FR"
        : language,
      {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }
    ).format(value)
  } catch {
    return `${value.toFixed(2)} ${currency}`
  }
}

function calculateFavoriteService(
  appointments:
    EnrichedAppointment[]
) {
  const serviceCounts =
    new Map<string, number>()

  appointments.forEach(
    appointment => {
      const serviceName =
        appointment.service?.name

      if (!serviceName) {
        return
      }

      serviceCounts.set(
        serviceName,
        (
          serviceCounts.get(
            serviceName
          ) ?? 0
        ) + 1
      )
    }
  )

  const favoriteService =
    Array.from(
      serviceCounts.entries()
    ).sort(
      (
        first,
        second
      ) =>
        second[1] -
        first[1]
    )[0]

  return {
    name:
      favoriteService?.[0] ??
      "",

    count:
      favoriteService?.[1] ??
      0,
  }
}

export default function AnimalsStatsPage() {
  const { session } = useAuth()
    
    if (
      !session ||
      session.accountType === "animal"
    ) {
      return
    }

  const language =
    session?.user?.language ??
    "fr"

  const accountType =
    session?.accountType ??
    ""

    const currency =
      session?.accountType === "sitter"
        ? session.user.devise
        : "EUR"

  const [
    error,
    setError,
  ] =
    useState("")

  const [
    animals,
    setAnimals,
  ] =
    useState<
      AnimalAccount[]
    >([])

  const [
    appointments,
    setAppointments,
  ] =
    useState<
      Appointment[]
    >([])

  const [
    services,
    setServices,
  ] =
    useState<
      Service[]
    >([])

  const [
    selectedTab,
    setSelectedTab,
  ] =
    useState<StatsTab>(
      "expenses"
    )

  const [
    selectedAnimal,
    setSelectedAnimal,
  ] =
    useState<
      AnimalStatistic | null
    >(null)

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true)

  async function fetchAnimalsFromAppointments(
    fetchedAppointments:
      Appointment[]
  ): Promise<
    AnimalAccount[]
  > {
    const animalIDs = [
      ...new Set(
        fetchedAppointments
          .map(
            appointment =>
              String(
                appointment.userID ??
                  ""
              )
          )
          .filter(Boolean)
      ),
    ]

    const animalsResults =
      await Promise.all(
        animalIDs.map(
          animalID =>
            fetchAnimalAccount(
              animalID
            )
        )
      )

    return animalsResults.filter(
      (
        animal
      ): animal is AnimalAccount =>
        animal !== null
    )
  }

  useEffect(() => {
    async function loadStats() {
      if (
        !session?.user?.id
      ) {
        setAppointments([])
        setAnimals([])
        setServices([])
        setIsLoading(false)

        return
      }

      try {
        setIsLoading(true)
        setError("")

          const fetchedAppointments =
            USE_FAKE_APPOINTMENTS
              ? fakeAppointments
              : await fetchProAppointments(
                  session.user.id
                )

        const fetchedAnimals =
          await fetchAnimalsFromAppointments(
            fetchedAppointments
          )

        const fetchedServices =
          session.accountType ===
          "sitter"
            ? []
            : await fetchServicesForProfessional(
                session.user.id
              )

        setAppointments(
          fetchedAppointments
        )

        setAnimals(
          fetchedAnimals
        )

        setServices(
          fetchedServices
        )
      } catch (
        loadError
      ) {
        console.error(
          "Erreur lors du chargement des statistiques animaux :",
          loadError
        )

        setAppointments([])
        setAnimals([])
        setServices([])

        setError(
          translate(
            language,
            "Impossible de charger les statistiques."
          )
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [
    language,
    session?.user?.id,
    session?.accountType,
  ])

  const animalsByID =
    useMemo(() => {
      return new Map(
        animals.map(
          animal => [
            animal.id,
            animal,
          ]
        )
      )
    }, [animals])

  const servicesByID =
    useMemo(() => {
      return new Map(
        services.map(
          service => [
            service.id,
            service,
          ]
        )
      )
    }, [services])

  const enrichedAppointments =
    useMemo<
      EnrichedAppointment[]
    >(() => {
      return appointments.map(
        appointment => {
          if (
            accountType ===
            "sitter"
          ) {
            const [
              serviceName,
              durationValue,
              priceValue,
            ] =
              String(
                appointment.serviceID ??
                  ""
              ).split("-")

            const duration =
              Number(
                durationValue
              ) || 0

            const price =
              Number(
                priceValue
              ) || 0

            return {
              ...appointment,

              duration,

              service: {
                id:
                  appointment.serviceID,

                name:
                  serviceName
                    ? translate(
                        language,
                        serviceName
                      )
                    : translate(
                        language,
                        "Garde"
                      ),

                price,
                duration,
                devise: currency,
              },

              amount: price,
            }
          }

          const service =
            servicesByID.get(
              appointment.serviceID
            )

          return {
            ...appointment,
            service,
            amount:
              service?.price ??
              0,
          }
        }
      )
    }, [
      appointments,
      servicesByID,
      accountType,
      language,
      currency,
    ])

  const animalStatistics =
    useMemo<
      AnimalStatistic[]
    >(() => {
      const appointmentsByAnimal =
        new Map<
          string,
          EnrichedAppointment[]
        >()

      enrichedAppointments.forEach(
        appointment => {
          const animalID =
            String(
              appointment.userID ??
                ""
            )

          if (!animalID) {
            return
          }

          const currentAppointments =
            appointmentsByAnimal.get(
              animalID
            ) ?? []

          currentAppointments.push(
            appointment
          )

          appointmentsByAnimal.set(
            animalID,
            currentAppointments
          )
        }
      )

      return Array.from(
        appointmentsByAnimal.entries()
      )
        .map(
          ([
            animalID,
            animalAppointments,
          ]) => {
            const sortedAppointments =
              [
                ...animalAppointments,
              ].sort(
                (
                  first,
                  second
                ) => {
                  const firstDate =
                    parseAppointmentDate(
                      first.date
                    )?.getTime() ??
                    0

                  const secondDate =
                    parseAppointmentDate(
                      second.date
                    )?.getTime() ??
                    0

                  return (
                    firstDate -
                    secondDate
                  )
                }
              )

            const totalExpenses =
              sortedAppointments.reduce(
                (
                  total,
                  appointment
                ) =>
                  total +
                  appointment.amount,
                0
              )

            const intervalsInDays:
              number[] = []

            for (
              let index = 1;
              index <
              sortedAppointments.length;
              index += 1
            ) {
              const previousDate =
                parseAppointmentDate(
                  sortedAppointments[
                    index - 1
                  ].date
                )

              const currentDate =
                parseAppointmentDate(
                  sortedAppointments[
                    index
                  ].date
                )

              if (
                !previousDate ||
                !currentDate
              ) {
                continue
              }

              intervalsInDays.push(
                differenceInDays(
                  currentDate,
                  previousDate
                )
              )
            }

            const averageDaysBetweenAppointments =
              intervalsInDays.length >
              0
                ? intervalsInDays.reduce(
                    (
                      total,
                      days
                    ) =>
                      total +
                      days,
                    0
                  ) /
                  intervalsInDays.length
                : null

            return {
              animalID,

              animal:
                animalsByID.get(
                  animalID
                ) ?? null,

              appointmentsCount:
                sortedAppointments.length,

              totalExpenses,

              averageDaysBetweenAppointments,

              appointments:
                sortedAppointments,
            }
          }
        )
        .sort(
          (
            first,
            second
          ) =>
            second.totalExpenses -
            first.totalExpenses
        )
    }, [
      enrichedAppointments,
      animalsByID,
    ])

  const stats =
    useMemo<
      AnimalStats
    >(() => {
      const validDates =
        enrichedAppointments
          .map(
            appointment =>
              parseAppointmentDate(
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

      const uniqueAnimalIDs =
        new Set(
          enrichedAppointments
            .map(
              appointment =>
                appointment.userID
            )
            .filter(Boolean)
        )

      const totalExpenses =
        enrichedAppointments.reduce(
          (
            sum,
            appointment
          ) =>
            sum +
            appointment.amount,
          0
        )

      const reservationsCount =
        enrichedAppointments.length

      const averageExpense =
        reservationsCount > 0
          ? totalExpenses /
            reservationsCount
          : 0

      const intervals:
        number[] = []

      for (
        let index = 1;
        index <
        validDates.length;
        index += 1
      ) {
        intervals.push(
          differenceInDays(
            validDates[index],
            validDates[
              index - 1
            ]
          )
        )
      }

      const averageFrequency =
        intervals.length > 0
          ? intervals.reduce(
              (
                sum,
                interval
              ) =>
                sum +
                interval,
              0
            ) /
            intervals.length
          : 0

      const now =
        new Date()

      const pastDates =
        validDates.filter(
          date =>
            date.getTime() <=
            now.getTime()
        )

      const lastVisitDate =
        pastDates.length > 0
          ? pastDates[
              pastDates.length -
                1
            ]
          : null

      return {
        animalsCount:
          uniqueAnimalIDs.size,

        reservationsCount,

        totalExpenses,

        averageExpense,

        averageFrequency:
          Math.round(
            averageFrequency
          ),

        daysSinceLastVisit:
          lastVisitDate
            ? differenceInDays(
                now,
                lastVisitDate
              )
            : null,
      }
    }, [
      enrichedAppointments,
    ])

  function getAnimalStatisticValue(
    statistic:
      AnimalStatistic
  ) {
    switch (
      selectedTab
    ) {
      case "expenses":
        return formatMoney(
          statistic.totalExpenses,
          language,
          currency
        )

      case "loyalty":
        return `${statistic.appointmentsCount} ${translate(
          language,
          "rendez-vous"
        )}`

      case "frequency":
        if (
          statistic.averageDaysBetweenAppointments ===
          null
        ) {
          return translate(
            language,
            "Pas assez de rendez-vous"
          )
        }

        return `${Math.round(
          statistic.averageDaysBetweenAppointments
        )} ${translate(
          language,
          "jours"
        )}`
    }
  }

  const selectedModalStatistic =
    useMemo<
      AnimalModalStatistic | null
    >(() => {
      if (
        !selectedAnimal
      ) {
        return null
      }

      const favoriteService =
        calculateFavoriteService(
          selectedAnimal.appointments
        )

      const averageBasket =
        selectedAnimal.appointmentsCount >
        0
          ? selectedAnimal.totalExpenses /
            selectedAnimal.appointmentsCount
          : 0

      return {
        userID:
          selectedAnimal.animalID,

        name:
          selectedAnimal.animal
            ?.name ||
          translate(
            language,
            "Animal Zoove"
          ),

        photo:
          selectedAnimal.animal
            ?.photo ??
          null,

        reservationCount:
          selectedAnimal.appointmentsCount,

        totalSpent:
          selectedAnimal.totalExpenses,

        averageBasket,

        averageFrequencyDays:
          selectedAnimal.averageDaysBetweenAppointments ??
          0,

        favoriteService:
          favoriteService.name ||
          translate(
            language,
            accountType ===
              "sitter"
              ? "Garde"
              : "Prestation"
          ),

        favoriteServiceCount:
          favoriteService.count,
      }
    }, [
      selectedAnimal,
      language,
      accountType,
    ])

  const modalServices =
    useMemo<
      AnimalModalService[]
    >(() => {
      return services.map(
        service => ({
          id: service.id,
          name: service.name,
          description:
            service.description,
          price:
            service.price,
          duration:
            service.duration,
          devise:
            service.devise,
        })
      )
    }, [services])

  function openAnimalModal(
    statistic:
      AnimalStatistic
  ) {
    setSelectedAnimal(
      statistic
    )
  }

  function handleAnimalKeyDown(
    event:
      React.KeyboardEvent<HTMLElement>,
    statistic:
      AnimalStatistic
  ) {
    if (
      event.key ===
        "Enter" ||
      event.key === " "
    ) {
      event.preventDefault()

      openAnimalModal(
        statistic
      )
    }
  }

  if (isLoading) {
    return (
      <main className="animalsStatsPage">
        <div className="animalsStatsLoading">
          <span className="animalsStatsSpinner" />

          <p>
            {translate(
              language,
              "Chargement..."
            )}
          </p>
        </div>
      </main>
    )
  }

  return (
    <>
      <main className="animalsStatsPage">
        <div className="animalsStatsContainer">
          <header className="animalsStatsHeader">
            <Link
              href="/professional-stats"
              className="animalsStatsBackButton"
              aria-label={translate(
                language,
                "Retour"
              )}
            >
              <ArrowLeft
                size={34}
                strokeWidth={2}
              />
            </Link>

            <div className="animalsStatsHeaderText">
              <h1>
                {translate(
                  language,
                  "Animaux"
                )}
              </h1>

              <p>
                {translate(
                  language,
                  "Fiches animaux et fidélisation"
                )}
              </p>
            </div>

            <PawPrint
              className="animalsStatsHeaderIcon"
              size={70}
              strokeWidth={1.8}
            />
          </header>

          {error && (
            <div className="animalsStatsError">
              {error}
            </div>
          )}

          <section className="animalsStatsGrid">
            <article className="animalsStatsCard">
              <strong className="animalsStatsCardValue">
                {
                  stats.animalsCount
                }
              </strong>

              <span className="animalsStatsCardLabel">
                {translate(
                  language,
                  "Animaux"
                )}
              </span>
            </article>

            <article className="animalsStatsCard">
              <strong className="animalsStatsCardValue">
                {
                  stats.reservationsCount
                }
              </strong>

              <span className="animalsStatsCardLabel">
                {translate(
                  language,
                  "Réservations"
                )}
              </span>
            </article>

            <article className="animalsStatsCard">
              <strong className="animalsStatsCardValue">
                {formatMoney(
                  stats.totalExpenses,
                  language,
                  currency
                )}
              </strong>

              <span className="animalsStatsCardLabel">
                {translate(
                  language,
                  "Dépenses totales"
                )}
              </span>
            </article>

            <article className="animalsStatsCard">
              <strong className="animalsStatsCardValue">
                {formatMoney(
                  stats.averageExpense,
                  language,
                  currency
                )}
              </strong>

              <span className="animalsStatsCardLabel">
                {translate(
                  language,
                  "Dépense moyenne"
                )}
              </span>
            </article>

            <article className="animalsStatsCard animalsStatsCard--information">
              <span className="animalsStatsSmallLabel">
                {translate(
                  language,
                  "Fréquence moyenne"
                )}
              </span>

              <strong className="animalsStatsInformationValue">
                {
                  stats.averageFrequency
                }{" "}
                {translate(
                  language,
                  "jours"
                )}
              </strong>
            </article>

            <article className="animalsStatsCard animalsStatsCard--information">
              <span className="animalsStatsSmallLabel">
                {translate(
                  language,
                  accountType ===
                    "sitter"
                    ? "Dernière garde"
                    : "Dernière visite"
                )}
              </span>

              <strong className="animalsStatsInformationValue">
                {stats.daysSinceLastVisit ===
                null
                  ? translate(
                      language,
                      accountType ===
                        "sitter"
                        ? "Aucune garde"
                        : "Aucune visite"
                    )
                  : translate(
                      language,
                      "Il y a _ jours"
                    ).replace(
                      "_",
                      String(
                        stats.daysSinceLastVisit
                      )
                    )}
              </strong>
            </article>
          </section>

          <nav className="animalsStatsTabs">
            <button
              type="button"
              className={`animalsStatsTab ${
                selectedTab ===
                "expenses"
                  ? "animalsStatsTab--active"
                  : ""
              }`}
              onClick={() =>
                setSelectedTab(
                  "expenses"
                )
              }
            >
              <span className="animalsStatsTabIcon">
                <Euro
                  size={21}
                />
              </span>

              <span>
                {translate(
                  language,
                  "Dép."
                )}
              </span>
            </button>

            <button
              type="button"
              className={`animalsStatsTab ${
                selectedTab ===
                "loyalty"
                  ? "animalsStatsTab--active"
                  : ""
              }`}
              onClick={() =>
                setSelectedTab(
                  "loyalty"
                )
              }
            >
              <Heart
                size={27}
              />

              <span>
                {translate(
                  language,
                  "Fidélité"
                )}
              </span>
            </button>

            <button
              type="button"
              className={`animalsStatsTab ${
                selectedTab ===
                "frequency"
                  ? "animalsStatsTab--active"
                  : ""
              }`}
              onClick={() =>
                setSelectedTab(
                  "frequency"
                )
              }
            >
              <RefreshCw
                size={27}
              />

              <span>
                {translate(
                  language,
                  "Fréq."
                )}
              </span>
            </button>
          </nav>

          <section className="animalsStatsHistory">
            {animalStatistics.length >
            0 ? (
              <div className="animalsStatsAppointmentList">
                {animalStatistics.map(
                  statistic => {
                    const animal =
                      statistic.animal

                    return (
                      <article
                        key={
                          statistic.animalID
                        }
                        className="animalsStatsAppointment animalsStatsAppointment--clickable"
                        role="button"
                        tabIndex={0}
                        aria-label={`${translate(
                          language,
                          "Afficher les statistiques de"
                        )} ${
                          animal?.name ||
                          translate(
                            language,
                            "Animal Zoove"
                          )
                        }`}
                        onClick={() =>
                          openAnimalModal(
                            statistic
                          )
                        }
                        onKeyDown={event =>
                          handleAnimalKeyDown(
                            event,
                            statistic
                          )
                        }
                      >
                        <div className="animalsStatsAppointmentIcon">
                          {animal?.photo ? (
                            <img
                              src={
                                animal.photo
                              }
                              alt={
                                animal.name ||
                                translate(
                                  language,
                                  "Animal"
                                )
                              }
                              className="animalsStatsAppointmentPhoto"
                            />
                          ) : (
                            <PawPrint
                              size={22}
                            />
                          )}
                        </div>

                        <div className="animalsStatsAppointmentContent">
                          <strong>
                            {animal?.name ||
                              translate(
                                language,
                                "Animal Zoove"
                              )}
                          </strong>

                          <span>
                            {animal?.species ||
                              translate(
                                language,
                                "Espèce non renseignée"
                              )}
                          </span>
                        </div>

                        <strong className="animalsStatsAppointmentPrice">
                          {getAnimalStatisticValue(
                            statistic
                          )}
                        </strong>
                      </article>
                    )
                  }
                )}
              </div>
            ) : (
              <div className="animalsStatsEmpty">
                <PawPrint
                  size={38}
                />

                <strong>
                  {translate(
                    language,
                    "Aucune réservation"
                  )}
                </strong>

                <p>
                  {translate(
                    language,
                    "Les réservations de cet animal apparaîtront ici."
                  )}
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      {selectedAnimal &&
        selectedModalStatistic && (
          <AnimalStatsModal
            statistic={
              selectedModalStatistic
            }
            appointments={
              selectedAnimal.appointments
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
            accountType={
              accountType
            }
            onClose={() =>
              setSelectedAnimal(
                null
              )
            }
          />
        )}
    </>
  )
}
