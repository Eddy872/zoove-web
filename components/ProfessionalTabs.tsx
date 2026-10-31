"use client"

import { useState } from "react"
import "./ProfessionalTabs.css"
import {
  useLanguage,
  type Language
} from "@/context/LanguageContext"
import { translate } from "@/translations/translations"
import BookingModal from "@/components/BookingModal"
import Image from "next/image"
import {
  useRouter
} from "next/navigation"

type Props = {
  pro: any
}

export default function ProfessionalTabs({ pro }: Props) {
    const { language } = useLanguage()
    const router = useRouter()
  const [selectedTab, setSelectedTab] = useState("Informations")
    const [bookingService, setBookingService] = useState<any>(null)
    const [showGuestModal, setShowGuestModal] = useState(false)
    const [pendingBooking, setPendingBooking] = useState<
      | { type: "service"; service: any }
      | { type: "sitter"; service: string }
      | null
    >(null)
    const packageValue = Number(
      pro.package ?? 0
    )

    const packageBadge =
      packageValue === 2
        ? {
            label: "Recommandé",
            image:
              "/images/visibility.png",
            className: "visibility"
          }
        : packageValue === 3
          ? {
              label: "Ambassadeur",
              image:
                "/images/ambassador.png",
              className: "ambassador"
            }
          : null
  const days = [
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
    "Dimanche"
  ]
    
    const handleServiceBooking = (service: any) => {
      setPendingBooking({
        type: "service",
        service
      })

      setShowGuestModal(true)
    }

    const handleSitterBookingRequest = (service: string) => {
      setPendingBooking({
        type: "sitter",
        service
      })

      setShowGuestModal(true)
    }

    const continueAsGuest = () => {
      if (!pendingBooking) return

      setShowGuestModal(false)

      if (pendingBooking.type === "sitter") {
        router.push(
          `/booking-request?professionalID=${encodeURIComponent(pro.id)}&serviceID=${encodeURIComponent(pendingBooking.service)}&professionalType=sitter`
        )
        return
      }

      const service = pendingBooking.service

      if (service.bookingMode === "approvalRequired") {
        router.push(
          `/booking-request?professionalID=${encodeURIComponent(pro.id)}&serviceID=${encodeURIComponent(service.id)}`
        )
        return
      }

      setBookingService(service)
      setPendingBooking(null)
    }

    const goToLogin = () => {
      if (!pendingBooking) return

      // Préserver la prestation choisie pour reprendre après connexion.
      const serviceID =
        pendingBooking.type === "sitter"
          ? pendingBooking.service
          : pendingBooking.service.id

      const params = new URLSearchParams({
        professionalID: pro.id,
        serviceID,
        ...(pendingBooking.type === "sitter"
          ? { professionalType: "sitter" }
          : {})
      })

      const returnTo = `/professional/${encodeURIComponent(pro.id)}?${params.toString()}`

      router.push(`/login?next=${encodeURIComponent(returnTo)}`)
    }

  const planning = pro.type === "Sitter" ? pro.availability : pro.schedules
    
    const sitterServiceIcons: Record<string, string> = {
      garde: "🏠",
      visites: "👀",
      promenades: "🚶",
      hebergement: "🛏️",
      transport: "🚗"
    }

    const sitterServiceNames: Record<string, string> = {
      garde: "Garde",
      visites: "Visites",
      promenades: "Promenades",
      hebergement: "Hébergement",
      transport: "Transport"
    }
    
    const tabs = [
      { id: "Informations", title: translate(language, "Informations") },
      { id: "Services", title: translate(language, "Services") },
      { id: "Avis", title: translate(language, "Avis") }
    ]

  return (
    <>
      <section className="photoGrid">
        {pro.photos.map((photo: string) => (
          <img key={photo} src={photo} alt={pro.name} />
        ))}
      </section>

      <div className="tabBar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={selectedTab === tab.id ? "tabButton active" : "tabButton"}
              onClick={() => setSelectedTab(tab.id)}
            >
              {tab.title}
            </button>
          ))}
      </div>

      {selectedTab === "Informations" && (
        <>
          <section className="proInfo">
            <div>
              <div className="proTitleRow">
                <h1>{pro.name}</h1>

                {packageBadge && (
                  <div
                    className={`professionalPackageBadge professionalPackageBadge--${packageBadge.className}`}
                  >
                    <img
                      src={packageBadge.image}
                      alt=""
                      className="professionalPackageBadgeImage"
                    />

                    <span>
                      {translate(
                        language,
                        packageBadge.label
                      )}
                    </span>
                  </div>
                )}
              </div>

              <p className="job">
                {translate(
                  language,
                  pro.speciality
                )}
              </p>

              <p>
                📍{" "}
                {pro.adress
                  ? pro.adress
                  : `${pro.city}, ${pro.country}`}
              </p>

              <p>📞 {pro.phoneNumber}</p>

              <p>
                ⭐ {pro.rating} —{" "}
                {pro.feedbacks?.length ?? 0} avis
              </p>
            </div>
          </section>

          <section className="block">
            <h2>{translate(language, "À propos")}</h2>
            <p>{pro.description}</p>
          </section>

          <section className="block">
            <h2>{translate(language, "Horaires")}</h2>

            <div className="scheduleList">
              {days.map((day) => {
                  const schedule = planning?.find((item: string) =>
                    item.startsWith(day)
                  )

                  const hours = schedule
                    ? schedule
                        .replace(day, "")
                        .replace("=", "")
                        .trim()
                    : ""

                  const isClosed = !schedule || hours.toLowerCase() === "fermé"
                return (
                  <div key={day} className="scheduleRow">
                        <strong>{translate(language, day)}</strong>

                        <span className={isClosed ? "closedHours" : "openHours"}>
                          {isClosed
                            ? translate(language, "Fermé")
                            : hours}
                        </span>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}

      {selectedTab === "Services" && (
        <section className="block">
          <div className="servicesHeader">
              <h2>{translate(language, "Services proposés")}</h2>

            {pro.type === "Sitter" && (
              <strong className="sitterPrice">
                {pro.price} {pro.devise}/h
              </strong>
            )}
          </div>

          {pro.type === "Sitter" ? (
            <>
                <div className="sitterServicesList">
                  {pro.services.map((service: string) => (
                    <div key={service} className="sitterServiceRow">
                      <span>
                        {sitterServiceIcons[service]}{" "}
                        {translate(language, sitterServiceNames[service])}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="reserveContainer">
                  <button
                    className="reserveServiceButton"
                    onClick={() =>
                      handleSitterBookingRequest("garde")
                    }
                  >
                    {translate(
                      language,
                      "Demander un créneau"
                    )}
                  </button>
                </div>
            </>
          ) : (
            <>
               {pro.services.map((service: any) => (
                 <div
                   key={service.id}
                   className="serviceCard"
                 >
                   <div className="serviceCardContent">
                     <h3 className="serviceCardName">
                       {service.name}
                     </h3>

                     <div className="serviceCardMain">
                       <p className="serviceCardDescription">
                         {service.description}
                       </p>
                        <button
                          type="button"
                          className="reserveServiceButton"
                          onClick={() =>
                            handleServiceBooking(
                              service
                            )
                          }
                        >
                          {translate(
                            language,
                            service.bookingMode ===
                              "approvalRequired"
                              ? "Demander un créneau"
                              : "Réserver"
                          )}
                        </button>
                     </div>

                     <div className="serviceCardPrice">
                       <span>
                         {translate(
                           language,
                           "À partir de "
                         )}
                       </span>

                       <strong>
                         {service.price}{" "}
                         {service.devise}
                       </strong>
                     </div>
                   </div>
                 </div>
               ))}
            </>
          )}
        </section>
      )}

      {selectedTab === "Avis" && (
        <section className="block">
          <h2>{translate(language, "Avis clients")}</h2>

          {pro.type === "Sitter" ? (
            <>
            <RatingRow label={translate(language, "Compétence")} value={pro.skill} />
            <RatingRow label={translate(language, "Fiabilité")} value={pro.fiability} />
            <RatingRow label={translate(language, "Engagement")} value={pro.engagement} />
            <RatingRow label={translate(language, "Affinité")} value={pro.affinity} />

              <div className="ratingRow totalRating">
                <span>Note globale</span>
                <strong>
                  ⭐{" "}
                  {(
                    (pro.skill + pro.fiability + pro.engagement + pro.affinity) /
                    4
                  ).toFixed(1)}
                </strong>
              </div>
            </>
          ) : (
            <>
              {pro.feedbacks && pro.feedbacks.length > 0 ? (
                <>
                  {(() => {
                    const count = pro.feedbacks.length

                    const cleanRate =
                      pro.feedbacks.reduce(
                        (sum: number, feedback: any) => sum + feedback.cleanRate,
                        0
                      ) / count

                    const frameRate =
                      pro.feedbacks.reduce(
                        (sum: number, feedback: any) => sum + feedback.frameRate,
                        0
                      ) / count

                    const homeRate =
                      pro.feedbacks.reduce(
                        (sum: number, feedback: any) => sum + feedback.homeRate,
                        0
                      ) / count

                    const qualityRate =
                      pro.feedbacks.reduce(
                        (sum: number, feedback: any) => sum + feedback.qualityRate,
                        0
                      ) / count

                    const globalRate =
                      (cleanRate + frameRate + homeRate + qualityRate) / 4

                    return (
                      <>
                            <RatingRow label={translate(language, "Propreté")} value={cleanRate} />
                            <RatingRow label={translate(language, "Accueil")} value={frameRate} />
                            <RatingRow label={translate(language, "Cadre")} value={homeRate} />
                            <RatingRow label={translate(language, "Qualité")} value={qualityRate} />

                        <div className="ratingRow totalRating">
                            <span>{translate(language, "Note globale")}</span>
                          <strong>⭐ {globalRate.toFixed(1)}</strong>
                        </div>
                      </>
                    )
                  })()}

                  <div className="commentsSection">
                    <h3>{translate(language, "Commentaires")}</h3>

                    {pro.feedbacks.map((feedback: any, index: number) => (
                      <div key={index} className="commentCard">
                        <div className="commentHeader">
                          <img
                            src="/images/demo2.jpg"
                            alt="Client"
                            className="commentPhoto"
                          />

                          <strong className="commentName">
                            Sarah Martin
                          </strong>
                        </div>

                        <p className="commentText">{feedback.comment}</p>

                        <div className="commentDate">
                          {new Date(feedback.date).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p>Aucun avis pour le moment.</p>
              )}
            </>
          )}
        </section>
      )}
          {showGuestModal && (
            <div
              className="guestBookingOverlay"
              onClick={() => setShowGuestModal(false)}
            >
              <div
                className="guestBookingModal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="guestBookingTitle"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="guestBookingClose"
                  aria-label={translate(language, "Fermer")}
                  onClick={() => setShowGuestModal(false)}
                >
                  ×
                </button>

                <h2 id="guestBookingTitle">
                  {translate(language, "Comment souhaitez-vous continuer ?")}
                </h2>

                <p>
                  {translate(
                    language,
                    "Connectez-vous ou continuez en tant qu'invité pour réserver."
                  )}
                </p>

                <button
                  type="button"
                  className="guestBookingPrimary"
                  onClick={goToLogin}
                >
                  {translate(language, "Se connecter")}
                </button>

                <button
                  type="button"
                  className="guestBookingSecondary"
                  onClick={continueAsGuest}
                >
                  {translate(language, "Continuer en tant qu'invité")}
                </button>
              </div>
            </div>
          )}
          
          {bookingService && (
            <BookingModal
              pro={pro}
              service={bookingService}
              onClose={() => setBookingService(null)}
            />
          )}
    </>
  )
}

function RatingRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="ratingRow">
      <span>{label}</span>
      <strong>⭐ {value.toFixed(1)}</strong>
    </div>
  )
}
