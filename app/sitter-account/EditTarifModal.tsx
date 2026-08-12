"use client"

import { useState } from "react"
import "./sitter-profile.css"
import { translate } from "@/translations/translations"
import {
  useLanguage,
  type Language
} from "@/context/LanguageContext"

type Props = {
  tarif: number
  onBack: () => void
  onSave: (tarif: number) => void
}

export default function EditTarifModal({
  tarif,
  onBack,
  onSave,
}: Props) {
  const { language } = useLanguage()

    const [currentTarif, setCurrentTarif] = useState<number>(
      tarif ?? 10
    )

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
            {translate(language, "Tarif horaire")}
          </h1>
            
        <div className="sitterHeaderSpacer" />
        </div>

        <div className="sitterEditCard">
          <p className="sitterEditLabel">
            {translate(language, "Tarif")}
          </p>

          <div className="sitterTarifValue">
            {currentTarif} € / h
          </div>

          <input
            type="range"
            className="sitterSlider"
            min={10}
            max={100}
            step={1}
            value={currentTarif}
            onChange={(event) =>
              setCurrentTarif(Number(event.target.value))
            }
          />

          <button
            type="button"
            className="sitterSaveButton"
            onClick={() => onSave(currentTarif)}
          >
            {translate(language, "Enregistrer")}
          </button>
        </div>
      </div>
    )
}
