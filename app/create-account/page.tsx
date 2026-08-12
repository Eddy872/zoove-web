"use client"

import {
  ChangeEvent,
  FormEvent,
  useState
} from "react"

import {
  useRouter
} from "next/navigation"

import {
  translate
} from "@/translations/translations"

import {
  useAuth
} from "@/context/AuthContext"
import type { Animal } from "@/types/animal"

import {
  getWebNotificationToken
} from "@/services/firebaseNotifications"

import type { Language } from "@/context/LanguageContext"

type LanguageOption = {
  code: Language
  name: string
}

const languages: LanguageOption[] = [
  { code: "fr", name: "Français" },
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "it", name: "Italiano" },
  { code: "de", name: "Deutsch" },
  { code: "pt", name: "Português" },
  { code: "ar", name: "العربية" }
]

const speciesList = [
  { value: "Dog", label: "Chien" },
  { value: "Cat", label: "Chat" },
  { value: "Rabbit", label: "Lapin" },
  { value: "Horse", label: "Cheval" },
  { value: "Rooster", label: "Coq" },
  { value: "Bird", label: "Oiseau" },
  { value: "Turtle", label: "Tortue" },
  { value: "Snake", label: "Serpent" },
  { value: "Tiger", label: "Tigre" },
  { value: "Fish", label: "Poisson" },
  { value: "Rat", label: "Rat" },
  { value: "Monkey", label: "Singe" },
  { value: "Camel", label: "Chameau" },
  { value: "Frog", label: "Grenouille" }
]

