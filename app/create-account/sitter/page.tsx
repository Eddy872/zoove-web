"use client"

import {
  ChangeEvent,
  FormEvent,
  useMemo,
  useState
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

import type { SitterUser } from "@/types/sitterUser"

import "./SitterCreateAccount.css"

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

type ScheduleItem = {
  day: string
  isOpen: boolean
  startTime: string
  endTime: string
}

type ServiceItem = {
  id: string
  label: string
  icon: string
}

type SpeciesItem = {
  id: string
  label: string
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

const availableServices: ServiceItem[] = [
  {
    id: "Garde",
    label: "Garde",
    icon: "🏠"
  },
  {
    id: "Visites",
    label: "Visites",
    icon: "👁️"
  },
  {
    id: "Promenades",
    label: "Promenades",
    icon: "🚶"
  },
  {
    id: "Hébergement",
    label: "Hébergement",
    icon: "🛏️"
  },
  {
    id: "Transport",
    label: "Transport",
    icon: "🚗"
  }
]

const availableSpecies: SpeciesItem[] = [
  {
    id: "Dog",
    label: "Chien"
  },
  {
    id: "Cat",
    label: "Chat"
  },
  {
    id: "Rabbit",
    label: "Lapin"
  },
  {
    id: "Rodent",
    label: "Rongeur"
  },
  {
    id: "Bird",
    label: "Oiseau"
  },
  {
    id: "Reptile",
    label: "Reptile"
  },
  {
    id: "Fish",
    label: "Poisson"
  },
  {
    id: "Horse",
    label: "Cheval"
  },
  {
    id: "Other",
    label: "Autre"
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
    code: "EUR",
    label: "EUR (€)"
  },
  {
    code: "USD",
    label: "USD ($)"
  },
  {
    code: "GBP",
    label: "GBP (£)"
  },
  {
    code: "CAD",
    label: "CAD ($)"
  },
  {
    code: "AUD",
    label: "AUD ($)"
  },
  {
    code: "CHF",
    label: "CHF"
  }
]

function createInitialDisponibilities():
  ScheduleItem[] {
  return weekDays.map(
    (day, index) => ({
      day,
      isOpen: index === 0,
      startTime: "08:00",
      endTime: "18:00"
    })
  )
}

function createDisponibilitiesString(
  schedules: ScheduleItem[]
): string {
  return weekDays
    .map((day) => {
      const schedule =
        schedules.find(
          (item) =>
            item.day === day
        )

      if (
        !schedule ||
        !schedule.isOpen
      ) {
        return `${day}=Fermé`
      }

      return (
        `${day}=` +
        `${schedule.startTime}-` +
        `${schedule.endTime}`
      )
    })
    .join(",")
}

export default function CreateSitterAccountPage() {
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

  const [city, setCity] =
    useState("")

  const [country, setCountry] =
    useState("")

  const [infos, setInfos] =
    useState("")

  const [
    phoneNumber,
    setPhoneNumber
  ] = useState("")

  const [paypalID, setPaypalID] =
    useState("")

  const [tarif, setTarif] =
    useState("")

  const [devise, setDevise] =
    useState("EUR")

  const [
    selectedLanguage,
    setSelectedLanguage
  ] = useState(
    language || "fr"
  )

    const [photo, setPhoto] =
      useState<File | null>(null)

    const [
      photoPreview,
      setPhotoPreview
    ] = useState("")

  const [
    selectedServices,
    setSelectedServices
  ] = useState<string[]>([])

  const [
    speciesAccepted,
    setSpeciesAccepted
  ] = useState<string[]>([])

  const [
    disponibilities,
    setDisponibilities
  ] = useState<ScheduleItem[]>(
    createInitialDisponibilities
  )

  const [error, setError] =
    useState("")

  const [
    isSubmitting,
    setIsSubmitting
  ] = useState(false)

  const disponibilitiesPreview =
    useMemo(
      () =>
        createDisponibilitiesString(
          disponibilities
        ),
      [disponibilities]
    )

    const handlePhotoChange = (
      event:
        ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target.files?.[0]

      if (!file) {
        return
      }

      if (
        !acceptedPhotoTypes.includes(
          file.type
        )
      ) {
        setError(
          translate(
            language,
            "Le fichier sélectionné doit être une image."
          )
        )

        event.target.value = ""
        return
      }

      if (
        file.size >
        MAX_PHOTO_SIZE
      ) {
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

      if (photoPreview) {
        URL.revokeObjectURL(
          photoPreview
        )
      }

      setPhoto(file)

      setPhotoPreview(
        URL.createObjectURL(file)
      )

      event.target.value = ""
    }

  const toggleService = (
    serviceID: string
  ) => {
    setSelectedServices(
      (currentServices) =>
        currentServices.includes(
          serviceID
        )
          ? currentServices.filter(
              (service) =>
                service !== serviceID
            )
          : [
              ...currentServices,
              serviceID
            ]
    )
  }

  const toggleSpecies = (
    speciesID: string
  ) => {
    setSpeciesAccepted(
      (currentSpecies) =>
        currentSpecies.includes(
          speciesID
        )
          ? currentSpecies.filter(
              (species) =>
                species !== speciesID
            )
          : [
              ...currentSpecies,
              speciesID
            ]
    )
  }

  const updateDisponibilityOpen = (
    day: string,
    isOpen: boolean
  ) => {
    setDisponibilities(
      (currentDisponibilities) =>
        currentDisponibilities.map(
          (disponibility) =>
            disponibility.day === day
              ? {
                  ...disponibility,
                  isOpen
                }
              : disponibility
        )
    )
  }

  const updateDisponibilityTime = (
    day: string,
    field:
      | "startTime"
      | "endTime",
    value: string
  ) => {
    setDisponibilities(
      (currentDisponibilities) =>
        currentDisponibilities.map(
          (disponibility) =>
            disponibility.day === day
              ? {
                  ...disponibility,
                  [field]: value
                }
              : disponibility
        )
    )
  }

  const validateForm =
    (): boolean => {
        if (!photo) {
          setError(
            translate(
              language,
              "Ajoutez une photo de profil."
            )
          )

          return false
        }

      if (!name.trim()) {
        setError(
          translate(
            language,
            "Indiquez votre nom."
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

      if (!paypalID.trim()) {
        setError(
          translate(
            language,
            "Indiquez votre adresse PayPal."
          )
        )

        return false
      }

      const numericTarif =
        Number(tarif)

      if (
        !Number.isInteger(
          numericTarif
        ) ||
        numericTarif <= 0
      ) {
        setError(
          translate(
            language,
            "Indiquez un tarif entier valide."
          )
        )

        return false
      }

      if (
        selectedServices.length ===
        0
      ) {
        setError(
          translate(
            language,
            "Sélectionnez au moins un service."
          )
        )

        return false
      }

      if (
        speciesAccepted.length ===
        0
      ) {
        setError(
          translate(
            language,
            "Sélectionnez au moins une espèce acceptée."
          )
        )

        return false
      }

      const invalidDisponibility =
        disponibilities.find(
          (disponibility) =>
            disponibility.isOpen &&
            (
              !disponibility.startTime ||
              !disponibility.endTime ||
              disponibility.startTime >=
                disponibility.endTime
            )
        )

      if (invalidDisponibility) {
        setError(
          translate(
            language,
            "Vérifiez les disponibilités renseignées."
          )
        )

        return false
      }

      setError("")
      return true
    }

    async function handleSubmit(
      event:
        FormEvent<HTMLFormElement>
    ) {
      event.preventDefault()

      if (isSubmitting) {
        return
      }

      setError("")

      if (!photo) {
        setError(
          translate(
            language,
            "Ajoutez une photo de profil."
          )
        )

        return
      }

      if (!name.trim()) {
        setError(
          translate(
            language,
            "Indiquez votre nom."
          )
        )

        return
      }

      if (!pseudo.trim()) {
        setError(
          translate(
            language,
            "Indiquez un pseudo."
          )
        )

        return
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

        return
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

        return
      }

      if (!phoneNumber.trim()) {
        setError(
          translate(
            language,
            "Le numéro de téléphone est obligatoire."
          )
        )

        return
      }

      if (!paypalID.trim()) {
        setError(
          translate(
            language,
            "Indiquez votre adresse PayPal."
          )
        )

        return
      }

      const normalizedTarif =
        Number(tarif)

      if (
        !Number.isInteger(
          normalizedTarif
        ) ||
        normalizedTarif <= 0
      ) {
        setError(
          translate(
            language,
            "Indiquez un tarif entier valide."
          )
        )

        return
      }

      if (
        selectedServices.length ===
        0
      ) {
        setError(
          translate(
            language,
            "Sélectionnez au moins un service."
          )
        )

        return
      }

      if (
        speciesAccepted.length ===
        0
      ) {
        setError(
          translate(
            language,
            "Sélectionnez au moins une espèce acceptée."
          )
        )

        return
      }

      const invalidDisponibility =
        disponibilities.find(
          (disponibility) =>
            disponibility.isOpen &&
            (
              !disponibility.startTime ||
              !disponibility.endTime ||
              disponibility.startTime >=
                disponibility.endTime
            )
        )

      if (invalidDisponibility) {
        setError(
          translate(
            language,
            "Vérifiez les disponibilités renseignées."
          )
        )

        return
      }

      setIsSubmitting(true)

      try {
        const webtoken =
          await getWebNotificationToken()

        const formattedServices =
          selectedServices
            .map((service) =>
              service.trim()
            )
            .filter(Boolean)

        const formattedSpeciesAccepted =
          speciesAccepted
            .map((species) =>
              species.trim()
            )
            .filter(Boolean)

          const formattedDisponibilities = weekDays.map((day) => {
            const schedule = disponibilities.find(
              (item) => item.day === day
            )

            if (!schedule || !schedule.isOpen) {
              return `${day}=Fermé`
            }

            return `${day}=${schedule.startTime}-${schedule.endTime}`
          })

        const sitter = {
          name:
            name.trim(),

          pseudo:
            pseudo.trim(),

          password,

          city:
            city.trim(),

          country:
            country.trim(),

          phoneNumber:
            phoneNumber.trim(),

          paypalID:
            paypalID.trim(),
            
            stripeAccountID: "",

          infos:
            infos.trim(),

          language:
            selectedLanguage,

          tarif:
            normalizedTarif,

          devise:
            devise.trim() ||
            "EUR",

          services:
            formattedServices,

          disponibilities:
            formattedDisponibilities,

          speciesAccepted:
            formattedSpeciesAccepted,

          skill: 0,
          fiability: 0,
          engagement: 0,
          affinity: 0,

          buyers: [],
          blockedUserIds: [],
          notifs: [],
          notifMatchId: [],

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
          webtoken
        }

        const formData =
          new FormData()

        formData.append(
          "data",
          JSON.stringify(sitter)
        )

        formData.append(
          "photo",
          photo,
          photo.name
        )

        const response =
          await fetch(
            `${API_URL}/api/professionals/sitter-users`,
            {
              method: "POST",
              body: formData
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

        const createdSitter =
          result.sitter

        if (!createdSitter?.id) {
          throw new Error(
            translate(
              language,
              "Le profil créé ne contient pas d’identifiant."
            )
          )
        }

        const cloudKitPhoto =
          createdSitter
            ?.photo
            ?.downloadURL ??
          createdSitter
            ?.photo
            ?.value
            ?.downloadURL ??
          ""

        const authenticatedSitter:
          SitterUser = {
            ...sitter,
            ...createdSitter,

            id:
              createdSitter.id,

            photo:
              cloudKitPhoto ||
              photoPreview ||
              "/images/demo2.jpg"
          }

        login({
          accountType:
            "sitter",

          user:
            authenticatedSitter
        })

        router.replace("/")
      } catch (submitError) {
        console.error(
          "Erreur création SitterUser :",
          submitError
        )

        setError(
          submitError instanceof Error
            ? submitError.message
            : translate(
                language,
                "Impossible de contacter le serveur."
              )
        )

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        })
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
              "Créer un compte pet sitter"
            )}
          </h1>

          <p>
            {translate(
              language,
              "Présentez vos services et commencez à recevoir des réservations."
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
                "Photo"
              )}
            </h2>

            <p>
              {translate(
                language,
                "Ajoutez une photo pour présenter votre profil."
              )}
            </p>
          </div>

          {!photo ? (
            <label className="photoUploadButton">
              <span>
                {translate(
                  language,
                  "Ajouter une photo"
                )}
              </span>

              <small>
                JPG, PNG ou WEBP,
                5 Mo maximum
              </small>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={
                  handlePhotoChange
                }
              />
            </label>
          ) : (
            <div className="singlePhotoPreview">
              <img
                src={photoPreview}
                alt={translate(
                  language,
                  "Photo du pet sitter"
                )}
              />

              <button
                type="button"
                onClick={() =>
                  setPhoto(null)
                }
              >
                {translate(
                  language,
                  "Supprimer la photo"
                )}
              </button>
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
                  "Nom"
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
                autoComplete="name"
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
                "Contact et paiement"
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
                  "Adresse PayPal"
                )}
              </span>

              <input
                type="email"
                value={paypalID}
                onChange={(event) =>
                  setPaypalID(
                    event.target.value
                  )
                }
                autoComplete="email"
                required
              />
            </label>

            <label>
              <span>
                {translate(
                  language,
                  "Tarif horaire"
                )}
              </span>

              <input
                type="number"
                min="0"
                step="1"
                value={tarif}
                onChange={(event) =>
                  setTarif(event.target.value)
                }
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
                value={devise}
                onChange={(event) =>
                  setDevise(
                    event.target.value
                  )
                }
              >
                {availableCurrencies.map(
                  (currency) => (
                    <option
                      key={
                        currency.code
                      }
                      value={
                        currency.code
                      }
                    >
                      {
                        currency.label
                      }
                    </option>
                  )
                )}
              </select>
            </label>

            <label className="fullWidthField">
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
                  (languageItem) => (
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
                "Présentez votre expérience et votre façon de vous occuper des animaux."
              )}
            </p>
          </div>

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
        </section>

        <section className="createAccountSection">
          <div className="createAccountSectionHeader">
            <h2>
              {translate(
                language,
                "Services"
              )}
            </h2>

            <p>
              {translate(
                language,
                "Sélectionnez les services que vous proposez."
              )}
            </p>
          </div>

          <div className="sitterChoicesGrid">
            {availableServices.map(
              (service) => (
                <label
                  className="sitterChoice"
                  key={service.id}
                >
                  <input
                    type="checkbox"
                    checked={
                      selectedServices.includes(
                        service.id
                      )
                    }
                    onChange={() =>
                      toggleService(
                        service.id
                      )
                    }
                  />

                  <span className="sitterChoiceIcon">
                    {service.icon}
                  </span>

                  <span>
                    {translate(
                      language,
                      service.label
                    )}
                  </span>
                </label>
              )
            )}
          </div>
        </section>

        <section className="createAccountSection">
          <div className="createAccountSectionHeader">
            <h2>
              {translate(
                language,
                "Espèces acceptées"
              )}
            </h2>

            <p>
              {translate(
                language,
                "Sélectionnez les espèces que vous acceptez."
              )}
            </p>
          </div>

          <div className="sitterChoicesGrid">
            {availableSpecies.map(
              (species) => (
                <label
                  className="sitterChoice"
                  key={species.id}
                >
                  <input
                    type="checkbox"
                    checked={
                      speciesAccepted.includes(
                        species.id
                      )
                    }
                    onChange={() =>
                      toggleSpecies(
                        species.id
                      )
                    }
                  />

                  <span>
                    {translate(
                      language,
                      species.label
                    )}
                  </span>
                </label>
              )
            )}
          </div>
        </section>

        <section className="createAccountSection">
          <div className="createAccountSectionHeader">
            <h2>
              {translate(
                language,
                "Disponibilités"
              )}
            </h2>

            <p>
              {translate(
                language,
                "Indiquez vos horaires de disponibilité habituels."
              )}
            </p>
          </div>

          <div className="schedulesList">
            {disponibilities.map(
              (disponibility) => (
                <div
                  className="scheduleRow"
                  key={
                    disponibility.day
                  }
                >
                  <label className="scheduleDay">
                    <input
                      type="checkbox"
                      checked={
                        disponibility.isOpen
                      }
                      onChange={(
                        event
                      ) =>
                        updateDisponibilityOpen(
                          disponibility.day,
                          event.target
                            .checked
                        )
                      }
                    />

                    <span>
                      {translate(
                        language,
                        disponibility.day
                      )}
                    </span>
                  </label>

                  {disponibility.isOpen ? (
                    <div className="scheduleHours">
                      <input
                        type="time"
                        value={
                          disponibility.startTime
                        }
                        onChange={(
                          event
                        ) =>
                          updateDisponibilityTime(
                            disponibility.day,
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
                          disponibility.endTime
                        }
                        onChange={(
                          event
                        ) =>
                          updateDisponibilityTime(
                            disponibility.day,
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
            {disponibilitiesPreview}
          </small>
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
