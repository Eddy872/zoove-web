"use client"

import {
  useEffect,
  useMemo,
  useState
} from "react"

import { useRouter } from "next/navigation"

import type {
  GroomingUser
} from "@/types/groomingUser"

import type {
  Service
} from "@/types/service"
import Image from "next/image"
import { useAuth } from "@/context/AuthContext"
import type { Language } from "@/context/LanguageContext"
import { translate } from "@/translations/translations"
import { fetchServicesForProfessional } from "@/services/fetchProfessionalById"
import InformationsModal from "./InformationsModal"
import GalleryModal from "./GalleryModal"
import SchedulesModal from "./SchedulesModal"
import CollaboratorsModal from "./CollaboratorsModal"
import ServicesModal from "./ServicesModal"
import { updateServices } from "@/services/updateServices"
import {
  updateGroomingGallery
} from "@/services/updateGroomingGallery"
import {
  createCustomerPortal
} from "@/services/createCustomerPortal"

import {
  updateGroomingProfile
} from "@/services/updateGroomingProfile"

import "./grooming-profile.css"

type GroomingTab =
  | "gallery"
  | "services"
  | "schedules"
  | "collaborators"

type ParsedSchedule = {
  day: string
  start: string
  end: string
  closed: boolean
}

function parseSchedules(
  schedules: string[]
): ParsedSchedule[] {
  return schedules.map(schedule => {
    const [
      rawDay,
      rawHours
    ] = schedule.split("=")

    const day =
      rawDay?.trim() ?? ""

    const hours =
      rawHours?.trim() ?? ""

    if (
      !hours ||
      hours.toLowerCase() ===
        "fermé"
    ) {
      return {
        day,
        start: "",
        end: "",
        closed: true
      }
    }

    const [
      rawStart,
      rawEnd
    ] = hours.split("-")

    return {
      day,
      start:
        rawStart?.trim() ?? "",
      end:
        rawEnd?.trim() ?? "",
      closed: false
    }
  })
}

type ParsedCollaboratorAvailability = {
  day: string
  available: boolean
}

type ParsedCollaborator = {
  name: string
  availabilities: ParsedCollaboratorAvailability[]
}

const weekDays = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche"
]

const weekDayAliases: Record<string, string> = {
  lundi: "Lundi",
  monday: "Lundi",

  mardi: "Mardi",
  tuesday: "Mardi",

  mercredi: "Mercredi",
  wednesday: "Mercredi",

  jeudi: "Jeudi",
  thursday: "Jeudi",

  vendredi: "Vendredi",
  friday: "Vendredi",

  samedi: "Samedi",
  saturday: "Samedi",

  dimanche: "Dimanche",
  sunday: "Dimanche"
}

function normalizeDay(value: string): string {
  const normalizedValue = value
    .trim()
    .toLowerCase()

  return (
    weekDayAliases[normalizedValue] ??
    value.trim()
  )
}

function parseTimeRange(
  value: string
): {
  start: string
  end: string
  closed: boolean
} {
  const normalizedValue = value.trim()

  if (
    !normalizedValue ||
    normalizedValue.toLowerCase() === "fermé" ||
    normalizedValue.toLowerCase() === "ferme" ||
    normalizedValue.toLowerCase() === "closed"
  ) {
    return {
      start: "",
      end: "",
      closed: true
    }
  }

  const times = normalizedValue.match(
    /\b\d{1,2}:\d{2}\b/g
  )

  if (!times || times.length < 2) {
    return {
      start: "",
      end: "",
      closed: true
    }
  }

  return {
    start: times[0],
    end: times[1],
    closed: false
  }
}

function parseSchedule(
  rawSchedule: string
): ParsedSchedule | null {
  const value = rawSchedule.trim()

  if (!value) {
    return null
  }

  const detectedDay = weekDays.find(day =>
    value
      .toLowerCase()
      .includes(day.toLowerCase())
  )

  if (detectedDay) {
    const scheduleValue = value
      .replace(
        new RegExp(detectedDay, "i"),
        ""
      )
      .replace(/^[\s:;|,-]+/, "")
      .trim()

    const range = parseTimeRange(scheduleValue)

    return {
      day: detectedDay,
      ...range
    }
  }

  const parts = value
    .split(/[|;]/)
    .map(part => part.trim())
    .filter(Boolean)

  if (parts.length >= 2) {
    const day = normalizeDay(parts[0])
    const range = parseTimeRange(
      parts.slice(1).join(" ")
    )

    return {
      day,
      ...range
    }
  }

  return null
}

