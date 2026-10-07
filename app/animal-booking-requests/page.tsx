"use client"

import {
  useEffect,
  useMemo,
  useState
} from "react"

import { useAuth } from "@/context/AuthContext"

import {
  useLanguage,
  type Language
} from "@/context/LanguageContext"

import {
  translate
} from "@/translations/translations"

import {
  fetchAnimalBookingRequests
} from "@/services/bookingRequests"

import {
  fetchProfessional
} from "@/services/fetchProfessionalById"

import {
  BookingRequest,
  BookingRequestStatus
} from "@/types/BookingRequest"

import "./AnimalBookingRequests.css"


type StatusFilter =
  | "all"
  | BookingRequestStatus


type ProfessionalInformation = {
  name: string
  serviceNames: Record<string, string>
}


function localeForLanguage(
  language: Language
): string {
  switch (language) {
    case "fr":
      return "fr-FR"

    case "es":
      return "es-ES"

    case "it":
      return "it-IT"

    case "de":
      return "de-DE"

    case "pt":
      return "pt-PT"

    case "ar":
      return "ar"

    default:
      return "en-US"
  }
}


function parseRequestNotes(
  rawNotes: string
): {
  notes: string
  preferredDays: string[]
  customAnswers: Record<string, string>
  pickupAddress: string
  duration: number
} {
  if (!rawNotes) {
    return {
      notes: "",
      preferredDays: [],
      customAnswers: {},
        pickupAddress: "",
        duration: 0
    }
  }

  try {
    const parsed =
      JSON.parse(rawNotes)

    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
    ) {
      return {
        notes:
          typeof parsed.notes === "string"
            ? parsed.notes
            : "",

        preferredDays:
          Array.isArray(
            parsed.preferredDays
          )
            ? parsed.preferredDays
            : [],

        customAnswers:
          parsed.customAnswers &&
          typeof parsed.customAnswers ===
            "object" &&
          !Array.isArray(
            parsed.customAnswers
          )
            ? parsed.customAnswers
            : {},
        
      pickupAddress:
        typeof parsed.pickupAddress === "string"
          ? parsed.pickupAddress
          : "",

      duration:
        Number.isFinite(
          Number(parsed.duration)
        )
          ? Number(parsed.duration)
          : 0
      }
    }
  } catch {
    /*
     * Compatibilité avec les anciennes
     * BookingRequest où notes était
     * directement une String.
     */
  }

    return {
      notes: rawNotes,
      preferredDays: [],
      customAnswers: {},
      pickupAddress: "",
      duration: 0
    }
}


function getTimestamp(
  value: number | null | undefined
): number {
  if (!value) {
    return 0
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 0
  }

  return date.getTime()
}


