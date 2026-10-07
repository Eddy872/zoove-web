"use client"

import {
  useEffect,
  useMemo,
  useState
} from "react"

import { useRouter } from "next/navigation"

import type {
  HealthcareUser
} from "@/types/healthcareUser"

import type {
  Service
} from "@/types/service"
import Image from "next/image"
import { useAuth } from "@/context/AuthContext"
import {
  useLanguage,
  type Language
} from "@/context/LanguageContext"
import { translate } from "@/translations/translations"
import {
  fetchServicesForProfessional
} from "@/services/fetchProfessionalById"
import InformationsModal from "./InformationsModal"
import ExpertiseModal from "./ExpertiseModal"
import GalleryModal from "./GalleryModal"
import SchedulesModal from "./SchedulesModal"
import CollaboratorsModal
  from "./CollaboratorsModal"
import ServicesModal
  from "./ServicesModal"
import {
  updateHealthcareProfile
} from "@/services/updateHealthcareProfile"
import { updateServices } from "@/services/updateServices"
import {
    updateHealthcareGallery
} from "@/services/updateHealthcareGallery"
import {
  createCustomerPortal
} from "@/services/createCustomerPortal"
import "./healthcare-profile.css"

type HealthcareTab =
  | "gallery"
  | "services"
  | "schedules"
  | "collaborators"
  | "expertise"

type ParsedSchedule = {
  day: string
  start: string
  end: string
  closed: boolean
}

type ParsedCollaboratorAvailability = {
  day: string
  available: boolean
}

