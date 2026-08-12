"use client"

import { useState } from "react"
import "./SearchBar.css"
import {
  useLanguage,
  type Language
} from "@/context/LanguageContext"
import { translate } from "@/translations/translations"


type Props = {
  onSearch: (city: string) => void
}

export default function SearchBar({ onSearch }: Props) {
  const [city, setCity] = useState("")
    const { language } = useLanguage()
  return (
    <section className="searchContainer">
      <div className="searchBox">
        <div className="searchField">
          <span>📍</span>

          <input
            type="text"
          placeholder={translate(language, "Ville ou pays...")}
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>

        <button
          className="searchButton"
          onClick={() => onSearch(city)}
        >
          {translate(language, "Rechercher")}
        </button>
      </div>
    </section>
  )
}
