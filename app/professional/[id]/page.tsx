import type { Metadata } from "next"
import ProfessionalClientPage from "./ProfessionalClientPage"

type Props = {
  params: Promise<{ id: string }>
}

type ProfessionalMetadata = {
  id: string
  type: string
  name: string
  description: string
  city: string
  country: string
  url: string
}

async function getProfessionalMetadata(
  id: string
): Promise<ProfessionalMetadata | null> {
  const apiUrl =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL

  if (!apiUrl) {
    console.error("URL du backend non configurée")
    return null
  }

  try {
    const response = await fetch(
      `${apiUrl.replace(/\/$/, "")}/api/professionals/${encodeURIComponent(id)}/metadata`,
      {
        next: { revalidate: 3600 }
      }
    )

    if (!response.ok) return null

    const data = await response.json()

    return data.success ? data.professional : null
  } catch (error) {
    console.error("Erreur récupération métadonnées :", error)
    return null
  }
}

export async function generateMetadata({
  params
}: Props): Promise<Metadata> {
  const { id } = await params

  const professional = await getProfessionalMetadata(id)

  const url =
    `https://zoove.app/professional/${encodeURIComponent(id)}`

  const title = professional?.name
    ? `${professional.name} | Zoove`
    : "Professionnel | Zoove"

  const description =
    professional?.description?.trim() ||
    "Découvrez les professionnels qui prennent soin de vos animaux sur Zoove."

  return {
    title,
    description,

    alternates: {
      canonical: url
    },

    openGraph: {
      title,
      description,
      url,
      siteName: "Zoove",
      type: "website",
      images: []
    },

    twitter: {
      card: "summary",
      title,
      description,
      images: []
    }
  }
}

export default async function Page({
  params
}: Props) {
  const { id } = await params

  return <ProfessionalClientPage id={id} />
}