type ParsedCollaborator = {
  name: string
  availabilities:
    ParsedCollaboratorAvailability[]
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

const weekDayAliases: Record<
  string,
  string
> = {
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

  const lowerValue =
    normalizedValue.toLowerCase()

  if (
    !normalizedValue ||
    lowerValue === "fermé" ||
    lowerValue === "ferme" ||
    lowerValue === "closed"
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

  const equalIndex =
    value.indexOf("=")

  if (equalIndex !== -1) {
    const rawDay =
      value
        .slice(0, equalIndex)
        .trim()

    const rawRange =
      value
        .slice(equalIndex + 1)
        .trim()

    const day =
      normalizeDay(rawDay)

    if (!weekDays.includes(day)) {
      return null
    }

    return {
      day,
      ...parseTimeRange(rawRange)
    }
  }

  const parts = value
    .split(/[|;]/)
    .map(part => part.trim())
    .filter(Boolean)

  if (parts.length >= 2) {
    const day =
      normalizeDay(parts[0])

    if (!weekDays.includes(day)) {
      return null
    }

    return {
      day,
      ...parseTimeRange(
        parts.slice(1).join(" ")
      )
    }
  }

  const detectedDay =
    weekDays.find(day =>
      value
        .toLowerCase()
        .startsWith(
          day.toLowerCase()
        )
    )

  if (!detectedDay) {
    return null
  }

  const scheduleValue =
    value
      .slice(detectedDay.length)
      .replace(
        /^[\s=:;|,-]+/,
        ""
      )
      .trim()

  return {
    day: detectedDay,
    ...parseTimeRange(
      scheduleValue
    )
  }
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
    const schedule =
      parsedSchedules.find(
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

function parseYesNoValue(
  value: string
): boolean {
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
      const separatorIndex =
        item.indexOf("=")

      if (separatorIndex === -1) {
        return null
      }

      const rawDay = item
        .slice(0, separatorIndex)
        .trim()

      const rawAvailability = item
        .slice(separatorIndex + 1)
        .trim()

      if (
        !rawDay ||
        !rawAvailability
      ) {
        return null
      }

      return {
        day: normalizeDay(rawDay),
        available: parseYesNoValue(
          rawAvailability
        )
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
          collaboratorsDispos[index] ??
            ""
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
    devise?.trim().toUpperCase() ||
    "EUR"

  try {
    return new Intl.NumberFormat(
      language === "fr"
        ? "fr-FR"
        : language,
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

  const hours =
    Math.floor(duration / 60)

  const minutes =
    duration % 60

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
    <div className="healthcareEmptyState">
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
  return (
    <div className="healthcareScheduleList">
      {schedules.map(schedule => (
        <div
          key={schedule.day}
          className="healthcareScheduleRow"
        >
          <span className="healthcareScheduleDay">
            {translate(
              language,
              schedule.day
            )}
          </span>

          {schedule.closed ? (
            <span className="healthcareClosed">
              {translate(
                language,
                "Fermé"
              )}
            </span>
          ) : (
            <span className="healthcareScheduleTime">
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
    <section className="healthcareSection">
      <div className="healthcareSectionHeader">
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
          className="healthcareSecondaryButton"
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
        <div className="healthcareGalleryGrid">
          {photos.map(
            (photo, index) => (
              <div
                key={`${photo}-${index}`}
                className="healthcareGalleryItem"
              >
                <img
                  src={photo}
                  alt={`${translate(
                    language,
                    "Photo de l’établissement"
                  )} ${index + 1}`}
                />
              </div>
            )
          )}
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
    <section className="healthcareSection">
      <div className="healthcareSectionHeader">
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
          className="healthcareSecondaryButton"
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
        <div className="healthcareServicesGrid">
          {services.map(service => (
            <article
              key={service.id}
              className="healthcareServiceCard"
            >
              <div className="healthcareServiceTop">
                <h3>
                  {service.name}
                </h3>

                <div className="healthcareServicePrice">
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
                <p className="healthcareServiceDescription">
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
  return (
    <section className="healthcareSection">
      <div className="healthcareSectionHeader">
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
          className="healthcareSecondaryButton"
          onClick={onEdit}
        >
          {translate(
            language,
            "Modifier les horaires"
          )}
        </button>
      </div>

      <div className="healthcareSchedulesList">
        {schedules.map(schedule => (
            <div
              key={schedule.day}
              className="healthcareScheduleRow"
            >
              <span className="healthcareScheduleDay">
                {translate(language, schedule.day)}
              </span>

              {!schedule.closed ? (
                <span className="healthcareScheduleTime">
                  {schedule.start} - {schedule.end}
                </span>
              ) : (
                <span className="healthcareClosed">
                  {translate(language, "Fermé")}
                </span>
              )}
            </div>
        ))}
      </div>
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
    <div className="healthcareScheduleList">
      {availabilities.map(item => (
        <div
          key={item.day}
          className="healthcareScheduleRow"
        >
          <span className="healthcareScheduleDay">
            {translate(
              language,
              item.day
            )}
          </span>

          <span
            className={
              item.available
                ? "healthcareAvailable"
                : "healthcareClosed"
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
    <section className="healthcareSection">
      <div className="healthcareSectionHeader">
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
          className="healthcareSecondaryButton"
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
        <div className="healthcareCollaboratorsGrid">
          {collaborators.map(
            collaborator => (
              <article
                key={collaborator.name}
                className="healthcareCollaboratorCard"
              >
                <div className="healthcareCollaboratorHeader">
                  <div className="healthcareCollaboratorAvatar">
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

function ExpertiseTab({
  expertise,
  language,
  onEdit
}: {
  expertise: string[]
  language: Language
  onEdit: () => void
}) {
  return (
    <section className="healthcareSection">
      <div className="healthcareSectionHeader">
        <div>
          <h2>
            {translate(language, "Spécialités")}
          </h2>

          <p>
            {translate(
              language,
              "Domaines d'expertise de votre établissement."
            )}
          </p>
        </div>

        <button
          type="button"
          className="healthcareSecondaryButton"
          onClick={onEdit}
        >
          {translate(
            language,
            "Modifier les spécialités"
          )}
        </button>
      </div>

      {expertise.length === 0 ? (
        <EmptyState
          text={translate(
            language,
            "Aucune spécialité renseignée."
          )}
        />
      ) : (
        <div className="healthcareExpertiseList">
          {expertise.map(item => (
            <span
              key={item}
              className="healthcareChip"
            >
              {translate(language, item)}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}

export default function HealthcareAccountPage() {
  const router = useRouter()
    const {
      language
    } = useLanguage()
    const {
      session,
      loading,
      updateUser
    } = useAuth()
  const [
    activeTab,
    setActiveTab
  ] = useState<HealthcareTab>(
    "gallery"
  )

  const [
    currentHealthcare,
    setCurrentHealthcare
  ] = useState<HealthcareUser | null>(
    session?.accountType ===
      "healthcare"
      ? (
          session.user as HealthcareUser
        )
      : null
  )

  const [
    services,
    setServices
  ] = useState<Service[]>([])
    
    const [
      isInformationsModalOpen,
      setIsInformationsModalOpen
    ] = useState(false)
    const [
      isExpertiseModalOpen,
      setIsExpertiseModalOpen
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
        "healthcare"
      ) {
        router.replace("/")
        return
      }

      setCurrentHealthcare(
        session.user as HealthcareUser
      )
    }, [
      loading,
      session,
      router
    ])

  useEffect(() => {
    if (!currentHealthcare?.id) {
      return
    }

    let isCancelled = false
      console.log("CK schedules :", currentHealthcare?.schedules)
    async function loadServices() {
      try {
        const healthcareServices =
          await fetchServicesForProfessional(
            currentHealthcare!.id
          )

        if (!isCancelled) {
          setServices(
            healthcareServices
          )
        }
      } catch (error) {
        console.error(
          "Erreur lors du chargement des prestations :",
          error
        )

        if (!isCancelled) {
          setServices([])
        }
      }
    }

    loadServices()

    return () => {
      isCancelled = true
    }
  }, [currentHealthcare?.id])

  const schedules = useMemo(
    () =>
      normalizeSchedules(
        (currentHealthcare
          ?.schedules ?? []) as string[]
      ),
    [currentHealthcare?.schedules]
  )
console.log("Normalized schedules :",schedules)
  const collaborators = useMemo(
    () =>
      normalizeCollaborators(
        (currentHealthcare
          ?.collaborators ?? []) as string[],
        (currentHealthcare
          ?.collaboratorsDispos ?? []) as string[]
      ),
    [
      currentHealthcare
        ?.collaborators,
      currentHealthcare
        ?.collaboratorsDispos
    ]
  )

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

  if (!currentHealthcare) {
    return (
      <main className="healthcareProfilePage">
        <div className="healthcareLoading">
          {translate(
            language,
            "Chargement..."
          )}
        </div>
      </main>
    )
  }

  const mainPhoto =
    currentHealthcare.photos?.[0] ??
    ""

  const location = [
    currentHealthcare.city,
    currentHealthcare.country
  ]
    .filter(Boolean)
    .join(", ")

  const expertise =
    (currentHealthcare.expertise ?? []) as string[]
    
    const handleManageSubscription =
      async () => {
        if (
          !currentHealthcare
            .stripeCustomerID
            ?.trim()
        ) {
          alert(
            translate(
              language,
              "Cet abonnement a été souscrit sur iOS. Veuillez utiliser l'application iOS pour le gérer."
            )
          )

          return
        }

        try {
          const portalURL =
            await createCustomerPortal({
              userID:
                currentHealthcare.id,

              stripeCustomerID:
                currentHealthcare
                  .stripeCustomerID,

              stripeSubscriptionID:
                currentHealthcare
                  .stripeSubscriptionID,

              accountType:
                "healthcare"
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
    
    console.log(
      "currentHealthcare.schedules :",
      currentHealthcare.schedules
    )

    console.log(
      "premier horaire :",
      currentHealthcare.schedules?.[0]
    )

    console.log(
      "type premier horaire :",
      typeof currentHealthcare.schedules?.[0]
    )
    console.log(
      "currentHealthcare.services =",
      currentHealthcare.services
    )
  return (
    <main className="healthcareProfilePage">
      <div className="healthcareProfileContainer">
        <section className="healthcareProfileCard">
          <div className="healthcareProfilePhotoWrapper">
            {mainPhoto ? (
              <img
                className="healthcareProfilePhoto"
                src={mainPhoto}
                alt={translate(
                  language,
                  "Photo de l’établissement"
                )}
              />
            ) : (
              <div className="healthcareProfilePhotoPlaceholder">
                {currentHealthcare.name
                  ?.trim()
                  .charAt(0)
                  .toUpperCase() ||
                  "H"}
              </div>
            )}
          </div>

          <div className="healthcareProfileContent">
          <div className="healthcareProfileHeading">
            <div className="healthcareProfileTitle">
              <span className="healthcareStatusBadge">
                {translate(
                  language,
                  "Établissement actif"
                )}
              </span>

              <h1>
                {currentHealthcare.name ||
                  translate(
                    language,
                    "Nom non renseigné"
                  )}
              </h1>

              <p className="healthcarePseudo">
                @
                {currentHealthcare.pseudo ||
                  translate(
                    language,
                    "Pseudo non renseigné"
                  )}
              </p>
            </div>

          <div className="healthcareSubscriptionCardMini">
            <div className="healthcareSubscriptionTop">
              <div className="professionalOffersCurrentPackageIcon">
                <Image
                  src={packageIcons[currentHealthcare.package ?? 0]}
                  alt=""
                  width={56}
                  height={56}
                  className="currentPackageImage"
                  aria-hidden="true"
                />
              </div>

              <div>
                <span className="healthcareSubscriptionLabel">
                  {translate(
                    language,
                    "Abonnement"
                  )}
                </span>

                <strong>
                  {translate(
                    language,
                    packageNames[
                      currentHealthcare.package ?? 0
                    ] ?? "Découverte"
                  )}
                </strong>
              </div>
            </div>

            <div className="healthcareSubscriptionBottom">
              <div>
                <span>
                  {translate(language, "Début")}
                </span>

                <strong>
                  {currentHealthcare.package === 0
                    ? "-"
                    : displaySubscriptionDate(
                        currentHealthcare.packageStart
                      )}
                </strong>
              </div>

              <div className="healthcareSubscriptionDivider" />

              <div>
                <span>
                  {translate(
                    language,
                    currentHealthcare.autoRenew === 1
                      ? "Prochain renouvellement"
                      : "Fin"
                  )}
                </span>

                <strong>
                  {currentHealthcare.package === 0
                    ? "-"
                    : displaySubscriptionDate(
                        currentHealthcare.packageEnd
                      )}
                </strong>
              </div>
            </div>
          
              {currentHealthcare.package > 0 && (
                <>
                  <div className="healthcareSubscriptionButtonDivider" />

                  <button
                    className="healthcareManageSubscriptionButton"
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
              className="healthcarePrimaryButton"
              onClick={() =>
                setIsInformationsModalOpen(true)
              }
            >
              {translate(
                language,
                "Modifier les informations"
              )}
            </button>
          </div>

            <p className="healthcareInfos">
              {currentHealthcare.infos ||
                translate(
                  language,
                  "Aucune présentation renseignée."
                )}
            </p>

            {expertise.length > 0 && (
              <div className="healthcareExpertise">
                <strong>
                  {translate(
                    language,
                    "Spécialités"
                  )}
                </strong>

                <div className="healthcareExpertiseList">
                  {expertise.map(
                    (specialty: string) => (
                      <span
                        key={specialty}
                        className="healthcareChip"
                      >
                        {translate(
                          language,
                          specialty
                        )}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

            <div className="healthcareContactGrid">
              <div className="healthcareContactItem">
                <span className="healthcareContactIcon">
                  📍
                </span>

                <div>
                  <span className="healthcareContactLabel">
                    {translate(
                      language,
                      "Adresse"
                    )}
                  </span>

                  <strong>
                    {currentHealthcare.adress ||
                      translate(
                        language,
                        "Non renseignée"
                      )}
                  </strong>
                </div>
              </div>

              <div className="healthcareContactItem">
                <span className="healthcareContactIcon">
                  🏙️
                </span>

                <div>
                  <span className="healthcareContactLabel">
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

              <div className="healthcareContactItem">
                <span className="healthcareContactIcon">
                  📞
                </span>

                <div>
                  <span className="healthcareContactLabel">
                    {translate(
                      language,
                      "Téléphone"
                    )}
                  </span>

                  <strong>
                    {currentHealthcare.phoneNumber ||
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
          className="healthcareTabs"
          aria-label={translate(
            language,
            "Navigation du profil"
          )}
        >
          <button
            type="button"
            className={
              activeTab === "gallery"
                ? "healthcareTab healthcareTabActive"
                : "healthcareTab"
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
                ? "healthcareTab healthcareTabActive"
                : "healthcareTab"
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
                ? "healthcareTab healthcareTabActive"
                : "healthcareTab"
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
                ? "healthcareTab healthcareTabActive"
                : "healthcareTab"
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
          
          <button
            type="button"
            className={
              activeTab === "expertise"
                ? "healthcareTab healthcareTabActive"
                : "healthcareTab"
            }
            onClick={() => setActiveTab("expertise")}
          >
            {translate(language, "Spécialités")}
          </button>
        </nav>

        <div className="healthcareTabContent">
          {activeTab === "gallery" && (
            <GalleryTab
              photos={
                currentHealthcare.photos ??
                []
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
                onEdit={() => {
                  console.log(
                    currentHealthcare.services
                  )

                  setIsServicesModalOpen(true)
                }}
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
          
          {activeTab === "expertise" && (
            <ExpertiseTab
              expertise={currentHealthcare.expertise ?? []}
              language={language}
              onEdit={() =>
                  setIsExpertiseModalOpen(true)
              }
            />
          )}
        </div>
          
          {isInformationsModalOpen && (
            <InformationsModal
              healthcare={
                currentHealthcare
              }
              language={language}
              onClose={() =>
                setIsInformationsModalOpen(
                  false
                )
              }
              onSave={async updates => {
                await updateHealthcareProfile(
                  currentHealthcare.id,
                  updates
                )

                setCurrentHealthcare(
                  (previous: HealthcareUser | null) => {
                    if (!previous) {
                      return previous
                    }

                    return {
                      ...previous,
                      ...updates
                    }
                  }
                )

                updateUser(updates)

                setIsInformationsModalOpen(
                  false
                )
              }}
            />
          )}
          
          {isExpertiseModalOpen && (
            <ExpertiseModal
              expertise={
                currentHealthcare.expertise ??
                []
              }
              language={language}
              onClose={() =>
                setIsExpertiseModalOpen(false)
              }
              onSave={async updates => {
                await updateHealthcareProfile(
                  currentHealthcare.id,
                  updates
                )

                setCurrentHealthcare(
                  (previous: HealthcareUser | null) => {
                    if (!previous) {
                      return previous
                    }

                    return {
                      ...previous,
                      ...updates
                    }
                  }
                )

                updateUser(updates)

                setIsExpertiseModalOpen(false)
              }}
            />
          )}
          
          {isGalleryModalOpen && (
            <GalleryModal
              photos={
                currentHealthcare.photos ?? []
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
                  await updateHealthcareGallery(
                    currentHealthcare.id,
                    existingPhotos,
                    newPhotos
                  )

                setCurrentHealthcare((previous: HealthcareUser | null) => {
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
              isOpen={isSchedulesModalOpen}
              schedules={
                currentHealthcare.schedules ?? []
              }
              onClose={() =>
                setIsSchedulesModalOpen(false)
              }
              onSave={async schedules => {
                const updates = {
                  schedules:
                    schedules as HealthcareUser["schedules"]
                }

                await updateHealthcareProfile(
                  currentHealthcare.id,
                  updates
                )

                setCurrentHealthcare((previous: HealthcareUser | null) => {
                  if (!previous) {
                    return previous
                  }

                  return {
                    ...previous,
                    ...updates
                  }
                })

                updateUser(updates)

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
                currentHealthcare
                  .collaborators ?? []
              }
              collaboratorsDispos={
                currentHealthcare
                  .collaboratorsDispos ?? []
              }
              language={language}
              onClose={() =>
                setIsCollaboratorsModalOpen(
                  false
                )
              }
              onSave={async updates => {
                await updateHealthcareProfile(
                  currentHealthcare.id,
                  updates
                )

                setCurrentHealthcare(
                  (previous: HealthcareUser | null) => {
                    if (!previous) {
                      return previous
                    }

                    return {
                      ...previous,
                      ...updates
                    }
                  }
                )

                updateUser(updates)

                setIsCollaboratorsModalOpen(
                  false
                )
              }}
            />
          )}
          
          {isServicesModalOpen &&
            currentHealthcare && (
              <ServicesModal
                isOpen={isServicesModalOpen}
                services={services}
                healthcareID={currentHealthcare.id}
                language={language}
                onClose={() =>
                  setIsServicesModalOpen(false)
                }
                onSave={async updatedServices => {
                  const savedServicesResult =
                    await updateServices({
                      professionalID:
                        currentHealthcare.id,

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
                          currentHealthcare.id
                      })
                    ) as Service[]

                  setServices(
                    savedServices
                  )

                  setCurrentHealthcare(
                    (previous: HealthcareUser | null) => {
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

                  setIsServicesModalOpen(
                    false
                  )
                }}
              />
            )}
      </div>
    </main>
  )
}
