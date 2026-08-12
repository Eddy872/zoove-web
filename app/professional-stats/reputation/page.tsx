"use client"

import "./ProfessionalReputation.css"

import Link from "next/link"
import {
  useEffect,
  useMemo,
  useState,
} from "react"

import { fetchProfessional } from "@/services/fetchProfessionalById"

import { useAuth } from "@/context/AuthContext"
import { translate } from "@/translations/translations"

type Feedback = {
  id?: string

  comment?: string

  date?:
    | string
    | number
    | Date

  cleanRate?: number
  frameRate?: number
  homeRate?: number
  qualityRate?: number

  groomingID?: string
  userID?: string

  animalName?: string
  animalPhoto?: string
}

type RatingItem = {
  label: string
  value: number
}

function normalizeNumber(
  value: unknown
): number {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return 0
  }

  return number
}

function clampRating(
  value: number
): number {
  return Math.min(
    5,
    Math.max(0, value)
  )
}

function RatingRow({
  label,
  value,
}: RatingItem) {
  const normalizedValue =
    clampRating(value)

  const percentage =
    (normalizedValue / 5) * 100

  return (
    <div className="reputationRatingRow">
      <div className="reputationRatingHeader">
        <span className="reputationRatingLabel">
          {label}
        </span>

        <strong className="reputationRatingValue">
          {normalizedValue.toFixed(1)}
          <span>/5</span>
        </strong>
      </div>

      <div className="reputationRatingTrack">
        <div
          className="reputationRatingProgress"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  )
}

function StarRating({
  value,
}: {
  value: number
}) {
  const roundedValue =
    Math.round(clampRating(value))

  return (
    <div
      className="reputationStars"
      aria-label={`${value.toFixed(1)} sur 5`}
    >
      {Array.from(
        { length: 5 },
        (_, index) => (
          <span
            key={index}
            className={
              index < roundedValue
                ? "reputationStar reputationStar--active"
                : "reputationStar"
            }
          >
            ★
          </span>
        )
      )}
    </div>
  )
}

