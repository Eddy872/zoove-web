"use client"

import "./ProfessionalCampaigns.css"

import Image from "next/image"
import {
  useEffect,
  useMemo,
  useState,
} from "react"

import { useAuth } from "@/context/AuthContext"
import {
  Campaign,
  fetchCampaigns,
} from "@/services/fetchCampaigns"
import { translate } from "@/translations/translations"

type CampaignDisplayStatus =
  | "active"
  | "scheduled"
  | "completed"

function getClickRate(
  campaign: Campaign
): number {
  if (campaign.impressions <= 0) {
    return 0
  }

  return (
    campaign.clicks /
    campaign.impressions
  ) * 100
}

function getConversionRate(
  campaign: Campaign
): number {
  if (campaign.clicks <= 0) {
    return 0
  }

  return (
    campaign.results /
    campaign.clicks
  ) * 100
}

function getCampaignStatus(
  campaign: Campaign
): CampaignDisplayStatus {
  const now = Date.now()
  const start = campaign.start.getTime()
  const end = campaign.end.getTime()

  if (now < start) {
    return "scheduled"
  }

  if (now > end) {
    return "completed"
  }

  return "active"
}

function getCampaignDurationInHours(
  campaign: Campaign
): number {
  const start = campaign.start.getTime()
  const end = campaign.end.getTime()

  if (
    Number.isNaN(start) ||
    Number.isNaN(end) ||
    end <= start
  ) {
    return 0
  }

  return Math.round(
    (end - start) /
      (1000 * 60 * 60)
  )
}

