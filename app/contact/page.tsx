
"use client"

import { useState, type FormEvent } from "react"
import Image from "next/image"
import Header from "@/components/Header"
import HomeNavbar from "@/components/HomeNavbar"
import Footer from "@/components/Footer"
import {
  Mail,
  MapPin,
} from "lucide-react"
import { Heart } from "lucide-react"
import { FaTiktok, FaFacebookF } from "react-icons/fa"
import { useLanguage } from "@/context/LanguageContext"
import { translate } from "@/translations/translations"
import styles from "./page.module.css"

type ContactType = "owner" | "professional" | "other"

export default function ContactPage() {
  const { language } = useLanguage()
  const t = (key: string) => translate(language, key)

  const [contactType, setContactType] =
    useState<ContactType>("owner")

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
    
    
    const [isSending, setIsSending] = useState(false)
    const [sendStatus, setSendStatus] =
      useState<"success" | "error" | null>(null)
  
    const handleSubmit = async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault()

      if (isSending) return

      setIsSending(true)
      setSendStatus(null)

      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            message,
            contactType,
          }),
        })

        if (!response.ok) {
          throw new Error("Échec de l'envoi")
        }

        setSendStatus("success")
        setName("")
        setEmail("")
        setMessage("")
        setContactType("owner")
      } catch (error) {
        console.error("Erreur contact :", error)
        setSendStatus("error")
      } finally {
        setIsSending(false)
      }
    }


  return (
    <main>
      <Header />
      <HomeNavbar />

      <section className={styles.contactPage}>
        <div className={styles.container}>

          {/* COLONNE PRINCIPALE */}

          <div className={styles.mainGrid}>

            {/* INTRODUCTION */}

            <div className={styles.intro}>
              <h1>
                {t("Une question ?")}
                <span>{t("Parlons-en !")}</span>
              </h1>

              <p>
                {t(
                  "Vous êtes propriétaire d'animal, professionnel ou souhaitez en savoir plus sur Zoove ?"
                )}
                <br />
                {t(
                  "Nous serons ravis d'échanger avec vous."
                )}
              </p>

              <div className={styles.animalVisual}>
                <Image
                  src="/images/zoove-contact-animals.png"
                  alt={t("Un chien et un chat")}
                  fill
                  priority
                  sizes="(max-width: 900px) 90vw, 600px"
                  className={styles.animalImage}
                />
              </div>
            </div>

            {/* FORMULAIRE */}

            <div className={styles.formCard}>
              <h2>{t("Envoyez-nous un message")}</h2>

              <form onSubmit={handleSubmit}>
                <fieldset className={styles.radioGroup}>
                  <legend>{t("Vous êtes")}</legend>

                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="contactType"
                      value="owner"
                      checked={contactType === "owner"}
                      onChange={() => setContactType("owner")}
                    />
                    <span>
                      {t("Propriétaire d'animal")}
                    </span>
                  </label>

                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="contactType"
                      value="professional"
                      checked={contactType === "professional"}
                      onChange={() => setContactType("professional")}
                    />
                    <span>{t("Professionnel")}</span>
                  </label>

                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="contactType"
                      value="other"
                      checked={contactType === "other"}
                      onChange={() => setContactType("other")}
                    />
                    <span>{t("Autre")}</span>
                  </label>
                </fieldset>

                <div className={styles.field}>
                  <label htmlFor="contact-name">
                    {t("Nom")}
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    placeholder={t("Votre nom")}
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="contact-email">
                    {t("Adresse e-mail")}
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    placeholder={t("votre@email.fr")}
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label htmlFor="contact-message">
                    {t("Message")}
                  </label>
                  <textarea
                    id="contact-message"
                    placeholder={t(
                      "Comment pouvons-nous vous aider ?"
                    )}
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSending}
          >
            {isSending
              ? t("Envoi en cours...")
              : t("Envoyer le message")}
          </button>

          {sendStatus === "success" && (
            <p role="status" className={styles.successMessage}>
              {t("Votre message a bien été envoyé.")}
            </p>
          )}

          {sendStatus === "error" && (
            <p role="alert" className={styles.errorMessage}>
              {t("Impossible d'envoyer le message. Veuillez réessayer.")}
            </p>
          )}
              </form>
            </div>
          </div>

          {/* CARTES INFORMATIONS */}

          <div className={styles.infoGrid}>

            {/* EMAIL */}

            <div className={styles.infoCard}>
              <div
                className={`${styles.infoIcon} ${styles.mailIcon}`}
              >
                <Mail size={39} strokeWidth={1.8} />
              </div>

              <div className={styles.infoContent}>
                <h3>{t("Par e-mail")}</h3>

                <a href="mailto:n.eddy@zoove.fr">
                  n.eddy@zoove.fr
                </a>

                <p>
                  {t(
                    "Nous vous répondons sous 24 à 48h."
                  )}
                </p>
              </div>
            </div>

            {/* LOCALISATION */}

            <div className={styles.infoCard}>
              <div
                className={`${styles.infoIcon} ${styles.mapIcon}`}
              >
                <MapPin size={42} strokeWidth={1.8} />
              </div>

              <div className={styles.infoContent}>
                <h3>{t("Notre localisation")}</h3>

                <span>{t("Marseille, France")}</span>

                <p>
                  {t("Une équipe proche de vous.")}
                </p>
              </div>
            </div>

          {/* RÉSEAUX SOCIAUX */}

          <div className={styles.infoCard}>
            <div
              className={`${styles.infoIcon} ${styles.heartIcon}`}
            >
              <Heart size={43} strokeWidth={1.8} />
            </div>

            <div className={styles.infoContent}>
              <h3>{t("Suivez-nous")}</h3>

              <div className={styles.socialLinks}>
                <a
                  href="https://www.tiktok.com/@animal.ia946"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok Animal.IA"
                  title="TikTok Animal.IA"
                  className={styles.tiktok}
                >
                  <FaTiktok size={23} />
                </a>

                <a
                  href="https://www.facebook.com/people/Zoove-Pro/61592760646507/?sk=grid"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook Zoove Pro"
                  title="Facebook Zoove Pro"
                  className={styles.facebook}
                >
                  <FaFacebookF size={23} />
                </a>
              </div>

              <p>{t("Toute l'actualité Zoove.")}</p>
            </div>
          </div>

          </div>
        </div>
      </section>
          <Footer />
    </main>
  )
}
