
import type { Metadata } from "next"
import Header from "@/components/Header"
import HomeNavbar from "@/components/HomeNavbar"
import Footer from "@/components/Footer"
import AboutContent from "./AboutContent"

export const metadata: Metadata = {
  title: "Qui sommes-nous ? | Zoove, services pour animaux",
  description:
    "Découvrez Zoove, notre mission, nos valeurs et notre histoire. Une plateforme qui rapproche les propriétaires d'animaux et les professionnels du monde animal.",
  alternates: {
    canonical: "/qui-sommes-nous",
  },
  openGraph: {
    title: "Notre histoire et notre mission | Zoove",
    description:
      "Zoove facilite le quotidien des propriétaires d'animaux et des professionnels qui prennent soin d'eux.",
    type: "website",
    url: "/qui-sommes-nous",
    images: [
      {
        url: "/images/chien-chat-zoove.png",
        width: 1200,
        height: 630,
        alt: "Un chien et un chat, symboles du lien entre les animaux et les humains",
      },
    ],
  },
}

export default function AboutPage() {
  return (
    <main>
      <Header />
      <HomeNavbar />
      <AboutContent />
          <Footer />
    </main>
  )
}
