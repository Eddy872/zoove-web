"use client"

import "./ProfessionalOffers.css"
import { translate } from "@/translations/translations"
import { useAuth } from "@/context/AuthContext"
import { updateSitterProfile } from "@/services/updateSitterProfile"
import { updateGroomingProfile } from "@/services/updateGroomingProfile"
import { updateHealthcareProfile } from "@/services/updateHealthcareProfile"
import { saveCampaign } from "@/services/saveCampaign"
import {
  createOfferCheckout,
} from "@/services/createOfferCheckout"
import {
  createBoostCheckout,
} from "@/services/createBoostCheckout"
import {
  createCustomerPortal,
} from "@/services/createCustomerPortal"
import {
  Suspense,
  useEffect,
  useState
} from "react"

import {
  useRouter,
  useSearchParams
} from "next/navigation"

import {
  fetchProfessional,
  fetchServicesForProfessional
} from "@/services/fetchProfessionalById"
import Image from "next/image"
import type { Service } from "@/types/service"

type Boost = {
  id: string
  title: string
  description: string
  price: string
  duration: string
    image: string
}

type CampaignDraft = {
  structId: string
  name: string
  icon: string
  type: string
  status: "pending"
  startDate: Date
  endDate: Date
  serviceID: string
}

type ZooveOffer = {
  id: string
  name: string
  subtitle: string
  icon: string
  image?: string
  features: string[]
  price: string
  period?: string
  color: "purple" | "orange" | "blue" | "yellow"
}

const boosts: Boost[] = [
  {
    id: "boost-24h",
    title: "Service 24h",
    description: "Votre service en publicité.",
    price: "9,99 €",
    duration: "24h",
      image: "service_24h",
  },
  {
    id: "boost-72h",
    title: "Service 72h",
    description: "3 jours de publicité pour votre service.",
    price: "24,99 €",
    duration: "72h",
      image: "service_72h",
  },
]

const packageNames: Record<number, string> = {
  0: "Découverte",
  1: "Organisation",
  2: "Visibilité",
  3: "Ambassadeur",
}

const packageIcons: Record<number, string> = {
  0: "🐾",
  1: "🗓️",
  2: "🚀",
  3: "👑",
}

const commonOffersData = {
  discovery: {
    id: "discovery",
    name: "Découverte",
    icon: "🐾",
    image: "/images/discovery.png",
    price: "Gratuit",
    color: "purple" as const,
  },

  organisation: {
    id: "organisation",
    name: "Organisation",
    icon: "🗓️",
    image: "/images/organisation.png",
    price: "29,99 €",
    period: "/ mois",
    color: "orange" as const,
  },

  visibility: {
    id: "visibility",
    name: "Visibilité",
    icon: "🚀",
    image: "/images/visibility.png",
    price: "49,99 €",
    period: "/ mois",
    color: "blue" as const,
  },

  ambassador: {
    id: "ambassador",
    name: "Ambassadeur",
    icon: "👑",
    image: "/images/ambassador.png",
    price: "79,99 €",
    period: "/ mois",
    color: "yellow" as const,
  },
}

const groomingOffers: ZooveOffer[] = [
  {
    ...commonOffersData.discovery,
    subtitle: "Pour essayer Zoove sans engagement",
    features: [
      "10 réservations / mois",
      "Avis clients",
      "Fiche établissement",
    ],
  },
  {
    ...commonOffersData.organisation,
    subtitle: "Gérez votre activité comme un pro",
    features: [
      "Réservations illimitées",
      "Avis clients",
      "Gestion des employés",
      "Gestion des disponibilités",
    ],
  },
  {
    ...commonOffersData.visibility,
    subtitle: "Soyez vu en premier, attirez plus de clients",
    features: [
      "Tout Organisation",
      "Mise en avant locale",
      "Badge Recommandé",
      "Priorité dans les résultats",
    ],
  },
  {
    ...commonOffersData.ambassador,
    subtitle: "Le meilleur de Zoove, sans limites",
    features: [
      "Tout Visibilité",
      "Statistiques avancées",
      "Badge Ambassadeur",
      "Boost Service 72h offert",
    ],
  },
]

