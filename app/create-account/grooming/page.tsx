"use client"

import {
  ChangeEvent,
  FormEvent,
  useMemo,
  useState,
  useEffect
} from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { useAuth } from "@/context/AuthContext"
import {
  useLanguage,
  type Language
} from "@/context/LanguageContext"
import { translate } from "@/translations/translations"
import {
  getWebNotificationToken
} from "@/services/firebaseNotifications"
import type { GroomingUser } from "@/types/groomingUser"
import type { Service } from "@/types/service"

import "./GroomingCreateAccount.css"

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001"

const MAX_PHOTO_SIZE =
  5 * 1024 * 1024

const acceptedPhotoTypes = [
  "image/jpeg",
  "image/png",
  "image/webp"
]

type WeekDay = {
  id: string
  label: string
}

type ScheduleItem = {
  day: string
  isOpen: boolean
  startTime: string
  endTime: string
}

type CollaboratorItem = {
  name: string
  disponibilities: Record<string, boolean>
}

type ServiceFormItem = {
  id: string
  name: string
  description: string
  price: string
  duration: string
  devise: string

  bookingMode: string
  requiredInformations: string[]
  customQuestions: string[]
}

const weekDays: WeekDay[] = [
  {
    id: "Lundi",
    label: "Lundi"
  },
  {
    id: "Mardi",
    label: "Mardi"
  },
  {
    id: "Mercredi",
    label: "Mercredi"
  },
  {
    id: "Jeudi",
    label: "Jeudi"
  },
  {
    id: "Vendredi",
    label: "Vendredi"
  },
  {
    id: "Samedi",
    label: "Samedi"
  },
  {
    id: "Dimanche",
    label: "Dimanche"
  }
]

const availableLanguages = [
  {
    code: "fr",
    label: "Français"
  },
  {
    code: "en",
    label: "English"
  },
  {
    code: "es",
    label: "Español"
  },
  {
    code: "it",
    label: "Italiano"
  },
  {
    code: "pt-PT",
    label: "Português"
  },
  {
    code: "de",
    label: "Deutsch"
  },
  {
    code: "ar",
    label: "العربية"
  }
]

const availableCurrencies = [
  {
    code: "€",
    label: "EUR (€)"
  },
  {
    code: "$",
    label: "USD ($)"
  },
  {
    code: "£",
    label: "GBP (£)"
  },
  {
    code: "CHF",
    label: "CHF"
  }
]

function generateID(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID()
  }

  return (
    Date.now().toString(36) +
    Math.random()
      .toString(36)
      .slice(2)
  )
}

function createInitialSchedules(): ScheduleItem[] {
  return weekDays.map(
    (day, index) => ({
      day: day.id,
      isOpen: index < 6,
      startTime: "08:00",
      endTime: "18:00"
    })
  )
}

function createInitialDisponibilities():
  Record<string, boolean> {
  return Object.fromEntries(
    weekDays.map((day) => [
      day.id,
      false
    ])
  )
}


function createScheduleStrings(
  schedules: ScheduleItem[]
): string[] {
  return weekDays.map((day) => {
    const schedule = schedules.find(
      (item) => item.day === day.id
    )

    if (!schedule || !schedule.isOpen) {
      return `${day.id}=Fermé`
    }

    return `${day.id}=${schedule.startTime}-${schedule.endTime}`
  })
}

function createDisponibilitiesString(
  disponibilities:
    Record<string, boolean>
): string {
  return weekDays
    .map((day) => {
      const isAvailable =
        disponibilities[
          day.id
        ] ?? false

      return (
        `${day.id}=` +
        `${isAvailable ? "Oui" : "Non"}`
      )
    })
    .join(",")
}