function normalizeSchedules(
  schedules: string[]
): ParsedSchedule[] {
  const parsedSchedules = schedules
    .map(parseSchedule)
    .filter(
      (
        schedule
      ): schedule is ParsedSchedule =>
        schedule !== null
    )

  return weekDays.map(day => {
    const schedule = parsedSchedules.find(
      item =>
        item.day.toLowerCase() ===
        day.toLowerCase()
    )

    return (
      schedule ?? {
        day,
        start: "",
        end: "",
        closed: true
      }
    )
  })
}

function parseCollaboratorAvailability(
  rawValue: string,
  collaboratorName: string
): ParsedSchedule | null {
  let value = rawValue.trim()

  if (!value) {
    return null
  }

  const includesCollaborator =
    value
      .toLowerCase()
      .includes(
        collaboratorName
          .trim()
          .toLowerCase()
      )

  if (includesCollaborator) {
    value = value
      .replace(
        new RegExp(
          collaboratorName.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          ),
          "i"
        ),
        ""
      )
      .replace(/^[\s:;|,-]+/, "")
      .trim()
  }

  return parseSchedule(value)
}

function parseYesNoValue(value: string): boolean {
  const normalizedValue = value
    .trim()
    .toLowerCase()

  return (
    normalizedValue === "oui" ||
    normalizedValue === "yes" ||
    normalizedValue === "true" ||
    normalizedValue === "1"
  )
}

function parseCollaboratorDispos(
  rawValue: string
): ParsedCollaboratorAvailability[] {
  const parsedValues = rawValue
    .split(",")
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => {
      const [rawDay, rawAvailability] =
        item.split("=")

      if (!rawDay || !rawAvailability) {
        return null
      }

      return {
        day: normalizeDay(rawDay),
        available:
          parseYesNoValue(rawAvailability)
      }
    })
    .filter(
      (
        item
      ): item is ParsedCollaboratorAvailability =>
        item !== null
    )

  return weekDays.map(day => {
    const availability =
      parsedValues.find(
        item =>
          item.day.toLowerCase() ===
          day.toLowerCase()
      )

    return (
      availability ?? {
        day,
        available: false
      }
    )
  })
}

function normalizeCollaborators(
  collaborators: string[],
  collaboratorsDispos: string[]
): ParsedCollaborator[] {
  return collaborators.map(
    (collaborator, index) => ({
      name: collaborator,
      availabilities:
        parseCollaboratorDispos(
          collaboratorsDispos[index] ?? ""
        )
    })
  )
}

function formatPrice(
  price: number,
  devise: string,
  language: Language
): string {
  const normalizedCurrency =
    devise?.trim().toUpperCase() || "EUR"

  try {
    return new Intl.NumberFormat(
      language === "fr" ? "fr-FR" : language,
      {
        style: "currency",
        currency: normalizedCurrency
      }
    ).format(price)
  } catch {
    return `${price} ${devise || "€"}`
  }
}

function formatDuration(
  duration: number,
  language: Language
): string {
  if (duration < 60) {
    return `${duration} ${translate(
      language,
      "minutes"
    )}`
  }

  const hours = Math.floor(duration / 60)
  const minutes = duration % 60

  if (minutes === 0) {
    return `${hours} h`
  }

  return `${hours} h ${minutes}`
}

function EmptyState({
  text
}: {
  text: string
}) {
  return (
    <div className="groomingEmptyState">
      <p>{text}</p>
    </div>
  )
}