const healthcareOffers: ZooveOffer[] = [
  {
    ...commonOffersData.discovery,
    subtitle: "Pour découvrir Zoove sans engagement",
    features: [
      "10 rendez-vous / mois",
      "Avis clients",
      "Fiche établissement de santé",
    ],
  },
  {
    ...commonOffersData.organisation,
    subtitle: "Gérez facilement votre établissement",
    features: [
      "Rendez-vous illimités",
      "Avis clients",
      "Gestion des collaborateurs",
      "Gestion des disponibilités",
    ],
  },
  {
    ...commonOffersData.visibility,
    subtitle: "Développez la visibilité de votre établissement",
    features: [
      "Tout Organisation",
      "Mise en avant locale",
      "Badge Recommandé",
      "Priorité dans les résultats",
    ],
  },
  {
    ...commonOffersData.ambassador,
    subtitle: "Le meilleur de Zoove pour votre établissement",
    features: [
      "Tout Visibilité",
      "Statistiques avancées",
      "Badge Ambassadeur",
      "Boost Service 72h offert",
    ],
  },
]

const sitterOffers: ZooveOffer[] = [
  {
    ...commonOffersData.discovery,
    subtitle: "Pour essayer Zoove sans engagement",
    features: [
      "2 réservations / mois",
      "Commission de 20%",
    ],
  },
  {
    ...commonOffersData.organisation,
    subtitle: "Gérez votre activité de pet sitter",
    features: [
      "Réservations illimitées",
      "Agenda professionnel",
      "Commission de 15%",
    ],
  },
  {
    ...commonOffersData.visibility,
    subtitle: "Soyez vu en premier, attirez plus de clients",
    features: [
      "Tout Organisation",
      "Mise en avant locale",
      "Badge Recommandé",
      "Priorité dans les résultats",
      "Commission de 10%",
    ],
  },
  {
    ...commonOffersData.ambassador,
    subtitle: "Le meilleur de Zoove, sans limites",
    features: [
      "Tout Visibilité",
      "Statistiques avancées",
      "Badge Ambassadeur",
      "Boost Service 72h offert",
      "Commission de 5%",
    ],
  },
]

