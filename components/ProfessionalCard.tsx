"use client"

import "./ProfessionalCard.css"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import {
  useLanguage,
  type Language
} from "@/context/LanguageContext"
import { translate } from "@/translations/translations"
import Image from "next/image"

type Props = {
  id: string
  image: string
  name: string
  speciality: string
  city: string
  rating: number
  package: number
}

export default function ProfessionalCard({
  id,
  image,
  name,
  speciality,
  city,
  rating,
  package: packageValue,
}: Props) {
  const { language } = useLanguage()
  const router = useRouter()
  const { isLogged } = useAuth()
    const packageBadges: Record<
      number,
      {
        label: string
        image: string
      }
    > = {
      2: {
        label: "Recommandé",
        image: "/images/visibility.png",
      },

      3: {
        label: "Ambassadeur",
        image: "/images/ambassador.png",
      },
    }
  const normalizedPackage =
    Number(packageValue ?? 0)

  const badge =
    normalizedPackage === 2
      ? {
          label: "Recommandé",
          image: "/images/visibility.png",
          className: "recommended",
        }
      : normalizedPackage === 3
        ? {
            label: "Ambassadeur",
            image: "/images/ambassador.png",
            className: "ambassador",
          }
        : null

  console.log("PROFESSIONAL PACKAGE", {
    name,
    packageValue,
    normalizedPackage,
    badge,
  })

    return (
      <article className="proCard">
        <img
          src={image}
          alt={name}
          className="proImage"
        />

        <div className="proContent">
          <div className="proTitleRow">
            <h3>{name}</h3>

            {badge && (
              <div
                className={`professionalPackageBadge professionalPackageBadgeInline professionalPackageBadge--${badge.className}`}
              >
                <img
                  src={badge.image}
                  alt=""
                  className="professionalPackageBadgeImage"
                />

                <span>
                  {translate(language, badge.label)}
                </span>
              </div>
            )}
          </div>

          <p className="speciality">
            {translate(language, speciality)}
          </p>

          <p className="city">
            📍 {city}
          </p>

          <p className="rating">
            ⭐ {rating}
          </p>
        </div>

        <button
          type="button"
          className="bookButton"
          onClick={() => {
            if (!isLogged) {
              router.push("/login")
              return
            }

            router.push(`/professional/${id}`)
          }}
        >
          {translate(language, "Réserver")}
        </button>
      </article>
    )
}
