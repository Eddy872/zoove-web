"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BedDouble,
  CalendarDays,
  Car,
  Check,
  Clock3,
  Footprints,
  Globe2,
  Home,
  MapPin,
  Pencil,
  Phone,
  Tag,
  UserRound,
  WalletCards,
    BadgeCheck,
} from "lucide-react"

import { translate } from "@/translations/translations"
import {
  useLanguage,
  type Language
} from "@/context/LanguageContext"
import { useAuth } from "@/context/AuthContext"
import { updateSitterProfile } from "@/services/updateSitterProfile"
import Image from "next/image"
import EditTarifModal from "./EditTarifModal"
import EditAcceptedSpeciesModal from "./EditAcceptedSpeciesModal"
import EditServicesModal from "./EditServicesModal"
import EditAvailabilityModal from "./EditAvailabilityModal"
import EditInformationsModal from "./EditInformationsModal"
import {
  createCustomerPortal
} from "@/services/createCustomerPortal"
import {
  createStripeConnectAccount,
  createStripeConnectAccountLink,
    createStripeConnectLoginLink
} from "@/services/stripeConnect"
import "./sitter-profile.css"

type ProfileTab =
  | "services"
  | "pricing"
  | "hours"


type CurrentView =
  | "profile"
  | "tarif"
  | "species"
  | "services"
  | "availability"
  | "informations"

type Availability = {
  day: string
  enabled: boolean
  start?: string
  end?: string
}

type SitterUser = {
  id: string
  name: string
  pseudo: string
  bio: string
  phoneNumber: string
  paypalID: string
  city: string
  country: string
  language: string
  photo?: string

  stripeAccountID: string
  stripeCustomerID: string
  stripeSubscriptionID: string
  autoRenew: number

  package: number
  packageStart: string
  packageEnd: string

  tarif: number
  devise: string
  services: string[]
  acceptedSpecies: string[]
  availability: Availability[]
}

const serviceLabels: Record<string, string> = {
  garde: "Garde",
  visites: "Visites",
  promenade: "Promenade",
  hebergement: "Hébergement",
  transport: "Transport",
}

const serviceIcons: Record<
  string,
  React.ReactNode
> = {
  garde: <Home size={22} />,
  visites: <Home size={22} />,
  promenade: <Footprints size={22} />,
  hebergement: <BedDouble size={22} />,
  transport: <Car size={22} />,
}

const speciesLabels: Record<string, string> = {
  dog: "Chien",
  cat: "Chat",
  fish: "Poisson",
  tortoise: "Tortue",
  monkey: "Singe",
  snake: "Serpent",
  camel: "Chameau",
  frog: "Grenouille",
  horse: "Cheval",
  rabbit: "Lapin",
  rooster: "Coq",
  tiger: "Tigre",
  rat: "Rat",
  bird: "Oiseau",
}

const speciesIcons: Record<string, string> = {
  dog: "🐶",
  cat: "🐱",
  fish: "🐠",
  tortoise: "🐢",
  monkey: "🐵",
  snake: "🐍",
  camel: "🐪",
  frog: "🐸",
  horse: "🐴",
  rabbit: "🐰",
  rooster: "🐓",
  tiger: "🐯",
  rat: "🐭",
  bird: "🐦",
}

const defaultAvailability: Availability[] = [
  {
    day: "Lundi",
    enabled: true,
    start: "08:00",
    end: "18:00",
  },
  {
    day: "Mardi",
    enabled: false,
  },
  {
    day: "Mercredi",
    enabled: true,
    start: "09:00",
    end: "17:00",
  },
  {
    day: "Jeudi",
    enabled: true,
    start: "08:00",
    end: "18:00",
  },
  {
    day: "Vendredi",
    enabled: true,
    start: "09:00",
    end: "16:00",
  },
  {
    day: "Samedi",
    enabled: true,
    start: "10:00",
    end: "14:00",
  },
  {
    day: "Dimanche",
    enabled: false,
  },
]

const defaultSitter: SitterUser = {
  id: "",
  name: "",
  pseudo: "",
  bio: "",
  phoneNumber: "",
  paypalID: "",
  city: "",
  country: "",
  language: "",
  photo: "",
  stripeAccountID: "",
  stripeCustomerID: "",
  stripeSubscriptionID: "",
  autoRenew: 0,
  package: 0,
  packageStart: "",
  packageEnd: "",
  tarif: 0,
  devise: "EUR",
  services: [],
  acceptedSpecies: [],
  availability: defaultAvailability,
}

