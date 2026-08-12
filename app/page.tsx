"use client"

import { useCallback, useEffect, useState } from "react"
import Header from "@/components/Header"
import SearchBar from "@/components/SearchBar"
import CategoryButtons from "@/components/CategoryButtons"
import ProfessionalList from "@/components/ProfessionalList"
import {
  fetchProfessionals,
  ProfessionalsCursor
} from "@/services/fetchProfessionals"

export default function Home() {
  const [professionals, setProfessionals] = useState<any[]>([])
  const [cursor, setCursor] =
    useState<ProfessionalsCursor | null>(null)

  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  const [searchedCity, setSearchedCity] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")

  const loadProfessionals = useCallback(async () => {
    if (loading || !hasMore) return

    try {
      setLoading(true)

      const page = await fetchProfessionals(cursor)

      setProfessionals((currentProfessionals) => {
        const existingKeys = new Set(
          currentProfessionals.map(
            (professional) =>
              `${professional.type}-${professional.id}`
          )
        )

        const newProfessionals = page.professionals.filter(
          (professional) =>
            !existingKeys.has(
              `${professional.type}-${professional.id}`
            )
        )

        return [
          ...currentProfessionals,
          ...newProfessionals
        ]
      })

      setCursor(page.cursor)
      setHasMore(page.hasMore)
    } catch (error) {
      console.error(
        "Erreur lors du chargement des professionnels :",
        error
      )
    } finally {
      setLoading(false)
    }
  }, [cursor, hasMore, loading])

  useEffect(() => {
    loadProfessionals()
  }, [])

  const normalizedSearch = searchedCity
    .trim()
    .toLowerCase()

  const filteredPros = professionals.filter((pro) => {
    const city = pro.city?.toLowerCase() ?? ""
    const country = pro.country?.toLowerCase() ?? ""

    const matchCity =
      normalizedSearch === "" ||
      city.includes(normalizedSearch) ||
      country.includes(normalizedSearch)

    const expertise = Array.isArray(pro.expertise)
      ? pro.expertise
      : []

    const matchCategory =
      selectedCategory === "" ||
      pro.speciality === selectedCategory ||
      expertise.includes(selectedCategory)

    return matchCity && matchCategory
  })

  return (
    <main>
      <Header />

      <SearchBar onSearch={setSearchedCity} />

      <CategoryButtons
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <ProfessionalList
        professionals={filteredPros}
        loadMore={loadProfessionals}
        hasMore={hasMore}
        loading={loading}
      />
    </main>
  )
}
