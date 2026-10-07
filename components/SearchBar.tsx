"use client"

import { useState } from "react"
import "./SearchBar.css"

import {
  useLanguage
} from "@/context/LanguageContext"

import {
  translate
} from "@/translations/translations"

type Props = {
  onSearch: (city: string) => void
}

export default function SearchBar({
  onSearch
}: Props) {

  const [city, setCity] =
    useState("")

  const { language } =
    useLanguage()

  const handleSearch = () => {
    onSearch(city)
  }

  return (
    <section className="searchContainer">

      <div className="searchBox">

        <div className="searchField">

          <span>📍</span>

          <input
            type="text"
            placeholder={translate(
              language,
              "Ville ou pays..."
            )}
            value={city}
            onChange={(event) =>
              setCity(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSearch()
              }
            }}
          />

        </div>

        <button
          type="button"
          className="searchButton"
          onClick={handleSearch}
        >
          {translate(
            language,
            "Rechercher"
          )}
        </button>

      </div>

    </section>
  )
}
