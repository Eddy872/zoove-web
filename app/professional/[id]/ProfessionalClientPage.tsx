"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import ProfessionalTabs from "@/components/ProfessionalTabs"
import { fetchProfessional } from "@/services/fetchProfessionalById"

export default function ProfessionalClientPage({
  id
}: {
  id: string
}) {
  const [pro, setPro] = useState<any>(null)
  const [isLoading, setIsLoading] =
    useState(true)

  useEffect(() => {
    let cancelled = false

    const loadProfessional = async () => {
      try {
        setIsLoading(true)

        const professional =
          await fetchProfessional(id)

        if (!cancelled) {
          setPro(professional)
        }
      } catch (error) {
        console.error(
          "Erreur pendant le chargement du professionnel :",
          error
        )

        if (!cancelled) {
          setPro(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadProfessional()

    return () => {
      cancelled = true
    }
  }, [id])

  if (isLoading) {
    return <main>Chargement...</main>
  }

  if (!pro) {
    return (
      <main>
        Professionnel introuvable : {id}
      </main>
    )
  }

  return (
    <>
      <Link href="/" className="backButton">
        ←
      </Link>

      <ProfessionalTabs pro={pro} />
    </>
  )
}