function getStripeCountryCode(
  country: string
): string {
  switch (country.trim().toLowerCase()) {
    case "france":
      return "FR"

    case "belgique":
      return "BE"

    case "suisse":
      return "CH"

    case "espagne":
      return "ES"

    case "italie":
      return "IT"

    case "portugal":
      return "PT"

    case "allemagne":
      return "DE"

    case "royaume-uni":
    case "uk":
    case "united kingdom":
      return "GB"

    case "états-unis":
    case "usa":
    case "united states":
      return "US"

    default:
      return country.toUpperCase()
  }
}

export default function SitterProfilePage() {
    
    const [
      isOpeningStripe,
      setIsOpeningStripe
    ] = useState(false)

    const [
      stripeDashboardError,
      setStripeDashboardError
    ] = useState("")
    
  const { language } = useLanguage()
    
    const {
      session,
      loading,
      updateUser
    } = useAuth()
    const [currentView, setCurrentView] =
      useState<CurrentView>("profile")

    const [activeTab, setActiveTab] =
      useState<ProfileTab>("services")

  const sitter = useMemo<SitterUser | null>(
    () => {
      if (
        !session ||
        session.accountType !== "sitter" ||
        !session.user
      ) {
        return null
      }

      const sessionUser =
        session.user as unknown as Record<
          string,
          unknown
        >

      return {
        id: String(sessionUser.id ?? ""),

        name: String(
          sessionUser.name ??
            sessionUser.pseudo ??
            ""
        ),

        pseudo: String(
          sessionUser.pseudo ?? ""
        ),

        bio: String(
          sessionUser.infos ??
            sessionUser.bio ??
            ""
        ),

        phoneNumber: String(
          sessionUser.phoneNumber ?? ""
        ),

        paypalID: String(
          sessionUser.paypalID ?? ""
        ),
          
        stripeAccountID: String(
          sessionUser.stripeAccountID ?? ""
        ),

        stripeCustomerID: String(
          sessionUser.stripeCustomerID ?? ""
        ),

        stripeSubscriptionID: String(
          sessionUser.stripeSubscriptionID ?? ""
        ),

        autoRenew: Number(
          sessionUser.autoRenew ?? 0
        ),

        city: String(
          sessionUser.city ?? ""
        ),

        country: String(
          sessionUser.country ?? ""
        ),

        language: String(
          sessionUser.language ?? ""
        ),

        photo: getPhotoUrl(
          sessionUser.photo
        ),
          
        package: Number(sessionUser.package ?? 0),

        packageStart: String(
            sessionUser.packageStart ?? ""
          ),

        packageEnd: String(
            sessionUser.packageEnd ?? ""
          ),

        tarif: Number(
          sessionUser.tarif ?? 0
        ),

        devise: String(
          sessionUser.devise ?? "EUR"
        ),

        services: normalizeStringArray(
          sessionUser.services
        ),

        acceptedSpecies:
          normalizeStringArray(
            sessionUser.speciesAccepted ??
              sessionUser.acceptedSpecies
          ),

        availability:
          normalizeAvailability(
            sessionUser.availability ??
              sessionUser.disponibilities
          ),
      }
    },
    [session]
  )
    
    const packageNames: Record<number, string> = {
      0: "Découverte",
      1: "Organisation",
      2: "Visibilité",
      3: "Ambassadeur",
    }
    
    const packageIcons: Record<number, string> = {
      0: "/images/discovery.png",
      1: "/images/organisation.png",
      2: "/images/visibility.png",
      3: "/images/ambassador.png",
    }

    function displaySubscriptionDate(
      value?: string
    ): string {
      if (!value) {
        return "-"
      }

      const datePart = value.split(" ")[0]
      const [year, month, day] =
        datePart.split("-").map(Number)

      if (!year || !month || !day) {
        return value
      }

      return new Intl.DateTimeFormat(
        language === "fr" ? "fr-FR" : language,
        {
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      ).format(new Date(year, month - 1, day))
    }

  /*
   * Ce Hook est placé avant tous les return.
   * L’ordre des Hooks reste donc identique
   * à chaque rendu.
   */
  const [currentSitter, setCurrentSitter] =
    useState<SitterUser>(
      sitter ?? defaultSitter
    )
    
    const [
      isConfiguringStripe,
      setIsConfiguringStripe
    ] = useState(false)

    const [
      stripeConfigurationError,
      setStripeConfigurationError
    ] = useState("")
    

  /*
   * Synchronise le state local lorsque
   * la session fournit un nouveau sitter.
   */
  useEffect(() => {
    if (sitter) {
      setCurrentSitter(sitter)
    }
  }, [sitter])

  if (!session) {
    return (
      <main className="sitterProfilePage">
        <div className="sitterSinglePanel">
          <p>
            {translate(
              language,
              "Vous devez être connecté."
            )}
          </p>
        </div>
      </main>
    )
  }

  if (
    session.accountType !== "sitter" ||
    !sitter
  ) {
    return (
      <main className="sitterProfilePage">
        <div className="sitterSinglePanel">
          <p>
            {translate(
              language,
              "Ce profil est réservé aux pet sitters."
            )}
          </p>
        </div>
      </main>
    )
  }

  if (currentView === "tarif") {
    return (
      <EditTarifModal
        tarif={currentSitter.tarif}
        onBack={() =>
          setCurrentView("profile")
        }
        onSave={async (tarif) => {
          try {
            await updateSitterProfile(
              currentSitter.id,
              {
                tarif,
              }
            )

            setCurrentSitter(
              (previous) => ({
                ...previous,
                tarif,
              })
            )

              updateUser({
                tarif,
              })
              
            setCurrentView("profile")
          } catch (error) {
            console.error(
              "Erreur modification tarif :",
              error
            )
          }
        }}
      />
    )
  }

  if (currentView === "species") {
    return (
      <EditAcceptedSpeciesModal
        acceptedSpecies={
          currentSitter.acceptedSpecies
        }
        onBack={() =>
          setCurrentView("profile")
        }
        onSave={async (
          acceptedSpecies
        ) => {
          try {
            await updateSitterProfile(
              currentSitter.id,
              {
                acceptedSpecies,
              }
            )

            setCurrentSitter(
              (previous) => ({
                ...previous,
                acceptedSpecies,
              })
            )
              
              updateUser({
                speciesAccepted: acceptedSpecies,
              })

              
            setCurrentView("profile")
          } catch (error) {
            console.error(
              "Erreur modification espèces :",
              error
            )
          }
        }}
      />
    )
  }

  if (currentView === "services") {
    return (
      <EditServicesModal
        services={
          currentSitter.services
        }
        onBack={() =>
          setCurrentView("profile")
        }
        onSave={async (services) => {
          try {
            await updateSitterProfile(
              currentSitter.id,
              {
                services,
              }
            )

            setCurrentSitter(
              (previous) => ({
                ...previous,
                services,
              })
            )
              
              updateUser({
                services,
              })

            setCurrentView("profile")
          } catch (error) {
            console.error(
              "Erreur modification services :",
              error
            )
          }
        }}
      />
    )
  }

    if (
      currentView === "availability"
    ) {
      return (
        <EditAvailabilityModal
          availability={
            currentSitter.availability ??
            []
          }
          onBack={() =>
            setCurrentView("profile")
          }
          onSave={async (
            newAvailability
          ) => {
            try {
              await updateSitterProfile(
                currentSitter.id,
                {
                  availability:
                    newAvailability,
                }
              )

              setCurrentSitter(
                (previous) => ({
                  ...previous,
                  availability:
                    newAvailability,
                })
              )

              const disponibilities =
                newAvailability.map(
                  (day) =>
                    day.enabled
                      ? `${day.day}=${day.start}-${day.end}`
                      : `${day.day}=Fermé`
                )

              updateUser({
                disponibilities,
              })

              setCurrentView(
                "profile"
              )
            } catch (error) {
              console.error(
                "Erreur modification disponibilités :",
                error
              )
            }
          }}
        />
      )
    }
    if (currentView === "informations") {
      return (
        <EditInformationsModal
          informations={{
            infos: currentSitter.bio ?? "",
            city: currentSitter.city ?? "",
            country: currentSitter.country ?? "",
            phoneNumber: currentSitter.phoneNumber ?? "",
            paypalID: currentSitter.paypalID ?? ""
          }}
          onBack={() =>
            setCurrentView("profile")
          }
          onSave={async (informations) => {
            try {
              await updateSitterProfile(
                currentSitter.id,
                {
                  bio:
                    informations.infos,

                  city:
                    informations.city,

                  country:
                    informations.country,

                  phoneNumber:
                    informations.phoneNumber,

                  paypalID:
                    informations.paypalID,
                }
              )

              setCurrentSitter(
                (previous) => ({
                  ...previous,

                  bio:
                    informations.infos,

                  city:
                    informations.city,

                  country:
                    informations.country,

                  phoneNumber:
                    informations.phoneNumber,

                  paypalID:
                    informations.paypalID,
                })
              )

              updateUser({
                infos:
                  informations.infos,

                city:
                  informations.city,

                country:
                  informations.country,

                phoneNumber:
                  informations.phoneNumber,

                paypalID:
                  informations.paypalID,
              })

              setCurrentView("profile")
            } catch (error) {
              console.error(
                "Erreur modification informations :",
                error
              )
            }
          }}
        />
      )
    }

  const initials =
    currentSitter.name
      ? currentSitter.name
          .split(" ")
          .filter(Boolean)
          .map((part) =>
            part.charAt(0)
          )
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : "PS"

  const location =
    [
      currentSitter.city,
      currentSitter.country,
    ]
      .filter(Boolean)
      .join(", ") ||
    translate(
      language,
      "Non renseignée"
    )
    
    const handleManageSubscription =
      async () => {
        if (
          !currentSitter
            .stripeCustomerID
            ?.trim()
        ) {
          alert(
            translate(
              language,
              "Cet abonnement a été souscrit via l'App Store. Veuillez utiliser l'application iOS pour le gérer."
            )
          )

          return
        }

        try {
          const portalURL =
            await createCustomerPortal({
              userID:
                currentSitter.id,

              stripeCustomerID:
                currentSitter
                  .stripeCustomerID,

              stripeSubscriptionID:
                currentSitter
                  .stripeSubscriptionID,

              accountType:
                "sitter"
            })

          window.location.href =
            portalURL
        } catch (error) {
          console.error(
            "Erreur ouverture portail Stripe :",
            error
          )

          alert(
            translate(
              language,
              "Impossible d'ouvrir la gestion de l'abonnement."
            )
          )
        }
      }
    
    const handleConfigureStripe =
      async () => {
        if (
          isConfiguringStripe ||
          !currentSitter.id
        ) {
          return
        }

        try {
          setIsConfiguringStripe(true)
          setStripeConfigurationError("")

          /*
           * Si le compte Connect existe déjà,
           * on ne le recrée pas.
           */
          let stripeAccountID =
            currentSitter
              .stripeAccountID
              ?.trim() ?? ""

          /*
           * 1. Création du compte Connect.
           */
          if (!stripeAccountID) {
            const accountResult =
              await createStripeConnectAccount({
                userID:
                  currentSitter.id,

                country:
                  getStripeCountryCode(
                        currentSitter.country
                      ),

                /*
                 * Ton backend accepte normalement
                 * email comme champ optionnel.
                 *
                 * Tu peux temporairement utiliser
                 * paypalID uniquement s'il contient
                 * encore une adresse e-mail.
                 */
                email:
                  currentSitter.paypalID ||
                  undefined
              })

            stripeAccountID =
              accountResult.stripeAccountID

            /*
             * Mise à jour du state local.
             */
            setCurrentSitter(
              previous => ({
                ...previous,

              stripeAccountID:
                  stripeAccountID
              })
            )

            /*
             * Mise à jour de la session locale.
             */
            updateUser({
            stripeAccountID:
                stripeAccountID
            })
          }

          /*
           * 3. Création du lien d'onboarding.
           */
          const linkResult =
            await createStripeConnectAccountLink(
              stripeAccountID
            )

          /*
           * 4. Redirection vers Stripe.
           */
          window.location.assign(
            linkResult.url
          )
        } catch (error) {
          console.error(
            "Erreur configuration Stripe Connect :",
            error
          )

          setStripeConfigurationError(
            error instanceof Error
              ? error.message
              : translate(
                  language,
                  "Impossible de configurer Stripe."
                )
          )
        } finally {
          setIsConfiguringStripe(false)
        }
      }

    if (loading) {
      return (
        <div>
          {translate(
            language,
            "Chargement..."
          )}
        </div>
      )
    }

    if (!session?.user) {
      return (
        <div>
          {translate(
            language,
            "Vous devez être connecté."
          )}
        </div>
      )
    }
    
    const handleOpenStripeDashboard =
      async () => {
        if (
          isOpeningStripe ||
          !currentSitter
            .stripeAccountID
            ?.trim()
        ) {
          return
        }

        try {
          setIsOpeningStripe(true)
          setStripeDashboardError("")

          const result =
            await createStripeConnectLoginLink(
              currentSitter
                .stripeAccountID
          )

          window.open(
            result.url,
            "_blank",
            "noopener,noreferrer"
          )
        } catch (error) {
          console.error(
            "Erreur ouverture Stripe :",
            error
          )

          setStripeDashboardError(
            error instanceof Error
              ? error.message
              : translate(
                  language,
                  "Impossible d'ouvrir Stripe."
                )
          )
        } finally {
          setIsOpeningStripe(false)
        }
      }
    
  return (
    <main className="sitterProfilePage">
          <section className="sitterProfileHeader">
            <div className="sitterIdentity">
              <div className="sitterAvatarWrapper">
                {currentSitter.photo ? (
                  <img
                    src={currentSitter.photo}
                    alt={
                      currentSitter.name ||
                      translate(
                        language,
                        "Photo du pet sitter"
                      )
                    }
                    className="sitterAvatar"
                  />
                ) : (
                  <div className="sitterAvatarFallback">
                    {initials}
                  </div>
                )}

                <span
                  className="sitterOnlineStatus"
                  aria-label={translate(
                    language,
                    "Profil actif"
                  )}
                />
              </div>

              <div className="sitterMainInformation">
                <h1>
                  {currentSitter.name ||
                    translate(
                      language,
                      "Nom non renseigné"
                    )}
                </h1>

                <p className="sitterPseudo">
                  {currentSitter.pseudo
                    ? `@${currentSitter.pseudo}`
                    : translate(
                        language,
                        "Pseudo non renseigné"
                      )}
                </p>

                <p className="sitterBio">
                  {currentSitter.bio ||
                    translate(
                      language,
                      "Aucune présentation renseignée."
                    )}
                </p>

                <div className="sitterMetaInformation">
                  <div className="sitterMetaItem">
                    <Globe2 size={23} />

                    <div>
                      <span>
                        {translate(
                          language,
                          "Langue"
                        )}
                      </span>

                      <strong>
                        {currentSitter.language ||
                          translate(
                            language,
                            "Non renseignée"
                          )}
                      </strong>
                    </div>
                  </div>

                  <div className="sitterMetaItem">
                    <MapPin size={23} />

                    <div>
                      <span>
                        {translate(
                          language,
                          "Localisation"
                        )}
                      </span>

                      <strong>
                        {location}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="sitterSubscriptionCardMini">
                  <div className="sitterSubscriptionTop">
                    <div className="professionalOffersCurrentPackageIcon">
                      <Image
                        src={
                          packageIcons[
                            currentSitter.package ?? 0
                          ]
                        }
                        alt=""
                        width={56}
                        height={56}
                        className="currentPackageImage"
                        aria-hidden="true"
                      />
                    </div>

                    <div className="sitterSubscriptionInformation">
                      <span className="sitterSubscriptionLabel">
                        {translate(
                          language,
                          "Abonnement"
                        )}
                      </span>

                      <strong>
                        {translate(
                          language,
                          packageNames[
                            currentSitter.package ?? 0
                          ] ?? "Découverte"
                        )}
                      </strong>
                    </div>
                  </div>

                  <div
                    className={
                      currentSitter.package === 0
                        ? "sitterSubscriptionBottom sitterSubscriptionBottomSingle"
                        : "sitterSubscriptionBottom"
                    }
                  >
                    <div className="sitterSubscriptionDate">
                      <span>
                        {translate(
                          language,
                          "Début"
                        )}
                      </span>

                      <strong>
                        {displaySubscriptionDate(
                          currentSitter.packageStart
                        )}
                      </strong>
                    </div>

                    {currentSitter.package !== 0 && (
                      <>
                        <div className="sitterSubscriptionDivider" />

                        <div className="sitterSubscriptionDate">
                          <span>
                            {translate(
                              language,
                              currentSitter.autoRenew === 1
                                ? "Prochain renouvellement"
                                : "Fin"
                            )}
                          </span>

                          <strong>
                            {displaySubscriptionDate(
                              currentSitter.packageEnd
                            )}
                          </strong>
                        </div>
                      </>
                    )}
                  </div>

                  {currentSitter.package > 0 && (
                    <>
                      <div className="sitterSubscriptionButtonDivider" />

                      <button
                        type="button"
                        className="sitterManageSubscriptionButton"
                        onClick={handleManageSubscription}
                      >
                        {translate(
                          language,
                          "Gérer mon abonnement"
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="sitterHeaderRight">
              <button
                type="button"
                className="sitterOutlineButton"
                onClick={() => {
                  setCurrentView("informations")
                }}
              >
                <Pencil size={19} />

                {translate(
                  language,
                  "Modifier le profil"
                )}
              </button>

              <div className="sitterContactCard">
                <h2>
                  {translate(
                    language,
                    "Contact"
                  )}
                </h2>

                <div className="sitterContactRow">
                  <Phone size={22} />

                  <span>
                    {translate(
                      language,
                      "Téléphone"
                    )}
                  </span>

                  <strong>
                    {currentSitter.phoneNumber ||
                      translate(
                        language,
                        "Non renseigné"
                      )}
                  </strong>
                </div>

                <div className="sitterContactRow">
                  <WalletCards size={22} />

                  <span>
                    {translate(
                      language,
                      "Adresse PayPal"
                    )}
                  </span>

                  <strong>
                    {currentSitter.paypalID ||
                      translate(
                        language,
                        "Non renseignée"
                      )}
                  </strong>
                </div>

                <div className="sitterContactRow">
                  <BadgeCheck size={22} />

                  <span>
                    {translate(
                      language,
                      "Identifiant Stripe"
                    )}
                  </span>

                  {currentSitter.stripeAccountID ? (
                    <strong className="sitterStripeAccountID">
                      {
                        currentSitter
                          .stripeAccountID
                      }
                    </strong>
                  ) : (
                   <button
                     type="button"
                     className="sitterConfigureStripeButton"
                     disabled={isConfiguringStripe}
                     onClick={handleConfigureStripe}
                   >
                     {isConfiguringStripe
                       ? translate(
                           language,
                           "Configuration..."
                         )
                       : translate(
                           language,
                           "Configurer Stripe"
                         )}
                   </button>
                  )}
                </div>
          
                  {currentSitter
                    .stripeAccountID
                    ?.trim() && (
                    <div className="sitterStripeActions">
                      <button
                        type="button"
                        className="openStripeDashboardButton"
                        disabled={isOpeningStripe}
                        onClick={
                          handleOpenStripeDashboard
                        }
                      >
                        {isOpeningStripe
                          ? translate(
                              language,
                              "Ouverture de Stripe..."
                            )
                          : translate(
                              language,
                              "Ouvrir Stripe"
                            )}
                      </button>

                      <p className="sitterStripeInformation">
                        {translate(
                          language,
                          "Consultez vos revenus et vos versements dans Stripe."
                        )}
                      </p>
                    </div>
                  )}

                  {stripeDashboardError && (
                    <p className="sitterStripeError">
                      {stripeDashboardError}
                    </p>
                  )}
              </div>
            </div>
          </section>

      <section className="sitterTabsContainer">
        <button
          type="button"
          className={`sitterTab ${
            activeTab === "services"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setActiveTab("services")
          }
        >
          <UserRound size={22} />

          {translate(
            language,
            "Services"
          )}
        </button>

        <button
          type="button"
          className={`sitterTab ${
            activeTab === "pricing"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setActiveTab("pricing")
          }
        >
          <Tag size={22} />

          {translate(
            language,
            "Tarif + espèces acceptées"
          )}
        </button>

        <button
          type="button"
          className={`sitterTab ${
            activeTab === "hours"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setActiveTab("hours")
          }
        >
          <CalendarDays size={22} />

          {translate(
            language,
            "Horaires"
          )}
        </button>
      </section>

      <section className="sitterTabContent">
        {activeTab === "services" && (
          <ServicesPanel
            sitter={currentSitter}
            language={language}
            onEdit={() =>
              setCurrentView("services")
            }
          />
        )}

        {activeTab === "pricing" && (
          <PricingPanel
            sitter={currentSitter}
            language={language}
            onEditTarif={() =>
              setCurrentView("tarif")
            }
            onEditSpecies={() =>
              setCurrentView("species")
            }
          />
        )}

        {activeTab === "hours" && (
          <HoursPanel
            availability={
              currentSitter.availability
            }
            language={language}
            onEdit={() =>
              setCurrentView(
                "availability"
              )
            }
          />
        )}
      </section>
    </main>
  )
}

function ServicesPanel({
  sitter,
  language,
  onEdit,
}: {
  sitter: SitterUser
  language: Language
  onEdit: () => void
}) {
  const allServices =
    Object.keys(serviceLabels)

  return (
    <div className="sitterSinglePanel">
      <div className="sitterPanelHeader">
        <div>
          <h2>
            {translate(
              language,
              "Prestations proposées"
            )}
          </h2>

          <p>
            {translate(
              language,
              "Services actuellement proposés aux propriétaires d’animaux."
            )}
          </p>
        </div>

        <button
          type="button"
          className="sitterOutlineButton"
          onClick={onEdit}
        >
          <Pencil size={18} />

          {translate(
            language,
            "Modifier les services"
          )}
        </button>
      </div>

      <div className="sitterServicesGrid">
        {allServices.map(
          (service) => {
            const isSelected =
              sitter.services.includes(
                service
              )

            return (
              <div
                key={service}
                className={`sitterServiceItem ${
                  isSelected
                    ? "selected"
                    : "disabled"
                }`}
              >
                <span className="sitterItemIcon">
                  {
                    serviceIcons[
                      service
                    ]
                  }
                </span>

                <span className="sitterItemName">
                  {translate(
                    language,
                    serviceLabels[
                      service
                    ]
                  )}
                </span>

                <span
                  className={`sitterCheckbox ${
                    isSelected
                      ? "checked"
                      : ""
                  }`}
                  aria-label={
                    isSelected
                      ? translate(
                          language,
                          "Service proposé"
                        )
                      : translate(
                          language,
                          "Service non proposé"
                        )
                  }
                >
                  {isSelected && (
                    <Check size={17} />
                  )}
                </span>
              </div>
            )
          }
        )}
      </div>
    </div>
  )
}

function PricingPanel({
  sitter,
  language,
  onEditTarif,
  onEditSpecies,
}: {
  sitter: SitterUser
  language: Language
  onEditTarif: () => void
  onEditSpecies: () => void
}) {
  return (
    <div className="sitterPricingLayout">
      <div className="sitterPanel sitterRatePanel">
        <div className="sitterPanelHeader">
          <div>
            <h2>
              {translate(
                language,
                "Tarif horaire"
              )}
            </h2>

            <p>
              {translate(
                language,
                "Prix appliqué pour une heure de prestation."
              )}
            </p>
          </div>

          <button
            type="button"
            className="sitterOutlineButton"
            onClick={onEditTarif}
          >
            <Pencil size={18} />

            {translate(
              language,
              "Modifier"
            )}
          </button>
        </div>

        <div className="sitterRateValue">
          <strong>
            {formatPrice(
              sitter.tarif,
              language
            )}
          </strong>

          <span>
            {sitter.devise || "EUR"} /{" "}
            {translate(
              language,
              "heure"
            )}
          </span>
        </div>
      </div>

      <div className="sitterPanel">
        <div className="sitterPanelHeader">
          <div>
            <h2>
              {translate(
                language,
                "Espèces acceptées"
              )}
            </h2>

            <p>
              {translate(
                language,
                "Animaux que vous acceptez de prendre en charge."
              )}
            </p>
          </div>

          <button
            type="button"
            className="sitterOutlineButton"
            onClick={onEditSpecies}
          >
            <Pencil size={18} />

            {translate(
              language,
              "Modifier"
            )}
          </button>
        </div>

        <div className="sitterSpeciesGrid">
          {sitter.acceptedSpecies
            .length > 0 ? (
            sitter.acceptedSpecies.map(
              (species, index) => {
                const key = species
                  .trim()
                  .toLowerCase()

                return (
                  <div
                    className="sitterSpeciesItem"
                    key={`${key}-${index}`}
                  >
                    <span className="sitterSpeciesEmoji">
                      {speciesIcons[
                        key
                      ] ?? "🐾"}
                    </span>

                    <span>
                      {translate(
                        language,
                        speciesLabels[
                          key
                        ] ?? species
                      )}
                    </span>
                  </div>
                )
              }
            )
          ) : (
            <p className="sitterEmptyState">
              {translate(
                language,
                "Aucune espèce renseignée."
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function HoursPanel({
  availability,
  language,
  onEdit,
}: {
  availability: Availability[]
  language: Language
  onEdit: () => void
}) {
  return (
    <div className="sitterSinglePanel">
      <div className="sitterPanelHeader">
        <div>
          <h2>
            {translate(
              language,
              "Disponibilités hebdomadaires"
            )}
          </h2>

          <p>
            {translate(
              language,
              "Horaires habituels pendant lesquels vous êtes disponible."
            )}
          </p>
        </div>

        <button
          type="button"
          className="sitterOutlineButton"
          onClick={onEdit}
        >
          <Pencil size={18} />

          {translate(
            language,
            "Modifier les horaires"
          )}
        </button>
      </div>

      <div className="sitterAvailabilityList">
        {availability.length > 0 ? (
          availability.map(
            (
              availabilityDay,
              index
            ) => (
              <div
                className="sitterAvailabilityRow"
                key={`${availabilityDay.day}-${index}`}
              >
                <div className="sitterAvailabilityDay">
                  <CalendarDays
                    size={20}
                  />

                  <strong>
                    {translate(
                      language,
                      availabilityDay.day
                    )}
                  </strong>
                </div>

                {availabilityDay.enabled &&
                availabilityDay.start &&
                availabilityDay.end ? (
                  <div className="sitterAvailabilityTime">
                    <Clock3 size={18} />

                    <span>
                      {
                        availabilityDay.start
                      }{" "}
                      –{" "}
                      {
                        availabilityDay.end
                      }
                    </span>
                  </div>
                ) : (
                  <span className="sitterClosedBadge">
                    {translate(
                      language,
                      "Fermé"
                    )}
                  </span>
                )}
              </div>
            )
          )
        ) : (
          <p className="sitterEmptyState">
            {translate(
              language,
              "Aucun horaire renseigné."
            )}
          </p>
        )}
      </div>
    </div>
  )
}

function formatPrice(
  value: number,
  language: Language
) {
  if (!Number.isFinite(value)) {
    return "0"
  }

  const localeByLanguage: Record<
    string,
    string
  > = {
    fr: "fr-FR",
    en: "en-US",
    es: "es-ES",
    it: "it-IT",
    pt: "pt-PT",
    de: "de-DE",
    ar: "ar-SA",
  }

  return new Intl.NumberFormat(
    localeByLanguage[language] ??
      "fr-FR",
    {
      maximumFractionDigits: 2,
    }
  ).format(value)
}

function normalizeStringArray(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return item
      }

      if (
        typeof item === "object" &&
        item !== null &&
        "value" in item &&
        typeof item.value === "string"
      ) {
        return item.value
      }

      return ""
    })
    .filter(Boolean)
}

function normalizeAvailability(
  value: unknown
): Availability[] {
  if (
    !Array.isArray(value) ||
    value.length === 0
  ) {
    return defaultAvailability.map(
      (availability) => ({
        ...availability,
      })
    )
  }

  return value.map(
    (item, index) => {
      if (typeof item === "string") {
        return parseAvailabilityString(
          item,
          index
        )
      }

      if (
        typeof item === "object" &&
        item !== null
      ) {
        const availabilityItem =
          item as Partial<Availability>

        return {
          day:
            availabilityItem.day ??
            `Jour ${index + 1}`,

          enabled:
            availabilityItem.enabled ??
            Boolean(
              availabilityItem.start &&
                availabilityItem.end
            ),

          start:
            availabilityItem.start,

          end:
            availabilityItem.end,
        }
      }

      return {
        day: `Jour ${index + 1}`,
        enabled: false,
      }
    }
  )
}

function parseAvailabilityString(
  value: string,
  index: number
): Availability {
  const trimmedValue =
    value.trim()

  /*
   * Permet aussi de relire les anciennes
   * disponibilités sauvegardées en JSON.
   */
  if (
    trimmedValue.startsWith("{") &&
    trimmedValue.endsWith("}")
  ) {
    try {
      const parsed = JSON.parse(
        trimmedValue
      ) as Partial<Availability>

      return {
        day:
          parsed.day ??
          `Jour ${index + 1}`,

        enabled:
          parsed.enabled ??
          Boolean(
            parsed.start &&
              parsed.end
          ),

        start: parsed.start,
        end: parsed.end,
      }
    } catch {
      // Continue avec le format Jour=Heure-Heure.
    }
  }

  const separatorIndex =
    trimmedValue.indexOf("=")

  if (separatorIndex === -1) {
    return {
      day:
        trimmedValue ||
        `Jour ${index + 1}`,
      enabled: false,
    }
  }

  const day = trimmedValue
    .slice(0, separatorIndex)
    .trim()

  const hours = trimmedValue
    .slice(separatorIndex + 1)
    .trim()

  const normalizedHours =
    hours.toLowerCase()

  if (
    normalizedHours.includes(
      "fermé"
    ) ||
    normalizedHours.includes(
      "ferme"
    ) ||
    normalizedHours.includes(
      "closed"
    )
  ) {
    return {
      day:
        day ||
        `Jour ${index + 1}`,
      enabled: false,
    }
  }

  const [start, end] = hours
    .split("-")
    .map((part) => part.trim())

  return {
    day:
      day ||
      `Jour ${index + 1}`,

    enabled: Boolean(
      start && end
    ),

    start,
    end,
  }
}

function getPhotoUrl(
  photo: unknown
): string {
  if (typeof photo === "string") {
    return photo
  }

  if (
    typeof photo === "object" &&
    photo !== null
  ) {
    if (
      "downloadURL" in photo &&
      typeof photo.downloadURL ===
        "string"
    ) {
      return photo.downloadURL
    }

    if (
      "value" in photo &&
      typeof photo.value ===
        "object" &&
      photo.value !== null &&
      "downloadURL" in
        photo.value &&
      typeof photo.value
        .downloadURL === "string"
    ) {
      return photo.value
        .downloadURL
    }
  }

  return ""
}