function formatPackageDate(
  date: Date
): string {
  const pad = (value: number) =>
    String(value).padStart(2, "0")

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}`
}

function displayPackageDate(date: string): string {
  if (!date) {
    return ""
  }

  return date.split(" ")[0]
}

function ProfessionalOffersContent() {
    
    const {
        session,
        updateUser,
      } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()

      const language = session?.user?.language ?? "fr"
    const accountType = session?.accountType
    console.log("account = ",accountType)
    const offers = (() => {
      switch (accountType) {
        case "grooming":
          return groomingOffers

        case "healthcare":
          return healthcareOffers

        case "sitter":
          return sitterOffers

        default:
          return sitterOffers
      }
    })()
    
    const [services, setServices] =
      useState<Service[]>([])

    const [isLoadingServices, setIsLoadingServices] =
      useState(false)
    
    const [
      isLoadingOffer,
      setIsLoadingOffer
    ] = useState(false)
    
    const [
      isLoadingBoost,
      setIsLoadingBoost
    ] = useState(false)
    
    const [selectedOffer, setSelectedOffer] =
      useState<ZooveOffer | null>(null)

    const [packageStart, setPackageStart] =
      useState("")

    const [packageEnd, setPackageEnd] =
      useState("")
    
    const [selectedBoost, setSelectedBoost] =
      useState<Boost | null>(null)
    
    const [
      pendingOffer,
      setPendingOffer
    ] = useState<ZooveOffer | null>(null)
    
    const [
      isServiceSelectionOpen,
      setIsServiceSelectionOpen
    ] = useState(false)
    
    const [
      showStripeRequiredModal,
      setShowStripeRequiredModal
    ] = useState(false)

    const [
      campaignDraft,
      setCampaignDraft
    ] = useState<CampaignDraft | null>(null)
    
    
    const getBoostEndDate = (
      boost: Boost,
      startDate: Date
    ) => {
      const endDate =
        new Date(startDate)

      /*
       * Adapte selon les vrais id
       * ou la vraie propriété duration de Boost.
       */
      switch (boost.id) {
        case "boost24":
          endDate.setHours(
            endDate.getHours() + 24
          )
          break

        case "boost72":
          endDate.setHours(
            endDate.getHours() + 72
          )
          break

        case "boost7days":
          endDate.setDate(
            endDate.getDate() + 7
          )
          break

        default:
          endDate.setHours(
            endDate.getHours() + 24
          )
      }

      return endDate
    }
    
    const updateProfessionalProfile = async (
      professionalID: string,
      updates: Record<string, unknown>
    ) => {
      if (!session) {
        throw new Error(
          "Utilisateur non connecté."
        )
      }

      switch (session.accountType) {
        case "sitter":
          return updateSitterProfile(
            professionalID,
            updates
          )

        case "grooming":
          return updateGroomingProfile(
            professionalID,
            updates
          )

        case "healthcare":
          return updateHealthcareProfile(
            professionalID,
            updates
          )

        default:
          throw new Error(
            "Type de compte professionnel non pris en charge."
          )
      }
    }
    
    const handleBoostPurchase = async (
      boost: Boost
    ) => {
      if (!session?.user?.id) {
        return
      }

      if (
        session.accountType === "sitter"
      ) {
        await handleBoostCheckout(
          boost,
          String(session.user.id)
        )

        return
      }

      if (
        session.accountType === "grooming" ||
        session.accountType === "healthcare"
      ) {
        try {
          setIsLoadingServices(true)

          const professionalServices =
            await fetchServicesForProfessional(
              String(session.user.id)
            )

          const loadedServices =
            Array.isArray(
              professionalServices
            )
              ? professionalServices
              : []

          setServices(loadedServices)
          setSelectedOffer(null)
          setSelectedBoost(boost)
          setIsServiceSelectionOpen(true)
        } catch (error) {
          console.error(
            "Impossible de charger les services :",
            error
          )

          setServices([])
          setSelectedBoost(null)
        } finally {
          setIsLoadingServices(false)
        }
      }
    }
    
    const handleBoostCheckout = async (
      boost: Boost,
      structId: string
    ) => {
      if (!session) {
        return
      }
        
        if (
          session.accountType === "sitter" &&
          !session.user.stripeAccountID
        ) {
          setShowStripeRequiredModal(true)
          return
        }

      if (
        session.accountType !== "sitter" &&
        session.accountType !== "grooming" &&
        session.accountType !== "healthcare"
      ) {
        return
      }

      try {
        setIsLoadingBoost(true)

        const durationHours: 24 | 72 =
          boost.id === "boost-24h"
            ? 24
            : 72

        const boostID:
          | "boost-24h"
          | "boost-72h" =
          durationHours === 24
            ? "boost-24h"
            : "boost-72h"

        const result =
          await createBoostCheckout({
            userID: structId,

            accountType:
              session.accountType,

            boostID,

            durationHours,

            email:
              session.user.email ?? "",

            stripeCustomerID:
              session.user
                .stripeCustomerID ||
              undefined
          })

        if (!result.url) {
          throw new Error(
            "URL Stripe manquante."
          )
        }

        window.location.href =
          result.url
      } catch (error) {
        console.error(
          "Impossible de démarrer le paiement du boost :",
          error
        )
      } finally {
        setIsLoadingBoost(false)
      }
    }
    
    const handleOfferCheckout = async (
      offer: ZooveOffer,
      boostStructId?: string
    ) => {
      if (!session?.user?.id) {
        return
      }

      let packageValue: 1 | 2 | 3

      switch (offer.id) {
        case "organisation":
          packageValue = 1
          break

        case "visibility":
          packageValue = 2
          break

        case "ambassador":
          packageValue = 3
          break

        default:
          return
      }

      if (
        session.accountType !== "sitter" &&
        session.accountType !== "grooming" &&
        session.accountType !== "healthcare"
      ) {
        return
      }

      try {
        setIsLoadingOffer(true)

        const result =
          await createOfferCheckout({
            userID: String(session.user.id),

            accountType: session.accountType,

            offerID: offer.id,

            package: packageValue,

            email: session.user.email ?? "",

            stripeCustomerID:
              session.user.stripeCustomerID ||
              undefined,

            boostStructId
          })

        if (!result.url) {
          throw new Error(
            "URL Stripe absente."
          )
        }

        window.location.href =
          result.url
      } catch (error) {
        console.error(
          "Erreur Checkout offre :",
          error
        )
      } finally {
        setIsLoadingOffer(false)
      }
    }
    
    const handleCampaignServiceSelection = async (
      service: Service
    ) => {
      const serviceID = String(
        service.id ?? ""
      )

      if (!serviceID) {
        console.error(
          "Identifiant du service introuvable."
        )

        return
      }

      setIsServiceSelectionOpen(false)

      if (selectedBoost) {
        const boost = selectedBoost

        setSelectedBoost(null)

        await handleBoostCheckout(
          boost,
          serviceID
        )

        return
      }

        if (
          pendingOffer?.id === "ambassador"
        ) {
          const offer =
            pendingOffer

          setPendingOffer(null)

          await handleOfferCheckout(
            offer,
            serviceID
          )
        }
    }
    
    const handleOfferSelection = async (
      offer: ZooveOffer
    ) => {
      if (!session?.user?.id) {
        return
      }
        
        if (
          session.accountType === "sitter" &&
          !session.user.stripeAccountID
        ) {
          setShowStripeRequiredModal(true)
          return
        }

      if (
        Number(session.user.package ?? 0) !== 0
      ) {
        return
      }

      if (offer.id === "discovery") {
        return
      }

      if (
        offer.id === "ambassador" &&
        (
          session.accountType === "grooming" ||
          session.accountType === "healthcare"
        )
      ) {
        try {
          setIsLoadingServices(true)

          const professionalServices =
            await fetchServicesForProfessional(
              String(session.user.id)
            )

          setServices(
            Array.isArray(professionalServices)
              ? professionalServices
              : []
          )

            setPendingOffer(offer)
            setIsServiceSelectionOpen(true)
        } catch (error) {
          console.error(
            "Impossible de charger les services :",
            error
          )

          setServices([])
        } finally {
          setIsLoadingServices(false)
        }

        return
      }

      const boostStructId =
        offer.id === "ambassador" &&
        session.accountType === "sitter"
          ? String(session.user.id)
          : undefined

      await handleOfferCheckout(
        offer,
        boostStructId
      )
    }
    
    const closeOfferConfirmation = () => {
      setSelectedOffer(null)
      setPackageStart("")
      setPackageEnd("")
    }
    
    const currentPackage =
      Number(session?.user?.package ?? 0)

    const currentOffer =
      offers.find((offer) => {
        const packageByOffer: Record<string, number> = {
          discovery: 0,
          organisation: 1,
          visibility: 2,
          ambassador: 3,
        }

        return packageByOffer[offer.id] === currentPackage
      })

    const currentPackageName =
      currentOffer?.name ?? "Découverte"

    const currentPackageImage =
    currentOffer?.image ??
      "/images/offers/discovery.png"

    const hasActivePaidPackage =
      currentPackage !== 0

    const synchronizeProfessionalSession =
      async (): Promise<boolean> => {
        if (!session?.user?.id) {
          return false
        }

        try {
          const professional =
            await fetchProfessional(
              String(session.user.id)
            )

          if (!professional) {
            console.error(
              "Professionnel introuvable après le paiement."
            )

            return false
          }

          const updatedPackage =
            Number(
              professional.package ?? 0
            )

          await updateUser({
            package:
              updatedPackage,

            packageStart:
              professional.packageStart ?? "",

            packageEnd:
              professional.packageEnd ?? "",

            stripeCustomerID:
              professional.stripeCustomerID ?? "",

            stripeSubscriptionID:
              professional.stripeSubscriptionID ?? ""
          })

          return true
        } catch (error) {
          console.error(
            "Impossible de mettre à jour la session locale :",
            error
          )

          return false
        }
      }
    useEffect(() => {
      const payment =
        searchParams.get("payment")

      if (
        payment !== "success" ||
        !session?.user?.id
      ) {
        return
      }

      let cancelled = false

      const synchronizePayment =
        async () => {
          /*
           * Le webhook Stripe peut finir légèrement
           * après la redirection vers la webapp.
           */
          for (
            let attempt = 0;
            attempt < 5;
            attempt += 1
          ) {
            const professional =
              await fetchProfessional(
                String(session.user.id)
              )

            if (cancelled) {
              return
            }

            const cloudKitPackage =
              Number(
                professional?.package ?? 0
              )

            if (
              professional &&
              cloudKitPackage !==
                Number(
                  session.user.package ?? 0
                )
            ) {
              await updateUser({
                package:
                  cloudKitPackage,

                packageStart:
                  professional.packageStart ?? "",

                packageEnd:
                  professional.packageEnd ?? "",

                stripeCustomerID:
                  professional.stripeCustomerID ?? "",

                stripeSubscriptionID:
                  professional.stripeSubscriptionID ?? ""
              })
                
                const offerCorrespondingToPackage =
                  offers.find((offer) => {
                    const map: Record<string, number> = {
                      discovery: 0,
                      organisation: 1,
                      visibility: 2,
                      ambassador: 3
                    }

                    return (
                      map[offer.id] ===
                      cloudKitPackage
                    )
                  })

                if (offerCorrespondingToPackage) {
                  setSelectedOffer(
                    offerCorrespondingToPackage
                  )
                }

                setPackageStart(
                  professional.packageStart ?? ""
                )

                setPackageEnd(
                  professional.packageEnd ?? ""
                )
                
              router.replace(
                "/professional-offers"
              )

              return
            }

            await new Promise<void>(
              (resolve) => {
                window.setTimeout(
                  resolve,
                  1500
                )
              }
            )
          }

          /*
           * On enlève quand même les paramètres Stripe,
           * même si le webhook a mis plus de temps.
           */
          if (!cancelled) {
            await synchronizeProfessionalSession()

            router.replace(
              "/professional-offers"
            )
          }
        }

      void synchronizePayment()

      return () => {
        cancelled = true
      }
    }, [
      searchParams,
      session?.user?.id,
      session?.user?.package,
      updateUser,
      router
    ])
    
  return (
    <main className="offersPage">
      <div className="offersContainer">
        <section className="offersHero">
          <div className="offersHeroContent">
            <div className="offersTitleRow">
              <h1 className="offersTitle">
                {translate(language, "Offres")}
              </h1>

              <span
                className="offersTitleIcon"
                aria-hidden="true"
              >
                ◆
              </span>
            </div>

            <p className="offersHeroDescription">
              {translate(
                language,
                "Développez votre activité avec nos boosts et offres irrésistibles."
              )}
            </p>
          </div>

          <div
            className="offersHeroIllustration"
            aria-hidden="true"
          >
            <div className="offersBagHandle" />

            <div className="offersBagBody">
              <span>🐾</span>
            </div>
          </div>
        </section>

        <section className="offersSection">
          <div className="offersSectionHeading">
            <div>
              <span className="offersSectionEyebrow">
                {translate(language, "Publicité")}
              </span>

              <h2>
                {translate(language, "Boosts")}
              </h2>
            </div>

            <p>
              {translate(
                language,
                "Gagnez rapidement en visibilité auprès des propriétaires d’animaux."
              )}
            </p>
          </div>

          <div className="boostGrid">
            {boosts.map((boost) => (
              <article
                className="boostCard"
                key={boost.id}
              >
                <div className="boostVisual">
                  <div className="boostVisualGlow" />

                <Image
                  src={`/images/${boost.image}.png`}
                  alt=""
                  width={110}
                  height={110}
                  className="boostImage"
                  aria-hidden="true"
                />

                  <span className="boostDuration">
                    {boost.duration}
                  </span>
                </div>

                <div className="boostContent">
                  <div>
                    <h3>
                      {translate(language, boost.title)}
                    </h3>

                    <p>
                      {translate(
                        language,
                        boost.description
                      )}
                    </p>
                  </div>

                  <div className="boostBottom">
                    <strong className="boostPrice">
                      {boost.price}
                    </strong>

                    <button
                      className="boostButton"
                      type="button"
                      onClick={() =>
                        handleBoostPurchase(boost)
                      }
                    >
                      {translate(language, "Acheter")}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="offersSection zooveOffersSection">
          {hasActivePaidPackage && (
            <div className="professionalOffersCurrentPackage">
                <div className="professionalOffersCurrentPackageIcon">
                  <Image
                    src={currentPackageImage}
                    alt=""
                    width={56}
                    height={56}
                    className="currentPackageImage"
                    aria-hidden="true"
                  />
                </div>

              <div className="professionalOffersCurrentPackageContent">
                <span className="professionalOffersCurrentPackageLabel">
                  {translate(
                    language,
                    "Votre offre actuelle"
                  )}
                </span>

                <strong>
                  {translate(
                    language,
                    `Vous avez déjà l’offre ${currentPackageName}`
                  )}
                </strong>

                <p>
                  {translate(
                    language,
                    "Vous ne pouvez pas sélectionner une autre offre tant que votre abonnement actuel est actif."
                  )}
                </p>

                {session?.user?.packageEnd && (
                  <span className="professionalOffersCurrentPackageEnd">
                    {translate(
                      language,
                      "Date de fin"
                    )}{" "}
                    :{" "}
                    {displayPackageDate(
                      String(
                        session.user.packageEnd
                      )
                    )}
                  </span>
                )}
              </div>
            </div>
          )}
          
          <div className="offersSectionHeading">
            <div>
              <span className="offersSectionEyebrow">
                {translate(language, "Abonnements")}
              </span>

              <div className="zooveOffersTitle">
                <h2>
                  {translate(language, "Offres Zoove")}
                </h2>

                <span aria-hidden="true">
                  🐾
                </span>
              </div>
            </div>

            <p>
              {translate(
                language,
                "Choisissez la formule adaptée au développement de votre activité."
              )}
            </p>
          </div>

          <div className="plansGrid">
            {offers.map((offer) => (
              <article
                className={`planCard planCard--${offer.color}`}
                key={offer.id}
              >
                <div className="planAccent" />

                <div className="planHeader">
                    <div className="planIcon">
                      <Image
                        src={
                          offer.image ??
                          "/images/discovery.png"
                        }
                        alt=""
                        width={74}
                        height={74}
                        className="planImage"
                        aria-hidden="true"
                      />
                    </div>

                  <div className="planHeading">
                    <h3>
                      {translate(language, offer.name)}
                    </h3>

                    <p>
                      {translate(
                        language,
                        offer.subtitle
                      )}
                    </p>
                  </div>
                </div>

                <ul className="planFeatures">
                  {offer.features.map((feature) => (
                    <li key={feature}>
                      <span
                        className="planCheck"
                        aria-hidden="true"
                      >
                        ✓
                      </span>

                      <span>
                        {translate(language, feature)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="planFooter">
                  <div className="planPriceContainer">
                    <strong className="planPrice">
                      {translate(
                        language,
                        offer.price
                      )}
                    </strong>

                    {offer.period && (
                      <span className="planPeriod">
                        {translate(
                          language,
                          offer.period
                        )}
                      </span>
                    )}
                  </div>

                {offer.id !== "discovery" && (
                  <button
                    className="planButton"
                    type="button"
                    onClick={() => handleOfferSelection(offer)}
                  >
                    {translate(language, "Choisir cette offre")}
                    <span aria-hidden="true">→</span>
                  </button>
                )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="offersAdvantages">
          <article className="advantageItem">
            <div className="advantageIcon advantageIcon--purple">
              ◆
            </div>

            <div>
              <h3>
                {translate(
                  language,
                  "Paiement sécurisé"
                )}
              </h3>

              <p>
                {translate(
                  language,
                  "Vos transactions sont protégées."
                )}
              </p>
            </div>
          </article>

          <article className="advantageItem">
            <div className="advantageIcon advantageIcon--green">
              ⚡
            </div>

            <div>
              <h3>
                {translate(
                  language,
                  "Activation rapide"
                )}
              </h3>

              <p>
                {translate(
                  language,
                  "Profitez immédiatement de vos avantages."
                )}
              </p>
            </div>
          </article>

          <article className="advantageItem">
            <div className="advantageIcon advantageIcon--blue">
              ↗
            </div>

            <div>
              <h3>
                {translate(
                  language,
                  "Résultats mesurables"
                )}
              </h3>

              <p>
                {translate(
                  language,
                  "Suivez les performances de votre activité."
                )}
              </p>
            </div>
          </article>

          <article className="advantageItem">
            <div className="advantageIcon advantageIcon--red">
              ↔
            </div>

            <div>
              <h3>
                {translate(
                  language,
                  "Achat flexible"
                )}
              </h3>

              <p>
                {translate(
                  language,
                  "Des solutions adaptées à chaque besoin."
                )}
              </p>
            </div>
          </article>
        </section>
      </div>
          
          {showStripeRequiredModal && (
            <div
              className="offerConfirmationOverlay"
              role="dialog"
              aria-modal="true"
            >
              <div className="offerConfirmationCard">
                <button
                  type="button"
                  className="offerConfirmationClose"
                  onClick={() =>
                    setShowStripeRequiredModal(false)
                  }
                  aria-label={translate(language, "Fermer")}
                >
                  ×
                </button>

                <div
                  className="offerConfirmationVisual orange"
                >
                  💳
                </div>

                <span className="offerConfirmationBadge">
                  {translate(
                    language,
                    "Configuration requise"
                  )}
                </span>

                <h2>
                  {translate(
                    language,
                    "Stripe n'est pas encore configuré"
                  )}
                </h2>

                <p className="offerConfirmationSubtitle">
                  {translate(
                    language,
                    "Configurez Stripe pour recevoir les paiements avant de souscrire à une offre."
                  )}
                </p>

               <div className="stripeRequiredActions">
                 <button
                   type="button"
                   className="stripeLaterButton"
                   onClick={() =>
                     setShowStripeRequiredModal(false)
                   }
                 >
                   {translate(language, "Plus tard")}
                 </button>

                 <button
                   type="button"
                   className="stripeConfigureButton"
                   onClick={() => {
                     setShowStripeRequiredModal(false)
                     router.push("/sitter-account")
                   }}
                 >
                   {translate(language, "Configurer Stripe")}
                 </button>
               </div>
              </div>
            </div>
          )}
          
          {selectedOffer && (
            <div
              className="offerConfirmationOverlay"
              role="dialog"
              aria-modal="true"
              aria-labelledby="offerConfirmationTitle"
            >
              <div className="offerConfirmationCard">
                <button
                  type="button"
                  className="offerConfirmationClose"
                  onClick={closeOfferConfirmation}
                  aria-label={translate(language, "Fermer")}
                >
                  ×
                </button>

                 <div
                   className={`offerConfirmationVisual ${selectedOffer.color}`}
                 >
                   <Image
                     src={
                       selectedOffer.image ??
                       "/images/discovery.png"
                     }
                     alt=""
                     width={100}
                     height={100}
                     className="offerConfirmationImage"
                     aria-hidden="true"
                   />
                 </div>

                <span className="offerConfirmationBadge">
                  {translate(language, "Félicitations")}
                </span>

                <h2 id="offerConfirmationTitle">
                  {translate(
                    language,
                    "Vous avez choisi l’offre"
                  )}{" "}
                  {translate(language, selectedOffer.name)}
                </h2>

                <p className="offerConfirmationSubtitle">
                  {translate(language, selectedOffer.subtitle)}
                </p>
                             
                 <div className="subscriptionDates">
                         <p>
                           <strong>
                             {translate(
                               language,
                               "Début de l’abonnement"
                             )} :
                           </strong>{" "}
                             {displayPackageDate(packageStart)}
                         </p>

                         <p>
                           <strong>
                             {translate(
                               language,
                               "Fin de l’abonnement"
                             )} :
                           </strong>{" "}
                             {displayPackageDate(packageEnd)}
                         </p>
                       </div>

                <div className="offerConfirmationPrice">
                  <strong>
                    {translate(language, selectedOffer.price)}
                  </strong>

                  {selectedOffer.period && (
                    <span>
                      {translate(language, selectedOffer.period)}
                    </span>
                  )}
                </div>

                <div className="offerConfirmationBenefits">
                  <h3>
                    {translate(
                      language,
                      "Ce que vous obtenez"
                    )}
                  </h3>

                  <ul>
                    {selectedOffer.features.map((feature) => (
                      <li key={feature}>
                        <span aria-hidden="true">✓</span>
                        {translate(language, feature)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {isServiceSelectionOpen && (
            <div
              className="campaignModalOverlay"
              onClick={() => {
                setIsServiceSelectionOpen(false)
                setPendingOffer(null)
                setSelectedBoost(null)
              }}
            >
              <div
                className="campaignModal"
                onClick={(e) =>
                  e.stopPropagation()
                }
              >
                <button
                  type="button"
                  className="campaignModalClose"
                  onClick={() => {
                    setIsServiceSelectionOpen(false)
                    setPendingOffer(null)
                    setSelectedBoost(null)
                  }}
                >
                  ×
                </button>

                <h2>
                  {translate(
                    language,
                    "Sélectionnez un service"
                  )}
                </h2>

                <p>
                  {translate(
                    language,
                    "Choisissez le service que vous souhaitez mettre en avant."
                  )}
                </p>

                {services.length === 0 ? (
                  <p>
                    {translate(
                      language,
                      "Aucun service disponible."
                    )}
                  </p>
                ) : (
                  <div className="campaignServicesList">
                    {services.map(
                      (
                        service: Service
                      ) => (
                        <button
                          key={service.id}
                          type="button"
                          className="campaignServiceButton"
                          onClick={() =>
                            handleCampaignServiceSelection(
                              service
                            )
                          }
                        >
                          <div className="campaignServiceName">
                            {service.name}
                          </div>

                          {service.price !=
                            null && (
                            <div className="campaignServicePrice">
                              {service.price} €
                            </div>
                          )}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
    </main>
  )
}

export default function ProfessionalOffers() {
  return (
    <Suspense fallback={null}>
      <ProfessionalOffersContent />
    </Suspense>
  )
}