export default function ProfessionalStatsPage() {
  const { session } = useAuth()
    
    if (
      !session ||
      session.accountType === "animal"
    ) {
      return
    }

  const language =
    session?.user?.language ?? "fr"
    
    function formatShortDate(date: Date): string {
      if (
        !(date instanceof Date) ||
        Number.isNaN(date.getTime())
      ) {
        return translate(
          language,
          "Date inconnue"
        )
      }

      return new Intl.DateTimeFormat(
        language,
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      ).format(date)
    }

  const [campaigns, setCampaigns] =
    useState<Campaign[]>([])

  const [isLoading, setIsLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)
    
    type SortColumn =
      | "name"
      | "impressions"
      | "clicks"
      | "ctr"
      | "results"
      | "conversion"

    const [sortColumn, setSortColumn] =
      useState<SortColumn>("impressions")

    const [sortAscending, setSortAscending] =
      useState(false)
    
    function handleSort(
      column: SortColumn
    ) {
      if (column === sortColumn) {
        setSortAscending(
          !sortAscending
        )
      } else {
        setSortColumn(column)
        setSortAscending(false)
      }
    }

  useEffect(() => {
    async function loadCampaigns() {
      if (!session?.user?.id) {
        setCampaigns([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const fetchedCampaigns =
          await fetchCampaigns(
            String(session.user.id)
          )

        setCampaigns(
          fetchedCampaigns
        )

        console.log(
          "Campagnes du professionnel :",
          fetchedCampaigns
        )
      } catch (loadError) {
        console.error(
          "Erreur lors du chargement des campagnes :",
          loadError
        )

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

    loadCampaigns()
  }, [
    session?.user?.id,
    language,
  ])

  const statistics = useMemo(() => {
    let active = 0
    let scheduled = 0
    let completed = 0
    let totalVisibilityHours = 0

    campaigns.forEach(
      (campaign) => {
        const status =
          getCampaignStatus(
            campaign
          )

        totalVisibilityHours +=
          getCampaignDurationInHours(
            campaign
          )

        if (status === "active") {
          active += 1
        }

        if (status === "scheduled") {
          scheduled += 1
        }

        if (status === "completed") {
          completed += 1
        }
      }
    )

    return {
      total: campaigns.length,
      active,
      scheduled,
      completed,
      totalVisibilityHours,
    }
  }, [campaigns])

  function getStatusLabel(
    status: CampaignDisplayStatus
  ): string {
    switch (status) {
      case "active":
        return translate(
          language,
          "Active"
        )

      case "scheduled":
        return translate(
          language,
          "Programmée"
        )

      case "completed":
        return translate(
          language,
          "Terminée"
        )
    }
  }

  if (isLoading) {
    return (
      <main className="professionalStatsPage">
        <div className="professionalStatsContainer">
          <h1 className="professionalStatsTitle">
            {translate(
              language,
              "Campagnes"
            )}
          </h1>

          <div className="professionalStatsLoading">
            <span className="professionalStatsSpinner" />

            <p>
              {translate(
                language,
                "Chargement des statistiques..."
              )}
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="professionalStatsPage">
      <div className="professionalStatsContainer">
        <header className="professionalStatsHeader">
          <div>
            <p className="professionalStatsEyebrow">
              {translate(
                language,
                "Performances publicitaires"
              )}
            </p>

            <h1 className="professionalStatsTitle">
              {translate(
                language,
                "Campagnes"
              )}
            </h1>

            <p className="professionalStatsSubtitle">
              {translate(
                language,
                "Suivez les performances et l'état de vos campagnes."
              )}
            </p>
          </div>
        </header>

        {error && (
          <div className="professionalStatsError">
            {error}
          </div>
        )}

        <section className="professionalStatsGrid">
          <article className="professionalStatCard">
            <div className="professionalStatCardHeader">
              <span className="professionalStatIcon">
                📢
              </span>

              <span className="professionalStatLabel">
                {translate(
                  language,
                  "Campagnes"
                )}
              </span>
            </div>

            <strong className="professionalStatValue">
              {statistics.total}
            </strong>

            <span className="professionalStatDescription">
              {translate(
                language,
                "Campagnes créées au total"
              )}
            </span>
          </article>

          <article className="professionalStatCard">
            <div className="professionalStatCardHeader">
              <span className="professionalStatIcon professionalStatIconActive">
                ●
              </span>

              <span className="professionalStatLabel">
                {translate(
                  language,
                  "Campagnes actives"
                )}
              </span>
            </div>

            <strong className="professionalStatValue">
              {statistics.active}
            </strong>

            <span className="professionalStatDescription">
              {translate(
                language,
                "Actuellement en diffusion"
              )}
            </span>
          </article>

          <article className="professionalStatCard">
            <div className="professionalStatCardHeader">
              <span className="professionalStatIcon">
                🕒
              </span>

              <span className="professionalStatLabel">
                {translate(
                  language,
                  "Campagnes programmées"
                )}
              </span>
            </div>

            <strong className="professionalStatValue">
              {statistics.scheduled}
            </strong>

            <span className="professionalStatDescription">
              {translate(
                language,
                "En attente de diffusion"
              )}
            </span>
          </article>

          <article className="professionalStatCard">
            <div className="professionalStatCardHeader">
              <span className="professionalStatIcon">
                ⏱️
              </span>

              <span className="professionalStatLabel">
                {translate(
                  language,
                  "Visibilité totale"
                )}
              </span>
            </div>

            <strong className="professionalStatValue">
              {statistics.totalVisibilityHours}

              <span className="professionalStatUnit">
                {" "}
                h
              </span>
            </strong>

            <span className="professionalStatDescription">
              {translate(
                language,
                "Durée cumulée des campagnes"
              )}
            </span>
          </article>
        </section>

        <section className="professionalCampaignsSection">
          <div className="professionalCampaignsSectionHeader">
            <div>
              <h2 className="professionalCampaignsTitle">
                {translate(
                  language,
                  "Performances des campagnes"
                )}
              </h2>

              <p className="professionalCampaignsSubtitle">
                {translate(
                  language,
                  "Consultez le détail de vos campagnes publicitaires."
                )}
              </p>
            </div>

            <span className="professionalCampaignsCount">
              {statistics.total}{" "}
              {statistics.total > 1
                ? translate(
                    language,
                    "campagnes"
                  )
                : translate(
                    language,
                    "campagne"
                  )}
            </span>
          </div>

          {campaigns.length === 0 ? (
            <div className="professionalCampaignsEmpty">
              <div className="professionalCampaignsEmptyIcon">
                📊
              </div>

              <h3>
                {translate(
                  language,
                  "Aucune campagne"
                )}
              </h3>

              <p>
                {translate(
                  language,
                  "Vous n'avez pas encore créé de campagne publicitaire."
                )}
              </p>
            </div>
          ) : (
            <div className="professionalCampaignTableWrapper">
              <table className="professionalCampaignTable">
                <thead>
                  <tr>
                    <th>
                      {translate(
                        language,
                        "Campagne"
                      )}
                    </th>

                       <th
                         onClick={() =>
                           handleSort(
                             "impressions"
                           )
                         }
                         className="sortableColumn"
                       >
                         {translate(
                           language,
                           "Impressions"
                         )}

                         {sortColumn ===
                           "impressions" &&
                           (sortAscending
                             ? " ▲"
                             : " ▼")}
                       </th>

                       <th
                         onClick={() =>
                           handleSort(
                             "clicks"
                           )
                         }
                         className="sortableColumn"
                       >
                         {translate(
                           language,
                           "Clics"
                         )}

                         {sortColumn ===
                           "clicks" &&
                           (sortAscending
                             ? " ▲"
                             : " ▼")}
                       </th>

                       <th
                         onClick={() =>
                           handleSort(
                             "ctr"
                           )
                         }
                         className="sortableColumn"
                       >
                         {translate(
                           language,
                           "Tx clic"
                         )}

                         {sortColumn ===
                           "ctr" &&
                           (sortAscending
                             ? " ▲"
                             : " ▼")}
                       </th>

                       <th
                         onClick={() =>
                           handleSort(
                             "results"
                           )
                         }
                         className="sortableColumn"
                       >
                         {translate(
                           language,
                           "Résultats"
                         )}

                         {sortColumn ===
                           "results" &&
                           (sortAscending
                             ? " ▲"
                             : " ▼")}
                       </th>

                       <th
                         onClick={() =>
                           handleSort(
                             "conversion"
                           )
                         }
                         className="sortableColumn"
                       >
                         {translate(
                           language,
                           "Conversion"
                         )}

                         {sortColumn ===
                           "conversion" &&
                           (sortAscending
                             ? " ▲"
                             : " ▼")}
                       </th>
                  </tr>
                </thead>

                <tbody>
                   {[...campaigns]
                     .sort((a, b) => {
                       let valueA: number | string
                       let valueB: number | string

                       switch (sortColumn) {
                         case "name":
                           valueA = a.name
                           valueB = b.name
                           break

                         case "impressions":
                           valueA = a.impressions
                           valueB = b.impressions
                           break

                         case "clicks":
                           valueA = a.clicks
                           valueB = b.clicks
                           break

                         case "results":
                           valueA = a.results
                           valueB = b.results
                           break

                         case "ctr":
                           valueA = getClickRate(a)
                           valueB = getClickRate(b)
                           break

                         case "conversion":
                           valueA =
                             getConversionRate(a)
                           valueB =
                             getConversionRate(b)
                           break
                       }

                       if (
                         typeof valueA === "string" &&
                         typeof valueB === "string"
                       ) {
                         return sortAscending
                           ? valueA.localeCompare(
                               valueB
                             )
                           : valueB.localeCompare(
                               valueA
                             )
                       }

                       return sortAscending
                         ? Number(valueA) -
                             Number(valueB)
                         : Number(valueB) -
                             Number(valueA)
                     })
                     .map((campaign) => {
                      const clickRate =
                        getClickRate(
                          campaign
                        )

                      const conversionRate =
                        getConversionRate(
                          campaign
                        )

                      const status =
                        getCampaignStatus(
                          campaign
                        )

                      return (
                        <tr key={campaign.id}>
                          <td>
                            <div className="professionalCampaignCell">
                              <div className="professionalCampaignTableImageWrapper">
                                <Image
                                  src={`/images/${campaign.icon}.png`}
                                  alt={
                                    campaign.name
                                  }
                                  width={46}
                                  height={46}
                                  className="professionalCampaignTableImage"
                                />
                              </div>

                              <div className="professionalCampaignCellContent">
                                <strong>
                                  {translate(
                                    language,
                                    campaign.name
                                  )}
                                </strong>

                                {status === "completed" && (
                                  <span className="professionalCampaignDates">
                                    {formatShortDate(
                                      campaign.start
                                    )}
                                    {" - "}
                                    {formatShortDate(
                                      campaign.end
                                    )}
                                  </span>
                                )}

                                <span
                                  className={`professionalCampaignStatus professionalCampaignStatus--${status}`}
                                >
                                  {getStatusLabel(
                                    status
                                  )}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <strong className="professionalCampaignNumber">
                              {campaign.impressions.toLocaleString(
                                language
                              )}
                            </strong>
                          </td>

                          <td>
                            <strong className="professionalCampaignNumber">
                              {campaign.clicks.toLocaleString(
                                language
                              )}
                            </strong>
                          </td>

                          <td>
                            <strong className="professionalCampaignNumber">
                              {clickRate.toLocaleString(
                                language,
                                {
                                  minimumFractionDigits:
                                    1,
                                  maximumFractionDigits:
                                    1,
                                }
                              )}
                              {" %"}
                            </strong>
                          </td>

                          <td>
                            <strong className="professionalCampaignNumber">
                              {campaign.results.toLocaleString(
                                language
                              )}
                            </strong>
                          </td>

                          <td>
                            <strong className="professionalCampaignNumber">
                              {conversionRate.toLocaleString(
                                language,
                                {
                                  minimumFractionDigits:
                                    1,
                                  maximumFractionDigits:
                                    1,
                                }
                              )}
                              {" %"}
                            </strong>
                          </td>
                        </tr>
                      )
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
