
"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

import {
  PawPrint,
  BriefcaseBusiness,
  CalendarDays,
  Search,
  Send,
  UserRound,
  ChartNoAxesColumnIncreasing,
  Heart,
  Bell,
  Settings,
  Check,
  Users,
  ArrowRight,
  Smartphone,
  ClipboardCheck,
  BadgeCheck,
  Plus,
  Sparkles,
  MapPin,
  ClipboardList,
} from "lucide-react"

import { useLanguage } from "@/context/LanguageContext"
import { translate } from "@/translations/translations"
import styles from "./page.module.css"

type Audience = "owner" | "professional"

const APP_STORE_URL =
  "https://apps.apple.com/fr/app/zoove-services-pour-animaux/id1637919730"

const SHOW_IMAGES = true

const ownerSteps = [
  {
    title: "Découvrez les professionnels près de chez vous",
    description:
      "Utilisez la recherche et les filtres pour trouver le professionnel adapté à vos besoins et à votre animal.",
    image: "/images/zoove-recherche-pro.png",
    icon: Search,
  },
  {
    title: "Consultez la fiche du professionnel",
    description:
      "Découvrez ses prestations, ses avis, ses photos et toutes les informations utiles.",
    image: "/images/zoove-pro-fiche.png",
    icon: ClipboardCheck,
  },
  {
    title: "Choisissez une prestation et demandez un rendez-vous",
    description:
      "Sélectionnez la prestation adaptée à votre animal, choisissez la date et l'heure qui vous conviennent, puis envoyez votre demande au professionnel.",
    image: "/images/zoove-demande-rdv.png",
    icon: CalendarDays,
  },
]

const professionalSteps = [
  {
    title: "Présentez votre savoir-faire",
    description:
      "Créez votre profil professionnel et faites découvrir vos prestations aux propriétaires d'animaux.",
    image: "/images/zoove-pro-clients.png",
    icon: UserRound,
  },
  {
    title: "Gardez la main sur vos rendez-vous",
    description:
      "Organisez vos disponibilités, recevez et gérez les demandes de rendez-vous depuis votre espace professionnel.",
    image: "/images/zoove-pro-planning.png",
    icon: CalendarDays,
  },
  {
    title: "Développez votre activité",
    description:
      "Découvrez les outils de visibilité et les statistiques pour mieux suivre votre activité.",
    image: "/images/zoove-pro-visibilite.png",
    icon: ChartNoAxesColumnIncreasing,
  },
]

const professionalFeatures = [
  {
    icon: CalendarDays,
    title: "Gérez vos rendez-vous",
    description: "Depuis votre bureau ou en mobilité.",
  },
  {
    icon: ChartNoAxesColumnIncreasing,
    title: "Consultez vos statistiques",
    description: "Suivez l'évolution de votre activité.",
  },
  {
    icon: Bell,
    title: "Recevez vos notifications",
    description: "Ne manquez aucune demande.",
  },
  {
    icon: Settings,
    title: "Accédez à toutes vos fonctionnalités",
    description: "Une expérience fluide et sécurisée.",
  },
]

const pilotBenefits = [
  "Découvrez une plateforme déjà existante.",
  "Partagez votre expérience et vos besoins.",
  "Contribuez à ses futures améliorations.",
  "Participation gratuite et sans engagement.",
]