export default function SignupPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [name, setName] =
    useState("")

  const [password, setPassword] =
    useState("")

  const [city, setCity] =
    useState("")

  const [country, setCountry] =
    useState("")

  const [bio, setBio] =
    useState("")

  const [species, setSpecies] =
    useState("")

    const [language, setLanguage] =
      useState<Language>("fr")

  const [photo, setPhoto] =
    useState<File | null>(null)

  const [photoPreview, setPhotoPreview] =
    useState("")

  const [showPassword, setShowPassword] =
    useState(false)

  const [error, setError] =
    useState("")

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  function handlePhotoChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile =
      event.target.files?.[0]

    setError("")

    if (!selectedFile) {
      return
    }

    if (
      !selectedFile.type.startsWith(
        "image/"
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

    const maximumSize =
      5 * 1024 * 1024

    if (
      selectedFile.size >
      maximumSize
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

    setPhoto(selectedFile)

    const previewURL =
      URL.createObjectURL(
        selectedFile
      )

    setPhotoPreview(
      (oldPreview) => {
        if (oldPreview) {
          URL.revokeObjectURL(
            oldPreview
          )
        }

        return previewURL
      }
    )
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
            "Ajoute une photo de ton animal."
          )
        )

        return
      }

      if (!name.trim()) {
        setError(
          translate(
            language,
            "Indique le nom de ton animal."
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

      if (!species) {
        setError(
          translate(
            language,
            "Sélectionne une espèce."
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
            "Indique la ville et le pays."
          )
        )

        return
      }

      setIsSubmitting(true)

      try {
        const webtoken =
          await getWebNotificationToken()

        const animal = {
          name:
            name.trim(),

          password,

          city:
            city.trim(),

          country:
            country.trim(),

          bio:
            bio.trim(),

          species,

          language,

          token: "",

          webtoken,

          likes: [],
          dislikes: [],
          swipeCount: 0,

          notifMatchId: [],

          package: 0,
          packageStart: "",
          packageEnd: "",

          share: 0,
          paypalID: "",
          requestsPerDay: 0,

          dailyQuests: [],
          weeklyQuests: [],
          shareOnTiktok: 0,

          rewards: [],
          badges: [],
          selectedBadge: "",
          pawpoints: 0,

          skins: [],
          selectedSkin: "",
          items: []
        }

        const apiURL =
          process.env
            .NEXT_PUBLIC_API_URL ||
          "http://localhost:3001"

        const formData =
          new FormData()

        formData.append(
          "data",
          JSON.stringify(animal)
        )

        formData.append(
          "photo",
          photo,
          photo.name
        )

        const response =
          await fetch(
            `${apiURL}/api/animals`,
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
            translate(
              language,
              "Impossible de créer le compte."
            )
          )
        }

        const createdAnimal =
          result.animal

        if (!createdAnimal?.id) {
          throw new Error(
            translate(
              language,
              "Le profil créé ne contient pas d’identifiant."
            )
          )
        }

        /*
         * CloudKit retourne un dictionnaire Asset.
         * L’URL affichable se trouve normalement
         * dans downloadURL après sauvegarde.
         */
        const cloudKitPhoto =
          createdAnimal
            ?.photo
            ?.downloadURL ??
          createdAnimal
            ?.photo
            ?.value
            ?.downloadURL ??
          ""

        const authenticatedAnimal:
          Animal = {
            ...animal,
            ...createdAnimal,

            id:
              createdAnimal.id,

            photo:
              cloudKitPhoto ||
              photoPreview ||
              "/images/demo2.jpg",

            speciesAccepted:
              createdAnimal
                .speciesAccepted ??
              [],

            lastConnection:
              createdAnimal
                .lastConnection ??
              ""
          }

        login({
          accountType:
            "animal",

          user:
            authenticatedAnimal
        })

        router.replace("/")
      } catch (submitError) {
        console.error(
          "Erreur création compte :",
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
      } finally {
        setIsSubmitting(false)
      }
    }

  return (
    <>
      <main className="signupPage">
        <div className="signupContainer">
          <header className="pageHeader">
            <button
              type="button"
              className="backButton"
              onClick={() =>
                window.history.back()
              }
              aria-label="Retour"
            >
              ←
            </button>

            <div>
              <h1>
                {translate(
                  language,
                  "Créer un compte"
                )}
              </h1>

              <p>
                {translate(
                  language,
                  "Complète les informations de ton animal."
                )}
              </p>
            </div>
          </header>

          <form onSubmit={handleSubmit}>
            <section className="formSection">
              <h2>
                {translate(
                  language,
                  "Photo"
                )}
              </h2>

              <label
                className="photoUpload"
                htmlFor="animalPhoto"
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Aperçu de l’animal"
                    className="photoPreview"
                  />
                ) : (
                  <div className="photoPlaceholder">
                    <span className="photoIcon">
                      📷
                    </span>

                    <strong>
                      {translate(
                        language,
                        "Ajouter une photo"
                      )}
                    </strong>

                    <small>
                      JPG, PNG ou WEBP,
                      5 Mo maximum
                    </small>
                  </div>
                )}
              </label>

              <input
                id="animalPhoto"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                hidden
              />
            </section>

            <section className="formSection">
              <h2>
                {translate(
                  language,
                  "Informations principales"
                )}
              </h2>

              <div className="formGroup">
                <label htmlFor="animalName">
                  {translate(
                    language,
                    "Nom"
                  )}
                </label>

                <input
                  id="animalName"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder={translate(
                    language,
                    "Nom de l’animal"
                  )}
                  autoComplete="off"
                  required
                />
              </div>

              <div className="formGroup">
                <label htmlFor="animalPassword">
                  {translate(
                    language,
                    "Mot de passe"
                  )}
                </label>

                <div className="passwordContainer">
                  <input
                    id="animalPassword"
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
                    placeholder={translate(
                      language,
                      "8 caractères minimum"
                    )}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />

                  <button
                    type="button"
                    className="passwordButton"
                    onClick={() =>
                      setShowPassword(
                        (currentValue) =>
                          !currentValue
                      )
                    }
                  >
                    {showPassword
                      ? translate(
                          language,
                          "Masquer"
                        )
                      : translate(
                          language,
                          "Afficher"
                        )}
                  </button>
                </div>
              </div>

              <div className="formGroup">
                <label htmlFor="animalSpecies">
                  {translate(
                    language,
                    "Espèce"
                  )}
                </label>

                <select
                  id="animalSpecies"
                  value={species}
                  onChange={(event) =>
                    setSpecies(
                      event.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    {translate(
                      language,
                      "Sélectionner une espèce"
                    )}
                  </option>

                  {speciesList.map(
                    (currentSpecies) => (
                      <option
                        key={
                          currentSpecies.value
                        }
                        value={
                          currentSpecies.value
                        }
                      >
                        {translate(
                          language,
                          currentSpecies.label
                        )}
                      </option>
                    )
                  )}
                </select>
              </div>
            </section>

            <section className="formSection">
              <h2>
                {translate(
                  language,
                  "Localisation"
                )}
              </h2>

              <div className="twoColumns">
                <div className="formGroup">
                  <label htmlFor="animalCity">
                    {translate(
                      language,
                      "Ville"
                    )}
                  </label>

                  <input
                    id="animalCity"
                    type="text"
                    value={city}
                    onChange={(event) =>
                      setCity(
                        event.target.value
                      )
                    }
                    placeholder="Marseille"
                    autoComplete="address-level2"
                    required
                  />
                </div>

                <div className="formGroup">
                  <label htmlFor="animalCountry">
                    {translate(
                      language,
                      "Pays"
                    )}
                  </label>

                  <input
                    id="animalCountry"
                    type="text"
                    value={country}
                    onChange={(event) =>
                      setCountry(
                        event.target.value
                      )
                    }
                    placeholder="France"
                    autoComplete="country-name"
                    required
                  />
                </div>
              </div>
            </section>

            <section className="formSection">
              <h2>
                {translate(
                  language,
                  "Présentation"
                )}
              </h2>

              <div className="formGroup">
                <label htmlFor="animalBio">
                  {translate(
                    language,
                    "Bio"
                  )}
                </label>

                <textarea
                  id="animalBio"
                  value={bio}
                  onChange={(event) =>
                    setBio(
                      event.target.value
                    )
                  }
                  rows={5}
                  maxLength={300}
                  placeholder={translate(
                    language,
                    "Présente ton animal en quelques mots..."
                  )}
                />

                <div className="characterCount">
                  {bio.length}/300
                </div>
              </div>
            </section>

            <section className="formSection">
              <h2>
                {translate(
                  language,
                  "Langue"
                )}
              </h2>

              <div className="languageSelector">
                {languages.map(
                  (currentLanguage) => (
                    <button
                      key={
                        currentLanguage.code
                      }
                      type="button"
                      className={
                        language ===
                        currentLanguage.code
                          ? "languageOption selected"
                          : "languageOption"
                      }
                      onClick={() =>
                        setLanguage(
                          currentLanguage.code
                        )
                      }
                    >
                      {currentLanguage.name}
                    </button>
                  )
                )}
              </div>
            </section>

            {error && (
              <p className="formError">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="submitButton"
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
        </div>
      </main>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .signupPage {
          min-height: 100vh;
          padding: 32px 16px 60px;
          overflow-y: auto;
          background: #f5f6fa;
          color: #17171c;
        }

        .signupContainer {
          width: 100%;
          max-width: 760px;
          margin: 0 auto;
        }

        .pageHeader {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 28px;
        }

        .pageHeader h1 {
          margin: 0 0 6px;
          font-size: 32px;
        }

        .pageHeader p {
          margin: 0;
          color: #757581;
        }

        .backButton {
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          border: none;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          font-size: 22px;
          box-shadow:
            0 6px 18px
            rgba(0, 0, 0, 0.06);
        }

        .formSection {
          padding: 24px;
          margin-bottom: 18px;
          border-radius: 24px;
          background: white;
          box-shadow:
            0 8px 28px
            rgba(31, 35, 48, 0.06);
        }

        .formSection h2 {
          margin: 0 0 20px;
          font-size: 18px;
        }

        .formGroup {
          margin-bottom: 18px;
        }

        .formGroup:last-child {
          margin-bottom: 0;
        }

        .formGroup label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .formGroup input,
        .formGroup select,
        .formGroup textarea {
          width: 100%;
          padding: 14px 16px;
          border: 1px solid #dedee7;
          border-radius: 14px;
          outline: none;
          background: #fafafd;
          font: inherit;
        }

        .formGroup input:focus,
        .formGroup select:focus,
        .formGroup textarea:focus {
          border-color: #6965db;
          box-shadow:
            0 0 0 4px
            rgba(105, 101, 219, 0.12);
        }

        .formGroup textarea {
          min-height: 120px;
          resize: vertical;
        }

        .twoColumns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .photoUpload {
          display: flex;
          width: 180px;
          height: 180px;
          margin: 0 auto;
          overflow: hidden;
          align-items: center;
          justify-content: center;
          border: 2px dashed #cfcfde;
          border-radius: 26px;
          background: #fafafd;
          cursor: pointer;
        }

        .photoUpload:hover {
          border-color: #6965db;
        }

        .photoPlaceholder {
          display: flex;
          padding: 18px;
          align-items: center;
          flex-direction: column;
          gap: 7px;
          color: #73737f;
          text-align: center;
        }

        .photoPlaceholder small {
          color: #9999a4;
        }

        .photoIcon {
          font-size: 34px;
        }

        .photoPreview {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .passwordContainer {
          position: relative;
        }

        .passwordContainer input {
          padding-right: 95px;
        }

        .passwordButton {
          position: absolute;
          top: 50%;
          right: 10px;
          padding: 7px 9px;
          transform: translateY(-50%);
          border: none;
          background: transparent;
          color: #6965db;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
        }

        .languageSelector {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .languageOption {
          padding: 13px 14px;
          border: 1px solid #dedee7;
          border-radius: 14px;
          background: #fafafd;
          cursor: pointer;
          font: inherit;
        }

        .languageOption.selected {
          border-color: #6965db;
          background: #6965db;
          color: white;
        }

        .characterCount {
          margin-top: 6px;
          color: #9999a4;
          text-align: right;
          font-size: 13px;
        }

        .formError {
          margin: 0 0 14px;
          color: #d9363e;
          text-align: center;
        }

        .submitButton {
          width: 100%;
          padding: 17px 24px;
          border: none;
          border-radius: 18px;
          background: #6965db;
          color: white;
          cursor: pointer;
          font: inherit;
          font-size: 16px;
          font-weight: 700;
          box-shadow:
            0 10px 24px
            rgba(105, 101, 219, 0.25);
        }

        .submitButton:hover {
          background: #5955cb;
        }

        .submitButton:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        @media screen and (max-width: 600px) {
          .signupPage {
            padding: 20px 12px 40px;
          }

          .pageHeader h1 {
            font-size: 27px;
          }

          .formSection {
            padding: 20px 16px;
            border-radius: 20px;
          }

          .twoColumns {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .languageSelector {
            grid-template-columns: 1fr;
          }

          .photoUpload {
            width: 150px;
            height: 150px;
          }
        }
      `}</style>
    </>
  )
}