export default function ReputationStatsPage() {
    const { session } = useAuth()

    const language =
      session?.user?.language ?? "fr"

    const professionalID =
      String(session?.user?.id ?? "")

    const [professional, setProfessional] =
      useState<any>(null)

    const [feedbacks, setFeedbacks] =
      useState<Feedback[]>([])

    const [isLoading, setIsLoading] =
      useState(true)

    useEffect(() => {
      async function loadProfessional() {
        if (!professionalID) {
          setProfessional(null)
          setFeedbacks([])
          setIsLoading(false)
          return
        }

        try {
          setIsLoading(true)

          const professionalData =
            await fetchProfessional(
              professionalID
            )

          setProfessional(
            professionalData
          )

          setFeedbacks(
            professionalData?.type === "Sitter"
              ? []
              : professionalData?.feedbacks ?? []
          )
        } catch (error) {
          console.error(
            "Erreur lors du chargement du professionnel :",
            error
          )

          setProfessional(null)
          setFeedbacks([])
        } finally {
          setIsLoading(false)
        }
      }

      loadProfessional()
    }, [professionalID])

    const accountType =
      String(
        professional?.type ??
          session?.accountType ??
          ""
      ).toLowerCase()

    const isSitter =
      accountType === "sitter"
    
    const reputationStats =
      useMemo(() => {
        if (isSitter) {
          const ratings: RatingItem[] = [
            {
              label: translate(
                language,
                "Compétence"
              ),
              value: normalizeNumber(
                professional?.skill
              ),
            },
            {
              label: translate(
                language,
                "Fiabilité"
              ),
              value: normalizeNumber(
                professional?.fiability
              ),
            },
            {
              label: translate(
                language,
                "Engagement"
              ),
              value: normalizeNumber(
                professional?.engagement
              ),
            },
            {
              label: translate(
                language,
                "Affinité"
              ),
              value: normalizeNumber(
                professional?.affinity
              ),
            },
          ]

          const globalRate =
            ratings.reduce(
              (sum, rating) =>
                sum + rating.value,
              0
            ) / ratings.length

          return {
            ratings,
            globalRate,
          }
        }

        if (feedbacks.length === 0) {
          return {
            ratings: [] as RatingItem[],
            globalRate: 0,
          }
        }

        const count =
          feedbacks.length

        const cleanRate =
          feedbacks.reduce(
            (sum, feedback) =>
              sum +
              normalizeNumber(
                feedback.cleanRate
              ),
            0
          ) / count

        const frameRate =
          feedbacks.reduce(
            (sum, feedback) =>
              sum +
              normalizeNumber(
                feedback.frameRate
              ),
            0
          ) / count

        const homeRate =
          feedbacks.reduce(
            (sum, feedback) =>
              sum +
              normalizeNumber(
                feedback.homeRate
              ),
            0
          ) / count

        const qualityRate =
          feedbacks.reduce(
            (sum, feedback) =>
              sum +
              normalizeNumber(
                feedback.qualityRate
              ),
            0
          ) / count

        const ratings: RatingItem[] = [
          {
            label: translate(
              language,
              "Propreté"
            ),
            value: cleanRate,
          },
          {
            label: translate(
              language,
              "Accueil"
            ),
            value: frameRate,
          },
          {
            label: translate(
              language,
              "Cadre"
            ),
            value: homeRate,
          },
          {
            label: translate(
              language,
              "Qualité"
            ),
            value: qualityRate,
          },
        ]

        const globalRate =
          (
            cleanRate +
            frameRate +
            homeRate +
            qualityRate
          ) / 4

        return {
          ratings,
          globalRate,
        }
      }, [
        feedbacks,
        isSitter,
        language,
        professional?.affinity,
        professional?.engagement,
        professional?.fiability,
        professional?.skill,
      ])
    
    const ratingDistribution =
      useMemo(() => {
        const distribution = [
          { rating: 5, count: 0 },
          { rating: 4, count: 0 },
          { rating: 3, count: 0 },
          { rating: 2, count: 0 },
          { rating: 1, count: 0 },
        ]

        feedbacks.forEach((feedback) => {
          const feedbackAverage =
            (
              normalizeNumber(feedback.cleanRate) +
              normalizeNumber(feedback.frameRate) +
              normalizeNumber(feedback.homeRate) +
              normalizeNumber(feedback.qualityRate)
            ) / 4

          const roundedRating = Math.min(
            5,
            Math.max(1, Math.round(feedbackAverage))
          )

          const item = distribution.find(
            (entry) => entry.rating === roundedRating
          )

          if (item) {
            item.count++
          }
        })

        return distribution
      }, [feedbacks])

    const maximumDistributionCount =
      Math.max(
        1,
        ...ratingDistribution.map(
          (item) => item.count
        )
      )
    function formatFeedbackDate(
      date?: Feedback["date"]
    ) {
      if (!date) {
        return ""
      }

      const parsedDate =
        date instanceof Date
          ? date
          : new Date(date)

      if (
        Number.isNaN(parsedDate.getTime())
      ) {
        return ""
      }

      return new Intl.DateTimeFormat(
        language,
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }
      ).format(parsedDate)
    }
    if (isLoading) {
      return (
        <main className="reputationPage">
          <p>
            {translate(
              language,
              "Chargement..."
            )}
          </p>
        </main>
      )
    }
  return (
    <main className="reputationPage">
      <div className="reputationContainer">
        <header className="reputationPageHeader">
          <div>
            <Link
              href="/professional-stats"
              className="reputationBackLink"
            >
              <span aria-hidden="true">
                ‹
              </span>

              {translate(
                language,
                "Statistiques"
              )}
            </Link>

            <p className="reputationEyebrow">
              {translate(
                language,
                "Réputation"
              )}
            </p>

            <h1 className="reputationTitle">
              {translate(
                language,
                "Notoriété"
              )}
            </h1>

            <p className="reputationSubtitle">
              {translate(
                language,
                "Analysez vos avis et votre réputation."
              )}
            </p>
          </div>

          <div className="reputationHeaderIcon">
            ★
          </div>
        </header>

        <section className="reputationSummaryGrid">
          <article className="reputationGlobalCard">
            <span className="reputationCardLabel">
              {translate(
                language,
                "Note globale"
              )}
            </span>

            <div className="reputationGlobalRating">
              <strong>
                {reputationStats.globalRate.toFixed(
                  1
                )}
              </strong>

              <span>/5</span>
            </div>

            <StarRating
              value={
                reputationStats.globalRate
              }
            />

            <p className="reputationReviewCount">
              {feedbacks.length}{" "}
              {feedbacks.length > 1
                ? translate(
                    language,
                    "avis clients"
                  )
                : translate(
                    language,
                    "avis client"
                  )}
            </p>
          </article>

          {
              !isSitter && (
                            <article className="reputationDistributionCard">
                              <div className="reputationSectionTitle">
                                <div>
                                  <h2>
                                    {translate(
                                      language,
                                      "Répartition des notes"
                                    )}
                                  </h2>

                                  <p>
                                    {translate(
                                      language,
                                      "Consultez la répartition des évaluations reçues."
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="reputationDistributionList">
                                {ratingDistribution.map(
                                  (item) => {
                                    const percentage =
                                      (
                                        item.count /
                                        maximumDistributionCount
                                      ) * 100

                                    return (
                                      <div
                                        key={
                                          item.rating
                                        }
                                        className="reputationDistributionRow"
                                      >
                                        <span className="reputationDistributionRating">
                                          {item.rating} ★
                                        </span>

                                        <div className="reputationDistributionTrack">
                                          <div
                                            className="reputationDistributionProgress"
                                            style={{
                                              width: `${percentage}%`,
                                            }}
                                          />
                                        </div>

                                        <strong>
                                          {item.count}
                                        </strong>
                                      </div>
                                    )
                                  }
                                )}
                              </div>
                            </article>
                            )
          }
        </section>

        <section className="reputationRatingsSection">
          <div className="reputationSectionTitle">
            <div>
              <h2>
                {translate(
                  language,
                  "Détail des évaluations"
                )}
              </h2>

              <p>
                {isSitter
                  ? translate(
                      language,
                      "Analysez les qualités principales de votre profil."
                    )
                  : translate(
                      language,
                      "Analysez les critères évalués par vos clients."
                    )}
              </p>
            </div>
          </div>

          {reputationStats.ratings.length >
          0 ? (
            <div className="reputationRatingsGrid">
              {reputationStats.ratings.map(
                (rating) => (
                  <RatingRow
                    key={rating.label}
                    label={rating.label}
                    value={rating.value}
                  />
                )
              )}
            </div>
          ) : (
            <div className="reputationEmptyState">
              <div className="reputationEmptyIcon">
                ☆
              </div>

              <h3>
                {translate(
                  language,
                  "Aucune évaluation"
                )}
              </h3>

              <p>
                {translate(
                  language,
                  "Les évaluations apparaîtront ici dès que vous recevrez vos premiers avis."
                )}
              </p>
            </div>
          )}
        </section>

        <section className="reputationCommentsSection">
          <div className="reputationSectionTitle">
            <div>
              <h2>
                {translate(
                  language,
                  "Commentaires"
                )}
              </h2>

              <p>
                {translate(
                  language,
                  "Découvrez les derniers retours laissés par vos clients."
                )}
              </p>
            </div>

            <span className="reputationCommentsCount">
              {feedbacks.length}
            </span>
          </div>

          {feedbacks.length > 0 ? (
            <div className="reputationCommentsList">
              {feedbacks.map(
                (
                  feedback,
                  index
                ) => {
                    const animalName =
                      feedback.animalName?.trim() ||
                      translate(
                        language,
                        "Animal Zoove"
                      )

                    const animalPhoto =
                      feedback.animalPhoto ||
                      "/images/demo2.jpg"

                  return (
                    <article
                      key={
                        feedback.id ??
                        `${feedback.date}-${index}`
                      }
                      className="reputationCommentCard"
                    >
                      <div className="reputationCommentHeader">
                          <div className="reputationClientIdentity">
                            <img
                              src={animalPhoto}
                              alt={animalName}
                              className="reputationClientPhoto"
                            />

                            <div>
                              <strong className="reputationClientName">
                                {animalName}
                              </strong>

                              <span className="reputationCommentDate">
                                {formatFeedbackDate(
                                  feedback.date
                                )}
                              </span>
                            </div>
                          </div>

                        <span className="reputationVerifiedBadge">
                          ✓{" "}
                          {translate(
                            language,
                            "Avis vérifié"
                          )}
                        </span>
                      </div>

                      <p className="reputationCommentText">
                        {feedback.comment?.trim() ||
                          translate(
                            language,
                            "Aucun commentaire laissé."
                          )}
                      </p>
                    </article>
                  )
                }
              )}
            </div>
          ) : (
            <div className="reputationEmptyState">
              <div className="reputationEmptyIcon">
                💬
              </div>

              <h3>
                {translate(
                  language,
                  "Aucun avis pour le moment."
                )}
              </h3>

              <p>
                {translate(
                  language,
                  "Les commentaires de vos clients apparaîtront ici."
                )}
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
