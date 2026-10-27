"use client"

import Link from "next/link"
import Image from "next/image"

import {
  ArrowRight,
  Search,
  CalendarDays,
  Heart,
  CheckCircle2,
  Sparkles,
  Gamepad2,
  Users,
  Monitor,
  Apple
} from "lucide-react"

import Header from "@/components/Header"
import HomeNavbar from "@/components/HomeNavbar"

import { useLanguage } from "@/context/LanguageContext"
import { translate } from "@/translations/translations"

import "./globals.css"

const APP_STORE_URL =
  "https://apps.apple.com/fr/app/zoove-services-pour-animaux/id1637919730"

const advantages = [
  {
    icon: Search,
    title: "Trouvez",
    description:
      "Découvrez des professionnels adaptés aux besoins de vos animaux.",
    color: "purple"
  },
  {
    icon: CalendarDays,
    title: "Réservez",
    description:
      "Organisez vos rendez-vous en quelques clics, en toute simplicité.",
    color: "violet"
  },
  {
    icon: Heart,
    title: "Prenez soin",
    description:
      "Un écosystème pensé pour les animaux et ceux qui les aiment.",
    color: "pink"
  }
]

const iosFeatures = [
  {
    icon: Sparkles,
    title: "Animal.IA",
    description:
      "Explorez une nouvelle façon de comprendre votre compagnon."
  },
  {
    icon: Gamepad2,
    title: "Jeux en réalité augmentée",
    description:
      "Vivez des expériences ludiques et interactives."
  },
  {
    icon: Users,
    title: "Rencontres",
    description:
      "Rencontrez d'autres passionnés et créez de nouveaux liens."
  }
]

export default function Home() {
  const { language } = useLanguage()

  const t = (key: string) =>
    translate(language, key)

  return (
    <main>
      {/* NAVIGATION COMMUNE À TOUTES LES PAGES */}

      <Header />
      <HomeNavbar />

      {/* CONTENU SPÉCIFIQUE À L'ACCUEIL */}

      <div className="zoove-home">
        <div className="home-content">
          <div className="home-container">

            {/* HERO */}

            <section className="home-hero">
              <div className="home-hero-copy">

                <div className="home-eyebrow">
                  <Sparkles size={15} />

                  {t("L'univers des animaux de compagnie")}
                </div>

                <h1>
                  {t("Zoove,")}
                  <br />

                  {t("pour eux, pour vous,")}
                  <br />

                  <span>
                    {t("pour nous.")}
                  </span>
                </h1>

                <p className="home-hero-description">
                  {t(
                    "La plateforme qui rapproche les propriétaires d'animaux et les professionnels qui prennent soin d'eux."
                  )}
                </p>

                <div className="home-hero-actions">

                  <a
                    href={APP_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="home-button home-button-primary"
                  >
                    <Apple size={22} />

                    {t("Télécharger sur iOS")}

                    <ArrowRight size={20} />
                  </a>

                  <Link
                    href="/login"
                    className="home-button home-button-secondary"
                  >
                    <Monitor size={22} />

                    {t("Découvrir la webapp")}

                    <ArrowRight size={20} />
                  </Link>

                </div>
              </div>

              <div className="home-hero-visual">
                <div className="home-hero-glow" />

                <Image
                  src="/images/zoove-hero-animals.png"
                  alt={t(
                    "Un chien et un chat réunis dans l'univers Zoove"
                  )}
                  width={680}
                  height={580}
                  priority
                  className="home-hero-image"
                />
              </div>
            </section>

            {/* ARGUMENTS DE CONFIANCE */}

            <div className="home-trust-row">

              <span>
                <CheckCircle2 />

                {t("Des professionnels de confiance")}
              </span>

              <span>
                <CheckCircle2 />

                {t("Réservation simple")}
              </span>

              <span>
                <CheckCircle2 />

                {t("Un quotidien plus serein")}
              </span>

            </div>

            {/* AVANTAGES DE ZOOVE */}

            <section className="home-advantages">

              {advantages.map((item) => {
                const Icon = item.icon

                return (
                  <article
                    className="home-advantage-card"
                    key={item.title}
                  >
                    <div
                      className={`home-card-icon ${item.color}`}
                    >
                      <Icon
                        size={30}
                        strokeWidth={2.2}
                      />
                    </div>

                    <h2>
                      {t(item.title)}
                    </h2>

                    <p>
                      {t(item.description)}
                    </p>
                  </article>
                )
              })}

            </section>
          </div>

          {/* FONCTIONNALITÉS EXCLUSIVES IOS */}

          <section className="home-ios-section">

            <div className="home-container home-ios-layout">

              {/* VISUELS IPHONE */}

              <div className="home-ios-visual">
                <Image
                  src="/images/zoove-ios-preview.png"
                  alt={t(
                    "Aperçu de l'application Zoove sur iPhone"
                  )}
                  width={500}
                  height={480}
                  className="home-ios-image"
                />
              </div>

              {/* CONTENU */}

              <div className="home-ios-content">

                <div className="home-ios-label">
                  <Apple size={16} />

                  {t("L'expérience Zoove sur iPhone")}
                </div>

                <h2>
                  {t("Encore plus d'expériences")}
                  <br />

                  <span>
                    {t("pour les propriétaires sur iOS !")}
                  </span>
                </h2>

                <p className="home-ios-intro">
                  {t(
                    "Avec l'application Zoove, allez au-delà des services du quotidien et découvrez de nouvelles façons de partager, jouer et créer du lien autour des animaux."
                  )}
                </p>

                {/* 3 FONCTIONNALITÉS IOS */}

                <div className="home-ios-features">

                  {iosFeatures.map((feature) => {
                    const Icon = feature.icon

                    return (
                      <div
                        className="home-ios-feature"
                        key={feature.title}
                      >

                        <div className="home-feature-icon">
                          <Icon size={21} />
                        </div>

                        <div>
                          <h3>
                            {t(feature.title)}
                          </h3>

                          <p>
                            {t(feature.description)}
                          </p>
                        </div>

                      </div>
                    )
                  })}

                </div>

                {/* CTA IOS */}

                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="home-button home-button-primary home-ios-cta"
                >
                  <Apple size={21} />

                  {t("Découvrir Zoove sur iOS")}

                  <ArrowRight size={19} />
                </a>

              </div>

              {/* QR CODE + APP STORE */}

              <div className="home-ios-download">

                <div className="home-qr-container">
                  <Image
                    src="/images/zoove-appstore-qr.png"
                    alt={t(
                      "QR code de téléchargement de Zoove"
                    )}
                    width={180}
                    height={180}
                  />
                </div>

                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="home-app-store-badge"
                >
                  <Apple size={27} />

                  <span>
                    <small>
                      {t("Télécharger dans")}
                    </small>

                    {t("l'App Store")}
                  </span>
                </a>

              </div>

            </div>
          </section>

        </div>
      </div>
    </main>
  )
}
