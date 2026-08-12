"use client"

import {
  FormEvent,
  MouseEvent,
  useEffect,
  useState
} from "react"

import type {
  HealthcareProfileUpdates
} from "@/services/updateHealthcareProfile"

import {
  translate
} from "@/translations/translations"
import type { Language } from "@/context/LanguageContext"

type ExpertiseModalProps = {
  expertise: string[]
  language: Language
  onClose: () => void
  onSave: (
    updates: HealthcareProfileUpdates
  ) => Promise<void>
}

const expertiseOptions = [
  "Vétérinaire",
  "Ostéopathe",
  "Nutrition",
  "Éducateur",
  "Comportement"
]

function normalizeExpertise(
  expertise: string
): string {
  return expertise
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
}

export default function ExpertiseModal({
  expertise,
  language,
  onClose,
  onSave
}: ExpertiseModalProps) {
  const [
    selectedExpertise,
    setSelectedExpertise
  ] = useState<string[]>(() =>
    expertise.map(normalizeExpertise)
  )

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

    function toggleExpertise(item: string) {
      setSelectedExpertise(previous =>
        previous.includes(item)
          ? previous.filter(
              value => value !== item
            )
          : [...previous, item]
      )
    }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (isSaving) {
      return
    }

    try {
      setIsSaving(true)
      setError("")

      await onSave({
        expertise:
          selectedExpertise
      })
    } catch (saveError) {
      console.error(
        "Erreur modification spécialités :",
        saveError
      )

      setError(
        saveError instanceof Error
          ? saveError.message
          : translate(
              language,
              "Impossible de modifier les spécialités."
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
        aria-labelledby="expertiseModalTitle"
      >
        <div className="healthcareModalHeader">
          <div>
            <h2 id="expertiseModalTitle">
              {translate(
                language,
                "Modifier les spécialités"
              )}
            </h2>

            <p>
              {translate(
                language,
                "Sélectionnez les domaines d'expertise de votre établissement."
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
          <div className="healthcareExpertiseSelectionGrid">
            {expertiseOptions.map(option => {
              const isSelected =
                selectedExpertise.includes(option)

              return (
                <button
                  key={option}
                  type="button"
                  className={
                    isSelected
                      ? "healthcareExpertiseOption healthcareExpertiseOptionSelected"
                      : "healthcareExpertiseOption"
                  }
                  onClick={() => toggleExpertise(option)}
                >
                  <span className="healthcareExpertiseCheckbox">
                    {isSelected ? "✓" : ""}
                  </span>

                  <span>{option}</span>
                </button>
              )
            })}
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
