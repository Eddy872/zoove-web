// types/BookingRequest.ts

export type BookingRequestStatus =
  | "pending"
  | "alternativeProposed"
  | "accepted"
  | "refused"

export type BookingRequest = {
  id: string

  animalID: string
  professionalID: string
  serviceID: string

  requestedDate: number
  proposedDate: number | null

  status: BookingRequestStatus

  behavior: string
  coatCondition: string
  weight: number
  notes: string

  photo: unknown | null

  refusalReason: string
}