export default function HowItWorksContent() {
  const { language } = useLanguage()
  const [audience, setAudience] = useState<Audience>("owner")

  const t = (key: string) => translate(language, key)

  const isOwner = audience === "owner"
  const steps = isOwner ? ownerSteps : professionalSteps

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* EN-TÊTE */}

        <header className={styles.intro}>
          <h1>{t("Comment ça marche ?")}</h1>
          <p>
            {t(
              "Une solution simple pour les propriétaires et les professionnels."
            )}
          </p>
        </header>

        {/* CHOIX DU PARCOURS */}

        <div
          className={styles.audienceTabs}
          role="group"
          aria-label={t("Choisissez votre parcours")}
        >
          <button
            type="button"
            className={`${styles.audienceTab} ${
              isOwner ? styles.selected : ""
            }`}
            aria-pressed={isOwner}
            onClick={() => setAudience("owner")}
          >
            <PawPrint size={23} aria-hidden="true" />
            <span>{t("Je suis propriétaire d'animal")}</span>
          </button>

          <button
            type="button"
            className={`${styles.audienceTab} ${
              !isOwner ? styles.selected : ""
            }`}
            aria-pressed={!isOwner}
            onClick={() => setAudience("professional")}
          >
            <BriefcaseBusiness size={23} aria-hidden="true" />
            <span>{t("Je suis professionnel")}</span>
          </button>
        </div>

        {/* CONTENU PRINCIPAL */}

        <div className={styles.contentGrid}>

          {/* CARTE ÉTAPES */}

          <section className={styles.stepsCard}>

            <div className={styles.stepsHeader}>
              <span className={styles.eyebrow}>
                {isOwner
                  ? t("ZOOVE POUR VOUS")
                  : t("ZOOVE PRO")}
              </span>

              <h2>
                {isOwner ? (
                  <>
                    {t("Découvrez les professionnels")}{" "}
                    <span className={styles.gradientText}>
                      {t("près de chez vous")}
                    </span>
                  </>
                ) : (
                  <>
                    {t("Découvrez comment")}{" "}
                    <span className={styles.gradientText}>
                      Zoove Pro
                    </span>{" "}
                    {t("simplifie votre quotidien")}
                  </>
                )}
              </h2>

              <p>
                {isOwner
                  ? t(
                      "Trouvez le professionnel adapté à votre animal, réservez en quelques clics et prenez soin de lui en toute sérénité."
                    )
                  : t(
                      "3 étapes simples pour présenter votre savoir-faire, gérer vos rendez-vous et développer votre activité."
                    )}
              </p>
            </div>

            <div className={styles.stepsList}>
              {steps.map((step, index) => {
                const Icon = step.icon

                return (
                  <article
                    key={`${audience}-${index}`}
                    className={styles.step}
                  >
                    <div className={styles.stepNumber}>
                      {index + 1}
                    </div>

                    <div className={styles.stepIcon}>
                      <Icon size={25} strokeWidth={2.1} />
                    </div>

                    <div className={styles.stepText}>
                      <h3>{t(step.title)}</h3>
                      <p>{t(step.description)}</p>
                    </div>

                    <div className={styles.stepVisual}>
                      {SHOW_IMAGES ? (
                        <Image
                          src={step.image}
                          alt={t(step.title)}
                          fill
                        unoptimized
                          sizes="(max-width: 768px) 90vw, 260px"
                          className={styles.stepImage}
                        />
                      ) : (
                        <div className={styles.imagePlaceholder}>
                          <Icon size={35} />
                          <span>{step.image.split("/").pop()}</span>
                        </div>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>

          </section>

          {/* CARTE DROITE */}

          {isOwner ? (

            <aside className={`${styles.iosCard} ${styles.ownerCard}`}>

              <div className={styles.ownerCardHeading}>
                <Heart size={25} className={styles.heartIcon} />

                <span className={styles.eyebrow}>
                  {t("POUR VOUS ET VOTRE ANIMAL")}
                </span>
              </div>

              <h2 className={styles.iosTitle}>
                {t("Encore plus à découvrir sur iPhone !")}
              </h2>

              <p className={styles.iosDescription}>
                {t(
                  "Avec Animal.IA, les jeux en réalité augmentée et les rencontres, découvrez d'autres façons d'interagir avec votre animal et de créer du lien."
                )}
              </p>

              <div className={styles.ownerVisual}>
                <div className={styles.visualGlow} />

                <Image
                  src="/images/zoove-ios-preview.png"
                  alt={t("L'application Zoove sur iPhone")}
                  fill
                  sizes="(max-width: 768px) 90vw, 450px"
                  className={styles.ownerPhoneImage}
                />

                <div className={styles.ownerVisualNote}>
                  {t("Des professionnels près de chez vous !")}
                </div>
              </div>

              <DownloadApp t={t} />

              <div className={styles.ownerHelp}>
                <div className={styles.ownerHelpIcon}>
                  <PawPrint size={23} />
                </div>

                <div>
                  <h3>
                    {t("Vous ne trouvez pas votre bonheur ?")}
                  </h3>

                  <p>
                    {t(
                      "Des services et des professionnels sont en cours d'ajout régulièrement. N'hésitez pas à nous faire part de vos besoins !"
                    )}
                  </p>

                  <Link
                    href="/contact"
                    className={styles.helpLink}
                    aria-label={t("Contact")}
                  >
                    <Plus size={16} />
                  </Link>
                </div>
              </div>

            </aside>

          ) : (

            <aside className={`${styles.iosCard} ${styles.proCard}`}>

              <h2 className={styles.iosTitle}>
                {t(
                  "Votre activité, sur ordinateur comme sur iPhone."
                )}
              </h2>

              <p className={styles.iosDescription}>
                {t(
                  "Retrouvez vos outils professionnels sur tous vos supports, où que vous soyez."
                )}
              </p>

              <div className={styles.proFeatures}>
                {professionalFeatures.map((feature) => {
                  const Icon = feature.icon

                  return (
                    <div
                      key={feature.title}
                      className={styles.proFeature}
                    >
                      <div className={styles.proFeatureIcon}>
                        <Icon size={21} />
                      </div>

                      <div>
                        <h3>{t(feature.title)}</h3>
                        <p>{t(feature.description)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              
               <div className={styles.proVisual}>
                 <div className={styles.visualGlow} />

                 <Image
                   src="/images/zoove-ios-pro-activite.png"
                   alt={t("Gestion de l'activité Zoove Pro")}
                   fill
                   sizes="(max-width: 768px) 90vw, 420px"
                   className={`${styles.proDeviceImage} ${styles.proActivite}`}
                 />

                 <Image
                   src="/images/zoove-ios-pro-planning.png"
                   alt={t("Planning Zoove Pro")}
                   fill
                   sizes="(max-width: 768px) 90vw, 420px"
                   className={`${styles.proDeviceImage} ${styles.proPlanning}`}
                 />

                 <Image
                   src="/images/zoove-ios-pro-visibilite.png"
                   alt={t("Visibilité Zoove Pro")}
                   fill
                   sizes="(max-width: 768px) 90vw, 420px"
                   className={`${styles.proDeviceImage} ${styles.proVisibilite}`}
                 />
               </div>


              <DownloadApp t={t} />

            </aside>

          )}

        </div>

        {/* PROFESSIONNELS PILOTES */}

        {!isOwner && (
          <section className={styles.pilotSection}>

            <div className={styles.pilotVisual}>
              <Image
                src="/images/zoove-hero-animals.png"
                alt={t("Professionnel du monde animal")}
                fill
                sizes="(max-width: 768px) 90vw, 350px"
                className={styles.pilotImage}
              />
            </div>

            <div className={styles.pilotContent}>

              <span className={styles.pilotBadge}>
                <Users size={15} />
                {t("PROFESSIONNELS PILOTES")}
              </span>

              <h2>
                {t("Votre expertise peut faire évoluer")}{" "}
                <span className={styles.gradientText}>Zoove.</span>
              </h2>

              <p>
                {t(
                  "Vous prenez soin des animaux au quotidien. Et nous sommes convaincus que les meilleurs outils se construisent avec ceux qui connaissent réellement leur métier."
                )}
              </p>

              <p>
                {t(
                  "C'est pourquoi nous recherchons des toiletteurs, pet sitters, vétérinaires et autres professionnels du monde animal pour découvrir Zoove Pro, tester ses fonctionnalités et partager leurs retours."
                )}
              </p>

              <Link
                href="/login"
                className={styles.pilotButton}
              >
                <Users size={19} />
                {t("Je souhaite participer")}
                <ArrowRight size={19} />
              </Link>

            </div>

            <div className={styles.pilotBenefits}>
              {pilotBenefits.map((benefit) => (
                <div
                  key={benefit}
                  className={styles.pilotBenefit}
                >
                  <span className={styles.benefitCheck}>
                    <Check size={18} strokeWidth={3} />
                  </span>
                  <p>{t(benefit)}</p>
                </div>
              ))}
            </div>

          </section>
        )}

      </div>
    </div>
  )
}

function DownloadApp({
  t,
}: {
  t: (key: string) => string
}) {
  return (
    <div className={styles.iosDownload}>

      <div className={styles.qrBox}>
        <Image
          src="/images/zoove-appstore-qr.png"
          alt={t("QR code pour télécharger Zoove")}
          width={130}
          height={130}
          className={styles.qrImage}
        />
      </div>

      <div className={styles.downloadInfo}>
        <p>
          {t("Téléchargez l'application Zoove sur iOS")}
        </p>

        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.appStoreButton}
        >
          <span className={styles.appleLogo}>●</span>

          <span>
            <small>{t("Télécharger dans")}</small>
            <strong>{t("l'App Store")}</strong>
          </span>
        </a>
      </div>

    </div>
  )
}