export default function CreateGroomingAccountPage() {
  const router = useRouter()

  const { language } =
    useLanguage()

  const { login } =
    useAuth()

  const [name, setName] =
    useState("")

  const [pseudo, setPseudo] =
    useState("")

  const [password, setPassword] =
    useState("")

  const [
    showPassword,
    setShowPassword
  ] = useState(false)

  const [adress, setAdress] =
    useState("")

  const [city, setCity] =
    useState("")

  const [country, setCountry] =
    useState("")

  const [
    phoneNumber,
    setPhoneNumber
  ] = useState("")

  const [infos, setInfos] =
    useState("")

  const [
    selectedLanguage,
    setSelectedLanguage
  ] = useState(
    language || "fr"
  )

    const [photos, setPhotos] =
      useState<File[]>([])

  const [
    schedules,
    setSchedules
  ] = useState<ScheduleItem[]>(
    createInitialSchedules
  )

  const [
    collaborators,
    setCollaborators
  ] = useState<
    CollaboratorItem[]
  >([])

  const [
    services,
    setServices
  ] = useState<ServiceFormItem[]>(
    []
  )

  const [error, setError] =
    useState("")

  const [
    isSubmitting,
    setIsSubmitting
  ] = useState(false)
    
    const [photoPreviews, setPhotoPreviews] =
      useState<string[]>([])

    useEffect(() => {
      const urls =
        photos.map((photo) =>
          URL.createObjectURL(photo)
        )

      setPhotoPreviews(urls)

      return () => {
        urls.forEach((url) =>
          URL.revokeObjectURL(url)
        )
      }
    }, [photos])

    const schedulePreview = useMemo(
      () =>
        createScheduleStrings(schedules).join(", "),
      [schedules]
    )

    const handlePhotosChange = (
      event:
        ChangeEvent<HTMLInputElement>
    ) => {
      const selectedFiles =
        Array.from(
          event.target.files ?? []
        )

      if (
        selectedFiles.length === 0
      ) {
        return
      }

      const invalidFile =
        selectedFiles.find(
          (file) =>
            !acceptedPhotoTypes.includes(
              file.type
            )
        )

      if (invalidFile) {
        setError(
          translate(
            language,
            "Le fichier sélectionné doit être une image."
          )
        )

        event.target.value = ""
        return
      }

      const oversizedFile =
        selectedFiles.find(
          (file) =>
            file.size >
            MAX_PHOTO_SIZE
        )

      if (oversizedFile) {
        setError(
          translate(
            language,
            "La photo ne doit pas dépasser 5 Mo."
          )
        )

        event.target.value = ""
        return
      }

      setError("")

      setPhotos(
        (currentPhotos) => [
          ...currentPhotos,
          ...selectedFiles
        ]
      )

      event.target.value = ""
    }

  const removePhoto = (
    indexToRemove: number
  ) => {
    setPhotos(
      (currentPhotos) =>
        currentPhotos.filter(
          (_, index) =>
            index !==
            indexToRemove
        )
    )
  }

  const updateScheduleOpen = (
    day: string,
    isOpen: boolean
  ) => {
    setSchedules(
      (currentSchedules) =>
        currentSchedules.map(
          (schedule) =>
            schedule.day === day
              ? {
                  ...schedule,
                  isOpen
                }
              : schedule
        )
    )
  }

  const updateScheduleTime = (
    day: string,
    field:
      | "startTime"
      | "endTime",
    value: string
  ) => {
    setSchedules(
      (currentSchedules) =>
        currentSchedules.map(
          (schedule) =>
            schedule.day === day
              ? {
                  ...schedule,
                  [field]: value
                }
              : schedule
        )
    )
  }

  const addCollaborator = () => {
    setCollaborators(
      (
        currentCollaborators
      ) => [
        ...currentCollaborators,
        {
          name: "",
          disponibilities:
            createInitialDisponibilities()
        }
      ]
    )
  }

  const removeCollaborator = (
    collaboratorIndex: number
  ) => {
    setCollaborators(
      (
        currentCollaborators
      ) =>
        currentCollaborators.filter(
          (_, index) =>
            index !==
            collaboratorIndex
        )
    )
  }

  const updateCollaboratorName = (
    collaboratorIndex: number,
    value: string
  ) => {
    setCollaborators(
      (
        currentCollaborators
      ) =>
        currentCollaborators.map(
          (
            collaborator,
            index
          ) =>
            index ===
            collaboratorIndex
              ? {
                  ...collaborator,
                  name: value
                }
              : collaborator
        )
    )
  }

  const updateCollaboratorDisponibility =
    (
      collaboratorIndex: number,
      day: string,
      isAvailable: boolean
    ) => {
      setCollaborators(
        (
          currentCollaborators
        ) =>
          currentCollaborators.map(
            (
              collaborator,
              index
            ) =>
              index ===
              collaboratorIndex
                ? {
                    ...collaborator,
                    disponibilities:
                      {
                        ...collaborator
                          .disponibilities,

                        [day]:
                          isAvailable
                      }
                  }
                : collaborator
          )
      )
    }

    const addService = () => {
      setServices(
        currentServices => [
          ...currentServices,
          {
            id: generateID(),
            name: "",
            description: "",
            price: "",
            duration: "",
            devise: "€",

            bookingMode: "direct",
            requiredInformations: [],
            customQuestions: []
          }
        ]
      )
    }

    const updateService = <
      K extends keyof Omit<
        ServiceFormItem,
        "id"
      >
    >(
      serviceIndex: number,
      field: K,
      value: ServiceFormItem[K]
    ) => {
      setServices(
        currentServices =>
          currentServices.map(
            (service, index) =>
              index === serviceIndex
                ? {
                    ...service,
                    [field]: value
                  }
                : service
          )
      )
    }
    
    const toggleRequiredInformation = (
      serviceIndex: number,
      information: string
    ) => {
      setServices(
        currentServices =>
          currentServices.map(
            (service, index) => {
              if (
                index !== serviceIndex
              ) {
                return service
              }

              const exists =
                service.requiredInformations.includes(
                  information
                )

              return {
                ...service,

                requiredInformations:
                  exists
                    ? service.requiredInformations.filter(
                        item =>
                          item !== information
                      )
                    : [
                        ...service.requiredInformations,
                        information
                      ]
              }
            }
          )
      )
    }
    
    const addCustomQuestion = (
      serviceIndex: number
    ) => {
      setServices(
        currentServices =>
          currentServices.map(
            (service, index) =>
              index === serviceIndex
                ? {
                    ...service,
                    customQuestions: [
                      ...service.customQuestions,
                      ""
                    ]
                  }
                : service
          )
      )
    }

    const updateCustomQuestion = (
      serviceIndex: number,
      questionIndex: number,
      value: string
    ) => {
      setServices(
        currentServices =>
          currentServices.map(
            (service, index) => {
              if (
                index !== serviceIndex
              ) {
                return service
              }

              return {
                ...service,

                customQuestions:
                  service.customQuestions.map(
                    (
                      question,
                      index
                    ) =>
                      index === questionIndex
                        ? value
                        : question
                  )
              }
            }
          )
      )
    }

    const removeCustomQuestion = (
      serviceIndex: number,
      questionIndex: number
    ) => {
      setServices(
        currentServices =>
          currentServices.map(
            (service, index) =>
              index === serviceIndex
                ? {
                    ...service,

                    customQuestions:
                      service.customQuestions.filter(
                        (_, index) =>
                          index !== questionIndex
                      )
                  }
                : service
          )
      )
    }

  const removeService = (
    serviceIndex: number
  ) => {
    setServices(
      (currentServices) =>
        currentServices.filter(
          (_, index) =>
            index !== serviceIndex
        )
    )
  }

  const validateForm =
    (): boolean => {
      if (photos.length === 0) {
        setError(
          translate(
            language,
            "Ajoutez au moins une photo du salon."
          )
        )

        return false
      }

      if (!name.trim()) {
        setError(
          translate(
            language,
            "Indiquez le nom du salon."
          )
        )

        return false
      }

      if (!pseudo.trim()) {
        setError(
          translate(
            language,
            "Indiquez un pseudo."
          )
        )

        return false
      }

      if (
        password.length < 8
      ) {
        setError(
          translate(
            language,
            "Le mot de passe doit contenir au moins 8 caractères."
          )
        )

        return false
      }

      if (!adress.trim()) {
        setError(
          translate(
            language,
            "Indiquez une adresse."
          )
        )

        return false
      }

      if (
        !city.trim() ||
        !country.trim()
      ) {
        setError(
          translate(
            language,
            "Indiquez la ville et le pays."
          )
        )

        return false
      }

      if (
        !phoneNumber.trim()
      ) {
        setError(
          translate(
            language,
            "Le numéro de téléphone est obligatoire."
          )
        )

        return false
      }

      const invalidSchedule =
        schedules.find(
          (schedule) =>
            schedule.isOpen &&
            (
              !schedule.startTime ||
              !schedule.endTime ||
              schedule.startTime >=
                schedule.endTime
            )
        )

      if (invalidSchedule) {
        setError(
          translate(
            language,
            "Vérifiez les horaires renseignés."
          )
        )

        return false
      }

      const emptyCollaborator =
        collaborators.find(
          (collaborator) =>
            !collaborator
              .name
              .trim()
        )

      if (emptyCollaborator) {
        setError(
          translate(
            language,
            "Indiquez le nom de chaque collaborateur ajouté."
          )
        )

        return false
      }

      if (
        services.length === 0
      ) {
        setError(
          translate(
            language,
            "Ajoutez au moins une prestation."
          )
        )

        return false
      }

      const invalidService =
        services.find(
          (service) => {
            const normalizedPrice =
              service.price.replace(
                ",",
                "."
              )

            const price =
              Number(
                normalizedPrice
              )

            const duration =
              Number(
                service.duration
              )

            return (
              !service.name.trim() ||
              !service.description.trim() ||
              !Number.isFinite(price) ||
              price < 0 ||
              !Number.isInteger(
                duration
              ) ||
              duration <= 0 ||
              !service.devise.trim()
            )
          }
        )

      if (invalidService) {
        setError(
          translate(
            language,
            "Vérifiez les prestations renseignées."
          )
        )

        return false
      }

      setError("")
      return true
    }

    const handleSubmit =
      async (
        event:
          FormEvent<HTMLFormElement>
      ) => {
        event.preventDefault()

        if (
          isSubmitting ||
          !validateForm()
        ) {
          return
        }

        setIsSubmitting(true)
        setError("")

        try {
          const webtoken =
            await getWebNotificationToken()

            const formattedSchedules =
              createScheduleStrings(schedules)

            console.log(
              "Horaires Grooming envoyés :",
              formattedSchedules
            )

          const cleanCollaborators =
            collaborators.map(
              (collaborator) => ({
                name:
                  collaborator.name.trim(),

                disponibilities:
                  collaborator.disponibilities
              })
            )

          const formattedCollaborators =
            cleanCollaborators.map(
              (collaborator) =>
                collaborator.name
            )

          const formattedCollaboratorsDispos =
            cleanCollaborators.map(
              (collaborator) =>
                createDisponibilitiesString(
                  collaborator
                    .disponibilities
                )
            )

            const formattedServices:
              Service[] =
              services.map(
                service => ({
                  id:
                    service.id ||
                    generateID(),

                  groomingID: "",

                  name:
                    service.name.trim(),

                  description:
                    service.description.trim(),

                  price:
                    Number(
                      service.price.replace(
                        ",",
                        "."
                      )
                    ),

                  duration:
                    Number(
                      service.duration
                    ),

                  devise:
                    service.devise.trim() ||
                    "€",

                  bookingMode:
                    service.bookingMode,

                  requiredInformations:
                    service.requiredInformations,

                  customQuestions:
                    service.customQuestions
                      .map(question =>
                        question.trim()
                      )
                      .filter(Boolean)
                })
              )
          const payload = {
            name:
              name.trim(),

            pseudo:
              pseudo.trim(),

            password,

            adress:
              adress.trim(),

            city:
              city.trim(),

            country:
              country.trim(),

            phoneNumber:
              phoneNumber.trim(),

            infos:
              infos.trim(),

            language:
              selectedLanguage,

            collaborators:
              formattedCollaborators,

            collaboratorsDispos:
              formattedCollaboratorsDispos,

            schedules: formattedSchedules,

            services:
              formattedServices,

            feedbacks: [],

            userIDs: [],
            notifs: [],
            blockedUserIDs: [],

            blocked: 0,
            package: 0,
            share: 0,

            packageStart: "",
            packageEnd: "",

            lastConnection:
              new Date()
                .toISOString(),

            device: "Web",

            token: "",

            webtoken,

            paypalID: "",

            devise:
              formattedServices[0]
                ?.devise ?? "€",
              
              autoRenew: 0,
              stripeCustomerID: "",
              stripeSubscriptionID: "",
              stripeAccountID: "",
          }

          const formData =
            new FormData()

          formData.append(
            "data",
            JSON.stringify(
              payload
            )
          )

          photos.forEach(
            (photo) => {
              formData.append(
                "photos",
                photo,
                photo.name
              )
            }
          )

          const response =
            await fetch(
              `${API_URL}/api/professionals/grooming-users`,
              {
                method: "POST",

                body:
                  formData
              }
            )

          const contentType =
            response.headers.get(
              "content-type"
            )

          const result =
            contentType?.includes(
              "application/json"
            )
              ? await response.json()
              : {
                  error:
                    await response.text()
                }

          if (!response.ok) {
            throw new Error(
              result.error ||
              result.message ||
              translate(
                language,
                "Impossible de créer le compte."
              )
            )
          }

          const groomingID =
            String(
              result.id ??
              result.record
                ?.recordName ??
              ""
            )

          if (!groomingID) {
            throw new Error(
              translate(
                language,
                "Le compte a été créé mais son identifiant est introuvable."
              )
            )
          }

          const cloudKitPhotos =
            result.grooming
              ?.photos ??
            result.record
              ?.fields
              ?.photos
              ?.value ??
            []

          const createdUser:
            GroomingUser = {
              ...payload,

              id:
                groomingID,

              photos:
                cloudKitPhotos,

              services:
                formattedServices.map(
                  (service) => ({
                    ...service,

                    groomingID
                  })
                )
            }

          login({
            accountType:
              "grooming",

            user:
              createdUser
          })

          router.replace("/")
        } catch (submitError) {
          console.error(
            "Erreur création GroomingUser :",
            submitError
          )

          setError(
            submitError instanceof Error
              ? submitError.message
              : translate(
                  language,
                  "Une erreur est survenue pendant la création du compte."
                )
          )
        } finally {
          setIsSubmitting(false)
        }
      }

  return (
    <main className="createAccountPage">
      <div className="createAccountHeader">
        <Link
          href="/login"
          className="backButton"
          aria-label={translate(
            language,
            "Retour"
          )}
        >
          ←
        </Link>

        <div>
          <h1>
            {translate(
              language,
              "Créer un compte toiletteur"
            )}
          </h1>

          <p>
            {translate(
              language,
              "Présentez votre salon et commencez à recevoir des réservations."
            )}
          </p>
        </div>
      </div>

      <form
        className="createAccountForm"
        onSubmit={handleSubmit}
      >
        {error && (
          <p
            className="createAccountError"
            role="alert"
          >
            {error}
          </p>
        )}

        <section className="createAccountSection">
          <div className="createAccountSectionHeader">
            <h2>
              {translate(
                language,
                "Photos"
              )}
            </h2>

            <p>
              {translate(
                language,
                "Ajoutez des photos de votre salon."
              )}
            </p>
          </div>

          <label className="photoUploadButton">
            <span>
              {translate(
                language,
                "Ajouter des photos"
              )}
            </span>

            <small>
              JPG, PNG ou WEBP,
              5 Mo maximum
            </small>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={
                handlePhotosChange
              }
            />
          </label>

          {photos.length > 0 && (
            <div className="photoPreviewGrid">
              {photos.map(
                (photo, index) => (
                  <div
                    className="photoPreview"
                    key={`${photo.name}-${photo.lastModified}-${index}`}
                  >
                   <img
                     src={photoPreviews[index]}
                     alt={`${translate(
                       language,
                       "Photo du salon"
                     )} ${index + 1}`}
                   />

                    <button
                      type="button"
                      onClick={() =>
                        removePhoto(index)
                      }
                      aria-label={translate(
                        language,
                        "Supprimer la photo"
                      )}
                    >
                      ×
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        <section className="createAccountSection">
          <div className="createAccountSectionHeader">
            <h2>
              {translate(
                language,
                "Informations principales"
              )}
            </h2>
          </div>

          <div className="createAccountFieldsGrid">
            <label>
              <span>
                {translate(
                  language,
                  "Nom du salon"
                )}
              </span>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                autoComplete="organization"
                required
              />
            </label>

            <label>
              <span>
                {translate(
                  language,
                  "Pseudo"
                )}
              </span>

              <input
                type="text"
                value={pseudo}
                onChange={(event) =>
                  setPseudo(
                    event.target.value
                  )
                }
                autoComplete="username"
                required
              />
            </label>

            <label className="fullWidthField">
              <span>
                {translate(
                  language,
                  "Mot de passe"
                )}
              </span>

              <div className="passwordField">
                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  minLength={8}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (currentValue) =>
                        !currentValue
                    )
                  }
                >
                  {translate(
                    language,
                    showPassword
                      ? "Masquer"
                      : "Afficher"
                  )}
                </button>
              </div>

              <small>
                {translate(
                  language,
                  "8 caractères minimum"
                )}
              </small>
            </label>
          </div>
        </section>

        <section className="createAccountSection">
          <div className="createAccountSectionHeader">
            <h2>
              {translate(
                language,
                "Localisation"
              )}
            </h2>
          </div>

          <div className="createAccountFieldsGrid">
            <label className="fullWidthField">
              <span>
                {translate(
                  language,
                  "Adresse"
                )}
              </span>

              <input
                type="text"
                value={adress}
                onChange={(event) =>
                  setAdress(
                    event.target.value
                  )
                }
                autoComplete="street-address"
                required
              />
            </label>

            <label>
              <span>
                {translate(
                  language,
                  "Ville"
                )}
              </span>

              <input
                type="text"
                value={city}
                onChange={(event) =>
                  setCity(
                    event.target.value
                  )
                }
                autoComplete="address-level2"
                required
              />
            </label>

            <label>
              <span>
                {translate(
                  language,
                  "Pays"
                )}
              </span>

              <input
                type="text"
                value={country}
                onChange={(event) =>
                  setCountry(
                    event.target.value
                  )
                }
                autoComplete="country-name"
                required
              />
            </label>
          </div>
        </section>

        <section className="createAccountSection">
          <div className="createAccountSectionHeader">
            <h2>
              {translate(
                language,
                "Contact"
              )}
            </h2>
          </div>

          <div className="createAccountFieldsGrid">
            <label>
              <span>
                {translate(
                  language,
                  "Numéro de téléphone"
                )}
              </span>

              <input
                type="tel"
                value={phoneNumber}
                onChange={(event) =>
                  setPhoneNumber(
                    event.target.value
                  )
                }
                autoComplete="tel"
                required
              />
            </label>

            <label>
              <span>
                {translate(
                  language,
                  "Langue"
                )}
              </span>

              <select
                value={
                  selectedLanguage
                }
                onChange={(event) =>
                  setSelectedLanguage(
                    event.target.value as Language
                  )
                }
              >
                {availableLanguages.map(
                  (
                    languageItem
                  ) => (
                    <option
                      key={
                        languageItem.code
                      }
                      value={
                        languageItem.code
                      }
                    >
                      {
                        languageItem.label
                      }
                    </option>
                  )
                )}
              </select>
            </label>
          </div>
        </section>

        <section className="createAccountSection">
          <div className="createAccountSectionHeader">
            <h2>
              {translate(
                language,
                "Présentation"
              )}
            </h2>

            <p>
              {translate(
                language,
                "Présentez votre salon, votre expérience et vos services."
              )}
            </p>
          </div>

          <label>
            <span>
              {translate(
                language,
                "À propos"
              )}
            </span>

            <textarea
              value={infos}
              onChange={(event) =>
                setInfos(
                  event.target.value
                )
              }
              rows={6}
              placeholder={translate(
                language,
                "Présentez votre activité..."
              )}
            />
          </label>
        </section>

        <section className="createAccountSection">
          <div className="createAccountSectionHeader createAccountSectionHeaderRow">
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
                  "Ajoutez les prestations proposées par votre salon."
                )}
              </p>
            </div>

            <button
              type="button"
              className="secondaryButton"
              onClick={addService}
            >
              +{" "}
              {translate(
                language,
                "Ajouter une prestation"
              )}
            </button>
          </div>

          {services.length === 0 ? (
            <p className="emptyServices">
              {translate(
                language,
                "Aucune prestation ajoutée."
              )}
            </p>
          ) : (
            <div className="servicesFormList">
              {services.map(
                (
                  service,
                  serviceIndex
                ) => (
                  <div
                    className="serviceFormCard"
                    key={service.id}
                  >
                    <div className="serviceFormHeader">
                      <h3>
                        {translate(
                          language,
                          "Prestation"
                        )}{" "}
                        {serviceIndex + 1}
                      </h3>

                      <button
                        type="button"
                        className="removeServiceButton"
                        onClick={() =>
                          removeService(
                            serviceIndex
                          )
                        }
                        aria-label={translate(
                          language,
                          "Supprimer la prestation"
                        )}
                      >
                        ×
                      </button>
                    </div>

                      <div className="createAccountFieldsGrid">
                        <label>
                          <span>
                            {translate(
                              language,
                              "Nom"
                            )}
                          </span>

                          <input
                            type="text"
                            value={service.name}
                            onChange={event =>
                              updateService(
                                serviceIndex,
                                "name",
                                event.target.value
                              )
                            }
                            required
                          />
                        </label>

                        <label>
                          <span>
                            {translate(
                              language,
                              "Devise"
                            )}
                          </span>

                          <select
                            value={service.devise}
                            onChange={event =>
                              updateService(
                                serviceIndex,
                                "devise",
                                event.target.value
                              )
                            }
                          >
                            {availableCurrencies.map(
                              currency => (
                                <option
                                  key={currency.code}
                                  value={currency.code}
                                >
                                  {currency.label}
                                </option>
                              )
                            )}
                          </select>
                        </label>

                        <label className="fullWidthField">
                          <span>
                            {translate(
                              language,
                              "Description"
                            )}
                          </span>

                          <textarea
                            value={service.description}
                            onChange={event =>
                              updateService(
                                serviceIndex,
                                "description",
                                event.target.value
                              )
                            }
                            rows={3}
                            required
                          />
                        </label>

                        <label>
                          <span>
                            {translate(
                              language,
                              "Prix minimum"
                            )}
                          </span>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={service.price}
                            onChange={event =>
                              updateService(
                                serviceIndex,
                                "price",
                                event.target.value
                              )
                            }
                            required
                          />
                        </label>

                        <label>
                          <span>
                            {translate(
                              language,
                              "Durée minimum (minutes)"
                            )}
                          </span>

                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={service.duration}
                            onChange={event =>
                              updateService(
                                serviceIndex,
                                "duration",
                                event.target.value
                              )
                            }
                            required
                          />
                        </label>

                        <label className="fullWidthField">
                          <span>
                            {translate(
                              language,
                              "Mode de réservation"
                            )}
                          </span>

                          <select
                            value={service.bookingMode}
                            onChange={event =>
                              updateService(
                                serviceIndex,
                                "bookingMode",
                                event.target.value
                              )
                            }
                          >
                            <option value="direct">
                              {translate(
                                language,
                                "Réservation directe"
                              )}
                            </option>

                            <option value="approvalRequired">
                              {translate(
                                language,
                                "Demande de rendez-vous"
                              )}
                            </option>
                          </select>
                        </label>

                        <div className="fullWidthField serviceOptionsSection">
                          <span className="serviceSectionLabel">
                            {translate(
                              language,
                              "Informations demandées avant le rendez-vous"
                            )}
                          </span>

                          <div className="serviceCheckboxGrid">
                            <label className="serviceCheckboxOption">
                              <input
                                type="checkbox"
                                checked={
                                  service.requiredInformations.includes(
                                    "behavior"
                                  )
                                }
                                onChange={() =>
                                  toggleRequiredInformation(
                                    serviceIndex,
                                    "behavior"
                                  )
                                }
                              />

                              <span>
                                {translate(
                                  language,
                                  "Comportement"
                                )}
                              </span>
                            </label>

                            <label className="serviceCheckboxOption">
                              <input
                                type="checkbox"
                                checked={
                                  service.requiredInformations.includes(
                                    "coatCondition"
                                  )
                                }
                                onChange={() =>
                                  toggleRequiredInformation(
                                    serviceIndex,
                                    "coatCondition"
                                  )
                                }
                              />

                              <span>
                                {translate(
                                  language,
                                  "État du pelage"
                                )}
                              </span>
                            </label>

                            <label className="serviceCheckboxOption">
                              <input
                                type="checkbox"
                                checked={
                                  service.requiredInformations.includes(
                                    "weight"
                                  )
                                }
                                onChange={() =>
                                  toggleRequiredInformation(
                                    serviceIndex,
                                    "weight"
                                  )
                                }
                              />

                              <span>
                                {translate(
                                  language,
                                  "Poids"
                                )}
                              </span>
                            </label>

                            <label className="serviceCheckboxOption">
                              <input
                                type="checkbox"
                                checked={
                                  service.requiredInformations.includes(
                                    "notes"
                                  )
                                }
                                onChange={() =>
                                  toggleRequiredInformation(
                                    serviceIndex,
                                    "notes"
                                  )
                                }
                              />

                              <span>
                                {translate(
                                  language,
                                  "Informations complémentaires"
                                )}
                              </span>
                            </label>
                          </div>
                        </div>

                        <div className="fullWidthField serviceQuestionsSection">
                          <span className="serviceSectionLabel">
                            {translate(
                              language,
                              "Questions personnalisées"
                            )}
                          </span>

                          {service.customQuestions.length > 0 && (
                            <div className="serviceQuestionsList">
                              {service.customQuestions.map(
                                (
                                  question,
                                  questionIndex
                                ) => (
                                  <div
                                    className="serviceQuestionRow"
                                    key={questionIndex}
                                  >
                                    <input
                                      type="text"
                                      value={question}
                                      placeholder={translate(
                                        language,
                                        "Votre question..."
                                      )}
                                      onChange={event =>
                                        updateCustomQuestion(
                                          serviceIndex,
                                          questionIndex,
                                          event.target.value
                                        )
                                      }
                                    />

                                    <button
                                      type="button"
                                      className="serviceQuestionRemove"
                                      onClick={() =>
                                        removeCustomQuestion(
                                          serviceIndex,
                                          questionIndex
                                        )
                                      }
                                      aria-label={translate(
                                        language,
                                        "Supprimer la question"
                                      )}
                                    >
                                      ×
                                    </button>
                                  </div>
                                )
                              )}
                            </div>
                          )}

                          <button
                            type="button"
                            className="serviceAddQuestionButton"
                            onClick={() =>
                              addCustomQuestion(
                                serviceIndex
                              )
                            }
                          >
                            <span>+</span>

                            {translate(
                              language,
                              "Ajouter une question"
                            )}
                          </button>
                        </div>
                      </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        <section className="createAccountSection">
          <div className="createAccountSectionHeader">
            <h2>
              {translate(
                language,
                "Horaires"
              )}
            </h2>

            <p>
              {translate(
                language,
                "Indiquez les horaires d'ouverture habituels du salon."
              )}
            </p>
          </div>

          <div className="schedulesList">
            {schedules.map(
              (schedule) => (
                <div
                  className="scheduleRow"
                  key={schedule.day}
                >
                  <label className="scheduleDay">
                    <input
                      type="checkbox"
                      checked={
                        schedule.isOpen
                      }
                      onChange={(
                        event
                      ) =>
                        updateScheduleOpen(
                          schedule.day,
                          event.target
                            .checked
                        )
                      }
                    />

                    <span>
                      {translate(
                        language,
                        schedule.day
                      )}
                    </span>
                  </label>

                  {schedule.isOpen ? (
                    <div className="scheduleHours">
                      <input
                        type="time"
                        value={
                          schedule.startTime
                        }
                        onChange={(
                          event
                        ) =>
                          updateScheduleTime(
                            schedule.day,
                            "startTime",
                            event.target
                              .value
                          )
                        }
                      />

                      <span>—</span>

                      <input
                        type="time"
                        value={
                          schedule.endTime
                        }
                        onChange={(
                          event
                        ) =>
                          updateScheduleTime(
                            schedule.day,
                            "endTime",
                            event.target
                              .value
                          )
                        }
                      />
                    </div>
                  ) : (
                    <span className="scheduleClosed">
                      {translate(
                        language,
                        "Fermé"
                      )}
                    </span>
                  )}
                </div>
              )
            )}
          </div>

          <small className="schedulePreview">
            {schedulePreview}
          </small>
        </section>

        <section className="createAccountSection">
          <div className="createAccountSectionHeader createAccountSectionHeaderRow">
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
                  "Ajoutez les membres de votre équipe et leurs jours de disponibilité."
                )}
              </p>
            </div>

            <button
              type="button"
              className="secondaryButton"
              onClick={
                addCollaborator
              }
            >
              +{" "}
              {translate(
                language,
                "Ajouter un collaborateur"
              )}
            </button>
          </div>

          {collaborators.length ===
          0 ? (
            <p className="emptyCollaborators">
              {translate(
                language,
                "Aucun collaborateur ajouté."
              )}
            </p>
          ) : (
            <div className="collaboratorsList">
              {collaborators.map(
                (
                  collaborator,
                  collaboratorIndex
                ) => (
                  <div
                    className="collaboratorCard"
                    key={
                      collaboratorIndex
                    }
                  >
                    <div className="collaboratorCardHeader">
                      <label>
                        <span>
                          {translate(
                            language,
                            "Nom du collaborateur"
                          )}
                        </span>

                        <input
                          type="text"
                          value={
                            collaborator.name
                          }
                          onChange={(
                            event
                          ) =>
                            updateCollaboratorName(
                              collaboratorIndex,
                              event
                                .target
                                .value
                            )
                          }
                          required
                        />
                      </label>

                      <button
                        type="button"
                        className="removeCollaboratorButton"
                        onClick={() =>
                          removeCollaborator(
                            collaboratorIndex
                          )
                        }
                        aria-label={translate(
                          language,
                          "Supprimer le collaborateur"
                        )}
                      >
                        ×
                      </button>
                    </div>

                    <div className="collaboratorDisponibilities">
                      <span className="collaboratorDisponibilitiesTitle">
                        {translate(
                          language,
                          "Disponibilités"
                        )}
                      </span>

                      <div className="collaboratorDays">
                        {weekDays.map(
                          (day) => (
                            <label
                              className="collaboratorDay"
                              key={
                                day.id
                              }
                            >
                              <input
                                type="checkbox"
                                checked={
                                  collaborator
                                    .disponibilities[
                                    day.id
                                  ] ??
                                  false
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateCollaboratorDisponibility(
                                    collaboratorIndex,
                                    day.id,
                                    event
                                      .target
                                      .checked
                                  )
                                }
                              />

                              <span>
                                {translate(
                                  language,
                                  day.label
                                )}
                              </span>
                            </label>
                          )
                        )}
                      </div>

                      <small className="schedulePreview">
                        {createDisponibilitiesString(
                          collaborator
                            .disponibilities
                        )}
                      </small>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        <button
          type="submit"
          className="createAccountSubmitButton"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? translate(
                language,
                "Création..."
              )
            : translate(
                language,
                "Créer mon compte"
              )}
        </button>
      </form>
    </main>
  )
}
