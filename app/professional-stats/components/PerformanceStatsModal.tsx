"use client"

import {
  useEffect,
  useMemo
} from "react"

import {
  CalendarDays,
  Clock3,
  PawPrint,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Users,
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

export type PerformanceModalStatistic = {
  serviceID: string
  name: string
  description?: string

  reservationCount: number
  totalRevenue: number
  averageBasket: number

  duration?: number
  averageDuration: number

  uniqueClients: number
}

export type PerformanceModalService = {
  id: string
  name: string
  description?: string
  price: number
  duration?: number
  devise?: string
  currency?: string
}

type PerformanceStatsModalProps = {
  statistic: PerformanceModalStatistic

  appointments: Appointment[]
  services?: PerformanceModalService[]

  language: Language
  currency?: string

  accountType?:
    | "grooming"
    | "healthcare"
    | string

  onClose: () => void
}

type PerformanceRowProps = {
  icon:
    | "appointments"
    | "revenue"
    | "clients"

  title: string
  value: string
  totalText: string
  percent: number
}

function normalizeDate(
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

function clampPercent(
  value: number
) {
  if (
    !Number.isFinite(value)
  ) {
    return 0
  }

  return Math.min(
    Math.max(value, 0),
    1
  )
}

export default function PerformanceStatsModal({
  statistic,
  appointments,
  services = [],
  language,
  currency = "EUR",
  accountType = "grooming",
  onClose
}: PerformanceStatsModalProps) {
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

  const currentService =
    useMemo(() => {
      return servicesByID.get(
        statistic.serviceID
      )
    }, [
      servicesByID,
      statistic.serviceID
    ])

  const serviceAppointments =
    useMemo(() => {
      return appointments
        .filter(
          appointment =>
            String(
              appointment.serviceID ??
              ""
            ) ===
            statistic.serviceID
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
      statistic.serviceID
    ])

  const calculatedReservationCount =
    serviceAppointments.length

  const reservationCount =
    calculatedReservationCount ||
    statistic.reservationCount ||
    0

  const servicePrice =
    Number(
      currentService?.price ??
      statistic.averageBasket ??
      0
    )

  const calculatedRevenue =
    reservationCount *
    servicePrice

  const totalRevenue =
    calculatedRevenue ||
    statistic.totalRevenue ||
    0

  const averageBasket =
    reservationCount > 0
      ? totalRevenue /
        reservationCount
      : statistic.averageBasket ||
        servicePrice ||
        0

  const uniqueClients =
    useMemo(() => {
      const clients =
        new Set(
          serviceAppointments
            .map(
              appointment =>
                appointment.userID
            )
            .filter(Boolean)
        )

      return (
        clients.size ||
        statistic.uniqueClients ||
        0
      )
    }, [
      serviceAppointments,
      statistic.uniqueClients
    ])

  const averageDuration =
    useMemo(() => {
      if (
        serviceAppointments.length >
        0
      ) {
        const totalDuration =
          serviceAppointments.reduce(
            (
              total,
              appointment
            ) => {
              return (
                total +
                Number(
                  appointment.duration ??
                  currentService
                    ?.duration ??
                  statistic
                    .averageDuration ??
                  statistic.duration ??
                  0
                )
              )
            },
            0
          )

        return Math.round(
          totalDuration /
          serviceAppointments.length
        )
      }

      return Number(
        statistic.averageDuration ??
        statistic.duration ??
        currentService?.duration ??
        0
      )
    }, [
      serviceAppointments,
      statistic.averageDuration,
      statistic.duration,
      currentService?.duration
    ])

  const averageFrequency =
    useMemo(() => {
      return calculateAverageFrequency(
        serviceAppointments
      )
    }, [serviceAppointments])

  const lastVisit =
    useMemo(() => {
      return (
        normalizeDate(
          serviceAppointments[0]?.date
        ) ?? null
      )
    }, [serviceAppointments])

  const totalAppointments =
    appointments.length

  const totalClients =
    useMemo(() => {
      return new Set(
        appointments
          .map(
            appointment =>
              appointment.userID
          )
          .filter(Boolean)
      ).size
    }, [appointments])

  const totalBusinessRevenue =
    useMemo(() => {
      return appointments.reduce(
        (
          total,
          appointment
        ) => {
          const serviceID =
            String(
              appointment.serviceID ??
              ""
            )

          const service =
            servicesByID.get(
              serviceID
            )

          return (
            total +
            Number(
              service?.price ??
              0
            )
          )
        },
        0
      )
    }, [
      appointments,
      servicesByID
    ])

  const appointmentsPercent =
    totalAppointments > 0
      ? reservationCount /
        totalAppointments
      : 0

  const revenuePercent =
    totalBusinessRevenue > 0
      ? totalRevenue /
        totalBusinessRevenue
      : 0

  const clientsPercent =
    totalClients > 0
      ? uniqueClients /
        totalClients
      : 0

  const translatedName =
    translate(
      language,
      statistic.name
    )

  const description =
    statistic.description ||
    currentService?.description ||
    ""

  const serviceDuration =
    Number(
      currentService?.duration ??
      statistic.duration ??
      averageDuration ??
      0
    )

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

  function formatCompactMoney(
    value: number
  ) {
    if (
      value >= 1_000_000
    ) {
      return `${(
        value /
        1_000_000
      ).toFixed(1)}M ${currency}`
    }

    if (
      value >= 1_000
    ) {
      return `${(
        value /
        1_000
      ).toFixed(1)}k ${currency}`
    }

    return formatMoney(value)
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
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }
    ).format(value)
  }

  function getPerformanceClass(
    percent: number
  ) {
    const normalized =
      clampPercent(percent)

    if (normalized < 0.5) {
      return "statsPerformanceLow"
    }

    if (normalized < 0.75) {
      return "statsPerformanceMedium"
    }

    return "statsPerformanceHigh"
  }

  function renderPerformanceIcon(
    icon:
      PerformanceRowProps["icon"]
  ) {
    switch (icon) {
      case "revenue":
        return (
          <TrendingUp
            size={22}
          />
        )

      case "clients":
        return (
          <Users
            size={22}
          />
        )

      default:
        return (
          <CalendarDays
            size={22}
          />
        )
    }
  }

  function PerformanceRow({
    icon,
    title,
    value,
    totalText,
    percent
  }: PerformanceRowProps) {
    const normalized =
      clampPercent(percent)

    const percentage =
      Math.round(
        normalized * 100
      )

    const performanceClass =
      getPerformanceClass(
        normalized
      )

    return (
      <article className="performanceStatsComparisonRow">
        <div className="performanceStatsComparisonIcon">
          {renderPerformanceIcon(
            icon
          )}
        </div>

        <div className="performanceStatsComparisonMain">
          <div className="performanceStatsComparisonHeader">
            <strong>
              {translate(
                language,
                title
              )}
            </strong>

            <span
              className={
                performanceClass
              }
            >
              {percentage} %
            </span>
          </div>

          <div className="performanceStatsProgressTrack">
            <div
              className={`performanceStatsProgressValue ${performanceClass}`}
              style={{
                width: `${percentage}%`
              }}
            />
          </div>

          <span className="performanceStatsComparisonTotal">
            {totalText}
          </span>
        </div>

        <strong className="performanceStatsComparisonValue">
          {value}
        </strong>
      </article>
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
        className="statsModal statsModalPerformance"
        role="dialog"
        aria-modal="true"
        aria-labelledby="performanceStatsModalTitle"
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
            <header className="performanceStatsModalHeader">
              <div className="performanceStatsModalServiceIcon">
                <PawPrint
                  size={43}
                  strokeWidth={2}
                />
              </div>

              <div className="performanceStatsModalHeaderText">
                <h2 id="performanceStatsModalTitle">
                  {translatedName}
                </h2>

                {description && (
                  <p>
                    {translate(
                      language,
                      description
                    )}
                  </p>
                )}

                <div className="performanceStatsModalMetadata">
                  <span>
                    <ShoppingCart
                      size={18}
                    />

                    {formatMoney(
                      averageBasket
                    )}
                  </span>

                  <span
                    aria-hidden="true"
                  >
                    •
                  </span>

                  <span>
                    <Clock3
                      size={18}
                    />

                    {serviceDuration}{" "}
                    {translate(
                      language,
                      "min"
                    )}
                  </span>
                </div>
              </div>
            </header>

            <section className="performanceStatsKPIGrid">
              <article className="statsModalKPICard performanceStatsKPICard">
                <div className="statsModalKPIIcon">
                  <CalendarDays
                    size={22}
                  />
                </div>

                <strong>
                  {reservationCount}
                </strong>

                <span>
                  {translate(
                    language,
                    "Visites"
                  )}
                </span>
              </article>

              <article className="statsModalKPICard performanceStatsKPICard">
                <div className="statsModalKPIIcon">
                  <TrendingUp
                    size={22}
                  />
                </div>

                <strong>
                  {formatCompactMoney(
                    totalRevenue
                  )}
                </strong>

                <span>
                  {translate(
                    language,
                    "Revenus"
                  )}
                </span>
              </article>

              <article className="statsModalKPICard performanceStatsKPICard">
                <div className="statsModalKPIIcon">
                  <Users
                    size={22}
                  />
                </div>

                <strong>
                  {uniqueClients}
                </strong>

                <span>
                  {translate(
                    language,
                    "Clients uniques"
                  )}
                </span>
              </article>

              <article className="statsModalKPICard performanceStatsKPICard">
                <div className="statsModalKPIIcon">
                  <ShoppingCart
                    size={22}
                  />
                </div>

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

              <article className="statsModalKPICard performanceStatsKPICard">
                <div className="statsModalKPIIcon">
                  <CalendarDays
                    size={22}
                  />
                </div>

                <strong>
                  {formatDate(
                    lastVisit
                  )}
                </strong>

                <span>
                  {translate(
                    language,
                    "Dernière visite"
                  )}
                </span>
              </article>

              <article className="statsModalKPICard performanceStatsKPICard">
                <div className="statsModalKPIIcon">
                  <RefreshCw
                    size={22}
                  />
                </div>

                <strong>
                  {averageFrequency > 0
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

                <span>
                  {translate(
                    language,
                    "Fréquence moyenne"
                  )}
                </span>
              </article>
            </section>

            <section className="performanceStatsComparisonCard">
              <h3>
                {translate(
                  language,
                  "Performance"
                )}
              </h3>

              <div className="performanceStatsComparisonList">
                <PerformanceRow
                  icon="appointments"
                  title="Visites"
                  value={String(
                    reservationCount
                  )}
                  totalText={translate(
                    language,
                    "sur _ visites au total"
                  ).replace(
                    "_",
                    String(
                      totalAppointments
                    )
                  )}
                  percent={
                    appointmentsPercent
                  }
                />

                <PerformanceRow
                  icon="revenue"
                  title="Revenus"
                  value={formatCompactMoney(
                    totalRevenue
                  )}
                  totalText={translate(
                    language,
                    "sur un total de _"
                  ).replace(
                    "_",
                    formatCompactMoney(
                      totalBusinessRevenue
                    )
                  )}
                  percent={
                    revenuePercent
                  }
                />

                <PerformanceRow
                  icon="clients"
                  title="Clients uniques"
                  value={String(
                    uniqueClients
                  )}
                  totalText={translate(
                    language,
                    "sur _ clients uniques"
                  ).replace(
                    "_",
                    String(
                      totalClients
                    )
                  )}
                  percent={
                    clientsPercent
                  }
                />
              </div>
            </section>

            {accountType ===
              "healthcare" && (
              <p className="performanceStatsAccountNote">
                {translate(
                  language,
                  "Les statistiques sont calculées à partir des rendez-vous associés à cette prestation."
                )}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
