"use client"

import Link from "next/link"
import {
  useEffect,
  useState
} from "react"

import { useAuth } from "@/context/AuthContext"
import {
  useLanguage,
  type Language
} from "@/context/LanguageContext"
import { translate } from "@/translations/translations"

import {
  AnimalAccount,
  fetchAnimalAccount
} from "@/services/fetchAnimalAccount"

import "./Account.css"

function displayValue(
  value: unknown,
  language: Language
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return translate(
      language,
      "Non renseigné"
    )
  }

  return String(value)
}

export default function AccountPage() {
  const { session } = useAuth()
  const { language } = useLanguage()

  const loggedAnimal =
    session?.accountType === "animal"
      ? session.user
      : null

  const [animal, setAnimal] =
    useState<AnimalAccount | null>(null)

  const [isLoading, setIsLoading] =
    useState(true)

  const [error, setError] =
    useState("")

  useEffect(() => {
    let cancelled = false

    const loadAnimal = async () => {
      if (!loggedAnimal?.id) {
        setAnimal(null)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError("")

        const result =
          await fetchAnimalAccount(
            loggedAnimal.id
          )

        if (!cancelled) {
          setAnimal(result)
        }
      } catch (loadError) {
        console.error(
          "Erreur pendant le chargement du compte :",
          loadError
        )

        if (!cancelled) {
          setError(
            translate(
              language,
              "Impossible de charger les informations du compte."
            )
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadAnimal()

    return () => {
      cancelled = true
    }
  }, [
    loggedAnimal?.id,
    language
  ])

  if (!loggedAnimal) {
    return (
      <main className="accountPage">
        <div className="accountHeader">
          <Link
            href="/"
            className="backButton"
          >
            ←
          </Link>

          <h1>
            {translate(
              language,
              "Mon compte"
            )}
          </h1>
        </div>

        <div className="accountEmptyState">
          <h2>
            {translate(
              language,
              "Vous devez être connecté."
            )}
          </h2>

          <Link
            href="/login"
            className="accountLoginButton"
          >
            {translate(
              language,
              "Se connecter"
            )}
          </Link>
        </div>
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="accountPage">
        <div className="accountHeader">
          <Link
            href="/"
            className="backButton"
          >
            ←
          </Link>

          <h1>
            {translate(
              language,
              "Mon compte"
            )}
          </h1>
        </div>

        <p>
          {translate(
            language,
            "Chargement..."
          )}
        </p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="accountPage">
        <div className="accountHeader">
          <Link
            href="/"
            className="backButton"
          >
            ←
          </Link>

          <h1>
            {translate(
              language,
              "Mon compte"
            )}
          </h1>
        </div>

        <p className="accountError">
          {error}
        </p>
      </main>
    )
  }

  if (!animal) {
    return (
      <main className="accountPage">
        <div className="accountHeader">
          <Link
            href="/"
            className="backButton"
          >
            ←
          </Link>

          <h1>
            {translate(
              language,
              "Mon compte"
            )}
          </h1>
        </div>

        <p>
          {translate(
            language,
            "Compte introuvable."
          )}
        </p>
      </main>
    )
  }

  const city =
    animal.city?.split(",loc")[0] ?? ""

  const accountFields = [
    {
      label: "Nom",
      value: animal.name
    },
    {
      label: "Espèce",
      value: animal.species
    },
    {
      label: "Ville",
      value: city
    },
    {
      label: "Pays",
      value: animal.country
    },
    {
      label: "Langue",
      value: animal.language
    },
    {
      label: "Bio",
      value: animal.bio
    }
  ]

  const userName =
    animal.name || "Utilisateur"

  return (
    <main className="accountPage">
      <div className="accountHeader">
        <Link
          href="/"
          className="backButton"
        >
          ←
        </Link>

        <h1>
          {translate(
            language,
            "Mon compte"
          )}
        </h1>
      </div>

      <section className="accountProfileCard">
        <div className="accountAvatar">
          {animal.photo ? (
            <img
              src={animal.photo}
              alt={userName}
            />
          ) : (
            <span>
              {userName
                .trim()
                .charAt(0)
                .toUpperCase()}
            </span>
          )}
        </div>

        <div className="accountProfileContent">
          <h2>{userName}</h2>

          {animal.species && (
            <p>
              {translate(
                language,
                animal.species
              )}
            </p>
          )}
        </div>
      </section>

      <section className="accountInformationCard">
        <div className="accountSectionHeader">
          <div>
            <h2>
              {translate(
                language,
                "Informations personnelles"
              )}
            </h2>

            <p>
              {translate(
                language,
                "Consultez les informations associées à votre compte."
              )}
            </p>
          </div>
        </div>

        <div className="accountFieldsGrid">
          {accountFields.map((item) => (
            <div
              className="accountField"
              key={item.label}
            >
              <span>
                {translate(
                  language,
                  item.label
                )}
              </span>

              <strong>
                {displayValue(
                  item.value,
                  language
                )}
              </strong>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
