"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import AuthMessageModal from "@/components/AuthMessageModal"
import {
  useLanguage,
  type Language
} from "@/context/LanguageContext"
import { useAuth } from "@/context/AuthContext"
import { translate } from "@/translations/translations"
import { fetchAccountByPseudo } from "@/services/fetchAccountByPseudo"
import type { AuthSession } from "@/types/auth"
import AccountTypeModal from "@/components/AccountTypeModal"
import { updateSitterProfile } from "@/services/updateSitterProfile"
import { updateGroomingProfile } from "@/services/updateGroomingProfile"
import { updateHealthcareProfile } from "@/services/updateHealthcareProfile"

import "./LoginPage.css"

function parsePackageDate(
  value?: string
): Date | null {
  if (!value) {
    return null
  }

  // Format CloudKit :
  // YYYY-MM-DD HH:mm:ss
  const normalizedValue =
    value.replace(" ", "T")

  const date = new Date(normalizedValue)

  return Number.isNaN(date.getTime())
    ? null
    : date
}

function isPackageExpired(
  packageEnd?: string
): boolean {
  const endDate =
    parsePackageDate(packageEnd)

  if (!endDate) {
    return false
  }

  return endDate.getTime() <
    new Date().getTime()
}

export default function LoginPage() {
  const router = useRouter()

  const { language } = useLanguage()
  const { login } = useAuth()

  const [pseudo, setPseudo] = useState("")
  const [password, setPassword] = useState("")

  const [pseudoError, setPseudoError] = useState(false)
  const [passwordError, setPasswordError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
    const [showWelcome, setShowWelcome] = useState(false)
    const [loggedSession, setLoggedSession] =
      useState<AuthSession | null>(null)
    const [
      showAccountTypeModal,
      setShowAccountTypeModal
    ] = useState(false)

    const handleLogin = async () => {
      setPseudoError(false)
      setPasswordError(false)

      if (!pseudo.trim()) {
        setPseudoError(true)
        return
      }

      if (!password) {
        setPasswordError(true)
        return
      }

      const updateProfessionalPackage = async (
        accountType: string,
        professionalID: string
      ) => {
        const updates = {
          package: 0,
          packageStart: "",
          packageEnd: "",
          autoRenew: 0,
          stripeSubscriptionID: ""
        }

        switch (accountType) {
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
            return null
        }
      }

      try {
        setIsLoading(true)

        const fetchedSession =
          await fetchAccountByPseudo(
            pseudo.trim()
          )

        if (!fetchedSession) {
          setPseudo("")
          setPseudoError(true)
          return
        }

        if (
          fetchedSession.user.password !==
          password
        ) {
          setPassword("")
          setPasswordError(true)
          return
        }

        const isProfessional =
          fetchedSession.accountType ===
            "sitter" ||
          fetchedSession.accountType ===
            "grooming" ||
          fetchedSession.accountType ===
            "healthcare"

        const packageValue = Number(
          fetchedSession.user?.package ?? 0
        )

        const packageEnd = String(
          fetchedSession.user?.packageEnd ?? ""
        )

          const autoRenew = Number(
            isProfessional
              ? fetchedSession.user.autoRenew
              : 0
          )
          
          console.log(
            "Sitter avant login :",
                      fetchedSession
          )

        const shouldExpirePackage =
          isProfessional &&
          packageValue > 0 &&
          packageEnd !== "" &&
          autoRenew === 0 &&
          isPackageExpired(packageEnd)

        if (shouldExpirePackage) {
          const professionalID = String(
            fetchedSession.user.id
          )

          const expiredPackageUpdates = {
            package: 0,
            packageStart: "",
            packageEnd: "",
            autoRenew: 0,
            stripeSubscriptionID: ""
          }

          try {
            await updateProfessionalPackage(
              fetchedSession.accountType,
              professionalID
            )

            fetchedSession.user = {
              ...fetchedSession.user,
              ...expiredPackageUpdates
            }

            console.log(
              "Offre expirée réinitialisée",
              {
                professionalID,
                previousPackage:
                  packageValue,
                previousPackageEnd:
                  packageEnd,
                previousAutoRenew:
                  autoRenew
              }
            )
          } catch (updateError) {
            console.error(
              "Erreur pendant la réinitialisation de l’offre expirée :",
              updateError
            )
          }
        }

        login(fetchedSession)

        setLoggedSession(
          fetchedSession
        )

        setShowWelcome(true)
      } catch (error) {
        console.error(
          "Login error:",
          error
        )

        alert(
          translate(
            language,
            "Une erreur est survenue pendant la connexion."
          )
        )
      } finally {
        setIsLoading(false)
      }
    }

  return (
    <main className="loginPage">
      <section className="loginCard">
        <Link href="/" className="backButton">
          ← {translate(language, "Retour")}
        </Link>

        <img
          src="/images/logo.png"
          alt="Zoove"
          className="loginLogo"
        />

        <h1>{translate(language, "Connexion")}</h1>

        <p>
          {translate(
            language,
            "Connectez-vous pour réserver un professionnel pour votre animal."
          )}
        </p>

        <div className="loginForm">
          <label>{translate(language, "Pseudo")}</label>

          <input
            className={pseudoError ? "inputError" : ""}
            type="text"
            placeholder={
              pseudoError
                ? "Pseudo introuvable"
                : translate(language, "Votre pseudo")
            }
            value={pseudo}
            onChange={(event) => {
              setPseudo(event.target.value)
              setPseudoError(false)
            }}
          />

          <label>{translate(language, "Mot de passe")}</label>

          <input
            className={passwordError ? "inputError" : ""}
            type="password"
            placeholder={
              passwordError
                ? translate(language, "Mot de passe incorrect")
                : translate(language, "Votre mot de passe")
            }
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setPasswordError(false)
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleLogin()
              }
            }}
          />

          <button
            type="button"
            disabled={isLoading}
            onClick={handleLogin}
          >
            {isLoading
              ? translate(language, "Connexion...")
              : translate(language, "Se connecter")}
          </button>
        </div>

        <div className="loginFooter">
          <span>
            {translate(language, "Pas encore de compte ?")}
          </span>

          <button
            type="button"
            className="createAccountButton"
            onClick={() => setShowAccountTypeModal(true)}
          >
            {translate(
              language,
              "Créer un compte"
            )}
          </button>
          {showAccountTypeModal && (
               <AccountTypeModal
                 onClose={() =>
                   setShowAccountTypeModal(false)
                 }
               />
             )}
        </div>
          
          {showWelcome && loggedSession && (
            <AuthMessageModal
              title={translate(language, "Bienvenue")}
              pseudo={
                loggedSession.accountType === "animal"
                  ? loggedSession.user.name
                  : loggedSession.user.pseudo
              }
              photo={
                loggedSession.accountType === "grooming" ||
                loggedSession.accountType === "healthcare"
                  ? loggedSession.user.photos[0] ??
                    "/images/demo2.jpg"
                  : loggedSession.user.photo
              }
              onClose={() => {
                setShowWelcome(false)
                router.push("/")
              }}
            />
          )}
      </section>
    </main>
  )
}
