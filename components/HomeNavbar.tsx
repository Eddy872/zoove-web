"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLanguage } from "@/context/LanguageContext"
import { translate } from "@/translations/translations"

export default function HomeNavbar() {
  const { language } = useLanguage()
  const pathname = usePathname()

  const tabs = [
    { label: "Accueil", href: "/" },
    { label: "Comment ça marche ?", href: "/comment-ca-marche" },
    { label: "Qui sommes-nous ?", href: "/qui-sommes-nous" },
    { label: "Contact", href: "/contact" },
  ]

  return (
    <nav className="home-navbar">
      <div className="home-nav-links">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`home-nav-link ${
              pathname === tab.href ? "active" : ""
            }`}
          >
            {translate(language, tab.label)}
          </Link>
        ))}
      </div>
    </nav>
  )
}

