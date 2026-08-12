import type { BaseUser } from "@/types/baseUser"

export type Animal = BaseUser & {
  bio: string
  species: string

  paypalID: string

  badges: string[]
  selectedBadge: string

  items: string[]
  skins: string[]
  selectedSkin: string

  likes: string[]
  dislikes: string[]

  dailyQuests: string[]
  weeklyQuests: string[]
  rewards: number[]

  speciesAccepted: string[]
  notifMatchId: string[]

  package: number
  share: number
  shareOnTiktok: number

  pawpoints: number
  requestsPerDay: number
  swipeCount: number

  packageStart: string
  packageEnd: string
  lastConnection: string
}
