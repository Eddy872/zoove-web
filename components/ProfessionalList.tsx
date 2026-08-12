"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import "./ProfessionalList.css"
import ProfessionalCard from "./ProfessionalCard"
import {
  useLanguage,
  type Language
} from "@/context/LanguageContext"
import { translate } from "@/translations/translations"

type Professional = {
  id: string
  image: string
  name: string
  speciality: string
  city: string
  rating: number
  package: number
  buyers?: string[]
  price?: number
}

type Props = {
  professionals: Professional[]
  loadMore: () => Promise<void>
  hasMore: boolean
  loading: boolean
}

type SortType =
  | "popular"
  | "lessPopular"
  | "bestRated"
  | "priceAsc"
  | "priceDesc"

const PAGE_SIZE = 5

export default function ProfessionalList({
  professionals,
  loadMore,
  hasMore,
  loading
}: Props){
  const { language } = useLanguage()

  const [sortType, setSortType] = useState<SortType>("popular")
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const sortedProfessionals = useMemo(() => {
    return [...professionals].sort((a, b) => {
      switch (sortType) {
        case "popular":
          return (
            (b.buyers?.length ?? 0) -
            (a.buyers?.length ?? 0)
          )

        case "lessPopular":
          return (
            (a.buyers?.length ?? 0) -
            (b.buyers?.length ?? 0)
          )

        case "bestRated":
          return b.rating - a.rating

        case "priceAsc":
          return (a.price ?? 0) - (b.price ?? 0)

        case "priceDesc":
          return (b.price ?? 0) - (a.price ?? 0)

        default:
          return 0
      }
    })
  }, [professionals, sortType])

  const visibleProfessionals = sortedProfessionals.slice(
    0,
    visibleCount
  )

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [sortType, professionals])

  useEffect(() => {
    const target = loadMoreRef.current

    if (!target || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]

        if (entry.isIntersecting) {
          setVisibleCount((current) =>
            Math.min(
              current + PAGE_SIZE,
              sortedProfessionals.length
            )
          )
        }
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0
      }
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [hasMore, sortedProfessionals.length])

  return (
    <section className="proSection">
      <div className="proHeader">
        <h2>
          {translate(
            language,
            "Professionnels près de chez vous"
          )}
        </h2>

        <select
          className="sortButton"
          value={sortType}
          onChange={(event) =>
            setSortType(event.target.value as SortType)
          }
        >
          <option value="popular">
            {translate(language, "Plus populaires")}
          </option>

          <option value="lessPopular">
            {translate(language, "Moins populaires")}
          </option>

          <option value="bestRated">
            {translate(language, "Mieux notés")}
          </option>

          <option value="priceAsc">
            {translate(language, "Prix croissant")}
          </option>

          <option value="priceDesc">
            {translate(language, "Prix décroissant")}
          </option>
        </select>
      </div>

      {sortedProfessionals.length === 0 ? (
        <p>
          {translate(
            language,
            "Aucun professionnel trouvé."
          )}
        </p>
      ) : (
        <>
          <div className="proList">
            {visibleProfessionals.map((pro) => (
              <ProfessionalCard
                key={`${pro.id}-${pro.speciality}`}
                {...pro}
              />
            ))}
          </div>

          {hasMore && (
            <div
              ref={loadMoreRef}
              className="loadMoreTrigger"
              aria-hidden="true"
            />
          )}
        </>
      )}
    </section>
  )
}
