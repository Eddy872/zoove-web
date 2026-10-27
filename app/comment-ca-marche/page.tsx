
import type { Metadata } from "next"
import Header from "@/components/Header"
import HomeNavbar from "@/components/HomeNavbar"
import HowItWorksContent from "./HowItWorksContent"

export const metadata: Metadata = {
  title: "Comment fonctionne Zoove ? | Réservation de services animaliers",
  description:
    "Découvrez comment utiliser Zoove pour rechercher des professionnels animaliers, demander un rendez-vous et gérer vos services pour animaux. Une solution pour les propriétaires et les professionnels.",
  alternates: {
    canonical: "/comment-ca-marche",
  },
  openGraph: {
    title: "Comment ça marche ? | Zoove",
    description:
      "Découvrez comment Zoove facilite les rendez-vous et les services pour animaux, pour les propriétaires comme pour les professionnels.",
    type: "website",
    url: "/comment-ca-marche",
  },
}

export default function HowItWorksPage() {
  return (
    <main>
      <Header />
      <HomeNavbar />
      <HowItWorksContent />
    </main>
  )
}
