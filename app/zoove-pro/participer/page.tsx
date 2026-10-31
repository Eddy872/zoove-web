
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  UserRound,
  BriefcaseBusiness,
  MapPin,
  Store,
  Phone,
  Mail,
  MessageSquare,
  LockKeyhole,
} from "lucide-react";
import { trackMetaEvent } from "@/components/ZooveProTracking";

import styles from "./page.module.css";

type FormData = {
  name: string;
  business: string;
  profession: string;
  phone: string;
  city: string;
  email: string;
  message: string;
};

const initialForm: FormData = {
  name: "",
  business: "",
  profession: "Toiletteur / Toiletteuse",
  phone: "",
  city: "",
  email: "",
  message: "",
};

export default function ParticiperPage() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function updateField(
    field: keyof FormData,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "zoove-pro",
            name: form.name,
            email: form.email,
            phone: form.phone,
            city: form.city,
            profession: form.profession,
            business: form.business,
            message: form.message,
          }),
        });


        if (!response.ok) {
          throw new Error("Envoi impossible");
        }

        // Conversion Meta : formulaire envoyé avec succès
        trackMetaEvent("Lead", true);

        setSuccess(true);
        setForm(initialForm);
    } catch {
      setError(
        "Une erreur est survenue. Veuillez réessayer ou nous contacter par e-mail."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <Link
          href="/zoove-pro"
          className={styles.backButton}
        >
          <ArrowLeft size={17} />
          Retour
        </Link>
      </section>

      <section className={styles.content}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>
            Professionnels animaliers
          </span>

          <h1 className={styles.title}>
            Je souhaite{" "}
            <span className={styles.gradientText}>
              participer.
            </span>
          </h1>

          <p className={styles.description}>
            Laissez-moi vos coordonnées, je vous
            contacterai personnellement pour
            échanger sur votre métier et vous
            présenter <strong>Zoove Pro.</strong>
          </p>
        </div>

        <form
          className={styles.form}
          onSubmit={handleSubmit}
        >
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <UserRound className={styles.fieldIcon} />

              <div className={styles.fieldBody}>
                <label htmlFor="name">
                  Nom et prénom <span>*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Votre nom et prénom"
                  required
                  maxLength={120}
                  value={form.name}
                  onChange={(e) =>
                    updateField("name", e.target.value)
                  }
                />
              </div>
            </div>

            <div className={styles.field}>
              <Store className={styles.fieldIcon} />

              <div className={styles.fieldBody}>
                <label htmlFor="business">
                  Nom de votre établissement
                  <small> (optionnel)</small>
                </label>
                <input
                  id="business"
                  type="text"
                  placeholder="Ex. Le Salon des Pattes"
                  maxLength={120}
                  value={form.business}
                  onChange={(e) =>
                    updateField("business", e.target.value)
                  }
                />
              </div>
            </div>

            <div className={styles.field}>
              <BriefcaseBusiness
                className={styles.fieldIcon}
              />

              <div className={styles.fieldBody}>
                <label htmlFor="profession">
                  Votre profession <span>*</span>
                </label>
                <select
                  id="profession"
                  required
                  value={form.profession}
                  onChange={(e) =>
                    updateField(
                      "profession",
                      e.target.value
                    )
                  }
                >
                  <option value="Toiletteur / Toiletteuse">
                    Toiletteur / Toiletteuse
                  </option>
                  <option value="Pet sitter">
                    Pet sitter
                  </option>
                  <option value="Vétérinaire">
                    Vétérinaire
                  </option>
                  <option value="Éducateur canin">
                    Éducateur canin
                  </option>
                  <option value="Ostéopathe animalier">
                    Ostéopathe animalier
                  </option>
                  <option value="Nutritionniste animalier">
                    Nutritionniste animalier
                  </option>
                  <option value="Autre">
                    Autre
                  </option>
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <Phone className={styles.fieldIcon} />

              <div className={styles.fieldBody}>
                <label htmlFor="phone">
                  Téléphone <span>*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="06 00 00 00 00"
                  required
                  maxLength={30}
                  value={form.phone}
                  onChange={(e) =>
                    updateField("phone", e.target.value)
                  }
                />
              </div>
            </div>

            <div className={styles.field}>
              <MapPin className={styles.fieldIcon} />

              <div className={styles.fieldBody}>
                <label htmlFor="city">
                  Ville <span>*</span>
                </label>
                <input
                  id="city"
                  type="text"
                  autoComplete="address-level2"
                  placeholder="Votre ville"
                  required
                  maxLength={120}
                  value={form.city}
                  onChange={(e) =>
                    updateField("city", e.target.value)
                  }
                />
              </div>
            </div>

            <div className={styles.field}>
              <Mail className={styles.fieldIcon} />

              <div className={styles.fieldBody}>
                <label htmlFor="email">
                  E-mail <span>*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="vous@exemple.fr"
                  required
                  maxLength={254}
                  value={form.email}
                  onChange={(e) =>
                    updateField("email", e.target.value)
                  }
                />
              </div>
            </div>

            <div
              className={`${styles.field} ${styles.fullWidth}`}
            >
              <MessageSquare
                className={styles.fieldIcon}
              />

              <div className={styles.fieldBody}>
                <label htmlFor="message">
                  Un mot sur votre activité
                  <small> (optionnel)</small>
                </label>
                <textarea
                  id="message"
                  rows={3}
                  placeholder="Ex. Nombre d'animaux par semaine, types de prestations, etc."
                  maxLength={2000}
                  value={form.message}
                  onChange={(e) =>
                    updateField("message", e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          {success && (
            <p
              className={styles.success}
              role="status"
            >
              Merci pour votre participation !
              Votre demande a bien été envoyée.
              Je vous contacterai prochainement.
            </p>
          )}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading
              ? "Envoi en cours..."
              : "Envoyer ma candidature"}

            {!loading && (
              <ArrowRight
                size={22}
                aria-hidden="true"
              />
            )}
          </button>
        </form>

        <div className={styles.contact}>
          <Mail
            className={styles.contactIcon}
            aria-hidden="true"
          />

          <div>
            <h2>
              Vous préférez nous contacter
              directement ?
            </h2>

            <p>
              Vous pouvez aussi nous écrire à{" "}
              <a href="mailto:n.eddy@zoove.fr">
                n.eddy@zoove.fr
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

