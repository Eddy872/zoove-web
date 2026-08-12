"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import "./Header.css"

import {
  useLanguage,
  type Language
} from "@/context/LanguageContext"
import { useAuth } from "@/context/AuthContext"
import { translate } from "@/translations/translations"
import AuthMessageModal from "@/components/AuthMessageModal"

import type { AuthSession } from "@/types/auth"

export default function Header() {
    const languages: {
      code: Language
      label: string
      flag: string
    }[] = [
      { code: "fr", label: "FR", flag: "🇫🇷" },
      { code: "en", label: "EN", flag: "🇬🇧" },
      { code: "es", label: "ES", flag: "🇪🇸" },
      { code: "it", label: "IT", flag: "🇮🇹" },
      { code: "pt", label: "PT", flag: "🇵🇹" },
      { code: "de", label: "DE", flag: "🇩🇪" },
      {
        code: "ar",
        label: "العربية",
        flag: "🇸🇦"
      }
    ]

  const router = useRouter()

  const {
    language,
    setLanguage
  } = useLanguage()

  const {
    session,
    isLogged,
    logout
  } = useAuth()

  const [
    isLanguageOpen,
    setIsLanguageOpen
  ] = useState(false)

  const [
    isUserMenuOpen,
    setIsUserMenuOpen
  ] = useState(false)

  const [
    showGoodbye,
    setShowGoodbye
  ] = useState(false)

  const [
    goodbyeSession,
    setGoodbyeSession
  ] = useState<AuthSession | null>(null)

  const getSessionName = (
    currentSession: AuthSession
  ): string => {
    if (
      currentSession.accountType ===
      "animal"
    ) {
      return currentSession.user.name ?? ""
    }

    return currentSession.user.pseudo ?? ""
  }

  const getSessionPhoto = (
    currentSession: AuthSession
  ): string => {
    if (
      currentSession.accountType ===
        "grooming" ||
      currentSession.accountType ===
        "healthcare"
    ) {
      return (
        currentSession.user.photos?.[0] ??
        "/images/demo2.jpg"
      )
    }

    return (
      currentSession.user.photo ??
      "/images/demo2.jpg"
    )
  }
    console.log(session)
    console.log(session?.accountType)
  const handleLogoutRequest = () => {
    if (!session) {
      return
    }

    setGoodbyeSession(session)
    setIsUserMenuOpen(false)
    setShowGoodbye(true)
  }

  return (
    <header className="hero">
      <nav className="nav">
        <Link href="/">
          <img
            src="/images/logo.png"
            alt="Zoove"
            className="logo"
          />
        </Link>

        <div className="navRight">
          <div className="languageMenu">
            <button
              type="button"
              className="languageButton"
              onClick={() =>
                setIsLanguageOpen(
                  (current) => !current
                )
              }
            >
              {
                languages.find(
                  (item) =>
                    item.code === language
                )?.flag
              }{" "}
              {
                languages.find(
                  (item) =>
                    item.code === language
                )?.label
              }{" "}
              ⌄
            </button>

            {isLanguageOpen && (
              <div className="languageDropdown">
                {languages.map((item) => (
                  <button
                    type="button"
                    key={item.code}
                    onClick={() => {
                      setLanguage(item.code)
                      setIsLanguageOpen(false)
                    }}
                  >
                    {item.flag}{" "}
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isLogged && session ? (
            <div className="userMenu">
              <button
                type="button"
                className="userMenuButton"
                onClick={() =>
                  setIsUserMenuOpen(
                    (current) => !current
                  )
                }
              >
                <img
                  src={getSessionPhoto(session)}
                  alt={getSessionName(session)}
                />

                <span>
                  {getSessionName(session)}
                </span>

                <span>⌄</span>
              </button>

              {isUserMenuOpen && (
                <div className="userDropdown">
                  {session.accountType === "animal" && (
                    <>
                      <Link href="/account">
                        <span>👤</span>
                        {translate(language, "Profil")}
                      </Link>

                      <Link href="/appointments">
                        <span>📅</span>
                        {translate(language, "Mes RDV")}
                      </Link>
                    </>
                  )}

                  {session.accountType === "sitter" && (
                    <>
                      <Link href="/sitter-account">
                        <span>👤</span>
                        {translate(language, "Profil")}
                      </Link>

                      <Link href="/professional-agenda">
                        <span>📅</span>
                        {translate(language, "Agenda")}
                      </Link>

                      <Link href="/professional-stats">
                        <span>📊</span>
                        {translate(language, "Statistiques")}
                      </Link>

                      <Link href="/professional-offers">
                        <span>⭐</span>
                        {translate(language, "Offres")}
                      </Link>
                    </>
                  )}

                  {session.accountType === "grooming" && (
                    <>
                      <Link href="/grooming-account">
                        <span>🏢</span>
                        {translate(language, "Mon établissement")}
                      </Link>

                      <Link href="/professional-agenda">
                        <span>📅</span>
                        {translate(language, "Agenda")}
                      </Link>

                      <Link href="/professional-stats">
                        <span>📊</span>
                        {translate(language, "Statistiques")}
                      </Link>

                      <Link href="/professional-offers">
                        <span>⭐</span>
                        {translate(language, "Offres")}
                      </Link>
                    </>
                  )}

                  {session.accountType === "healthcare" && (
                    <>
                      <Link href="/healthcare-account">
                        <span>🏥</span>
                        {translate(language, "Mon établissement")}
                      </Link>

                      <Link href="/professional-agenda">
                        <span>📅</span>
                        {translate(language, "Agenda")}
                      </Link>

                      <Link href="/professional-stats">
                        <span>📊</span>
                        {translate(language, "Statistiques")}
                      </Link>

                      <Link href="/professional-offers">
                        <span>⭐</span>
                        {translate(language, "Offres")}
                      </Link>
                    </>
                  )}

                  <button
                    type="button"
                    className="logoutButton"
                    onClick={handleLogoutRequest}
                  >
                    <span>↪</span>

                    {translate(language, "Déconnexion")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="loginButton"
            >
              {translate(
                language,
                "Se connecter"
              )}
            </Link>
          )}
        </div>
      </nav>

      <section className="heroContent">
        <div className="heroText">
          <h1>
            {translate(
              language,
              "Le meilleur pour"
            )}

            <br />

            <span>
              {translate(
                language,
                "vos animaux 🐾"
              )}
            </span>
          </h1>

          <p>
            {translate(
              language,
              "Trouvez les meilleurs professionnels près de chez vous et réservez en toute simplicité."
            )}
          </p>
        </div>

        <div className="heroImage">
          <img
            src="/images/hero-pets.png"
            alt="Animaux"
          />
        </div>
      </section>

      {showGoodbye &&
        goodbyeSession && (
          <AuthMessageModal
            title={translate(
              language,
              "À bientôt"
            )}
            pseudo={getSessionName(
              goodbyeSession
            )}
            photo={getSessionPhoto(
              goodbyeSession
            )}
            onClose={() => {
              logout()
              setShowGoodbye(false)
              setGoodbyeSession(null)
              router.push("/")
            }}
          />
        )}
    </header>
  )
}
