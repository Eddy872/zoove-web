"use client"

import {
  FormEvent,
  useEffect,
  useState
} from "react"

import {
  translate
} from "@/translations/translations"
import type { Language } from "@/context/LanguageContext"

type CollaboratorFormItem = {
  name: string
  disponibilities:
    Record<string, boolean>
}

type CollaboratorsModalProps = {
  isOpen: boolean
  collaborators: string[]
  collaboratorsDispos: string[]
  language: Language
  onClose: () => void
  onSave: (
    updates: {
      collaborators: string[]
      collaboratorsDispos: string[]
    }
  ) => Promise<void>
}

const weekDays = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche"
]

function createInitialDisponibilities():
  Record<string, boolean> {
  return Object.fromEntries(
    weekDays.map(day => [
      day,
      false
    ])
  )
}

function parseYesNoValue(
  value: string
): boolean {
  const normalizedValue =
    value
      .trim()
      .toLowerCase()

  return (
    normalizedValue === "oui" ||
    normalizedValue === "yes" ||
    normalizedValue === "true" ||
    normalizedValue === "1"
  )
}

function parseDisponibilities(
  rawValue: string
): Record<string, boolean> {
  const initialDisponibilities =
    createInitialDisponibilities()

  if (!rawValue.trim()) {
    return initialDisponibilities
  }

  rawValue
    .split(",")
    .map(item => item.trim())
    .filter(Boolean)
    .forEach(item => {
      const separatorIndex =
        item.indexOf("=")

      if (separatorIndex === -1) {
        return
      }

      const day =
        item
          .slice(
            0,
            separatorIndex
          )
          .trim()

      const rawAvailability =
        item
          .slice(
            separatorIndex + 1
          )
          .trim()

      if (!weekDays.includes(day)) {
        return
      }

      initialDisponibilities[day] =
        parseYesNoValue(
          rawAvailability
        )
    })

  return initialDisponibilities
}

function createDisponibilitiesString(
  disponibilities:
    Record<string, boolean>
): string {
  return weekDays
    .map(day => {
      const isAvailable =
        disponibilities[day] ??
        false

      return (
        `${day}=` +
        `${isAvailable ? "Oui" : "Non"}`
      )
    })
    .join(",")
}

function createInitialCollaborators(
  collaborators: string[],
  collaboratorsDispos: string[]
): CollaboratorFormItem[] {
  return collaborators.map(
    (name, index) => ({
      name,
      disponibilities:
        parseDisponibilities(
          collaboratorsDispos[index] ??
            ""
        )
    })
  )
}

