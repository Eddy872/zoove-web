import {
  BookingRequest
} from "@/types/BookingRequest"

export type CreateBookingRequestData = {
  animalID: string
  professionalID: string
  serviceID: string
  requestedDate: Date

  behavior?: string
  coatCondition?: string
  weight?: number
  notes?: string

  // Sitter : durée choisie en minutes
  duration?: number
}

type BookingRequestResponse = {
  success?: boolean
  id?: string
  record?: unknown
  error?: string
}

type BookingRequestsResponse = {
  success?: boolean
  bookingRequests?: BookingRequest[]
  error?: string
}

type AcceptBookingRequestResponse = {
  success?: boolean
  bookingRequestID?: string
  status?: string
  rdvID?: string
  date?: number
  duration?: number
  collaborator?: string
  record?: unknown
  error?: string
}

function getBackendURL(): string {
  const backendURL =
    process.env.NEXT_PUBLIC_API_URL

  if (!backendURL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL n'est pas configurée."
    )
  }

  return backendURL
}

async function parseResponse<T>(
  response: Response
): Promise<T> {
  const rawResponse =
    await response.text()

  let result: any = null

  try {
    result = rawResponse
      ? JSON.parse(rawResponse)
      : null
  } catch {
    result = null
  }

  if (!response.ok) {
    throw new Error(
      result?.error ||
      rawResponse ||
      `Erreur HTTP ${response.status}`
    )
  }

  return result as T
}

/*
 * Créer une demande de rendez-vous
 */

export async function saveBookingRequest(
  data: CreateBookingRequestData
) {
  const backendURL =
    getBackendURL()

  const response =
    await fetch(
      `${backendURL}/api/booking-requests`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          animalID:
            data.animalID,

          professionalID:
            data.professionalID,

          serviceID:
            data.serviceID,

          requestedDate:
            data.requestedDate.toISOString(),

          behavior:
            data.behavior ?? "",

          coatCondition:
            data.coatCondition ?? "",

          weight:
            data.weight ?? 0,

          notes:
            data.notes ?? "",

          /*
           * Sitter :
           * durée en minutes.
           *
           * Le backend la placera avec
           * l'adresse dans BookingRequest.notes.
           */
          duration:
            data.duration ?? 0
        })
      }
    )

  return parseResponse<
    BookingRequestResponse
  >(response)
}

/*
 * Récupérer une demande
 */

export async function fetchBookingRequest(
  bookingRequestID: string
): Promise<BookingRequest> {
  const backendURL =
    getBackendURL()

  const response =
    await fetch(
      `${backendURL}/api/booking-requests/${encodeURIComponent(
        bookingRequestID
      )}`
    )

  const result =
    await parseResponse<any>(
      response
    )

  return (
    result.bookingRequest ??
    result
  ) as BookingRequest
}

/*
 * Récupérer les demandes d'un professionnel
 */

export async function fetchProfessionalBookingRequests(
  professionalID: string
): Promise<BookingRequest[]> {
  const backendURL =
    getBackendURL()

  const response =
    await fetch(
      `${backendURL}/api/booking-requests/professional/${encodeURIComponent(
        professionalID
      )}`
    )

  const result =
    await parseResponse<
      BookingRequestsResponse
    >(response)

  return result.bookingRequests ?? []
}

/*
 * Récupérer les demandes d'un animal
 */

export async function fetchAnimalBookingRequests(
  animalID: string
): Promise<BookingRequest[]> {
  const backendURL =
    getBackendURL()

  const response =
    await fetch(
      `${backendURL}/api/booking-requests/animal/${encodeURIComponent(
        animalID
      )}`
    )

  const result =
    await parseResponse<
      BookingRequestsResponse
    >(response)

  return result.bookingRequests ?? []
}

/*
 * Accepter une demande.
 *
 * Grooming / Healthcare :
 * duration + collaborator sont envoyés.
 *
 * Sitter :
 * aucun des deux n'est nécessaire.
 * Le backend récupère la durée depuis notes.
 */

export type AcceptBookingRequestData = {
  duration?: number
  collaborator?: string
}

export async function acceptBookingRequest(
  bookingRequestID: string,
  data: AcceptBookingRequestData = {}
): Promise<AcceptBookingRequestResponse> {
  const backendURL =
    getBackendURL()

  const response =
    await fetch(
      `${backendURL}/api/booking-requests/${encodeURIComponent(
        bookingRequestID
      )}/accept`,
      {
        method: "PATCH",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          duration:
            data.duration,

          collaborator:
            data.collaborator
        })
      }
    )

  return parseResponse<
    AcceptBookingRequestResponse
  >(response)
}

/*
 * Proposer un autre créneau
 */

export async function proposeBookingRequestDate(
  bookingRequestID: string,
  proposedDate: Date
) {
  const backendURL =
    getBackendURL()

  const response =
    await fetch(
      `${backendURL}/api/booking-requests/${encodeURIComponent(
        bookingRequestID
      )}/propose`,
      {
        method: "PATCH",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          proposedDate:
            proposedDate.toISOString()
        })
      }
    )

  return parseResponse<
    BookingRequestResponse
  >(response)
}

/*
 * Refuser une demande
 */

export async function refuseBookingRequest(
  bookingRequestID: string,
  refusalReason: string
) {
  const backendURL =
    getBackendURL()

  const response =
    await fetch(
      `${backendURL}/api/booking-requests/${encodeURIComponent(
        bookingRequestID
      )}/refuse`,
      {
        method: "PATCH",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          refusalReason
        })
      }
    )

  return parseResponse<
    BookingRequestResponse
  >(response)
}
