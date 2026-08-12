"use client"

import {
  ChangeEvent,
  useEffect,
  useState
} from "react"

import "./sitter-profile.css"

import {
  useLanguage,
  type Language
} from "@/context/LanguageContext"

import {
  translate
} from "@/translations/translations"

export type EditableInformations = {
  infos: string
  city: string
  country: string
  phoneNumber: string
  paypalID: string
}

type Props = {
  informations: EditableInformations
  onBack: () => void
  onSave: (
    informations: EditableInformations
  ) => void | Promise<void>
  isSaving?: boolean
}

export default function EditInformationsModal({
  informations,
  onBack,
  onSave,
  isSaving = false
}: Props) {
  const { language } =
    useLanguage()

  const [
    form,
    setForm
  ] = useState<EditableInformations>(
    informations
  )

  const [
    error,
    setError
  ] = useState("")

  useEffect(() => {
    setForm(informations)
    setError("")
  }, [informations])

  function updateField(
    field: keyof EditableInformations,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value
    }))
  }

  function handleChange(
    event:
      ChangeEvent<
        HTMLInputElement |
        HTMLTextAreaElement
      >
  ) {
    const field =
      event.target
        .name as keyof EditableInformations

    updateField(
      field,
      event.target.value
    )
  }

  function isValidEmail(
    value: string
  ): boolean {
    if (!value.trim()) {
      return true
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      value.trim()
    )
  }

  async function handleSave() {
    const normalizedForm:
      EditableInformations = {
      infos:
        form.infos.trim(),

      city:
        form.city.trim(),

      country:
        form.country.trim(),

      phoneNumber:
        form.phoneNumber.trim(),

      paypalID:
        form.paypalID.trim()
    }

    if (!normalizedForm.city) {
      setError(
        translate(
          language,
          "La ville est obligatoire."
        )
      )

      return
    }

    if (!normalizedForm.country) {
      setError(
        translate(
          language,
          "Le pays est obligatoire."
        )
      )

      return
    }

    if (
      !normalizedForm.phoneNumber
    ) {
      setError(
        translate(
          language,
          "Le numéro de téléphone est obligatoire."
        )
      )

      return
    }

    if (
      normalizedForm.paypalID &&
      !isValidEmail(
        normalizedForm.paypalID
      )
    ) {
      setError(
        translate(
          language,
          "Entrez une adresse PayPal valide."
        )
      )

      return
    }

    setError("")

    await onSave(
      normalizedForm
    )
  }

  return (
    <div className="sitterEditContainer">
      <div className="sitterEditHeader">
        <button
          type="button"
          className="sitterBackButton"
          onClick={onBack}
          disabled={isSaving}
        >
          {translate(
            language,
            "Annuler"
          )}
        </button>

        <h1 className="sitterEditTitle">
          {translate(
            language,
            "Informations"
          )}
        </h1>

        <div className="sitterHeaderSpacer" />
      </div>

      <div className="sitterEditCard">
        {error && (
          <p
            className="sitterEditError"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="sitterInformationsForm">
          <label className="sitterEditField sitterEditFieldFull">
            <span className="sitterEditFieldLabel">
              {translate(
                language,
                "Présentation"
              )}
            </span>

            <textarea
              name="infos"
              className="sitterEditTextarea"
              value={form.infos}
              rows={6}
              onChange={handleChange}
              placeholder={translate(
                language,
                "Présentez votre activité..."
              )}
              disabled={isSaving}
            />
          </label>

          <div className="sitterEditFieldsGrid">
            <label className="sitterEditField">
              <span className="sitterEditFieldLabel">
                {translate(
                  language,
                  "Ville"
                )}
              </span>

              <input
                type="text"
                name="city"
                className="sitterEditInput"
                value={form.city}
                onChange={handleChange}
                autoComplete="address-level2"
                disabled={isSaving}
              />
            </label>

            <label className="sitterEditField">
              <span className="sitterEditFieldLabel">
                {translate(
                  language,
                  "Pays"
                )}
              </span>

              <input
                type="text"
                name="country"
                className="sitterEditInput"
                value={form.country}
                onChange={handleChange}
                autoComplete="country-name"
                disabled={isSaving}
              />
            </label>

            <label className="sitterEditField">
              <span className="sitterEditFieldLabel">
                {translate(
                  language,
                  "Numéro de téléphone"
                )}
              </span>

              <input
                type="tel"
                name="phoneNumber"
                className="sitterEditInput"
                value={form.phoneNumber}
                onChange={handleChange}
                autoComplete="tel"
                disabled={isSaving}
              />
            </label>

            <label className="sitterEditField">
              <span className="sitterEditFieldLabel">
                {translate(
                  language,
                  "Adresse PayPal"
                )}
              </span>

              <input
                type="email"
                name="paypalID"
                className="sitterEditInput"
                value={form.paypalID}
                onChange={handleChange}
                autoComplete="email"
                placeholder="exemple@email.com"
                disabled={isSaving}
              />
            </label>
          </div>
        </div>

        <button
          type="button"
          className="sitterSaveButton"
          disabled={isSaving}
          onClick={handleSave}
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
    </div>
  )
}