export default function CollaboratorsModal({
  isOpen,
  collaborators,
  collaboratorsDispos,
  language,
  onClose,
  onSave
}: CollaboratorsModalProps) {
  const [
    formCollaborators,
    setFormCollaborators
  ] = useState<
    CollaboratorFormItem[]
  >([])

  const [
    error,
    setError
  ] = useState("")

  const [
    isSaving,
    setIsSaving
  ] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setFormCollaborators(
      createInitialCollaborators(
        collaborators,
        collaboratorsDispos
      )
    )

    setError("")
  }, [
    isOpen,
    collaborators,
    collaboratorsDispos
  ])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow =
      "hidden"

    return () => {
      document.body.style.overflow =
        previousOverflow
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  function addCollaborator() {
    setFormCollaborators(
      currentCollaborators => [
        ...currentCollaborators,
        {
          name: "",
          disponibilities:
            createInitialDisponibilities()
        }
      ]
    )
  }

  function removeCollaborator(
    collaboratorIndex: number
  ) {
    setFormCollaborators(
      currentCollaborators =>
        currentCollaborators.filter(
          (_, index) =>
            index !==
            collaboratorIndex
        )
    )
  }

  function updateCollaboratorName(
    collaboratorIndex: number,
    value: string
  ) {
    setFormCollaborators(
      currentCollaborators =>
        currentCollaborators.map(
          (collaborator, index) =>
            index ===
            collaboratorIndex
              ? {
                  ...collaborator,
                  name: value
                }
              : collaborator
        )
    )
  }

  function updateDisponibility(
    collaboratorIndex: number,
    day: string,
    isAvailable: boolean
  ) {
    setFormCollaborators(
      currentCollaborators =>
        currentCollaborators.map(
          (collaborator, index) =>
            index ===
            collaboratorIndex
              ? {
                  ...collaborator,
                  disponibilities: {
                    ...collaborator
                      .disponibilities,

                    [day]:
                      isAvailable
                  }
                }
              : collaborator
        )
    )
  }

  function validate(): boolean {
    const hasEmptyName =
      formCollaborators.some(
        collaborator =>
          !collaborator
            .name
            .trim()
      )

    if (hasEmptyName) {
      setError(
        translate(
          language,
          "Indiquez le nom de chaque collaborateur ajouté."
        )
      )

      return false
    }

    const normalizedNames =
      formCollaborators.map(
        collaborator =>
          collaborator
            .name
            .trim()
            .toLowerCase()
      )

    const hasDuplicate =
      new Set(normalizedNames).size !==
      normalizedNames.length

    if (hasDuplicate) {
      setError(
        translate(
          language,
          "Deux collaborateurs ne peuvent pas avoir le même nom."
        )
      )

      return false
    }

    setError("")
    return true
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (
      isSaving ||
      !validate()
    ) {
      return
    }

    setIsSaving(true)
    setError("")

    try {
      const formattedCollaborators =
        formCollaborators.map(
          collaborator =>
            collaborator
              .name
              .trim()
        )

      const formattedCollaboratorsDispos =
        formCollaborators.map(
          collaborator =>
            createDisponibilitiesString(
              collaborator
                .disponibilities
            )
        )

      await onSave({
        collaborators:
          formattedCollaborators,

        collaboratorsDispos:
          formattedCollaboratorsDispos
      })
    } catch (saveError) {
      console.error(
        "Erreur sauvegarde collaborateurs :",
        saveError
      )

      setError(
        saveError instanceof Error
          ? saveError.message
          : translate(
              language,
              "Impossible d'enregistrer les collaborateurs."
            )
      )
    } finally {
      setIsSaving(false)
    }
  }

    return (
      <div
        className="groomingModalOverlay"
        role="presentation"
        onMouseDown={event => {
          if (
            event.target ===
              event.currentTarget &&
            !isSaving
          ) {
            onClose()
          }
        }}
      >
        <div
          className="groomingCollaboratorsModal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="grooming-collaborators-modal-title"
        >
          <div className="groomingModalHeader">
            <div>
              <h2 id="grooming-collaborators-modal-title">
                {translate(
                  language,
                  "Modifier les collaborateurs"
                )}
              </h2>

              <p>
                {translate(
                  language,
                  "Ajoutez les membres de votre équipe et leurs jours de disponibilité."
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
            className="groomingCollaboratorsModalForm"
            onSubmit={handleSubmit}
          >
            <div className="groomingCollaboratorsToolbar">
              <span>
                {formCollaborators.length}{" "}
                {translate(
                  language,
                  formCollaborators.length > 1
                    ? "collaborateurs"
                    : "collaborateur"
                )}
              </span>

              <button
                type="button"
                className="groomingSecondaryButton"
                onClick={addCollaborator}
                disabled={isSaving}
              >
                +{" "}
                {translate(
                  language,
                  "Ajouter un collaborateur"
                )}
              </button>
            </div>

            {formCollaborators.length === 0 ? (
              <div className="groomingEmptyCollaborators">
                <p>
                  {translate(
                    language,
                    "Aucun collaborateur ajouté."
                  )}
                </p>

                <button
                  type="button"
                  className="groomingSecondaryButton"
                  onClick={addCollaborator}
                  disabled={isSaving}
                >
                  +{" "}
                  {translate(
                    language,
                    "Ajouter un collaborateur"
                  )}
                </button>
              </div>
            ) : (
              <div className="groomingCollaboratorsList">
                {formCollaborators.map(
                  (
                    collaborator,
                    collaboratorIndex
                  ) => (
                    <div
                      className="groomingCollaboratorCard"
                      key={
                        `${collaboratorIndex}-${collaborator.name}`
                      }
                    >
                      <div className="groomingCollaboratorCardHeader">
                        <label>
                          <span>
                            {translate(
                              language,
                              "Nom du collaborateur"
                            )}
                          </span>

                          <input
                            type="text"
                            value={
                              collaborator.name
                            }
                            onChange={event =>
                              updateCollaboratorName(
                                collaboratorIndex,
                                event.target.value
                              )
                            }
                            placeholder={translate(
                              language,
                              "Nom du collaborateur"
                            )}
                            disabled={
                              isSaving
                            }
                            autoFocus={
                              collaboratorIndex ===
                                formCollaborators.length -
                                  1 &&
                              !collaborator.name
                            }
                          />
                        </label>

                        <button
                          type="button"
                          className="groomingRemoveCollaboratorButton"
                          onClick={() =>
                            removeCollaborator(
                              collaboratorIndex
                            )
                          }
                          disabled={isSaving}
                          aria-label={translate(
                            language,
                            "Supprimer le collaborateur"
                          )}
                        >
                          ×
                        </button>
                      </div>

                      <div className="groomingCollaboratorDisponibilities">
                        <span className="groomingCollaboratorDisponibilitiesTitle">
                          {translate(
                            language,
                            "Disponibilités"
                          )}
                        </span>

                        <div className="groomingCollaboratorDays">
                          {weekDays.map(day => {
                            const isAvailable =
                              collaborator
                                .disponibilities[
                                day
                              ] ?? false

                            return (
                              <label
                                className={
                                  isAvailable
                                    ? "groomingCollaboratorDay groomingCollaboratorDaySelected"
                                    : "groomingCollaboratorDay"
                                }
                                key={day}
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    isAvailable
                                  }
                                  onChange={event =>
                                    updateDisponibility(
                                      collaboratorIndex,
                                      day,
                                      event.target
                                        .checked
                                    )
                                  }
                                  disabled={
                                    isSaving
                                  }
                                />

                                <span>
                                  {translate(
                                    language,
                                    day
                                  )}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {error && (
              <p
                className="groomingModalError"
                role="alert"
              >
                {error}
              </p>
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
        </div>
      </div>
    )
}

