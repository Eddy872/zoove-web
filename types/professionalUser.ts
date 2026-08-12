import type {
  Service
} from "@/types/service"

import type {
  Feedback
} from "@/types/feedback"

import type {
  BaseUser
} from "@/types/baseUser"

export type ProfessionalUser =
  BaseUser & {
    adress: string

    phoneNumber: string
    infos: string

    photos: string[]

    collaborators: string[]
    collaboratorsDispos: string[]

    schedules: string[]

    services: Service[]
    feedbacks: Feedback[]

    userIDs: string[]
    notifs: string[]

    blocked: number

    package: number
    share: number
    autoRenew: number

    packageStart: string
    packageEnd: string

    stripeCustomerID: string
    stripeSubscriptionID: string
    stripeAccountID: string

    lastConnection: string

    device: string

    email?: string
  }