export default function AnimalBookingRequestsPage() {
  const { session } =
    useAuth()

  const { language } =
    useLanguage()

  const animal =
    session?.accountType === "animal"
      ? session.user
      : null


  const [
    bookingRequests,
    setBookingRequests
  ] = useState<BookingRequest[]>([])

  const [
    professionals,
    setProfessionals
  ] = useState<
    Record<
      string,
      ProfessionalInformation
    >
  >({})

  const [
    selectedStatus,
    setSelectedStatus
  ] = useState<StatusFilter>(
    "all"
  )

  const [
    isLoading,
    setIsLoading
  ] = useState(true)

  const [
    error,
    setError
  ] = useState("")


  /*
   * Chargement BookingRequest
   */

  useEffect(() => {
    let cancelled = false

    async function loadBookingRequests() {
      if (!animal?.id) {
        setBookingRequests([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError("")

        const results =
          await fetchAnimalBookingRequests(
            animal.id
          )

        if (!cancelled) {
          setBookingRequests(
            results
          )
        }
      } catch (loadError) {
        console.error(
          "Erreur chargement BookingRequest :",
          loadError
        )

        if (!cancelled) {
          setError(
            "Impossible de charger vos demandes."
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadBookingRequests()

    return () => {
      cancelled = true
    }
  }, [animal?.id])


  /*
   * Chargement du nom des professionnels
   * et des prestations.
   */

  useEffect(() => {
    let cancelled = false

    async function loadProfessionals() {
      const professionalIDs = [
        ...new Set(
          bookingRequests
            .map(
              request =>
                request.professionalID
            )
            .filter(Boolean)
        )
      ]

      if (
        professionalIDs.length === 0
      ) {
        setProfessionals({})
        return
      }

      try {
        const results =
          await Promise.all(
            professionalIDs.map(
              async professionalID => {
                const professional =
                  await fetchProfessional(
                    professionalID
                  )

                const serviceNames =
                  Object.fromEntries(
                    (
                      professional?.services ??
                      []
                    ).map(
                      (service: any) => [
                        service.id,
                        service.name
                      ]
                    )
                  )

                return {
                  id:
                    professionalID,

                  name:
                    professional?.name ??
                    "",

                  serviceNames
                }
              }
            )
          )

        if (cancelled) {
          return
        }

        setProfessionals(
          Object.fromEntries(
            results.map(
              professional => [
                professional.id,

                {
                  name:
                    professional.name,

                  serviceNames:
                    professional.serviceNames
                }
              ]
            )
          )
        )
      } catch (loadError) {
        console.error(
          "Erreur chargement professionnels :",
          loadError
        )
      }
    }

    loadProfessionals()

    return () => {
      cancelled = true
    }
  }, [bookingRequests])


  /*
   * Nombre de demandes par statut.
   */

  const statusCounts =
    useMemo(() => {
      return {
        all:
          bookingRequests.length,

        pending:
          bookingRequests.filter(
            request =>
              request.status ===
              "pending"
          ).length,

        alternativeProposed:
          bookingRequests.filter(
            request =>
              request.status ===
              "alternativeProposed"
          ).length,

        accepted:
          bookingRequests.filter(
            request =>
              request.status ===
              "accepted"
          ).length,

        refused:
          bookingRequests.filter(
            request =>
              request.status ===
              "refused"
          ).length
      }
    }, [bookingRequests])


  /*
   * Filtre + tri.
   */

  const displayedBookingRequests =
    useMemo(() => {
      const statusPriority:
        Record<
          BookingRequestStatus,
          number
        > = {
          alternativeProposed: 0,
          pending: 1,
          accepted: 2,
          refused: 3
        }

      const filtered =
        selectedStatus === "all"
          ? bookingRequests
          : bookingRequests.filter(
              request =>
                request.status ===
                selectedStatus
            )

      return [
        ...filtered
      ].sort(
        (a, b) => {
          if (
            selectedStatus === "all"
          ) {
            const statusDifference =
              statusPriority[
                a.status
              ] -
              statusPriority[
                b.status
              ]

            if (
              statusDifference !== 0
            ) {
              return statusDifference
            }
          }

          const dateA =
            Math.max(
              getTimestamp(
                a.requestedDate
              ),
              getTimestamp(
                a.proposedDate
              )
            )

          const dateB =
            Math.max(
              getTimestamp(
                b.requestedDate
              ),
              getTimestamp(
                b.proposedDate
              )
            )

          return dateB - dateA
        }
      )
    }, [
      bookingRequests,
      selectedStatus
    ])


  const locale =
    localeForLanguage(
      language
    )


  function formatDate(
    timestamp:
      | number
      | null
      | undefined
  ): string {
    if (!timestamp) {
      return ""
    }

    const date =
      new Date(timestamp)

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return ""
    }

    return date.toLocaleDateString(
      locale,
      {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
      }
    )
  }


  function formatTime(
    timestamp:
      | number
      | null
      | undefined
  ): string {
    if (!timestamp) {
      return ""
    }

    const date =
      new Date(timestamp)

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return ""
    }

    return date.toLocaleTimeString(
      locale,
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    )
  }


  function getStatusLabel(
    status: BookingRequestStatus
  ): string {
    switch (status) {
      case "pending":
        return translate(
          language,
          "En attente"
        )

      case "alternativeProposed":
        return translate(
          language,
          "Nouveau créneau"
        )

      case "accepted":
        return translate(
          language,
          "Acceptée"
        )

      case "refused":
        return translate(
          language,
          "Refusée"
        )
    }
  }


  /*
   * Pas de compte animal.
   */

  if (!animal) {
    return (
      <main className="animalBookingRequestsPage">
        <div className="animalBookingRequestsHeader">
          <h1>
            {translate(
              language,
              "Mes demandes"
            )}
          </h1>
        </div>

        <p>
          {translate(
            language,
            "Vous devez être connecté."
          )}
        </p>
      </main>
    )
  }


  return (
    <main className="animalBookingRequestsPage">

      {/* HEADER */}

      <header className="animalBookingRequestsHeader">
        <div>
          <h1>
            {translate(
              language,
              "Mes demandes"
            )}
          </h1>

          <p>
            {translate(
              language,
              "Suivez vos demandes de rendez-vous auprès des professionnels."
            )}
          </p>
        </div>
      </header>


      {/* FILTRES */}

      {!isLoading &&
        !error &&
        bookingRequests.length >
          0 && (
          <div className="bookingRequestFilters">

            <button
              type="button"
              className={
                selectedStatus ===
                "all"
                  ? "bookingRequestFilter active"
                  : "bookingRequestFilter"
              }
              onClick={() =>
                setSelectedStatus(
                  "all"
                )
              }
            >
              {translate(
                language,
                "Toutes"
              )}

              <span>
                {
                  statusCounts.all
                }
              </span>
            </button>


            <button
              type="button"
              className={
                selectedStatus ===
                "pending"
                  ? "bookingRequestFilter active"
                  : "bookingRequestFilter"
              }
              onClick={() =>
                setSelectedStatus(
                  "pending"
                )
              }
            >
              {translate(
                language,
                "En attente"
              )}

              <span>
                {
                  statusCounts.pending
                }
              </span>
            </button>


            <button
              type="button"
              className={
                selectedStatus ===
                "alternativeProposed"
                  ? "bookingRequestFilter active"
                  : "bookingRequestFilter"
              }
              onClick={() =>
                setSelectedStatus(
                  "alternativeProposed"
                )
              }
            >
              {translate(
                language,
                "Nouveau créneau"
              )}

              <span>
                {
                  statusCounts
                    .alternativeProposed
                }
              </span>
            </button>


            <button
              type="button"
              className={
                selectedStatus ===
                "accepted"
                  ? "bookingRequestFilter active"
                  : "bookingRequestFilter"
              }
              onClick={() =>
                setSelectedStatus(
                  "accepted"
                )
              }
            >
              {translate(
                language,
                "Acceptées"
              )}

              <span>
                {
                  statusCounts.accepted
                }
              </span>
            </button>


            <button
              type="button"
              className={
                selectedStatus ===
                "refused"
                  ? "bookingRequestFilter active"
                  : "bookingRequestFilter"
              }
              onClick={() =>
                setSelectedStatus(
                  "refused"
                )
              }
            >
              {translate(
                language,
                "Refusées"
              )}

              <span>
                {
                  statusCounts.refused
                }
              </span>
            </button>

          </div>
        )}


      {/* CHARGEMENT */}

      {isLoading && (
        <div className="animalBookingRequestsLoading">
          <div className="bookingRequestLoader" />

          <span>
            {translate(
              language,
              "Chargement..."
            )}
          </span>
        </div>
      )}


      {/* ERREUR */}

      {!isLoading &&
        error && (
          <div className="animalBookingRequestsError">
            {translate(
              language,
              error
            )}
          </div>
        )}


      {/* AUCUNE DEMANDE */}

      {!isLoading &&
        !error &&
        bookingRequests.length ===
          0 && (
          <div className="emptyBookingRequests">

            <div className="emptyBookingRequestsIcon">
              🕐
            </div>

            <h2>
              {translate(
                language,
                "Aucune demande"
              )}
            </h2>

            <p>
              {translate(
                language,
                "Vos demandes de rendez-vous apparaîtront ici."
              )}
            </p>

          </div>
        )}


      {/* FILTRE VIDE */}

      {!isLoading &&
        !error &&
        bookingRequests.length >
          0 &&
        displayedBookingRequests.length ===
          0 && (
          <div className="emptyFilteredRequests">

            <span>
              🔎
            </span>

            <p>
              {translate(
                language,
                "Aucune demande avec ce statut."
              )}
            </p>

          </div>
        )}


      {/* LISTE */}

      {!isLoading &&
        !error &&
        displayedBookingRequests.length >
          0 && (
          <div className="animalBookingRequestsList">

            {displayedBookingRequests.map(
              request => {

                const professional =
                  professionals[
                    request.professionalID
                  ]

                const professionalName =
                  professional?.name ||
                  translate(
                    language,
                    "Professionnel"
                  )

                const serviceName =
                  professional
                    ?.serviceNames?.[
                      request.serviceID
                    ] ||
                  translate(
                    language,
                    "Prestation"
                  )

                const parsedNotes =
                  parseRequestNotes(
                    request.notes
                  )
                  
                  const isSitterRequest =
                    parsedNotes.duration > 0

                  const sitterEndDate =
                    isSitterRequest
                      ? new Date(
                          new Date(
                            request.requestedDate
                          ).getTime() +
                            parsedNotes.duration *
                              60_000
                        )
                      : null

                const hasAnimalInformations =
                  Boolean(
                    request.behavior ||
                    request.coatCondition ||
                    request.weight ||
                    parsedNotes.notes ||
                    parsedNotes
                      .preferredDays
                      .length ||
                    Object.keys(
                      parsedNotes
                        .customAnswers
                    ).length
                  )

                return (
                  <article
                    key={request.id}
                    className={`animalBookingRequestCard status-${request.status}`}
                  >

                    {/* HAUT CARTE */}

                    <div className="bookingRequestCardHeader">

                      <div className="bookingRequestProfessional">

                        <span className="bookingRequestSmallLabel">
                          {translate(
                            language,
                            "Professionnel"
                          )}
                        </span>

                        <strong>
                          {
                            professionalName
                          }
                        </strong>

                        <span className="bookingRequestService">
                          {
                            serviceName
                          }
                        </span>

                      </div>


                      <span
                        className={`bookingRequestStatus status-${request.status}`}
                      >
                        {getStatusLabel(
                          request.status
                        )}
                      </span>

                    </div>


                    {/* CRÉNEAU DEMANDÉ */}

                    <section className="bookingRequestSection">

                      <div className="bookingRequestSectionTitle">
                        <span className="bookingRequestSectionIcon">
                          📅
                        </span>

                        <span>
                          {translate(
                            language,
                            "Créneau demandé"
                          )}
                        </span>
                      </div>


                      <div className="bookingRequestDateCard">

                        <strong>
                          {formatDate(
                            request.requestedDate
                          )}
                        </strong>

                        <span>
                          {formatTime(
                            request.requestedDate
                          )}

                          {isSitterRequest &&
                            sitterEndDate && (
                              <>
                                {" → "}
                                {formatTime(
                                  sitterEndDate.getTime()
                                )}
                              </>
                            )}
                        </span>

                      </div>

                    </section>


                    {/* NOUVEAU CRÉNEAU */}

                    {request.status ===
                      "alternativeProposed" &&
                      request.proposedDate && (
                        <section className="bookingRequestSection">

                          <div className="bookingRequestSectionTitle proposed">
                            <span className="bookingRequestSectionIcon">
                              ✨
                            </span>

                            <span>
                              {translate(
                                language,
                                "Nouveau créneau proposé"
                              )}
                            </span>
                          </div>


                          <div className="bookingRequestDateCard proposed">

                            <strong>
                              {formatDate(
                                request.proposedDate
                              )}
                            </strong>

                            <span>
                              {formatTime(
                                request.proposedDate
                              )}
                            </span>

                          </div>

                        </section>
                      )}


                    {/* INFORMATIONS TRANSMISES */}

                    {hasAnimalInformations && (
                      <section className="bookingRequestSection">

                        <div className="bookingRequestSectionTitle">
                          <span className="bookingRequestSectionIcon">
                            🐶
                          </span>

                          <span>
                            {translate(
                              language,
                              "Informations transmises"
                            )}
                          </span>
                        </div>


                        <div className="bookingRequestInformations">

                          {request.behavior && (
                            <div className="bookingRequestInformation">

                              <span>
                                {translate(
                                  language,
                                  "Comportement"
                                )}
                              </span>

                              <strong>
                                {
                                  request.behavior
                                }
                              </strong>

                            </div>
                          )}


                          {request.coatCondition && (
                            <div className="bookingRequestInformation">

                              <span>
                                {translate(
                                  language,
                                  "État du pelage"
                                )}
                              </span>

                              <strong>
                                {
                                  request.coatCondition
                                }
                              </strong>

                            </div>
                          )}


                          {request.weight >
                            0 && (
                            <div className="bookingRequestInformation">

                              <span>
                                {translate(
                                  language,
                                  "Poids"
                                )}
                              </span>

                              <strong>
                                {request.weight} kg
                              </strong>

                            </div>
                          )}


                          {parsedNotes
                            .preferredDays
                            .length >
                            0 && (
                            <div className="bookingRequestInformation bookingRequestInformationFull">

                              <span>
                                {translate(
                                  language,
                                  "Jours préférés"
                                )}
                              </span>

                              <strong>
                                {parsedNotes
                                  .preferredDays
                                  .join(", ")}
                              </strong>

                            </div>
                          )}


                          {parsedNotes.notes && (
                            <div className="bookingRequestInformation bookingRequestInformationFull">

                              <span>
                                {translate(
                                  language,
                                  "Notes"
                                )}
                              </span>

                              <strong>
                                {
                                  parsedNotes.notes
                                }
                              </strong>

                            </div>
                          )}


                          {Object.entries(
                            parsedNotes
                              .customAnswers
                          ).map(
                            ([
                              question,
                              answer
                            ]) => (
                              <div
                                key={
                                  question
                                }
                                className="bookingRequestInformation bookingRequestInformationFull"
                              >

                                <span>
                                  {
                                    question
                                  }
                                </span>

                                <strong>
                                  {
                                    answer
                                  }
                                </strong>

                              </div>
                            )
                          )}

                        </div>

                      </section>
                    )}


                    {/* MESSAGE STATUT */}

                    <div
                      className={`bookingRequestStatusMessage status-${request.status}`}
                    >

                      {request.status ===
                        "pending" && (
                        <>
                          <span>
                            ⏳
                          </span>

                          <p>
                            {translate(
                              language,
                              "Votre demande a été envoyée au professionnel et attend sa réponse."
                            )}
                          </p>
                        </>
                      )}


                      {request.status ===
                        "alternativeProposed" && (
                        <>
                          <span>
                            📅
                          </span>

                          <p>
                            {translate(
                              language,
                              "Le professionnel vous propose un autre créneau."
                            )}
                          </p>
                        </>
                      )}


                      {request.status ===
                        "accepted" && (
                        <>
                          <span>
                            ✓
                          </span>

                          <p>
                            {translate(
                              language,
                              "Votre demande a été acceptée. Le rendez-vous est confirmé."
                            )}
                          </p>
                        </>
                      )}


                      {request.status ===
                        "refused" && (
                        <>
                          <span>
                            ×
                          </span>

                          <p>
                            {translate(
                              language,
                              "Le professionnel n'a pas pu accepter cette demande."
                            )}
                          </p>
                        </>
                      )}

                    </div>


                    {/* MOTIF REFUS */}

                    {request.status ===
                      "refused" &&
                      request.refusalReason && (
                        <div className="bookingRequestRefusal">

                          <span>
                            {translate(
                              language,
                              "Motif du refus"
                            )}
                          </span>

                          <p>
                            {
                              request.refusalReason
                            }
                          </p>

                        </div>
                      )}

                  </article>
                )
              }
            )}

          </div>
        )}

    </main>
  )
}
