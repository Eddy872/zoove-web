"use client"

import {
  FormEvent,
  MouseEvent,
  useEffect,
  useState
} from "react"

import type {
  HealthcareUser
} from "@/types/healthcareUser"

import type {
  HealthcareProfileUpdates
} from "@/services/updateHealthcareProfile"

import {
  translate
} from "@/translations/translations"
import type { Language } from "@/context/LanguageContext"

type InformationsFormData = {
  name: string
  infos: string
  adress: string
  city: string
  country: string
  phoneNumber: string
}

type InformationsModalProps = {
  healthcare: HealthcareUser
  language: Language
  onClose: () => void
  onSave: (
    updates: HealthcareProfileUpdates
  ) => Promise<void>
}

export default function InformationsModal({
  healthcare,
  language,
  onClose,
  onSave
}: InformationsModalProps) {
  const [
    formData,
    setFormData
  ] = useState<InformationsFormData>({
    name: healthcare.name ?? "",
    infos: healthcare.infos ?? "",
    adress: healthcare.adress ?? "",
    city: healthcare.city ?? "",
    country: healthcare.country ?? "",
    phoneNumber:
      healthcare.phoneNumber ?? ""
  })

  const [
    isSaving,
    setIsSaving
  ] = useState(false)

  const [
    error,
    setError
  ] = useState("")

  useEffect(() => {
    function handleEscape(
      event: KeyboardEvent
    ) {
      if (
        event.key === "Escape" &&
        !isSaving
      ) {
        onClose()
      }
    }

    document.addEventListener(
      "keydown",
      handleEscape
    )

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow =
      "hidden"

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      )

      document.body.style.overflow =
        previousOverflow
    }
  }, [isSaving, onClose])

  function updateField(
    field: keyof InformationsFormData,
    value: string
  ) {
    setFormData(previous => ({
      ...previous,
      [field]: value
    }))

    if (error) {
      setError("")
    }
  }

  function validateForm(): string {
    if (!formData.name.trim()) {
      return translate(
        language,
        "Le nom est obligatoire."
      )
    }

    if (!formData.adress.trim()) {
      return translate(
        language,
        "L’adresse est obligatoire."
      )
    }

    if (!formData.city.trim()) {
      return translate(
        language,
        "La ville est obligatoire."
      )
    }

    if (!formData.country.trim()) {
      return translate(
        language,
        "Le pays est obligatoire."
      )
    }

    if (!formData.phoneNumber.trim()) {
      return translate(
        language,
        "Le numéro de téléphone est obligatoire."
      )
    }

    return ""
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (isSaving) {
      return
    }

    const validationError =
      validateForm()

    if (validationError) {
      setError(validationError)
      return
    }

    const updates: HealthcareProfileUpdates =
      {
        name: formData.name.trim(),
        infos: formData.infos.trim(),
        adress: formData.adress.trim(),
        city: formData.city.trim(),
        country: formData.country.trim(),
        phoneNumber:
          formData.phoneNumber.trim()
      }

    try {
      setIsSaving(true)
      setError("")

      await onSave(updates)
    } catch (saveError) {
      console.error(
        "Erreur modification Healthcare :",
        saveError
      )

      setError(
        saveError instanceof Error
          ? saveError.message
          : translate(
              language,
              "Impossible de modifier les informations."
            )
      )
    } finally {
      setIsSaving(false)
    }
  }

  function handleOverlayClick(
    event: MouseEvent<HTMLDivElement>
  ) {
    if (
      event.target ===
        event.currentTarget &&
      !isSaving
    ) {
      onClose()
    }
  }

  return (
    <div
      className="healthcareModalOverlay"
      role="presentation"
      onMouseDown={
        handleOverlayClick
      }
    >
      <section
        className="healthcareModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="healthcareInformationsModalTitle"
      >
        <div className="healthcareModalHeader">
          <div>
            <h2 id="healthcareInformationsModalTitle">
              {translate(
                language,
                "Modifier les informations"
              )}
            </h2>

            <p>
              {translate(
                language,
                "Modifiez les coordonnées et la présentation de votre établissement."
              )}
            </p>
          </div>

          <button
            type="button"
            className="healthcareModalCloseButton"
            onClick={onClose}
            disabled={isSaving}
            aria-label={translate(
              language,
              "Fermer"
            )}
          >
            ×
          </button>
        </div>

        <form
          className="healthcareModalForm"
          onSubmit={handleSubmit}
        >
          <div className="healthcareFormGroup">
            <label htmlFor="healthcare-name">
              {translate(
                language,
                "Nom"
              )}
            </label>

            <input
              id="healthcare-name"
              type="text"
              value={formData.name}
              onChange={event =>
                updateField(
                  "name",
                  event.target.value
                )
              }
              disabled={isSaving}
              autoComplete="organization"
            />
          </div>

          <div className="healthcareFormGroup healthcareFormGroupFull">
            <label htmlFor="healthcare-infos">
              {translate(
                language,
                "Présentation"
              )}
            </label>

            <textarea
              id="healthcare-infos"
              value={formData.infos}
              onChange={event =>
                updateField(
                  "infos",
                  event.target.value
                )
              }
              disabled={isSaving}
              rows={5}
              maxLength={1000}
              placeholder={translate(
                language,
                "Présentez votre activité..."
              )}
            />

            <span className="healthcareCharacterCount">
              {formData.infos.length}
              /1000
            </span>
          </div>

          <div className="healthcareFormGroup healthcareFormGroupFull">
            <label htmlFor="healthcare-adress">
              {translate(
                language,
                "Adresse"
              )}
            </label>

            <input
              id="healthcare-adress"
              type="text"
              value={formData.adress}
              onChange={event =>
                updateField(
                  "adress",
                  event.target.value
                )
              }
              disabled={isSaving}
              autoComplete="street-address"
            />
          </div>

          <div className="healthcareFormGrid">
            <div className="healthcareFormGroup">
              <label htmlFor="healthcare-city">
                {translate(
                  language,
                  "Ville"
                )}
              </label>

              <input
                id="healthcare-city"
                type="text"
                value={formData.city}
                onChange={event =>
                  updateField(
                    "city",
                    event.target.value
                  )
                }
                disabled={isSaving}
                autoComplete="address-level2"
              />
            </div>

            <div className="healthcareFormGroup">
              <label htmlFor="healthcare-country">
                {translate(
                  language,
                  "Pays"
                )}
              </label>

              <input
                id="healthcare-country"
                type="text"
                value={
                  formData.country
                }
                onChange={event =>
                  updateField(
                    "country",
                    event.target.value
                  )
                }
                disabled={isSaving}
                autoComplete="country-name"
              />
            </div>
          </div>

          <div className="healthcareFormGroup">
            <label htmlFor="healthcare-phoneNumber">
              {translate(
                language,
                "Téléphone"
              )}
            </label>

            <input
              id="healthcare-phoneNumber"
              type="tel"
              value={
                formData.phoneNumber
              }
              onChange={event =>
                updateField(
                  "phoneNumber",
                  event.target.value
                )
              }
              disabled={isSaving}
              autoComplete="tel"
            />
          </div>

          {error && (
            <div
              className="healthcareModalError"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="healthcareModalActions">
            <button
              type="button"
              className="healthcareSecondaryButton"
              onClick={onClose}
              disabled={isSaving}
            >
              {translate(
                language,
                "Annuler"
              )}
            </button>

            <button
              type="submit"
              className="healthcarePrimaryButton"
              disabled={isSaving}
            >
              {isSaving
                ? translate(
                    language,
                    "Enregistrement..."
                  )
                : translate(
                    language,
                    "Enregistrer"
                  )}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
