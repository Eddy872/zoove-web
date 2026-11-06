
import {
  PawPrint,
  Lightbulb,
  UsersRound,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Check,
  Clock3,
} from "lucide-react";

import ZooveProCTA from "@/components/ZooveProCTA";

import styles from "./page.module.css";

export default function ZooveProPage() {
  return (
    <main className={styles.page}>
      {/* =====================================
          HERO
      ===================================== */}

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>
            Toiletteurs, pet sitters et
            professionnels animaliers en PACA
          </span>

          <h1 className={styles.heroTitle}>
            Merci de les aider
            <br />
            à{" "}
            <span className={styles.gradientText}>
              nous aider.
            </span>
          </h1>

          <p className={styles.heroSubtitle}>
            Et si Zoove facilitait aussi
            votre quotidien ?
          </p>

          <p className={styles.heroDescription}>
            Gérez plus simplement vos demandes
            de rendez-vous, votre planning et
            les informations sur les animaux.
          </p>

          <p className={styles.heroDescription}>
            Je recherche des professionnels
            pilotes en PACA pour tester
            Zoove Pro et m&apos;aider à
            l&apos;améliorer.
          </p>

          {/* GRATUITÉ ET ENGAGEMENT */}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "10px 20px",
              marginTop: 20,
              marginBottom: 18,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                fontSize: 14,
                fontWeight: 600,
                color: "#15275A",
              }}
            >
              <Check
                size={17}
                color="#7B2CFF"
                aria-hidden="true"
              />
              Gratuit
            </span>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                fontSize: 14,
                fontWeight: 600,
                color: "#15275A",
              }}
            >
              <Check
                size={17}
                color="#7B2CFF"
                aria-hidden="true"
              />
              Sans engagement
            </span>
          </div>

          {/* CTA PRINCIPAL */}

          <ZooveProCTA />

          <p
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              marginTop: 12,
              fontSize: 13,
              lineHeight: 1.5,
              color: "#66758E",
            }}
          >
            <Clock3
              size={16}
              aria-hidden="true"
              style={{ flexShrink: 0 }}
            />
            Un échange de 15 minutes
            avec le fondateur.
          </p>
        </div>
      </section>

      {/* =====================================
          CONTENU
      ===================================== */}

      <section
        className={styles.content}
        aria-label="Notre démarche"
      >
        {/* =====================================
            TROIS PILIERS ANIMÉS
        ===================================== */}

        <div className={styles.pillars}>
          {/* CHEMIN 1 */}

          <div
            className={`${styles.pawTrail} ${styles.pawTrailFirst}`}
            aria-hidden="true"
          >
            <PawPrint />
            <PawPrint />
            <PawPrint />
          </div>

          {/* CHEMIN 2 */}

          <div
            className={`${styles.pawTrail} ${styles.pawTrailSecond}`}
            aria-hidden="true"
          >
            <PawPrint />
            <PawPrint />
            <PawPrint />
          </div>

          {/* =====================================
              01 - VOTRE EXPERTISE
          ===================================== */}

          <article className={styles.pillar}>
            <div className={styles.pillarIcon}>
              <PawPrint aria-hidden="true" />
            </div>

            <p className={styles.pillarNumber}>
              01
            </p>

            <h2 className={styles.pillarTitle}>
              Votre expertise
            </h2>

            <p className={styles.pillarDescription}>
              Vous connaissez les animaux,
              leurs besoins et les réalités
              de votre métier mieux que personne.{" "}
              <span className={styles.pillarHighlight}>
                Votre expérience est précieuse
                pour construire des outils
                réellement utiles.
              </span>
            </p>
          </article>

          {/* =====================================
              02 - MON AMBITION
          ===================================== */}

          <article className={styles.pillar}>
            <div className={styles.pillarIcon}>
              <Lightbulb aria-hidden="true" />
            </div>

            <p className={styles.pillarNumber}>
              02
            </p>

            <h2 className={styles.pillarTitle}>
              Mon ambition
            </h2>

            <p className={styles.pillarDescription}>
              J&apos;ai créé Zoove pour faciliter
              le quotidien des propriétaires
              d&apos;animaux.{" "}
              <span className={styles.pillarHighlight}>
                Aujourd&apos;hui, je souhaite
                aussi simplifier votre organisation
                et la gestion de vos rendez-vous.
              </span>
            </p>
          </article>

          {/* =====================================
              03 - ENSEMBLE
          ===================================== */}

          <article className={styles.pillar}>
            <div className={styles.pillarIcon}>
              <UsersRound aria-hidden="true" />
            </div>

            <p className={styles.pillarNumber}>
              03
            </p>

            <h2 className={styles.pillarTitle}>
              Ensemble
            </h2>

            <p className={styles.pillarDescription}>
              Testez Zoove Pro avec vos clients,
              partagez votre expérience et
              vos besoins.{" "}
              <span className={styles.pillarHighlight}>
                Construisons un outil adapté
                à votre métier.
              </span>
            </p>
          </article>
        </div>

        {/* =====================================
            FONCTIONNALITÉS CONCRÈTES
        ===================================== */}

        <div
          style={{
            maxWidth: 1000,
            margin: "36px auto 0",
            padding: "0 16px",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              fontSize: "clamp(22px, 3vw, 30px)",
              fontWeight: 750,
              color: "#10265D",
              marginBottom: 12,
            }}
          >
            Zoove Pro, concrètement
          </h2>

          <p
            style={{
              textAlign: "center",
              color: "#66758E",
              fontSize: 15,
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            Des fonctionnalités pour simplifier
            votre quotidien professionnel.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            {[
              {
                title: "Demandes de rendez-vous",
                description:
                  "Consultez les demandes de vos clients et organisez leur prise en charge.",
                icon: CalendarCheck,
              },
              {
                title: "Planning",
                description:
                  "Retrouvez vos rendez-vous dans un agenda organisé.",
                icon: CalendarDays,
              },
              {
                title: "Informations des animaux",
                description:
                  "Accédez aux informations utiles avant chaque prestation.",
                icon: ClipboardList,
              },
            ].map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  style={{
                    background: "#F5F0FF",
                    borderRadius: 22,
                    padding: 22,
                  }}
                >
                  <Icon
                    size={26}
                    color="#7B2CFF"
                    aria-hidden="true"
                  />

                  <h3
                    style={{
                      marginTop: 14,
                      marginBottom: 8,
                      fontSize: 17,
                      fontWeight: 700,
                      color: "#10265D",
                    }}
                  >
                    {feature.title}
                  </h3>

                  <p
                    style={{
                      color: "#66758E",
                      fontSize: 14,
                      lineHeight: 1.6,
                    }}
                  >
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>

          {/* Remplacer ce bloc par une vraie
              capture de l'agenda Zoove Pro
              lorsqu'elle est disponible. */}
        </div>

        {/* =====================================
            COMMENT ÇA MARCHE
        ===================================== */}

        <div
          style={{
            maxWidth: 900,
            margin: "40px auto 0",
            padding: "0 16px 32px",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              fontSize: "clamp(22px, 3vw, 30px)",
              fontWeight: 750,
              color: "#10265D",
              marginBottom: 24,
            }}
          >
            Comment participer ?
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 20,
            }}
          >
            {[
              {
                number: "01",
                title: "Je remplis le formulaire",
                description:
                  "Je laisse mes coordonnées en quelques minutes.",
              },
              {
                number: "02",
                title: "Nous échangeons",
                description:
                  "Le fondateur me recontacte pour discuter de mon métier et de mes besoins.",
              },
              {
                number: "03",
                title: "Je découvre Zoove Pro",
                description:
                  "Je teste les fonctionnalités et partage mon expérience.",
              },
            ].map((step) => (
              <div
                key={step.number}
                style={{
                  textAlign: "center",
                  padding: 16,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: "#7B2CFF",
                    color: "#fff",
                    fontWeight: 700,
                    marginBottom: 12,
                  }}
                >
                  {step.number}
                </span>

                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#10265D",
                    marginBottom: 8,
                  }}
                >
                  {step.title}
                </h3>

                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: "#66758E",
                  }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