function ScheduleTable({
  schedules,
  language
}: {
  schedules: ParsedSchedule[]
  language: Language
}) {
    console.log("schedules tab =",schedules)
    console.log(
      "schedule table = ",schedules.map(schedule => schedule.day)
    )
  return (
    <div className="groomingScheduleList">
      {schedules.map(schedule => (
        <div
          key={schedule.day}
          className="groomingScheduleRow"
        >
          <span className="groomingScheduleDay">
            {translate(
              language,
              schedule.day
            )}
          </span>

          {schedule.closed ? (
            <span className="groomingClosed">
              {translate(language, "Fermé")}
            </span>
          ) : (
            <span className="groomingScheduleTime">
              {schedule.start} –{" "}
              {schedule.end}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function GalleryTab({
  photos,
  language,
  onEdit
}: {
  photos: string[]
  language: Language
  onEdit: () => void
}) {
  return (
    <section className="groomingSection">
      <div className="groomingSectionHeader">
        <div>
          <h2>
            {translate(
              language,
              "Galerie photos"
            )}
          </h2>

          <p>
            {translate(
              language,
              "Photos présentées aux propriétaires d’animaux."
            )}
          </p>
        </div>

        <button
          type="button"
          className="groomingSecondaryButton"
          onClick={onEdit}
        >
          {translate(
            language,
            "Modifier les photos"
          )}
        </button>
      </div>

      {photos.length === 0 ? (
        <EmptyState
          text={translate(
            language,
            "Aucune photo renseignée."
          )}
        />
      ) : (
        <div className="groomingGalleryGrid">
          {photos.map((photo, index) => (
            <div
              key={`${photo}-${index}`}
              className="groomingGalleryItem"
            >
              <img
                src={photo}
                alt={`${translate(
                  language,
                  "Photo de l’établissement"
                )} ${index + 1}`}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function ServicesTab({
  services,
  language,
  onEdit
}: {
  services: Service[]
  language: Language
  onEdit: () => void
}) {
  return (
    <section className="groomingSection">
      <div className="groomingSectionHeader">
        <div>
          <h2>
            {translate(
              language,
              "Prestations"
            )}
          </h2>

          <p>
            {translate(
              language,
              "Prestations proposées par votre établissement."
            )}
          </p>
        </div>

        <button
          type="button"
          className="groomingSecondaryButton"
          onClick={onEdit}
        >
          {translate(
            language,
            "Modifier les prestations"
          )}
        </button>
      </div>

      {services.length === 0 ? (
        <EmptyState
          text={translate(
            language,
            "Aucune prestation renseignée."
          )}
        />
      ) : (
        <div className="groomingServicesGrid">
          {services.map(service => (
            <article
              key={service.id}
              className="groomingServiceCard"
            >
              <div className="groomingServiceTop">
                <h3>
                  {service.name}
                </h3>

                <div className="groomingServicePrice">
                  <span>
                    {translate(
                      language,
                      "À partir de "
                    )}
                  </span>

                  <strong>
                    {formatPrice(
                      service.price,
                      service.devise,
                      language
                    )}
                  </strong>
                </div>
              </div>

              {service.description && (
                <p className="groomingServiceDescription">
                  {service.description}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function SchedulesTab({
  schedules,
  language,
  onEdit
}: {
  schedules: ParsedSchedule[]
  language: Language
  onEdit: () => void
}) {
    const parsedSchedules =
    schedules
  return (
    <section className="groomingSection">
      <div className="groomingSectionHeader">
        <div>
          <h2>
            {translate(
              language,
              "Horaires d’ouverture"
            )}
          </h2>

          <p>
            {translate(
              language,
              "Horaires habituels de votre établissement."
            )}
          </p>
        </div>

        <button
          type="button"
          className="groomingSecondaryButton"
          onClick={onEdit}
        >
          {translate(
            language,
            "Modifier les horaires"
          )}
        </button>
      </div>

      <ScheduleTable
        schedules={parsedSchedules}
        language={language}
      />
    </section>
  )
}

function CollaboratorAvailabilityList({
  availabilities,
  language
}: {
  availabilities:
    ParsedCollaboratorAvailability[]
  language: Language
}) {
  return (
    <div className="groomingScheduleList">
      {availabilities.map(item => (
        <div
          key={item.day}
          className="groomingScheduleRow"
        >
          <span className="groomingScheduleDay">
            {translate(language, item.day)}
          </span>

          <span
            className={
              item.available
                ? "groomingAvailable"
                : "groomingClosed"
            }
          >
            {item.available
              ? translate(
                  language,
                  "Disponible"
                )
              : translate(
                  language,
                  "Indisponible"
                )}
          </span>
        </div>
      ))}
    </div>
  )
}

function CollaboratorsTab({
  collaborators,
  language,
  onEdit
}: {
  collaborators: ParsedCollaborator[]
  language: Language
  onEdit: () => void
}) {
  return (
    <section className="groomingSection">
      <div className="groomingSectionHeader">
        <div>
          <h2>
            {translate(
              language,
              "Collaborateurs"
            )}
          </h2>

          <p>
            {translate(
              language,
              "Équipe de l’établissement et disponibilités."
            )}
          </p>
        </div>

        <button
          type="button"
          className="groomingSecondaryButton"
          onClick={onEdit}
        >
          {translate(
            language,
            "Modifier les collaborateurs"
          )}
        </button>
      </div>

      {collaborators.length === 0 ? (
        <EmptyState
          text={translate(
            language,
            "Aucun collaborateur renseigné."
          )}
        />
      ) : (
        <div className="groomingCollaboratorsGrid">
          {collaborators.map(
            collaborator => (
              <article
                key={collaborator.name}
                className="groomingCollaboratorCard"
              >
                <div className="groomingCollaboratorHeader">
                  <div className="groomingCollaboratorAvatar">
                    {collaborator.name
                      .trim()
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <h3>
                      {collaborator.name}
                    </h3>

                    <span>
                      {translate(
                        language,
                        "Collaborateur"
                      )}
                    </span>
                  </div>
                </div>

                 <CollaboratorAvailabilityList
                   availabilities={
                     collaborator.availabilities
                   }
                   language={language}
                 />
              </article>
            )
          )}
        </div>
      )}
    </section>
  )
}

export default function GroomingAccountPage() {
  const router = useRouter()

    const {
      session,
      loading,
      updateUser
    } = useAuth()
  const [
    activeTab,
    setActiveTab
  ] = useState<GroomingTab>("gallery")
    const [
      isInformationsModalOpen,
      setIsInformationsModalOpen
    ] = useState(false)
    const [
      isGalleryModalOpen,
      setIsGalleryModalOpen
    ] = useState(false)
    const [
      isSchedulesModalOpen,
      setIsSchedulesModalOpen
    ] = useState(false)
    const [
      isCollaboratorsModalOpen,
      setIsCollaboratorsModalOpen
    ] = useState(false)
    const [
      isServicesModalOpen,
      setIsServicesModalOpen
    ] = useState(false)

  const [
    currentGrooming,
    setCurrentGrooming
  ] = useState<GroomingUser | null>(
    session?.accountType === "grooming"
      ? (session.user as GroomingUser)
      : null
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
    
    const [services, setServices] = useState<Service[]>([])
    
    useEffect(() => {
      if (!currentGrooming?.id) {
        return
      }

      async function loadServices() {
        try {
            if (!currentGrooming) {
                return
              }
            
          const groomingServices =
            await fetchServicesForProfessional(currentGrooming.id)

          setServices(groomingServices)
        } catch (error) {
          console.error(
            "Erreur lors du chargement des prestations :",
            error
          )
        }
      }

      loadServices()
    }, [currentGrooming?.id])

    useEffect(() => {
      if (loading) {
        return
      }

      if (!session) {
        router.replace("/login")
        return
      }

      if (
        session.accountType !==
        "grooming"
      ) {
        router.replace("/")
        return
      }

      setCurrentGrooming(
        session.user as GroomingUser
      )
    }, [
      loading,
      session,
      router
    ])

  const language =
    currentGrooming?.language ?? "fr"

  const schedules = useMemo(
    () =>
      normalizeSchedules(
        currentGrooming?.schedules ?? []
      ),
    [currentGrooming?.schedules]
  )

  const collaborators = useMemo(
    () =>
      normalizeCollaborators(
        currentGrooming?.collaborators ?? [],
        currentGrooming
          ?.collaboratorsDispos ?? []
      ),
    [
      currentGrooming?.collaborators,
      currentGrooming
        ?.collaboratorsDispos
    ]
  )

  if (!currentGrooming) {
    return (
      <main className="groomingProfilePage">
        <div className="groomingLoading">
          {translate(
            language,
            "Chargement..."
          )}
        </div>
      </main>
    )
  }

  const mainPhoto =
    currentGrooming.photos?.[0] ?? ""

  const location = [
    currentGrooming.city,
    currentGrooming.country
  ]
    .filter(Boolean)
    .join(", ")
    
    const handleManageSubscription =
      async () => {
        if (
          !currentGrooming
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
                  currentGrooming.id,

                stripeCustomerID:
                  currentGrooming.stripeCustomerID,

                stripeSubscriptionID:
                  currentGrooming.stripeSubscriptionID,

                accountType:
                  "grooming"
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
  function openTemporaryEditor(
    editor:
      | "profile"
      | "gallery"
      | "services"
      | "schedules"
      | "collaborators"
  ) {
    console.log(
      `Ouverture future de l’éditeur : ${editor}`
    )
  }
  return (
    <main className="groomingProfilePage">
      <div className="groomingProfileContainer">
        <section className="groomingProfileCard">
          <div className="groomingProfilePhotoWrapper">
            {mainPhoto ? (
              <img
                className="groomingProfilePhoto"
                src={mainPhoto}
                alt={translate(
                  language,
                  "Photo de l’établissement"
                )}
              />
            ) : (
              <div className="groomingProfilePhotoPlaceholder">
                {currentGrooming.name
                  ?.trim()
                  .charAt(0)
                  .toUpperCase() || "G"}
              </div>
            )}
          </div>

          <div className="groomingProfileContent">
          <div className="groomingProfileHeading">
            <div className="groomingProfileTitle">
              <span className="groomingStatusBadge">
                {translate(
                  language,
                  "Établissement actif"
                )}
              </span>

              <h1>
                {currentGrooming.name ||
                  translate(
                    language,
                    "Nom non renseigné"
                  )}
              </h1>

              <p className="groomingPseudo">
                @
                {currentGrooming.pseudo ||
                  translate(
                    language,
                    "Pseudo non renseigné"
                  )}
              </p>
            </div>

          <div className="groomingSubscriptionCardMini">
            <div className="groomingSubscriptionTop">
              <div className="professionalOffersCurrentPackageIcon">
                <Image
                  src={packageIcons[currentGrooming.package ?? 0]}
                  alt=""
                  width={56}
                  height={56}
                  className="currentPackageImage"
                  aria-hidden="true"
                />
              </div>

              <div>
                <span className="groomingSubscriptionLabel">
                  {translate(
                    language,
                    "Abonnement"
                  )}
                </span>

                <strong>
                  {translate(
                    language,
                    packageNames[
                      currentGrooming.package ?? 0
                    ] ?? "Découverte"
                  )}
                </strong>
              </div>
            </div>

            <div className="groomingSubscriptionBottom">
              <div>
                <span>
                  {translate(language, "Début")}
                </span>

                <strong>
                  {currentGrooming.package === 0
                    ? "-"
                    : displaySubscriptionDate(
                        currentGrooming.packageStart
                      )}
                </strong>
              </div>

              <div className="groomingSubscriptionDivider" />

              <div>
                <span>
                  {translate(
                    language,
                    currentGrooming.autoRenew === 1
                      ? "Prochain renouvellement"
                      : "Fin"
                  )}
                </span>

                <strong>
                  {currentGrooming.package === 0
                    ? "-"
                    : displaySubscriptionDate(
                        currentGrooming.packageEnd
                      )}
                </strong>
              </div>
            </div>

            {currentGrooming.package > 0 && (
              <>
                <div className="groomingSubscriptionButtonDivider" />

                <button
                  className="groomingManageSubscriptionButton"
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

            <button
              type="button"
              className="groomingPrimaryButton"
              onClick={() =>
                setIsInformationsModalOpen(true)
              }
            >
              {translate(
                language,
                "Modifier le profil"
              )}
            </button>
          </div>

            <p className="groomingInfos">
              {currentGrooming.infos ||
                translate(
                  language,
                  "Aucune présentation renseignée."
                )}
            </p>

            <div className="groomingContactGrid">
              <div className="groomingContactItem">
                <span className="groomingContactIcon">
                  📍
                </span>

                <div>
                  <span className="groomingContactLabel">
                    {translate(
                      language,
                      "Adresse"
                    )}
                  </span>

                  <strong>
                    {currentGrooming.adress ||
                      translate(
                        language,
                        "Non renseignée"
                      )}
                  </strong>
                </div>
              </div>

              <div className="groomingContactItem">
                <span className="groomingContactIcon">
                  🏙️
                </span>

                <div>
                  <span className="groomingContactLabel">
                    {translate(
                      language,
                      "Localisation"
                    )}
                  </span>

                  <strong>
                    {location ||
                      translate(
                        language,
                        "Non renseignée"
                      )}
                  </strong>
                </div>
              </div>

              <div className="groomingContactItem">
                <span className="groomingContactIcon">
                  📞
                </span>

                <div>
                  <span className="groomingContactLabel">
                    {translate(
                      language,
                      "Téléphone"
                    )}
                  </span>

                  <strong>
                    {currentGrooming.phoneNumber ||
                      translate(
                        language,
                        "Non renseigné"
                      )}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <nav
          className="groomingTabs"
          aria-label={translate(
            language,
            "Navigation du profil"
          )}
        >
          <button
            type="button"
            className={
              activeTab === "gallery"
                ? "groomingTab groomingTabActive"
                : "groomingTab"
            }
            onClick={() =>
              setActiveTab("gallery")
            }
          >
            {translate(
              language,
              "Galerie photos"
            )}
          </button>

          <button
            type="button"
            className={
              activeTab === "services"
                ? "groomingTab groomingTabActive"
                : "groomingTab"
            }
            onClick={() =>
              setActiveTab("services")
            }
          >
            {translate(
              language,
              "Prestations"
            )}
          </button>

          <button
            type="button"
            className={
              activeTab === "schedules"
                ? "groomingTab groomingTabActive"
                : "groomingTab"
            }
            onClick={() =>
              setActiveTab("schedules")
            }
          >
            {translate(
              language,
              "Horaires"
            )}
          </button>

          <button
            type="button"
            className={
              activeTab ===
              "collaborators"
                ? "groomingTab groomingTabActive"
                : "groomingTab"
            }
            onClick={() =>
              setActiveTab(
                "collaborators"
              )
            }
          >
            {translate(
              language,
              "Collaborateurs"
            )}
          </button>
        </nav>

        <div className="groomingTabContent">
          {activeTab === "gallery" && (
            <GalleryTab
              photos={
                currentGrooming.photos ?? []
              }
              language={language}
               onEdit={() =>
                 setIsGalleryModalOpen(true)
               }
            />
          )}

          {activeTab === "services" && (
                <ServicesTab
                  services={services}
                  language={language}
                  onEdit={() =>
                    setIsServicesModalOpen(true)
                  }
                />
          )}

          {activeTab === "schedules" && (
             <SchedulesTab
               schedules={schedules}
               language={language}
               onEdit={() =>
                 setIsSchedulesModalOpen(true)
               }
             />
          )}

          {activeTab ===
            "collaborators" && (
                <CollaboratorsTab
                  collaborators={
                    collaborators
                  }
                  language={language}
                  onEdit={() =>
                    setIsCollaboratorsModalOpen(true)
                  }
                />
          )}
          
          {isInformationsModalOpen && (
            <InformationsModal
              grooming={currentGrooming}
              language={language}
              onClose={() =>
                setIsInformationsModalOpen(
                  false
                )
              }
              onSave={async updates => {
                const updatedGrooming =
                  (await updateGroomingProfile(
                    currentGrooming.id,
                    updates
                  )) as Partial<GroomingUser>

                setCurrentGrooming(
                  (previous: GroomingUser | null) => {
                    if (!previous) {
                      return previous
                    }

                    return {
                      ...previous,
                      ...updatedGrooming
                    }
                  }
                )

                updateUser(updatedGrooming)

                setIsInformationsModalOpen(
                  false
                )
              }}
            />
          )}
          
          {isGalleryModalOpen && (
            <GalleryModal
              photos={
                currentGrooming.photos ?? []
              }
              language={language}
              onClose={() =>
                setIsGalleryModalOpen(false)
              }
              onSave={async (
                existingPhotos,
                newPhotos
              ) => {
                const updatedPhotos =
                  await updateGroomingGallery(
                    currentGrooming.id,
                    existingPhotos,
                    newPhotos
                  )

                setCurrentGrooming((previous: GroomingUser | null) => {
                  if (!previous) {
                    return previous
                  }

                  return {
                    ...previous,
                    photos: updatedPhotos
                  }
                })

                updateUser({
                  photos: updatedPhotos
                })

                setIsGalleryModalOpen(false)
              }}
            />
          )}
          
          {isSchedulesModalOpen && (
            <SchedulesModal
              isOpen={
                isSchedulesModalOpen
              }
              schedules={
                currentGrooming.schedules ?? []
              }
              onClose={() =>
                setIsSchedulesModalOpen(false)
              }
              onSave={async schedules => {
                const updatedGrooming =
                  (await updateGroomingProfile(
                    currentGrooming.id,
                    {
                      schedules:
                        schedules as GroomingUser["schedules"]
                    }
                  )) as Partial<GroomingUser>

                setCurrentGrooming((previous: GroomingUser | null) => {
                  if (!previous) {
                    return previous
                  }

                  return {
                    ...previous,
                    ...updatedGrooming,
                    schedules:
                      schedules as GroomingUser["schedules"]
                  }
                })

                updateUser({
                  ...updatedGrooming,
                  schedules:
                    schedules as GroomingUser["schedules"]
                })

                setIsSchedulesModalOpen(false)
              }}
            />
          )}
          
          {isCollaboratorsModalOpen && (
            <CollaboratorsModal
              isOpen={
                isCollaboratorsModalOpen
              }
              collaborators={
                currentGrooming.collaborators ??
                []
              }
              collaboratorsDispos={
                currentGrooming
                  .collaboratorsDispos ??
                []
              }
              language={language}
              onClose={() =>
                setIsCollaboratorsModalOpen(false)
              }
              onSave={async updates => {
                const updatedGrooming =
                  (await updateGroomingProfile(
                    currentGrooming.id,
                    updates
                  )) as Partial<GroomingUser>

                setCurrentGrooming((previous: GroomingUser | null) => {
                  if (!previous) {
                    return previous
                  }

                  return {
                    ...previous,
                    ...updatedGrooming,

                    collaborators:
                      updatedGrooming
                        .collaborators ??
                      updates.collaborators,

                    collaboratorsDispos:
                      updatedGrooming
                        .collaboratorsDispos ??
                      updates.collaboratorsDispos
                  }
                })

                updateUser({
                  ...updatedGrooming,

                  collaborators:
                    updatedGrooming
                      .collaborators ??
                    updates.collaborators,

                  collaboratorsDispos:
                    updatedGrooming
                      .collaboratorsDispos ??
                    updates.collaboratorsDispos
                })

                setIsCollaboratorsModalOpen(
                  false
                )
              }}
            />
          )}
          
          {isServicesModalOpen &&
            currentGrooming && (
              <ServicesModal
                isOpen={isServicesModalOpen}
                services={services}
                healthcareID={currentGrooming.id}
                language={language}
                onClose={() =>
                  setIsServicesModalOpen(false)
                }
                onSave={async updatedServices => {
                  const savedServicesResult =
                    await updateServices({
                      professionalID:
                        currentGrooming.id,

                      previousServices:
                        services,

                      services:
                        updatedServices
                    })

                  const savedServices: Service[] =
                    savedServicesResult.map(
                      service => ({
                        ...service,
                        groomingID:
                          service.groomingID ??
                          currentGrooming.id
                      })
                    ) as Service[]

                  setServices(savedServices)

                  setCurrentGrooming(
                    (previous: GroomingUser | null) => {
                      if (!previous) {
                        return previous
                      }

                      return {
                        ...previous,
                        services:
                          savedServices
                      }
                    }
                  )

                  updateUser({
                    services:
                      savedServices
                  })

                  setIsServicesModalOpen(false)
                }}
              />
            )}
        </div>
      </div>
    </main>
  )
}
