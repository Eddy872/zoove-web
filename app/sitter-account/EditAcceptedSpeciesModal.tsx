"use client"

import { useState } from "react"
import "./sitter-profile.css"
import { translate } from "@/translations/translations"
import {
  useLanguage,
  type Language
} from "@/context/LanguageContext"

type Props = {
  acceptedSpecies: string[]
  onBack: () => void
  onSave: (acceptedSpecies: string[]) => void
}

const speciesLabels: Record<string, string> = {
  dog: "Chien",
  cat: "Chat",
  fish: "Poisson",
  tortoise: "Tortue",
  monkey: "Singe",
  snake: "Serpent",
  camel: "Chameau",
  frog: "Grenouille",
  horse: "Cheval",
  rabbit: "Lapin",
  rooster: "Coq",
  tiger: "Tigre",
  rat: "Rat",
  bird: "Oiseau",
}

export default function EditAcceptedSpeciesModal({
  acceptedSpecies,
  onBack,
  onSave,
}: Props) {
  const { language } = useLanguage()

  const [selectedSpecies, setSelectedSpecies] =
    useState<string[]>(acceptedSpecies ?? [])

  function toggleSpecies(species: string) {
    if (selectedSpecies.includes(species)) {
      setSelectedSpecies(
        selectedSpecies.filter(
          (item) => item !== species
        )
      )
    } else {
      setSelectedSpecies([
        ...selectedSpecies,
        species,
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
            {translate(language, "Espèces acceptées")}
          </h1>
            
            <div className="sitterHeaderSpacer" />
        </div>

        <div className="sitterEditCard">
          <div className="sitterEditList">
            {Object.entries(speciesLabels).map(
              ([key, label]) => (
                <label
                  key={key}
                  className="sitterEditRow"
                >
                  <span className="sitterEditLabel">
                    {translate(language, label)}
                  </span>

                  <input
                    type="checkbox"
                    className="sitterEditCheckbox"
                    checked={selectedSpecies.includes(key)}
                    onChange={() => toggleSpecies(key)}
                  />
                </label>
              )
            )}
          </div>

          <button
            type="button"
            className="sitterSaveButton"
            onClick={() => onSave(selectedSpecies)}
          >
            {translate(language, "Enregistrer")}
          </button>
        </div>
      </div>
    )
}
