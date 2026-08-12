"use client"

import "./MarketStats.css"

import Link from "next/link"

import {
  ArrowLeft,
  Globe,
  Map,
  MapPinned,
  TrendingUp,
} from "lucide-react"
import {
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  fetchMarketProfessionals,
} from "@/services/fetchProfessionals"
import {
  fetchProAppointments,
  type Appointment
} from "@/services/appointments"
import { useAuth } from "@/context/AuthContext"
import { translate } from "@/translations/translations"

type MarketScope = "city" | "country" | "world"

type ProfessionalAccountType =
  | "grooming"
  | "healthcare"
  | "sitter"

type TestService = {
  id: string
  professionalID: string
  name: string
  price: number
}

type TestAppointment = {
  id: string
  groomingID: string
  userID: string
  serviceID: string
}

type TestFeedback = {
  id: string
  cleanRate: number
  homeRate: number
  frameRate: number
  qualityRate: number
}

type TestBuyer = {
  id: string
  skill: number
  fiability: number
  engagement: number
  affinity: number
}

type TestProfessional = {
  id: string
  accountType: ProfessionalAccountType
  name: string
  city: string
  country: string
  userIDs: string[]
  buyers: TestBuyer[]
  services: TestService[]
  feedbacks: TestFeedback[]
  rating: number
}

type StatisticID =
  | "clients"
  | "appointments"
  | "revenue"
  | "basket"
  | "services"
  | "reviews"
  | "rating"
  | "loyalty"

type MarketStatistic = {
  id: StatisticID
  title: string
  value: number
  average: number
  max: number
  rank: number
  total: number
  suffix?: string
  decimals?: number
}

type CalculatedProfessionalStatistics = {
  professionalID: string
  clients: number
  appointments: number
  revenue: number
  basket: number
  services: number
  reviews: number
  rating: number
  loyalty: number
}

type ProfessionalSeed = {
  id: string
  name: string
  city: string
  country: string
  clients: number
  services: number
  reviews: number
  rating: number
  appointments: number
  returningClients: number
  prices: number[]
}

function createIDs(
  prefix: string,
  count: number
): string[] {
  return Array.from(
    { length: count },
    (_, index) => `${prefix}-${index + 1}`
  )
}

function createFeedbacks(
  prefix: string,
  count: number,
  rating: number
): TestFeedback[] {
  return Array.from(
    { length: count },
    (_, index) => ({
      id: `${prefix}-${index + 1}`,
      cleanRate: rating,
      homeRate: Math.max(1, rating - 0.1),
      frameRate: Math.min(5, rating + 0.1),
      qualityRate: rating,
    })
  )
}

function createBuyers(
  prefix: string,
  count: number,
  rating: number
): TestBuyer[] {
  return Array.from(
    { length: count },
    (_, index) => ({
      id: `${prefix}-${index + 1}`,
      skill: rating,
      fiability: Math.max(1, rating - 0.1),
      engagement: rating,
      affinity: Math.min(5, rating + 0.1),
    })
  )
}

function createServices(
  professionalID: string,
  count: number,
  prices: number[]
): TestService[] {
  return Array.from(
    { length: count },
    (_, index) => ({
      id: `${professionalID}-service-${index + 1}`,
      professionalID,
      name: `Prestation ${index + 1}`,
      price:
        prices[index % prices.length] ??
        0,
    })
  )
}

function createAppointments(
  professional: TestProfessional,
  count: number,
  returningClients: number,
  sitterPrices: number[]
): TestAppointment[] {
  const clientIDs =
    professional.accountType === "sitter"
      ? professional.buyers.map(
          buyer => buyer.id
        )
      : professional.userIDs

  if (clientIDs.length === 0) {
    return []
  }

  return Array.from(
    { length: count },
    (_, index) => {
      const repeatedClientCount =
        Math.min(
          returningClients,
          clientIDs.length
        )

      const clientIndex =
        index < repeatedClientCount * 2
          ? index % repeatedClientCount
          : index % clientIDs.length

      const userID =
        clientIDs[clientIndex]

      if (
        professional.accountType ===
        "sitter"
      ) {
        const price =
          sitterPrices[
            index %
              sitterPrices.length
          ] ?? 0

        const duration =
          (index % 6) + 1

        return {
          id: `${professional.id}-rdv-${index + 1}`,
          groomingID:
            professional.id,
          userID,
          serviceID:
            `Sitting-${duration}-${price}`,
        }
      }

      const service =
        professional.services[
          index %
            professional.services.length
        ]

      return {
        id: `${professional.id}-rdv-${index + 1}`,
        groomingID:
          professional.id,
        userID,
        serviceID:
          service?.id ?? "",
      }
    }
  )
}

