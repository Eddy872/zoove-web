"use client"

import { createContext, useContext, useState } from "react"

export type Language =
  | "fr"
  | "en"
  | "es"
  | "it"
  | "pt"
  | "de"
  | "ar"

const LanguageContext = createContext<{
  language: Language
  setLanguage: (language: Language) => void
} | null>(null)

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [language, setLanguage] = useState<Language>("fr")

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider")
  }

  return context
}
