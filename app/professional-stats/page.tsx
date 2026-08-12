"use client"

import "./ProfessionalStats.css"

import Link from "next/link"
import { Download } from "lucide-react"
import { generateAnalyticsReport } from "./pdf/generateAnalyticsReport"
import { useAuth } from "@/context/AuthContext"
import { translate } from "@/translations/translations"
import {
  useEffect,
  useMemo,
  useState,
} from "react"

type StatsCard = {
  id: string
  title: string
  description: string
  icon: string
  className: string
  href?: string
  minimumPackage?: number
}

export default function ProfessionalStatsPage() {
  const { session } = useAuth()

  const language =
    session?.user?.language ??
    "fr"

  const accountType =
    session?.accountType ??
    ""

  const userPackage =
    Number(
      session?.user?.package ??
        0
    )

  const statsCards: StatsCard[] = [
    {
      id: "performance",
      title: "Performance",
      description:
        "Vue d’ensemble de votre activité : chiffre d’affaires, prestations et agenda.",
      icon: "↗",
      className:
        "statsCardIcon--performance",
      href:
        "/professional-stats/performance",
      minimumPackage: 3,
    },
    {
      id: "animals",
      title: "Animaux",
      description:
        "Fiches animaux, prestations réalisées, fréquence, dépenses et fidélité.",
      icon: "🐾",
      className:
        "statsCardIcon--animals",
      href:
        "/professional-stats/animals",
      minimumPackage: 3,
    },
    {
      id: "team",
      title: "Équipe",
      description:
        "Analysez l’activité de vos collaborateurs, leurs réservations et performances.",
      icon: "👥",
      className:
        "statsCardIcon--team",
      href:
        "/professional-stats/team",
      minimumPackage: 3,
    },
    {
      id: "reputation",
      title: "Notoriété",
      description:
        "Analysez vos avis et votre réputation.",
      icon: "★",
      className:
        "statsCardIcon--reputation",
      href:
        "/professional-stats/reputation",
      minimumPackage: 3,
    },
    {
      id: "market",
      title: "Marché",
      description:
        "Analysez votre positionnement et comparez-vous aux professionnels de votre ville.",
      icon: "⌂",
      className:
        "statsCardIcon--market",
      href:
        "/professional-stats/market",
      minimumPackage: 3,
    },
    {
      id: "campaigns",
      title: "Campagnes",
      description:
        "Suivez les performances de vos boosts et optimisez votre visibilité.",
      icon: "📣",
      className:
        "statsCardIcon--campaigns",
      href:
        "/professional-stats/campaigns",
      minimumPackage: 3,
    },
  ]

  const visibleCards =
    statsCards.filter(card => {
      if (
        accountType ===
          "sitter" &&
        card.id === "team"
      ) {
        return false
      }

      return true
    })

  function isCardLocked(
    card: StatsCard
  ): boolean {
    if (
      card.minimumPackage ===
      undefined
    ) {
      return false
    }

    return (
      userPackage <
      card.minimumPackage
    )
  }

    const [isGeneratingReport, setIsGeneratingReport] =
      useState(false)
    
    const canDownloadReport =
      Number(
        session?.user?.package ??
        0
      ) === 3

    async function handleDownloadReport() {
      if (isGeneratingReport) {
        return
      }

      try {
        setIsGeneratingReport(true)

        await generateAnalyticsReport({
          session,
          accountType,
          language,
        })
      } catch (error) {
        console.error(
          "Impossible de générer le rapport :",
          error
        )
      } finally {
        setIsGeneratingReport(false)
      }
    }

  return (
    <main className="professionalStatsPage">
      <div className="professionalStatsContainer">
        <header className="professionalStatsHeader">
          <div className="professionalStatsHeaderContent">
            <p className="professionalStatsEyebrow">
              {translate(
                language,
                "Tableau de bord"
              )}
            </p>

            <h1 className="professionalStatsTitle">
              {translate(
                language,
                "Analytics"
              )}
            </h1>

            <p className="professionalStatsSubtitle">
              {translate(
                language,
                "Analysez les performances de votre établissement."
              )}
            </p>
          </div>

          <button
            type="button"
            className={`downloadReportButton ${
              !canDownloadReport
                ? "downloadReportButtonLocked"
                : ""
            }`}
            onClick={
              canDownloadReport
                ? handleDownloadReport
                : undefined
            }
            disabled={
              isGeneratingReport ||
              !canDownloadReport
            }
            aria-busy={
              isGeneratingReport
            }
            aria-disabled={
              !canDownloadReport
            }
            title={
              canDownloadReport
                ? undefined
                : translate(
                    language,
                    "Cette fonctionnalité est réservée à l'offre Ambassadeur."
                  )
            }
          >
            {isGeneratingReport ? (
              <>
                <span
                  className="downloadReportSpinner"
                  aria-hidden="true"
                />

                {translate(
                  language,
                  "Génération du rapport..."
                )}
              </>
            ) : (
              <>
                <span aria-hidden="true">
                  {canDownloadReport
                    ? "↓"
                    : "🔒"}
                </span>

                {translate(
                  language,
                  "Télécharger le rapport complet"
                )}
              </>
            )}
          </button>
        </header>

        <section className="professionalStatsCards">
          {visibleCards.map(card => {
            const isLocked =
              isCardLocked(card)

            const content = (
              <>
                <div
                  className={`professionalStatsCardIcon ${card.className}`}
                >
                  <span>
                    {card.icon}
                  </span>
                </div>

                <div className="professionalStatsCardContent">
                  <div className="professionalStatsCardTitleRow">
                    <h2>
                      {translate(
                        language,
                        card.title
                      )}
                    </h2>

                    {isLocked && (
                      <span className="professionalStatsLockedBadge">
                        {translate(
                          language,
                          "Offre Ambassadeur"
                        )}
                      </span>
                    )}
                  </div>

                  <p>
                    {translate(
                      language,
                      card.description
                    )}
                  </p>
                </div>

                <div className="professionalStatsCardArrow">
                  {isLocked
                    ? "🔒"
                    : "›"}
                </div>
              </>
            )

            if (
              !card.href ||
              isLocked
            ) {
              return (
                <article
                  key={card.id}
                  className={`professionalStatsCard ${
                    isLocked
                      ? "professionalStatsCard--locked"
                      : ""
                  }`}
                >
                  {content}
                </article>
              )
            }

            return (
              <Link
                key={card.id}
                href={card.href}
                className="professionalStatsCard"
              >
                {content}
              </Link>
            )
          })}
        </section>
      </div>
    </main>
  )
}