function average(
  values: number[]
): number {
  if (values.length === 0) {
    return 0
  }

  return (
    values.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / values.length
  )
}

function round(
  value: number,
  decimals = 0
): number {
  const multiplier =
    10 ** decimals

  return (
    Math.round(
      value * multiplier
    ) / multiplier
  )
}

export default function MarketPage() {
  const { session } = useAuth()

  const language =
    session?.user?.language ?? "fr"

  const city =
    session?.user?.city ?? "Marseille"

  const country =
    session?.user?.country ?? "France"

  const accountType =
    (
      session?.accountType ??
      "grooming"
    ) as ProfessionalAccountType

  const currentProfessionalID =
    session?.user?.id ?? ""

  const [scope, setScope] =
    useState<MarketScope>("city")

  const [
    professionals,
    setProfessionals,
  ] = useState<TestProfessional[]>([])

    const [
      appointments,
      setAppointments,
    ] = useState<Appointment[]>([])

  const [
    loading,
    setLoading,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState("")

    useEffect(() => {
      if (
        !session?.user?.id ||
        !session?.accountType
      ) {
        return
      }

      let cancelled = false

      async function loadMarketData() {
        try {
          setLoading(true)
          setError("")
            console.log({
              accountType,
              scope,
              city,
              country,
            })
            const fetchedProfessionals =
              await fetchMarketProfessionals({
                accountType,
                scope,
                city,
                country,
              })
            console.log(
              "Professionnels récupérés :",
              fetchedProfessionals
            )

          if (cancelled) {
            return
          }

          const normalizedProfessionals:
            TestProfessional[] =
            fetchedProfessionals.map(
              (professional: any) => {
                const normalizedType:
                  ProfessionalAccountType =
                  professional.type ===
                  "Sitter"
                    ? "sitter"
                    : professional.type ===
                        "Healthcare"
                      ? "healthcare"
                      : "grooming"

                return {
                  id:
                    professional.id,

                  accountType:
                    normalizedType,

                  name:
                    professional.name ?? "",

                  city:
                    professional.city ?? "",

                  country:
                    professional.country ?? "",

                  userIDs:
                    Array.isArray(
                      professional.userIDs
                    )
                      ? professional.userIDs
                      : [],

                  buyers:
                    Array.isArray(
                      professional.buyers
                    )
                      ? professional.buyers
                      : [],

                  services:
                    Array.isArray(
                      professional.services
                    )
                      ? professional.services
                      : [],

                  feedbacks:
                    Array.isArray(
                      professional.feedbacks
                    )
                      ? professional.feedbacks
                      : [],

                  rating:
                    Number(
                      professional.rating
                    ) || 0,
                }
              }
            )

          /*
           * On récupère les rendez-vous de
           * chaque professionnel en parallèle.
           */
          const appointmentsResults =
            await Promise.all(
              normalizedProfessionals.map(
                async professional => {
                  try {
                    return await fetchProAppointments(
                      professional.id
                    )
                  } catch (
                    appointmentError
                  ) {
                    console.error(
                      `Erreur RDV pour ${professional.id} :`,
                      appointmentError
                    )

                    return []
                  }
                }
              )
            )

          if (cancelled) {
            return
          }

          const fetchedAppointments =
            appointmentsResults.flat()

          setProfessionals(
            normalizedProfessionals
          )

          setAppointments(
            fetchedAppointments
          )
        } catch (fetchError) {
          console.error(
            "Erreur chargement marché :",
            fetchError
          )

          if (!cancelled) {
            setProfessionals([])
            setAppointments([])

            setError(
              translate(
                language,
                "Impossible de charger les données du marché."
              )
            )
          }
        } finally {
          if (!cancelled) {
            setLoading(false)
          }
        }
      }

      loadMarketData()

      return () => {
        cancelled = true
      }
    }, [
      language,
      scope,
      session?.accountType,
      session?.user?.city,
      session?.user?.country,
      session?.user?.id,
    ])



  function getProfessionalRevenue(
    professional: TestProfessional,
    professionalAppointments:
      Appointment[]
  ) {
    if (
      professional.accountType ===
      "sitter"
    ) {
      return professionalAppointments.reduce(
        (total, appointment) => {
          const [, , price] =
            appointment.serviceID.split(
              "-"
            )

          return (
            total +
            (Number(price) || 0)
          )
        },
        0
      )
    }

    return professionalAppointments.reduce(
      (total, appointment) => {
        const service =
          professional.services.find(
            item =>
              item.id ===
              appointment.serviceID
          )

        return (
          total +
          (Number(service?.price) ||
            0)
        )
      },
      0
    )
  }

  function getProfessionalRating(
    professional: TestProfessional
  ) {
    /*
     * La note est déjà calculée dans
     * fetchProfessionals.ts.
     */
    if (
      Number(professional.rating) >
      0
    ) {
      return Number(
        professional.rating
      )
    }

    if (
      professional.accountType ===
      "sitter"
    ) {
      const validBuyers =
        professional.buyers.filter(
          buyer =>
            buyer &&
            typeof buyer === "object"
        )

      const ratings =
        validBuyers.map(
          buyer =>
            (
              Number(
                buyer.skill ?? 0
              ) +
              Number(
                buyer.fiability ?? 0
              ) +
              Number(
                buyer.engagement ?? 0
              ) +
              Number(
                buyer.affinity ?? 0
              )
            ) / 4
        )

      return average(ratings)
    }

    const ratings =
      professional.feedbacks.map(
        feedback =>
          (
            Number(
              feedback.cleanRate ?? 0
            ) +
            Number(
              feedback.homeRate ?? 0
            ) +
            Number(
              feedback.frameRate ?? 0
            ) +
            Number(
              feedback.qualityRate ?? 0
            )
          ) / 4
      )

    return average(ratings)
  }

  function getProfessionalLoyalty(
    professionalAppointments:
      Appointment[]
  ) {
    const appointmentsByClient =
      professionalAppointments.reduce<
        Record<string, number>
      >(
        (
          result,
          appointment
        ) => {
          result[appointment.userID] =
            (
              result[
                appointment.userID
              ] ?? 0
            ) + 1

          return result
        },
        {}
      )

    const clientCounts =
      Object.values(
        appointmentsByClient
      )

    if (
      clientCounts.length === 0
    ) {
      return 0
    }

    const returningClients =
      clientCounts.filter(
        count => count >= 2
      ).length

    return (
      returningClients /
      clientCounts.length
    ) * 100
  }

    const calculatedProfessionals =
      useMemo<
        CalculatedProfessionalStatistics[]
      >(() => {
        return professionals.map(
          professional => {
            const professionalAppointments =
              appointments.filter(
                appointment =>
                  appointment.groomingID ===
                  professional.id
              )

            const uniqueClientIDs =
              new Set(
                professionalAppointments
                  .map(
                    appointment =>
                      appointment.userID
                  )
                  .filter(Boolean)
              )

            const clients =
              uniqueClientIDs.size

            const revenue =
              getProfessionalRevenue(
                professional,
                professionalAppointments
              )

            return {
              professionalID:
                professional.id,

              clients,

              appointments:
                professionalAppointments.length,

              revenue,

              basket:
                professionalAppointments
                  .length > 0
                  ? revenue /
                    professionalAppointments
                      .length
                  : 0,

              services:
                professional.services.length,

              reviews:
                professional.accountType ===
                "sitter"
                  ? professional.buyers.length
                  : professional.feedbacks
                      .length,

              rating:
                getProfessionalRating(
                  professional
                ),

              loyalty:
                getProfessionalLoyalty(
                  professionalAppointments
                ),
            }
          }
        )
      }, [
        appointments,
        professionals,
      ])

  function getRank(
    statisticID: StatisticID,
    professionalID: string
  ) {
    const sorted =
      [...calculatedProfessionals]
        .sort(
          (first, second) =>
            second[statisticID] -
            first[statisticID]
        )

    const index =
      sorted.findIndex(
        professional =>
          professional.professionalID ===
          professionalID
      )

    return index >= 0
      ? index + 1
      : 0
  }

  const statistics =
    useMemo<MarketStatistic[]>(() => {
      const currentStatistics =
        calculatedProfessionals.find(
          professional =>
            professional.professionalID ===
            currentProfessionalID
        )

      if (!currentStatistics) {
        return []
      }
        
        const safeCurrentStatistics =
          currentStatistics

      function createStatistic(
        id: StatisticID,
        title: string,
        suffix?: string,
        decimals = 0
      ): MarketStatistic {
        const values =
          calculatedProfessionals.map(
            professional =>
              professional[id]
          )

        return {
          id,

          title,

          value: round(
           safeCurrentStatistics[id],
            decimals
          ),

          average: round(
            average(values),
            decimals
          ),

          max: round(
            Math.max(
              ...values,
              1
            ),
            decimals
          ),

          rank: getRank(
            id,
            currentProfessionalID
          ),

          total:
            calculatedProfessionals.length,

          suffix,
          decimals,
        }
      }

      return [
        createStatistic(
          "clients",
          translate(
            language,
            "Clients"
          )
        ),

        createStatistic(
          "appointments",
          translate(
            language,
            "Réservations"
          )
        ),

        createStatistic(
          "revenue",
          translate(
            language,
            "CA généré"
          ),
          "€"
        ),

        createStatistic(
          "basket",
          translate(
            language,
            "Panier moyen"
          ),
          "€",
          2
        ),

        createStatistic(
          "services",
          translate(
            language,
            "Prestations"
          )
        ),

        createStatistic(
          "reviews",
          translate(
            language,
            "Avis clients"
          )
        ),

        createStatistic(
          "rating",
          translate(
            language,
            "Note moyenne"
          ),
          undefined,
          1
        ),

        createStatistic(
          "loyalty",
          translate(
            language,
            "Fidélisation"
          ),
          "%",
          1
        ),
      ]
    }, [
      calculatedProfessionals,
      currentProfessionalID,
      language,
    ])

  const globalRank =
    useMemo(() => {
      if (
        statistics.length === 0
      ) {
        return 0
      }

      return Math.max(
        1,
        Math.round(
          average(
            statistics.map(
              statistic =>
                statistic.rank
            )
          )
        )
      )
    }, [statistics])

  function displayValue(
    statistic: MarketStatistic
  ) {
    const formattedValue =
      statistic.value.toLocaleString(
        "fr-FR",
        {
          minimumFractionDigits:
            statistic.decimals ?? 0,

          maximumFractionDigits:
            statistic.decimals ?? 0,
        }
      )

    if (
      statistic.suffix === "%"
    ) {
      return `${formattedValue} %`
    }

    if (
      statistic.suffix === "€"
    ) {
      return `${formattedValue} €`
    }

    if (
      statistic.id === "rating"
    ) {
      return `${formattedValue} / 5`
    }

    return formattedValue
  }

  function progress(
    statistic: MarketStatistic
  ) {
    if (
      statistic.max <= 0
    ) {
      return 0
    }

    return Math.min(
      100,
      Math.max(
        0,
        (
          statistic.value /
          statistic.max
        ) * 100
      )
    )
  }

  function averagePosition(
    statistic: MarketStatistic
  ) {
    if (
      statistic.max <= 0
    ) {
      return 0
    }

    return Math.min(
      100,
      Math.max(
        0,
        (
          statistic.average /
          statistic.max
        ) * 100
      )
    )
  }

  const scopeTitle =
    scope === "city"
      ? city
      : scope === "country"
        ? country
        : translate(
            language,
            "Monde"
          )

  if (loading) {
    return (
      <main className="marketPage">
        <div className="marketContainer">
          <p className="marketLoading">
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
    <main className="marketPage">
      <div className="marketContainer">
        <header className="marketHeader">
          <Link
            href="/professional-stats"
            className="marketBackButton"
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

          <div className="marketHeaderText">
            <h1>
              {translate(
                language,
                "Marché"
              )}
            </h1>

            <p>
              {translate(
                language,
                accountType === "sitter"
                  ? "Comparez votre profil aux autres."
                  : "Comparez votre établissement aux autres."
              )}
            </p>
          </div>

          <TrendingUp
            className="marketHeaderIcon"
            size={70}
            strokeWidth={1.8}
          />
        </header>

        <section className="marketScopeSelector">
          <button
            type="button"
            className={
              scope === "city"
                ? "marketScopeButton marketScopeButton--active"
                : "marketScopeButton"
            }
            onClick={() =>
              setScope("city")
            }
          >
            <MapPinned size={18} />
            {city}
          </button>

          <button
            type="button"
            className={
              scope === "country"
                ? "marketScopeButton marketScopeButton--active"
                : "marketScopeButton"
            }
            onClick={() =>
              setScope("country")
            }
          >
            <Map size={18} />
            {country}
          </button>

          <button
            type="button"
            className={
              scope === "world"
                ? "marketScopeButton marketScopeButton--active"
                : "marketScopeButton"
            }
            onClick={() =>
              setScope("world")
            }
          >
            <Globe size={18} />

            {translate(
              language,
              "Monde"
            )}
          </button>
        </section>

        {error && (
          <p className="marketError">
            {error}
          </p>
        )}

        {!error &&
          professionals.length ===
            0 && (
            <p className="marketEmpty">
              {translate(
                language,
                "Aucun professionnel trouvé."
              )}
            </p>
          )}

        {!error &&
          professionals.length > 0 && (
            <>
              <section className="marketRankingCard">
                <span className="marketRankingLabel">
                  {translate(
                    language,
                    "Classement"
                  )}
                </span>

                <strong className="marketRankingValue">
                  #{globalRank}
                </strong>

                <span className="marketRankingSubtitle">
                  {translate(
                    language,
                    "sur"
                  )}{" "}
                  {professionals.length}{" "}
                  — {scopeTitle}
                </span>
              </section>

              <section className="marketStatistics">
                {statistics.map(
                  statistic => {
                    const isAboveAverage =
                      statistic.value >=
                      statistic.average

                    return (
                      <article
                        key={statistic.id}
                        className="marketRow"
                      >
                        <div className="marketRowHeader">
                          <strong className="marketRowTitle">
                            {statistic.title}
                          </strong>
                        </div>

                        <div className="marketRowContent">
                          <div className="marketRowCurrent">
                            {displayValue(
                              statistic
                            )}
                          </div>

                          <div className="marketProgress">
                            <div className="marketProgressTrack">
                              <div
                                className={
                                  isAboveAverage
                                    ? "marketProgressFill marketProgressFill--good"
                                    : "marketProgressFill marketProgressFill--bad"
                                }
                                style={{
                                  width: `${progress(
                                    statistic
                                  )}%`,
                                }}
                              />

                              <div
                                className="marketAverage"
                                style={{
                                  left: `${averagePosition(
                                    statistic
                                  )}%`,
                                }}
                                title={`${translate(
                                  language,
                                  "Moyenne"
                                )} : ${displayValue(
                                  {
                                    ...statistic,
                                    value:
                                      statistic.average,
                                  }
                                )}`}
                              />
                            </div>

                            <span className="marketProgressMax">
                              {displayValue({
                                ...statistic,
                                value:
                                  statistic.max,
                              })}
                            </span>
                          </div>
                        </div>

                        <strong className="marketRowRank">
                          #{statistic.rank}
                        </strong>
                      </article>
                    )
                  }
                )}
              </section>
            </>
          )}
      </div>
    </main>
  )
}
