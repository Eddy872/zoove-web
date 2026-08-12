// types/baseUser.ts

import type {
  Language
} from "@/context/LanguageContext"

export type BaseUser = {
  id: string

  name?: string
  pseudo?: string

  password?: string

  city: string
  country: string

  language: Language

  photo?: string

  token?: string
  webtoken?: string
}
