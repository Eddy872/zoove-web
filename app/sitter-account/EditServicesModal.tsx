"use client"

import { useState } from "react"
import "./sitter-profile.css"
import { translate } from "@/translations/translations"
import {
  useLanguage,
  type Language
} from "@/context/LanguageContext"

type Props = {
  services: string[]
  onBack: () => void
  onSave: (services: string[]) => void
}

const availableServices = [
  "garde",
  "visites",
  "promenade",
  "hebergement",
  "transport",
]

const serviceLabels: Record<string, string> = {
  garde: "Garde",
  visites: "Visites",
  promenade: "Promenade",
  hebergement: "Hébergement",
  transport: "Transport",
}

export default function EditServicesModal({
  services,
  onBack,
  onSave,
}: Props) {
  const { language } = useLanguage()

  const [selectedServices, setSelectedServices] =
    useState<string[]>(services)

  function toggleService(service: string) {
    if (selectedServices.includes(service)) {
      setSelectedServices(
        selectedServices.filter((s) => s !== service)
      )
    } else {
      setSelectedServices([
        ...selectedServices,
        service,
      ])
    }
  }

    return (
      <div className="sitterEditContainer">
        <div className="sitterEditHeader">
          <button
            type="button"
            className="sitterBackButton"
            onClick={onBack}
          >
            {translate(language, "Annuler")}
          </button>

          <h1 className="sitterEditTitle">
            {translate(language, "Services")}
          </h1>
            
            <div className="sitterHeaderSpacer" />
        </div>

        <div className="sitterEditCard">
          <div className="sitterEditList">
            {availableServices.map((service) => (
              <label
                key={service}
                className="sitterEditRow"
              >
                <span className="sitterEditLabel">
                  {translate(
                    language,
                    serviceLabels[service]
                  )}
                </span>

                <input
                  type="checkbox"
                  className="sitterEditCheckbox"
                  checked={selectedServices.includes(service)}
                  onChange={() => toggleService(service)}
                />
              </label>
            ))}
          </div>

          <button
            type="button"
            className="sitterSaveButton"
            onClick={() => onSave(selectedServices)}
          >
            {translate(language, "Enregistrer")}
          </button>
        </div>
      </div>
    )
}
