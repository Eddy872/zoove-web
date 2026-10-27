
"use client"

import Image from "next/image"
import {
  Heart,
  UsersRound,
  PawPrint,
  Star,
  Trophy,
} from "lucide-react"
import { useLanguage } from "@/context/LanguageContext"
import { translate } from "@/translations/translations"
import styles from "./page.module.css"

export default function AboutContent() {
  const { language } = useLanguage()

  const t = (key: string) => translate(language, key)

  const values = [
    {
      title: "Notre mission",
      description:
        "Améliorer le quotidien des animaux et de ceux qui les aiment.",
      icon: Heart,
      color: "red",
    },
    {
      title: "Nos valeurs",
      description:
        "Confiance, bienveillance, proximité et innovation.",
      icon: UsersRound,
      color: "purple",
    },
    {
      title: "Notre vision",
      description:
        "Un écosystème complet et accessible pour tous les amoureux des animaux.",
      icon: PawPrint,
      color: "violet",
    },
    {
      title: "Notre engagement",
      description:
        "Soutenir les professionnels et promouvoir le bien-être animal.",
      icon: Star,
      color: "orange",
    },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* PRÉSENTATION */}

        <section
          className={styles.hero}
          aria-labelledby="about-title"
        >
          <div className={styles.heroText}>
            <h1 id="about-title">
              {t("Une histoire de passion et de lien.")}
            </h1>

            <p>
              {t(
                "Chez Zoove, nous croyons que les animaux créent du lien et rendent nos vies plus belles. Ils nous accompagnent, nous rapprochent et contribuent à notre bien-être."
              )}
            </p>

            <p>
              {t(
                "Zoove est née d’une conviction : la technologie peut faciliter le quotidien des propriétaires d’animaux et des professionnels, tout en renforçant leur lien."
              )}
            </p>

            <div className={styles.quote}>
              {t(
                "« Zoove existe pour les aider à nous aider. »"
              )}
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.heroGlow} />

            <div className={styles.petImage}>
              <Image
                src="/images/chien-chat-zoove.png"
                alt={t(
                  "Un chien et un chat réunis, symboles de la complicité entre les animaux"
                )}
                fill
                priority
                sizes="(max-width: 768px) 90vw, 480px"
                className={styles.imageCover}
              />
            </div>

            <Heart
              className={styles.floatingHeart}
              size={52}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </div>
        </section>

        {/* MISSION ET VALEURS */}

        <section
          className={styles.valuesSection}
          aria-label={t("Notre mission et nos valeurs")}
        >
          <div className={styles.valuesGrid}>
            {values.map((value) => {
              const Icon = value.icon

              return (
                <article
                  key={value.title}
                  className={styles.valueCard}
                >
                  <Icon
                    className={`${styles.valueIcon} ${
                      styles[value.color]
                    }`}
                    size={40}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />

                  <h2>{t(value.title)}</h2>
                  <p>{t(value.description)}</p>
                </article>
              )
            })}
          </div>
        </section>

        
          {/* NOTRE HISTOIRE */}

          <section
            className={styles.story}
            aria-labelledby="story-title"
          >
            
          <div className={styles.storyText}>
            <h2 id="story-title">
              {t("Notre histoire")}
            </h2>

            <p>
              {t("Zoove est né d'une conviction : ")}
              <strong>
                {t("les animaux contribuent à notre bonheur, à notre bien-être et aux liens qui nous unissent.")}
              </strong>
            </p>

            <p>
              {t("Fondé par ")}
              <strong>
                {t("Eddy Nemer, passionné d'animaux et titulaire d'un Master en informatique")}
              </strong>
              {t(", Zoove associe technologie et passion du monde animal pour faciliter le quotidien des propriétaires et des professionnels.")}
            </p>

            <p>
              {t("Notre ambition : ")}
              <strong>
                {t("développer un écosystème numérique accessible qui simplifie les services animaliers et renforce les liens.")}
              </strong>
            </p>

            <p className={styles.awardText}>
              {t("En 2026, Zoove a été ")}
              <strong>
                {t("lauréat régional du prix Création Talents des Cités en Provence-Alpes-Côte d'Azur")}
              </strong>
              {t(", une reconnaissance de son potentiel et de son ambition.")}
            </p>
          </div>


            <div className={styles.founderAwardImage}>
              <Image
                src="/images/eddy-nemer-laureat-talents-des-cites-2026.png"
                alt={t(
                  "Eddy Nemer, fondateur de Zoove, lauréat régional Talents des Cités 2026"
                )}
                width={420}
                height={420}
                sizes="(max-width: 768px) 90vw, 340px"
                className={styles.awardPhoto}
              />
            </div>
          </section>
      </div>
    </div>
  )
}

