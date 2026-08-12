"use client"

import {
  useEffect,
  useMemo
} from "react"

import {
  CalendarDays,
  Heart,
  PawPrint,
  RefreshCw,
  Scissors,
  ShoppingCart,
  WalletCards,
  X
} from "lucide-react"

import {
  translate
} from "@/translations/translations"
import type { Language } from "@/context/LanguageContext"

import {
  type Appointment
} from "@/services/appointments"

import "./StatsModal.css"

export type AnimalModalStatistic = {
  userID: string
  name: string

  image?: string | null
  photo?: string | null

  reservationCount: number
  totalSpent: number
  averageBasket: number
  averageFrequencyDays: number

  favoriteService: string
  favoriteServiceCount?: number
}

export type AnimalModalService = {
  id: string
  name: string
  description?: string

  price: number
  duration?: number

  currency?: string
  devise?: string
}

type AnimalStatsModalProps = {
  statistic: AnimalModalStatistic

  appointments: Appointment[]
  services?: AnimalModalService[]

  language: Language
  currency?: string

  accountType?:
    | "grooming"
    | "healthcare"
    | "sitter"
    | string

  onClose: () => void
}

type AnimalHistoryItem = {
  id: string
  date: Date | null

  serviceID: string
  serviceName: string

  price: number
  duration: number
}

