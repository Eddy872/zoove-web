"use client"

import {
  FormEvent,
  MouseEvent,
  useEffect,
  useState
} from "react"

import type {
  GroomingUser
} from "@/types/groomingUser"

import type {
  GroomingProfileUpdates
} from "@/services/updateGroomingProfile"

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
  grooming: GroomingUser
  language: Language
  onClose: () => void
  onSave: (
    updates: GroomingProfileUpdates
  ) => Promise<void>
}

export default function InformationsModal({
  grooming,
  language,
  onClose,
  onSave
}: InformationsModalProps) {
  const [
    formData,
    setFormData
  ] = useState<InformationsFormData>({
    name: grooming.name ?? "",
    infos: grooming.infos ?? "",
    adress: grooming.adress ?? "",
    city: grooming.city ?? "",
    country: grooming.country ?? "",
    phoneNumber:
      grooming.phoneNumber ?? ""
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
  }, [
    isSaving,
    onClose
  ])

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

    const updates: GroomingProfileUpdates =
      {
        name:
          formData.name.trim(),

        infos:
          formData.infos.trim(),

        adress:
          formData.adress.trim(),

        city:
          formData.city.trim(),

        country:
          formData.country.trim(),

        phoneNumber:
          formData.phoneNumber.trim()
      }

    try {
      setIsSaving(true)
      setError("")

      await onSave(updates)
    } catch (saveError) {
      console.error(
        "Erreur modification Grooming :",
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
      className="groomingModalOverlay"
      role="presentation"
      onMouseDown={
        handleOverlayClick
      }
    >
      <section
        className="groomingModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="groomingInformationsModalTitle"
      >
        <div className="groomingModalHeader">
          <div>
            <h2 id="groomingInformationsModalTitle">
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
            className="groomingModalCloseButton"
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
          className="groomingModalForm"
          onSubmit={handleSubmit}
        >
          <div className="groomingFormGroup">
            <label htmlFor="grooming-name">
              {translate(
                language,
                "Nom"
              )}
            </label>

            <input
              id="grooming-name"
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

          <div className="groomingFormGroup groomingFormGroupFull">
            <label htmlFor="grooming-infos">
              {translate(
                language,
                "Présentation"
              )}
            </label>

            <textarea
              id="grooming-infos"
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

            <span className="groomingCharacterCount">
              {formData.infos.length}
              /1000
            </span>
          </div>

          <div className="groomingFormGroup groomingFormGroupFull">
            <label htmlFor="grooming-adress">
              {translate(
                language,
                "Adresse"
              )}
            </label>

            <input
              id="grooming-adress"
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

          <div className="groomingFormGrid">
            <div className="groomingFormGroup">
              <label htmlFor="grooming-city">
                {translate(
                  language,
                  "Ville"
                )}
              </label>

              <input
                id="grooming-city"
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

            <div className="groomingFormGroup">
              <label htmlFor="grooming-country">
                {translate(
                  language,
                  "Pays"
                )}
              </label>

              <input
                id="grooming-country"
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

          <div className="groomingFormGroup">
            <label htmlFor="grooming-phoneNumber">
              {translate(
                language,
                "Téléphone"
              )}
            </label>

            <input
              id="grooming-phoneNumber"
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
              className="groomingModalError"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="groomingModalActions">
            <button
              type="button"
              className="groomingSecondaryButton"
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
              className="groomingPrimaryButton"
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
