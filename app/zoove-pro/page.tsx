

import {
  ArrowRight,
  PawPrint,
  Lightbulb,
  UsersRound,
  ClipboardPenLine,
  Phone,
  Monitor,
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
            Professionnels animaliers
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
            Votre expérience est précieuse.
          </p>

          <p className={styles.heroDescription}>
            Ensemble, construisons des outils
            qui facilitent votre quotidien et
            répondent réellement à vos besoins.
          </p>

          <ZooveProCTA />
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
          {/* CHEMIN 1 : EXPERTISE → AMBITION */}

          <div
            className={`${styles.pawTrail} ${styles.pawTrailFirst}`}
            aria-hidden="true"
          >
            <PawPrint />
            <PawPrint />
            <PawPrint />
          </div>

          {/* CHEMIN 2 : AMBITION → ENSEMBLE */}

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
              leurs besoins et leurs propriétaires
          mieux que personne.{" "}
            <span className={styles.pillarHighlight}>
                Votre expérience est précieuse.
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
          le quotidien des propriétaires d&apos;animaux.{" "}

              <span className={styles.pillarHighlight}>
                Aujourd&apos;hui, je souhaite aussi
                faciliter le vôtre.
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
          Vous apportez votre expérience et votre savoir-faire.{" "}
              <span className={styles.pillarHighlight}>
                Je mets la technologie à votre service.
              </span>
            </p>
          </article>
        </div>

       
      </section>
    </main>
  );
}
