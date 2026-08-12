"use client"

import {
  useEffect,
  useMemo
} from "react"

import {
  CalendarDays,
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

export type TeamModalStatistic = {
  collaborator: string
  collaboratorName?: string

  appointmentsCount: number
  reservationCount?: number

  revenue: number
  totalIncome?: number

  clientsCount: number
  uniqueClientsCount?: number

  averageFrequencyDays?: number
  averageBasket?: number

  appointments?: Appointment[]
}

export type TeamModalService = {
  id: string
  name: string
  description?: string

  price: number
  duration?: number

  devise?: string
  currency?: string
}

type TeamStatsModalProps = {
  statistic: TeamModalStatistic

  appointments: Appointment[]
  services?: TeamModalService[]

  language: Language
  currency?: string

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

export default function TeamStatsModal({
  statistic,
  appointments,
  services = [],
  language,
  currency = "EUR",
  onClose
}: TeamStatsModalProps) {
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

  const collaboratorName =
    statistic.collaboratorName ||
    statistic.collaborator ||
    translate(
      language,
      "Collaborateur"
    )

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

  const collaboratorAppointments =
    useMemo(() => {
      return appointments
        .filter(
          appointment =>
            String(
              appointment.collaborator ??
              ""
            ) ===
            collaboratorName
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
      collaboratorName
    ])

  const appointmentsCount =
    collaboratorAppointments.length ||
    statistic.appointmentsCount ||
    statistic.reservationCount ||
    0

  const calculatedRevenue =
    useMemo(() => {
      return collaboratorAppointments.reduce(
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
      collaboratorAppointments,
      servicesByID
    ])

  const revenue =
    calculatedRevenue ||
    statistic.revenue ||
    statistic.totalIncome ||
    0

  const clientsCount =
    useMemo(() => {
      const clients =
        new Set(
          collaboratorAppointments
            .map(
              appointment =>
                appointment.userID
            )
            .filter(Boolean)
        )

      return (
        clients.size ||
        statistic.clientsCount ||
        statistic
          .uniqueClientsCount ||
        0
      )
    }, [
      collaboratorAppointments,
      statistic.clientsCount,
      statistic.uniqueClientsCount
    ])

  const averageBasket =
    appointmentsCount > 0
      ? revenue /
        appointmentsCount
      : statistic.averageBasket ||
        0

  const averageFrequency =
    useMemo(() => {
      const calculated =
        calculateAverageFrequency(
          collaboratorAppointments
        )

      return (
        calculated ||
        statistic
          .averageFrequencyDays ||
        0
      )
    }, [
      collaboratorAppointments,
      statistic
        .averageFrequencyDays
    ])

  const lastAppointmentDate =
    useMemo(() => {
      return (
        normalizeDate(
          collaboratorAppointments[0]
            ?.date
        ) ?? null
      )
    }, [
      collaboratorAppointments
    ])

  const totalAppointments =
    appointments.length

  const totalRevenue =
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

  const appointmentsPercent =
    totalAppointments > 0
      ? appointmentsCount /
        totalAppointments
      : 0

  const revenuePercent =
    totalRevenue > 0
      ? revenue /
        totalRevenue
      : 0

  const clientsPercent =
    totalClients > 0
      ? clientsCount /
        totalClients
      : 0

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
      <article className="teamStatsPerformanceRow">
        <div className="teamStatsPerformanceIcon">
          {renderPerformanceIcon(
            icon
          )}
        </div>

        <div className="teamStatsPerformanceMain">
          <div className="teamStatsPerformanceHeader">
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

          <div className="teamStatsProgressTrack">
            <div
              className={`teamStatsProgressValue ${performanceClass}`}
              style={{
                width: `${percentage}%`
              }}
            />
          </div>

          <span className="teamStatsPerformanceTotal">
            {totalText}
          </span>
        </div>

        <strong className="teamStatsPerformanceValue">
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
        className="statsModal statsModalTeam"
        role="dialog"
        aria-modal="true"
        aria-labelledby="teamStatsModalTitle"
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
            <header className="teamStatsModalHeader">
              <h2 id="teamStatsModalTitle">
                {collaboratorName}
              </h2>
            </header>

            <section className="teamStatsKPIGrid">
              <article className="statsModalKPICard teamStatsKPICard">
                <div className="statsModalKPIIcon">
                  <CalendarDays
                    size={22}
                  />
                </div>

                <strong>
                  {appointmentsCount}
                </strong>

                <span>
                  {translate(
                    language,
                    "Prestations"
                  )}
                </span>
              </article>

              <article className="statsModalKPICard teamStatsKPICard">
                <div className="statsModalKPIIcon">
                  <TrendingUp
                    size={22}
                  />
                </div>

                <strong>
                  {formatCompactMoney(
                    revenue
                  )}
                </strong>

                <span>
                  {translate(
                    language,
                    "CA généré"
                  )}
                </span>
              </article>

              <article className="statsModalKPICard teamStatsKPICard">
                <div className="statsModalKPIIcon">
                  <Users
                    size={22}
                  />
                </div>

                <strong>
                  {clientsCount}
                </strong>

                <span>
                  {translate(
                    language,
                    "Clients"
                  )}
                </span>
              </article>
            </section>

            <section className="teamStatsPerformanceCard">
              <h3>
                {translate(
                  language,
                  "Performance"
                )}
              </h3>

              <div className="teamStatsPerformanceList">
                <PerformanceRow
                  icon="appointments"
                  title="Prestations"
                  value={String(
                    appointmentsCount
                  )}
                  totalText={translate(
                    language,
                    "_ sur * prestations au total"
                  )
                    .replace(
                      "_",
                      String(
                        appointmentsCount
                      )
                    )
                    .replace(
                      "*",
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
                  title="CA généré"
                  value={formatCompactMoney(
                    revenue
                  )}
                  totalText={translate(
                    language,
                    "_ sur * de CA au total"
                  )
                    .replace(
                      "_",
                      formatCompactMoney(
                        revenue
                      )
                    )
                    .replace(
                      "*",
                      formatCompactMoney(
                        totalRevenue
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
                    clientsCount
                  )}
                  totalText={translate(
                    language,
                    "_ sur * clients uniques au total"
                  )
                    .replace(
                      "_",
                      String(
                        clientsCount
                      )
                    )
                    .replace(
                      "*",
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

            <section className="teamStatsInfoCard">
              <article className="teamStatsInfoRow">
                <div className="teamStatsInfoIcon">
                  <CalendarDays
                    size={22}
                  />
                </div>

                <span>
                  {translate(
                    language,
                    "Dernière prestation"
                  )}
                </span>

                <strong>
                  {formatDate(
                    lastAppointmentDate
                  )}
                </strong>
              </article>

              <article className="teamStatsInfoRow">
                <div className="teamStatsInfoIcon">
                  <RefreshCw
                    size={22}
                  />
                </div>

                <span>
                  {translate(
                    language,
                    "Fréquence moyenne"
                  )}
                </span>

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
              </article>

              <article className="teamStatsInfoRow">
                <div className="teamStatsInfoIcon">
                  <ShoppingCart
                    size={22}
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
          </div>
        </div>
      </section>
    </div>
  )
}