function normalizeDate(
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

function parseSitterServiceID(
  serviceID: string
) {
  const [
    serviceName,
    duration,
    price
  ] =
    String(
      serviceID ?? ""
    ).split("-")

  return {
    serviceName:
      serviceName ||
      "Garde",

    duration:
      Number(duration) ||
      0,

    price:
      Number(price) ||
      0
  }
}

function calculateAverageFrequency(
  appointments: Appointment[]
) {
  const dates =
    appointments
      .map(
        appointment =>
          normalizeDate(
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

  if (dates.length < 2) {
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
      dates[index - 1]
        .getTime()

    totalDays += Math.max(
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

  return Math.floor(
    totalDays /
    (dates.length - 1)
  )
}

function getDaysSinceDate(
  value: Date | null
) {
  if (!value) {
    return null
  }

  const difference =
    Date.now() -
    value.getTime()

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

export default function AnimalStatsModal({
  statistic,
  appointments,
  services = [],
  language,
  currency = "EUR",
  accountType = "grooming",
  onClose
}: AnimalStatsModalProps) {
  const isSitter =
    accountType === "sitter"

  /*
   * Fermeture avec la touche Échap
   * et blocage du scroll de la page.
   */
  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (
        event.key === "Escape"
      ) {
        onClose()
      }
    }

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow =
      "hidden"

    window.addEventListener(
      "keydown",
      handleKeyDown
    )

    return () => {
      document.body.style.overflow =
        previousOverflow

      window.removeEventListener(
        "keydown",
        handleKeyDown
      )
    }
  }, [onClose])

  const animalAppointments =
    useMemo(() => {
      return appointments
        .filter(
          appointment =>
            appointment.userID ===
            statistic.userID
        )
        .sort(
          (
            first,
            second
          ) => {
            const firstDate =
              normalizeDate(
                first.date
              )?.getTime() ??
              0

            const secondDate =
              normalizeDate(
                second.date
              )?.getTime() ??
              0

            return (
              secondDate -
              firstDate
            )
          }
        )
    }, [
      appointments,
      statistic.userID
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
    }, [services])

  const historyItems =
    useMemo<
      AnimalHistoryItem[]
    >(() => {
      return animalAppointments.map(
        (
          appointment,
          index
        ) => {
          const serviceID =
            String(
              appointment.serviceID ??
              ""
            )

          if (isSitter) {
            const parsed =
              parseSitterServiceID(
                serviceID
              )

            return {
              id:
                String(
                  appointment.id ??
                  `${serviceID}-${index}`
                ),

              date:
                normalizeDate(
                  appointment.date
                ),

              serviceID,

              serviceName:
                parsed.serviceName,

              price:
                parsed.price,

              duration:
                parsed.duration
            }
          }

          const service =
            servicesByID.get(
              serviceID
            )

          return {
            id:
              String(
                appointment.id ??
                `${serviceID}-${index}`
              ),

            date:
              normalizeDate(
                appointment.date
              ),

            serviceID,

            serviceName:
              service?.name ||
              translate(
                language,
                "Prestation"
              ),

            price:
              Number(
                service?.price ??
                0
              ),

            duration:
              Number(
                service?.duration ??
                appointment.duration ??
                0
              )
          }
        }
      )
    }, [
      animalAppointments,
      isSitter,
      servicesByID,
      language
    ])

  const calculatedTotalSpent =
    useMemo(() => {
      return historyItems.reduce(
        (
          total,
          appointment
        ) =>
          total +
          appointment.price,
        0
      )
    }, [historyItems])

  const reservationCount =
    animalAppointments.length ||
    statistic.reservationCount ||
    0

  const totalSpent =
    calculatedTotalSpent ||
    statistic.totalSpent ||
    0

  const averageBasket =
    reservationCount > 0
      ? totalSpent /
        reservationCount
      : statistic.averageBasket ||
        0

  const averageFrequency =
    useMemo(() => {
      const calculated =
        calculateAverageFrequency(
          animalAppointments
        )

      return (
        calculated ||
        statistic
          .averageFrequencyDays ||
        0
      )
    }, [
      animalAppointments,
      statistic
        .averageFrequencyDays
    ])

  const favoriteServiceData =
    useMemo(() => {
      if (
        historyItems.length === 0
      ) {
        return {
          name:
            statistic
              .favoriteService ||
            translate(
              language,
              "Aucune prestation"
            ),

          count:
            statistic
              .favoriteServiceCount ??
            0
        }
      }

      const counts =
        new Map<
          string,
          number
        >()

      historyItems.forEach(
        appointment => {
          counts.set(
            appointment.serviceName,
            (
              counts.get(
                appointment.serviceName
              ) ??
              0
            ) + 1
          )
        }
      )

      const favorite =
        Array.from(
          counts.entries()
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
          favorite?.[0] ||
          statistic
            .favoriteService ||
          translate(
            language,
            "Aucune prestation"
          ),

        count:
          favorite?.[1] ??
          statistic
            .favoriteServiceCount ??
          0
      }
    }, [
      historyItems,
      statistic.favoriteService,
      statistic.favoriteServiceCount,
      language
    ])

  const lastAppointment =
    historyItems[0] ??
    null

  const imageURL =
    statistic.image ||
    statistic.photo ||
    ""

  function formatMoney(
    value: number
  ) {
    try {
      return new Intl.NumberFormat(
        language === "fr"
          ? "fr-FR"
          : language,
        {
          style: "currency",
          currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }
      ).format(value)
    } catch {
      return `${value.toFixed(2)} ${currency}`
    }
  }

  function formatDate(
    value: Date | null
  ) {
    if (!value) {
      return "-"
    }

    return new Intl.DateTimeFormat(
      language === "fr"
        ? "fr-FR"
        : language,
      {
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    ).format(value)
  }

  function getLastAppointmentText() {
    if (
      !lastAppointment?.date
    ) {
      return "-"
    }

    const days =
      getDaysSinceDate(
        lastAppointment.date
      )

    if (days === null) {
      return "-"
    }

    if (days === 0) {
      return translate(
        language,
        "Aujourd'hui"
      )
    }

    if (days === 1) {
      return translate(
        language,
        "Hier"
      )
    }

    return translate(
      language,
      "Il y a _ jours"
    ).replace(
      "_",
      String(days)
    )
  }

  function handleBackdropClick(
    event:
      React.MouseEvent<HTMLDivElement>
  ) {
    if (
      event.target ===
      event.currentTarget
    ) {
      onClose()
    }
  }

  return (
    <div
      className="statsModalBackdrop"
      onMouseDown={
        handleBackdropClick
      }
      role="presentation"
    >
      <section
        className="statsModal statsModalAnimal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="animalStatsModalTitle"
      >
        <div
          className="statsModalGrabber"
          aria-hidden="true"
        />

        <button
          type="button"
          className="statsModalCloseButton"
          onClick={onClose}
          aria-label={translate(
            language,
            "Fermer"
          )}
        >
          <X
            size={22}
            strokeWidth={2.5}
          />
        </button>

        <div className="statsModalScroll">
          <div className="statsModalContent">
            <header className="animalStatsModalHeader">
              <div className="animalStatsModalAvatar">
                {imageURL ? (
                  <img
                    src={imageURL}
                    alt={statistic.name}
                  />
                ) : (
                  <PawPrint
                    size={48}
                    strokeWidth={2}
                  />
                )}
              </div>

              <div className="animalStatsModalHeaderText">
                <h2 id="animalStatsModalTitle">
                  {statistic.name}
                </h2>

                <p>
                  {translate(
                    language,
                    "_ réservation(s)"
                  ).replace(
                    "_",
                    String(
                      reservationCount
                    )
                  )}
                </p>

                <p>
                  {translate(
                    language,
                    "Prestation préférée : *"
                  ).replace(
                    "*",
                    translate(
                      language,
                      favoriteServiceData
                        .name
                    )
                  )}
                </p>
              </div>
            </header>

            <section className="animalStatsModalKPIGrid">
              <article className="statsModalKPICard">
                <div className="statsModalKPIIcon">
                  <WalletCards
                    size={21}
                  />
                </div>

                <span>
                  {translate(
                    language,
                    "Dépenses totales"
                  )}
                </span>

                <strong>
                  {formatMoney(
                    totalSpent
                  )}
                </strong>
              </article>

              <article className="statsModalKPICard">
                <div className="statsModalKPIIcon">
                  <Heart
                    size={21}
                    fill="currentColor"
                  />
                </div>

                <span>
                  {translate(
                    language,
                    "Fidélité"
                  )}
                </span>

                <strong>
                  {translate(
                    language,
                    "_ visites"
                  ).replace(
                    "_",
                    String(
                      reservationCount
                    )
                  )}
                </strong>
              </article>

              <article className="statsModalKPICard">
                <div className="statsModalKPIIcon">
                  <RefreshCw
                    size={21}
                  />
                </div>

                <span>
                  {translate(
                    language,
                    "Fréquence moyenne"
                  )}
                </span>

                <strong>
                  {translate(
                    language,
                    "_ jours"
                  ).replace(
                    "_",
                    String(
                      averageFrequency
                    )
                  )}
                </strong>
              </article>

              <article className="statsModalKPICard">
                <div className="statsModalKPIIcon">
                  <ShoppingCart
                    size={21}
                  />
                </div>

                <span>
                  {translate(
                    language,
                    "Panier moyen"
                  )}
                </span>

                <strong>
                  {formatMoney(
                    averageBasket
                  )}
                </strong>
              </article>
            </section>

            <section className="animalStatsFavoriteCard">
              <h3>
                {translate(
                  language,
                  isSitter
                    ? "Service préféré"
                    : "Prestation préférée"
                )}
              </h3>

              <div className="animalStatsFavoriteContent">
                <div className="animalStatsFavoriteIcon">
                  {isSitter ? (
                    <PawPrint
                      size={28}
                    />
                  ) : (
                    <Scissors
                      size={28}
                    />
                  )}
                </div>

                <div>
                  <strong>
                    {translate(
                      language,
                      favoriteServiceData
                        .name
                    )}
                  </strong>

                  <span>
                    {translate(
                      language,
                      "_ fois"
                    ).replace(
                      "_",
                      String(
                        favoriteServiceData
                          .count
                      )
                    )}
                  </span>
                </div>
              </div>
            </section>

            <section className="animalStatsLastVisitCard">
              <div className="animalStatsLastVisitIcon">
                <CalendarDays
                  size={23}
                />
              </div>

              <div>
                <span>
                  {translate(
                    language,
                    isSitter
                      ? "Dernière garde"
                      : "Dernière visite"
                  )}
                </span>

                <strong>
                  {getLastAppointmentText()}
                </strong>
              </div>
            </section>

            <section className="animalStatsHistoryCard">
              <h3>
                {translate(
                  language,
                  "Historique des réservations"
                )}
              </h3>

              {historyItems.length ===
              0 ? (
                <div className="statsModalEmpty">
                  <CalendarDays
                    size={34}
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
              ) : (
                <div className="animalStatsHistoryList">
                  {historyItems.map(
                    appointment => (
                      <article
                        key={
                          appointment.id
                        }
                        className="animalStatsHistoryRow"
                      >
                        <div className="animalStatsHistoryIcon">
                          {isSitter ? (
                            <PawPrint
                              size={21}
                            />
                          ) : (
                            <Scissors
                              size={21}
                            />
                          )}
                        </div>

                        <div className="animalStatsHistoryText">
                          <strong>
                            {formatDate(
                              appointment.date
                            )}
                          </strong>

                          <span>
                            {translate(
                              language,
                              appointment
                                .serviceName
                            )}
                          </span>

                          {appointment.duration >
                            0 && (
                            <small>
                              {translate(
                                language,
                                "_ heure(s)"
                              ).replace(
                                "_",
                                String(
                                  appointment
                                    .duration
                                )
                              )}
                            </small>
                          )}
                        </div>

                        <strong className="animalStatsHistoryPrice">
                          {formatMoney(
                            appointment.price
                          )}
                        </strong>
                      </article>
                    )
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
    </div>
  )
}
