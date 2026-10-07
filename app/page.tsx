"use client"

import {
  useCallback,
  useEffect,
  useState
} from "react"

import Header from "@/components/Header"
import SearchBar from "@/components/SearchBar"
import CategoryButtons from "@/components/CategoryButtons"
import ProfessionalList from "@/components/ProfessionalList"

import SitterServiceFilters, {
  type SitterService
} from "@/components/SitterServicesFilters"

import {
  fetchProfessionals,
  ProfessionalsCursor
} from "@/services/fetchProfessionals"

const SITTER_CATEGORY = "Pet Sitter"

const DEFAULT_SITTER_SERVICES: SitterService[] = [
  "garde",
  "promenades",
  "visites",
  "hebergement",
  "transport"
]

export default function Home() {

  const [professionals, setProfessionals] =
    useState<any[]>([])

  const [cursor, setCursor] =
    useState<ProfessionalsCursor | null>(null)

  const [hasMore, setHasMore] =
    useState(true)

  const [loading, setLoading] =
    useState(false)

  const [searchedCity, setSearchedCity] =
    useState("")

  const [selectedCategory, setSelectedCategory] =
    useState("")

  const [
    selectedSitterServices,
    setSelectedSitterServices
  ] = useState<SitterService[]>(
    DEFAULT_SITTER_SERVICES
  )

  const loadProfessionals =
    useCallback(async () => {

      if (loading || !hasMore) return

      try {

        setLoading(true)

        const page =
          await fetchProfessionals(cursor)

        setProfessionals(
          (currentProfessionals) => {

            const existingKeys =
              new Set(
                currentProfessionals.map(
                  (professional) =>
                    `${professional.type}-${professional.id}`
                )
              )

            const newProfessionals =
              page.professionals.filter(
                (professional) =>
                  !existingKeys.has(
                    `${professional.type}-${professional.id}`
                  )
              )

            return [
              ...currentProfessionals,
              ...newProfessionals
            ]
          }
        )

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

    }, [
      cursor,
      hasMore,
      loading
    ])

  useEffect(() => {
    loadProfessionals()
  }, [])

  const normalizedSearch =
    searchedCity
      .trim()
      .toLowerCase()

  const filteredPros =
    professionals.filter((pro) => {

      /*
       * Recherche ville / pays
       */

      const city =
        pro.city?.toLowerCase() ?? ""

      const country =
        pro.country?.toLowerCase() ?? ""

      const matchCity =
        normalizedSearch === "" ||
        city.includes(normalizedSearch) ||
        country.includes(normalizedSearch)

      /*
       * Catégorie
       */

      const expertise =
        Array.isArray(pro.expertise)
          ? pro.expertise
          : []

      const matchCategory =
        selectedCategory === "" ||
        pro.speciality === selectedCategory ||
        expertise.includes(selectedCategory)

      /*
       * Services Pet Sitter
       */

      let matchSitterService = true

      if (
        selectedCategory ===
        SITTER_CATEGORY
      ) {

        const sitterServices =
          Array.isArray(pro.services)
            ? pro.services
            : []

        matchSitterService =
          selectedSitterServices.some(
            (service) =>
              sitterServices.includes(service)
          )
      }

      return (
        matchCity &&
        matchCategory &&
        matchSitterService
      )
    })

  return (
    <main>

      <Header />

      <SearchBar
        onSearch={setSearchedCity}
      />

      <CategoryButtons
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {selectedCategory ===
        SITTER_CATEGORY && (

        <SitterServiceFilters
          selectedServices={
            selectedSitterServices
          }
          onChange={
            setSelectedSitterServices
          }
        />

      )}

      <ProfessionalList
        professionals={filteredPros}
        loadMore={loadProfessionals}
        hasMore={hasMore}
        loading={loading}
      />

    </main>
  )
}
