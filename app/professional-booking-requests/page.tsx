"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react"

import { useAuth } from "@/context/AuthContext"
import {
  useLanguage,
  type Language
} from "@/context/LanguageContext"
import { translate } from "@/translations/translations"

import {
  fetchProfessionalBookingRequests,
  acceptBookingRequest,
  proposeBookingRequestDate,
  refuseBookingRequest
} from "@/services/bookingRequests"

import {
  fetchServicesForProfessional
} from "@/services/fetchProfessionalById"

import {
  fetchClientById
} from "@/services/fetchClientUser"

import {
  BookedAppointment,
  fetchBookedAppointments
} from "@/services/fetchBookedAppointments"

import {
  BookingRequest,
  BookingRequestStatus
} from "@/types/BookingRequest"

import { Service } from "@/types/service"

import "./ProfessionalBookingRequests.css"

import {
  sendNotificationToAll
} from "@/services/notifications"

type StatusFilter =
  | "all"
  | BookingRequestStatus

type ParsedNotes = {
  notes: string
  preferredDays: string[]
  customAnswers: Record<string, string>

  pickupAddress: string
  duration: number
  phoneNumber: string
}

type AnimalClient =
  NonNullable<
    Awaited<
      ReturnType<typeof fetchClientById>
    >
  >

type DaySchedule = {
  isOpen: boolean
  openingMinutes: number
  closingMinutes: number
}


const frenchDays = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi"
]

const englishToFrench: Record<string, string> = {
  sunday: "dimanche",
  monday: "lundi",
  tuesday: "mardi",
  wednesday: "mercredi",
  thursday: "jeudi",
  friday: "vendredi",
  saturday: "samedi"
}


/* =========================================================
   OUTILS
========================================================= */

function localeForLanguage(
  language: Language
): string {
  switch (language) {
    case "fr":
      return "fr-FR"
    case "es":
      return "es-ES"
    case "it":
      return "it-IT"
    case "de":
      return "de-DE"
    case "pt":
      return "pt-PT"
    case "ar":
      return "ar"
    default:
      return "en-US"
  }
}

function parseRequestNotes(
  rawNotes: string
): ParsedNotes {
    if (!rawNotes) {
      return {
        notes: "",
        preferredDays: [],
        customAnswers: {},
        pickupAddress: "",
        duration: 0,
        phoneNumber: ""
      }
    }

  try {
    const parsed =
      JSON.parse(rawNotes)

    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
    ) {
      return {
        notes:
          typeof parsed.notes === "string"
            ? parsed.notes
            : "",

        preferredDays:
          Array.isArray(parsed.preferredDays)
            ? parsed.preferredDays
            : [],

        customAnswers:
          parsed.customAnswers &&
          typeof parsed.customAnswers === "object" &&
          !Array.isArray(
            parsed.customAnswers
          )
            ? parsed.customAnswers
            : {},

        pickupAddress:
          typeof parsed.pickupAddress ===
          "string"
            ? parsed.pickupAddress
            : "",

      duration:
        Number.isFinite(
          Number(parsed.duration)
        )
          ? Number(parsed.duration)
          : 0,

      phoneNumber:
        typeof parsed.phoneNumber === "string"
          ? parsed.phoneNumber
          : ""
      }
    }
  } catch {
    // Anciennes BookingRequest :
    // notes était une simple String.
  }

    return {
      notes: rawNotes,
      preferredDays: [],
      customAnswers: {},
      pickupAddress: "",
      duration: 0,
      phoneNumber: ""
    }
}

function getSitterDurationMinutes(
  request: BookingRequest
): number {

  const parsedNotes =
    parseRequestNotes(
      request.notes
    )

  /*
   * Nouveau format :
   * duration est stocké dans notes
   * et est déjà exprimé en minutes.
   */
  if (
    parsedNotes.duration > 0
  ) {
    return parsedNotes.duration
  }


  /*
   * Ancien format :
   *
   * Sitting-duration-price
   *
   * Exemple :
   * Sitting-3-45
   *
   * Ici 3 = 3 heures.
   */
  const parts =
    request.serviceID
      ?.split("-") ?? []

  if (
    parts.length >= 2 &&
    parts[0]
      ?.toLowerCase() ===
      "sitting"
  ) {

    const durationHours =
      Number(parts[1])

    if (
      Number.isFinite(
        durationHours
      ) &&
      durationHours > 0
    ) {
      return durationHours * 60
    }
  }


  return 0
}

function translateWeekday(
  day: string,
  language: Language
): string {
  const days: Record<
    string,
    Record<string, string>
  > = {
    Monday: {
      fr: "Lundi", en: "Monday", es: "Lunes",
      it: "Lunedì", de: "Montag",
      pt: "Segunda-feira", ar: "الاثنين"
    },
    Tuesday: {
      fr: "Mardi", en: "Tuesday", es: "Martes",
      it: "Martedì", de: "Dienstag",
      pt: "Terça-feira", ar: "الثلاثاء"
    },
    Wednesday: {
      fr: "Mercredi", en: "Wednesday", es: "Miércoles",
      it: "Mercoledì", de: "Mittwoch",
      pt: "Quarta-feira", ar: "الأربعاء"
    },
    Thursday: {
      fr: "Jeudi", en: "Thursday", es: "Jueves",
      it: "Giovedì", de: "Donnerstag",
      pt: "Quinta-feira", ar: "الخميس"
    },
    Friday: {
      fr: "Vendredi", en: "Friday", es: "Viernes",
      it: "Venerdì", de: "Freitag",
      pt: "Sexta-feira", ar: "الجمعة"
    },
    Saturday: {
      fr: "Samedi", en: "Saturday", es: "Sábado",
      it: "Sabato", de: "Samstag",
      pt: "Sábado", ar: "السبت"
    },
    Sunday: {
      fr: "Dimanche", en: "Sunday", es: "Domingo",
      it: "Domenica", de: "Sonntag",
      pt: "Domingo", ar: "الأحد"
    }
  }

  return days[day]?.[language] ?? day
}

function getTimestamp(
  value: number | null | undefined
): number {
  if (!value) {
    return 0
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? 0
    : date.getTime()
}

function timeToMinutes(
  time: string
): number {
  const [hours, minutes] =
    time.split(":").map(Number)

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return 0
  }

  return hours * 60 + minutes
}

function minutesToTime(
  minutes: number
): string {
  const hours =
    Math.floor(minutes / 60)

  const remainingMinutes =
    minutes % 60

  return `${String(hours).padStart(2, "0")}:${String(
    remainingMinutes
  ).padStart(2, "0")}`
}

function parseDaySchedule(
  planning: string[] | undefined,
  date: Date
): DaySchedule {
  const dayName =
    frenchDays[date.getDay()]

  const line =
    planning?.find(
      item =>
        item
          .trim()
          .toLocaleLowerCase("fr-FR")
          .startsWith(
            dayName.toLocaleLowerCase("fr-FR")
          )
    )

  if (!line) {
    return {
      isOpen: false,
      openingMinutes: 0,
      closingMinutes: 0
    }
  }

  const normalized =
    line
      .replace(dayName, "")
      .replace("=", "")
      .trim()

  if (
    !normalized ||
    normalized
      .toLocaleLowerCase("fr-FR") ===
      "fermé"
  ) {
    return {
      isOpen: false,
      openingMinutes: 0,
      closingMinutes: 0
    }
  }

  const [opening, closing] =
    normalized
      .split("-")
      .map(value => value.trim())

  if (!opening || !closing) {
    return {
      isOpen: false,
      openingMinutes: 0,
      closingMinutes: 0
    }
  }

  return {
    isOpen: true,
    openingMinutes:
      timeToMinutes(opening),
    closingMinutes:
      timeToMinutes(closing)
  }
}




/* =========================================================
   PAGE
========================================================= */

export default function ProfessionalBookingRequestsPage() {
  const { session } = useAuth()
  const { language } = useLanguage()

    const professional =
      session?.accountType === "grooming" ||
      session?.accountType === "healthcare" ||
      session?.accountType === "sitter"
        ? session.user
        : null
    
    const isSitter =
      session?.accountType === "sitter"

  const [
    bookingRequests,
    setBookingRequests
  ] = useState<BookingRequest[]>([])

  const [
    professionalServices,
    setProfessionalServices
  ] = useState<Service[]>([])

  const [
    animalsById,
    setAnimalsById
  ] = useState<
    Record<string, AnimalClient>
  >({})

  const [
    selectedStatus,
    setSelectedStatus
  ] = useState<StatusFilter>("all")

  const [
    isLoading,
    setIsLoading
  ] = useState(true)

  const [
    error,
    setError
  ] = useState("")

  const [
    processingRequestID,
    setProcessingRequestID
  ] = useState<string | null>(null)

  const [
    refusingRequestID,
    setRefusingRequestID
  ] = useState<string | null>(null)

  const [
    refusalReason,
    setRefusalReason
  ] = useState("")

  /* PLANIFICATION */

  const [
    schedulingRequestID,
    setSchedulingRequestID
  ] = useState<string | null>(null)

  const [
    selectedDuration,
    setSelectedDuration
  ] = useState(60)

  const [
    selectedCollaborator,
    setSelectedCollaborator
  ] = useState("")
    
    const [
      proposedDate,
      setProposedDate
    ] = useState("")

    const [
      proposedTime,
      setProposedTime
    ] = useState("")

  const [
    bookedAppointments,
    setBookedAppointments
  ] = useState<BookedAppointment[]>([])

  const [
    isLoadingAppointments,
    setIsLoadingAppointments
  ] = useState(false)

  /* =======================================================
     CHARGEMENT DEMANDES
  ======================================================= */

  useEffect(() => {
    let cancelled = false

    async function loadBookingRequests() {
      if (!professional?.id) {
        setBookingRequests([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError("")

        const results =
          await fetchProfessionalBookingRequests(
            professional.id
          )

        if (!cancelled) {
          setBookingRequests(
            results ?? []
          )
        }
      } catch (loadError) {
        console.error(
          "Erreur chargement BookingRequest pro :",
          loadError
        )

        if (!cancelled) {
          setError(
            "Impossible de charger vos demandes."
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadBookingRequests()

    return () => {
      cancelled = true
    }
  }, [professional?.id])


  /* =======================================================
     CHARGEMENT SERVICES
  ======================================================= */

  useEffect(() => {
    let cancelled = false

    async function loadServices() {
      if (!professional?.id) {
        setProfessionalServices([])
        return
      }

      try {
        const services =
          await fetchServicesForProfessional(
            professional.id
          )

        if (!cancelled) {
          setProfessionalServices(
            services ?? []
          )
        }
      } catch (loadError) {
        console.error(
          "Erreur chargement prestations :",
          loadError
        )

        if (!cancelled) {
          setProfessionalServices([])
        }
      }
    }

    loadServices()

    return () => {
      cancelled = true
    }
  }, [professional?.id])


  /* =======================================================
     CHARGEMENT ANIMAUX
  ======================================================= */

  useEffect(() => {
    let cancelled = false

    async function loadAnimals() {
      if (bookingRequests.length === 0) {
        if (!cancelled) {
          setAnimalsById({})
        }
        return
      }

      const uniqueIDs = [
        ...new Set(
          bookingRequests
            .map(request => request.animalID)
            .filter(
              id =>
                Boolean(id) &&
                id !== "TON_ANIMAL_ID"
            )
        )
      ]

      const results =
        await Promise.allSettled(
          uniqueIDs.map(
            async id => ({
              id,
              animal:
                await fetchClientById(id)
            })
          )
        )

      if (cancelled) {
        return
      }

      const map:
        Record<string, AnimalClient> = {}

      results.forEach(result => {
        if (
          result.status === "fulfilled" &&
          result.value.animal
        ) {
          map[result.value.id] =
            result.value.animal
        }
      })

      setAnimalsById(map)
    }

    loadAnimals()

    return () => {
      cancelled = true
    }
  }, [bookingRequests])


  /* =======================================================
     COLLABORATEURS
  ======================================================= */

  const collaborators =
    useMemo(() => {
        const values =
          professional &&
          "collaborators" in professional &&
          Array.isArray(
            professional.collaborators
          )
            ? professional.collaborators.filter(
                value =>
                  typeof value === "string" &&
                  Boolean(value.trim())
              )
            : []

      if (values.length > 0) {
        return values
      }

      if (professional?.name) {
        return [professional.name]
      }

      return []
    }, [professional])


  /* =======================================================
     DISPONIBILITÉ JOUR COLLABORATEUR
  ======================================================= */

  const collaboratorWorksOnDate =
    useCallback(
      (
        collaborator: string,
        date: Date
      ): boolean => {
        if (!professional) {
          return false
        }

        /*
         * Si aucun collaboratorsDispos n'est configuré,
         * on considère les horaires du salon comme référence.
         */
          if (
            !("collaboratorsDispos" in professional) ||
            !Array.isArray(
              professional.collaboratorsDispos
            ) ||
            professional.collaboratorsDispos.length === 0
          ) {
            return true
          }

        const collaboratorIndex =
          professional.collaborators.findIndex(
            value =>
              value === collaborator
          )

        /*
         * Cas fallback : aucun collaborateur enregistré
         * et on utilise professional.name.
         */
        if (collaboratorIndex < 0) {
          return true
        }

        const raw =
          professional.collaboratorsDispos[
            collaboratorIndex
          ]

        if (!raw) {
          return true
        }

        const dayName =
          frenchDays[date.getDay()]
            .toLocaleLowerCase("fr-FR")

        const values =
          raw
            .split(",")
            .map(item => item.trim())

        const dayValue =
          values.find(item => {
            const [day] =
              item.split("=")

            return (
              day
                ?.trim()
                .toLocaleLowerCase("fr-FR") ===
              dayName
            )
          })

        if (!dayValue) {
          return false
        }

        const [, availability = ""] =
          dayValue.split("=")

        return (
          availability
            .trim()
            .toLocaleLowerCase("fr-FR") ===
          "oui"
        )
      },
      [professional]
    )


  /* =======================================================
     OUVERTURE PLANIFICATEUR
  ======================================================= */
    
    function dateInputValue(
      date: Date
    ): string {
      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return ""
      }

      const year =
        date.getFullYear()

      const month =
        String(
          date.getMonth() + 1
        ).padStart(2, "0")

      const day =
        String(
          date.getDate()
        ).padStart(2, "0")

      return `${year}-${month}-${day}`
    }


    function timeInputValue(
      date: Date
    ): string {
      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return ""
      }

      const hours =
        String(
          date.getHours()
        ).padStart(2, "0")

      const minutes =
        String(
          date.getMinutes()
        ).padStart(2, "0")

      return `${hours}:${minutes}`
    }


    function buildProposedDate():
      Date | null {

      if (
        !proposedDate ||
        !proposedTime
      ) {
        return null
      }

      const [
        year,
        month,
        day
      ] =
        proposedDate
          .split("-")
          .map(Number)

      const [
        hours,
        minutes
      ] =
        proposedTime
          .split(":")
          .map(Number)

      if (
        !year ||
        !month ||
        !day ||
        Number.isNaN(hours) ||
        Number.isNaN(minutes)
      ) {
        return null
      }

      const date =
        new Date(
          year,
          month - 1,
          day,
          hours,
          minutes,
          0,
          0
        )

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return null
      }

      return date
    }

    function openScheduling(
      request: BookingRequest
    ) {
      const service =
        professionalServices.find(
          item =>
            item.id === request.serviceID
        )

      const initialDuration =
        Math.max(
          15,
          Number(service?.duration ?? 60)
        )

      setSelectedDuration(
        Math.min(
          360,
          Math.ceil(
            initialDuration / 15
          ) * 15
        )
      )

      const requestedDate =
        new Date(
          request.requestedDate
        )

      const firstWorkingCollaborator =
        collaborators.find(
          collaborator =>
            !Number.isNaN(
              requestedDate.getTime()
            ) &&
            collaboratorWorksOnDate(
              collaborator,
              requestedDate
            )
        ) ?? ""

      setSelectedCollaborator(
        firstWorkingCollaborator
      )

      /*
       * On préremplit la proposition avec
       * le créneau demandé.
       *
       * Le professionnel pourra ensuite
       * modifier la date et/ou l'heure.
       */
      if (
        !Number.isNaN(
          requestedDate.getTime()
        )
      ) {
        setProposedDate(
          dateInputValue(
            requestedDate
          )
        )

        setProposedTime(
          timeInputValue(
            requestedDate
          )
        )
      } else {
        setProposedDate("")
        setProposedTime("")
      }

      setSchedulingRequestID(
        request.id
      )

      setRefusingRequestID(null)
      setRefusalReason("")
      setError("")
    }


  /* =======================================================
     CHARGEMENT RDV DU COLLABORATEUR
  ======================================================= */

  useEffect(() => {
    let cancelled = false

    async function loadAppointments() {
      if (
        !professional?.id ||
        !selectedCollaborator ||
        !schedulingRequestID
      ) {
        setBookedAppointments([])
        return
      }

      try {
        setIsLoadingAppointments(true)

        const appointments =
          await fetchBookedAppointments(
            professional.id,
            selectedCollaborator
          )

        if (!cancelled) {
          setBookedAppointments(
            appointments ?? []
          )
        }
      } catch (appointmentError) {
        console.error(
          "Erreur récupération RDV :",
          appointmentError
        )

        if (!cancelled) {
          setBookedAppointments([])
          setError(
            "Impossible de charger les rendez-vous existants."
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoadingAppointments(false)
        }
      }
    }

    loadAppointments()

    return () => {
      cancelled = true
    }
  }, [
    professional?.id,
    selectedCollaborator,
    schedulingRequestID
  ])


  /* =======================================================
     COLLISION RDV
  ======================================================= */

  const isCollaboratorAvailable =
    useCallback(
      (
        date: Date,
        startTime: string
      ): boolean => {
        if (!selectedCollaborator) {
          return false
        }

        const [hours, minutes] =
          startTime
            .split(":")
            .map(Number)

        if (
          Number.isNaN(hours) ||
          Number.isNaN(minutes)
        ) {
          return false
        }

        const candidateStart =
          new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            hours,
            minutes,
            0,
            0
          )

        if (
          candidateStart <= new Date()
        ) {
          return false
        }

        const candidateEnd =
          new Date(
            candidateStart.getTime() +
            selectedDuration * 60_000
          )

        return !bookedAppointments.some(
          appointment => {
            const bookedStart =
              new Date(
                appointment.date
              )

            /*
             * RDV possède déjà duration.
             * Fallback 30 uniquement pour
             * d'anciens enregistrements invalides.
             */
            const bookedDuration =
              Number(appointment.duration) > 0
                ? Number(
                    appointment.duration
                  )
                : 30

            const bookedEnd =
              new Date(
                bookedStart.getTime() +
                bookedDuration * 60_000
              )

            return (
              candidateStart < bookedEnd &&
              candidateEnd > bookedStart
            )
          }
        )
      },
      [
        bookedAppointments,
        collaboratorWorksOnDate,
        selectedCollaborator,
        selectedDuration
      ]
    )


  /* =======================================================
     CRÉNEAU DEMANDÉ TOUJOURS DISPONIBLE ?
  ======================================================= */

  function isRequestedSlotAvailable(
    request: BookingRequest
  ): boolean {
    if (
      !professional ||
      !selectedCollaborator
    ) {
      return false
    }

    const requestedDate =
      new Date(request.requestedDate)

    if (
      Number.isNaN(
        requestedDate.getTime()
      )
    ) {
      return false
    }

    if (
      !collaboratorWorksOnDate(
        selectedCollaborator,
        requestedDate
      )
    ) {
      return false
    }

      const schedule =
        parseDaySchedule(
          "schedules" in professional
            ? professional.schedules
            : undefined,
          requestedDate
        )

    if (!schedule.isOpen) {
      return false
    }

    const startMinutes =
      requestedDate.getHours() * 60 +
      requestedDate.getMinutes()

    if (
      startMinutes <
        schedule.openingMinutes ||
      startMinutes +
        selectedDuration >
        schedule.closingMinutes
    ) {
      return false
    }

    return isCollaboratorAvailable(
      requestedDate,
      minutesToTime(startMinutes)
    )
  }
    
    function isProposedSlotAvailable():
      boolean {

      if (
        !professional ||
        !selectedCollaborator
      ) {
        return false
      }

      const date =
        buildProposedDate()

      if (!date) {
        return false
      }

      /*
       * Pas de proposition dans le passé.
       */
      if (
        date <= new Date()
      ) {
        return false
      }

      /*
       * Le collaborateur doit travailler
       * ce jour-là.
       */
      if (
        !collaboratorWorksOnDate(
          selectedCollaborator,
          date
        )
      ) {
        return false
      }

      /*
       * Vérification des horaires
       * du salon / établissement.
       */
          const schedule =
            parseDaySchedule(
              "schedules" in professional
                ? professional.schedules
                : undefined,
              date
            )

      if (!schedule.isOpen) {
        return false
      }

      const startMinutes =
        date.getHours() * 60 +
        date.getMinutes()

      /*
       * Le rendez-vous doit commencer
       * après l'ouverture et se terminer
       * avant la fermeture.
       */
      if (
        startMinutes <
          schedule.openingMinutes ||
        startMinutes +
          selectedDuration >
          schedule.closingMinutes
      ) {
        return false
      }

      /*
       * Vérification des collisions
       * avec les RDV existants.
       */
      return isCollaboratorAvailable(
        date,
        minutesToTime(
          startMinutes
        )
      )
    }


  /* =======================================================
     CONFIRMER LE CRÉNEAU DEMANDÉ
  ======================================================= */
    
    async function sendBookingRequestStatusNotification(
      request: BookingRequest,
      status:
        | "accepted"
        | "refused"
        | "alternativeProposed"
    ) {

      const animal =
        animalsById[request.animalID]

      if (!animal) {
        console.warn(
          "⚠️ Animal introuvable pour notification :",
          request.animalID
        )

        return
      }


      const iphoneToken =
        typeof animal.token === "string"
          ? animal.token.trim()
          : ""

      const webToken =
        typeof animal.webtoken === "string"
          ? animal.webtoken.trim()
          : ""


      if (
        !iphoneToken &&
        !webToken
      ) {
        console.warn(
          "⚠️ Aucun token iOS ou Web pour l'animal :",
          request.animalID
        )

        return
      }


      const animalLanguage =
        (animal.language || "fr") as Language


        const professionalName =
          isSitter
            ? (
                professional?.pseudo?.trim() ||
                professional?.name?.trim() ||
                translate(
                  animalLanguage,
                  "Le pet sitter"
                )
              )
            : (
                professional?.name?.trim() ||
                translate(
                  animalLanguage,
                  "Le professionnel"
                )
              )


      let title = ""
      let body = ""
      let notificationType = ""


      switch (status) {

        case "accepted":

          title =
            translate(
              animalLanguage,
              "Rendez-vous accepté"
            )

          body =
            translate(
              animalLanguage,
              "_ a accepté votre demande de rendez-vous."
            ).replace(
              "_",
              professionalName
            )

          notificationType =
            "bookingRequestAccepted"

          break


        case "refused":

          title =
            translate(
              animalLanguage,
              "Demande de rendez-vous refusée"
            )

          body =
            translate(
              animalLanguage,
              "_ a refusé votre demande de rendez-vous."
            ).replace(
              "_",
              professionalName
            )

          notificationType =
            "bookingRequestRefused"

          break


        case "alternativeProposed":

          title =
            translate(
              animalLanguage,
              "Nouveau créneau proposé"
            )

          body =
            translate(
              animalLanguage,
              "_ vous propose un autre créneau pour votre rendez-vous."
            ).replace(
              "_",
              professionalName
            )

          notificationType =
            "bookingRequestProposed"

          break
      }


      try {

        await sendNotificationToAll({
          iphoneToken,
          webToken,

          title,
          body,

          data: {
            type:
              notificationType,

            requestID:
              request.id,

            professionalID:
              professional?.id ?? ""
          }
        })


        console.log(
          `✅ Notification ${notificationType} envoyée iOS/Web`
        )

      } catch (notificationError) {

        console.error(
          `❌ Erreur notification ${notificationType} :`,
          notificationError
        )
      }
    }

  async function handleAccept(
    request: BookingRequest
  ) {
    if (
      processingRequestID ||
      !selectedCollaborator ||
      !isRequestedSlotAvailable(request)
    ) {
      return
    }

    try {
      setProcessingRequestID(
        request.id
      )
      setError("")

        await acceptBookingRequest(
          request.id,
          {
            duration:
              selectedDuration,

            collaborator:
              selectedCollaborator
          }
        )
        
        await sendBookingRequestStatusNotification(
          request,
          "accepted"
        )

      setBookingRequests(
        current =>
          current.map(item =>
            item.id === request.id
              ? {
                  ...item,
                  status: "accepted"
                }
              : item
          )
      )

      setSchedulingRequestID(null)
    } catch (actionError) {
      console.error(
        "Erreur confirmation BookingRequest :",
        actionError
      )

      setError(
        actionError instanceof Error
          ? actionError.message
          : "Impossible de confirmer ce rendez-vous."
      )
    } finally {
      setProcessingRequestID(null)
    }
  }
    
    async function handleProposeAlternative(
      request: BookingRequest
    ) {
      if (
        processingRequestID ||
        !selectedCollaborator
      ) {
        return
      }

      const newProposedDate =
        buildProposedDate()

      if (!newProposedDate) {
        setError(
          "Le nouveau créneau est invalide."
        )

        return
      }

      if (
        newProposedDate <= new Date()
      ) {
        setError(
          "Le nouveau créneau doit être dans le futur."
        )

        return
      }

      if (
        !isProposedSlotAvailable()
      ) {
        setError(
          "Ce créneau n'est pas disponible."
        )

        return
      }

      try {
        setProcessingRequestID(
          request.id
        )

        setError("")

        await proposeBookingRequestDate(
          request.id,
          newProposedDate
        )

        await sendBookingRequestStatusNotification(
          request,
          "alternativeProposed"
        )

        setBookingRequests(
          current =>
            current.map(item =>
              item.id === request.id
                ? {
                    ...item,
                    status:
                      "alternativeProposed",
                    proposedDate:
                      newProposedDate.getTime()
                  }
                : item
            )
        )

        setSchedulingRequestID(null)

        setProposedDate("")
        setProposedTime("")

      } catch (actionError) {
        console.error(
          "Erreur proposition nouveau créneau :",
          actionError
        )

        setError(
          actionError instanceof Error
            ? actionError.message
            : "Impossible de proposer ce créneau."
        )

      } finally {
        setProcessingRequestID(null)
      }
    }
    
    async function handleSitterAccept(
      request: BookingRequest
    ) {
      if (processingRequestID) {
        return
      }

      /*
       * Nouveau format :
       * notes.duration en minutes.
       *
       * Ancien format :
       * serviceID = Sitting-duration-price
       * avec duration exprimée en heures.
       */
      const duration =
        getSitterDurationMinutes(
          request
        )

      if (duration <= 0) {
        setError(
          "Les informations de garde sont invalides."
        )

        console.error(
          "❌ Durée Sitter invalide",
          {
            requestID:
              request.id,

            serviceID:
              request.serviceID,

            notes:
              request.notes
          }
        )

        return
      }

      try {

        setProcessingRequestID(
          request.id
        )

        setError("")

        console.log(
          "🐾 Acceptation BookingRequest Sitter",
          {
            requestID:
              request.id,

            serviceID:
              request.serviceID,

            duration
          }
        )

        await acceptBookingRequest(
          request.id,
          {
            duration
          }
        )


        await sendBookingRequestStatusNotification(
          request,
          "accepted"
        )


        setBookingRequests(
          current =>
            current.map(item =>
              item.id === request.id
                ? {
                    ...item,
                    status:
                      "accepted"
                  }
                : item
            )
        )

      } catch (actionError) {

        console.error(
          "Erreur acceptation BookingRequest Sitter :",
          actionError
        )

        setError(
          actionError instanceof Error
            ? actionError.message
            : "Impossible d'accepter cette demande."
        )

      } finally {

        setProcessingRequestID(null)
      }
    }


  /* =======================================================
     REFUSER
  ======================================================= */

  async function handleRefuse(
    request: BookingRequest
  ) {
    if (processingRequestID) {
      return
    }

    try {
      setProcessingRequestID(
        request.id
      )
      setError("")

      await refuseBookingRequest(
        request.id,
        refusalReason.trim()
      )

        await sendBookingRequestStatusNotification(
          request,
          "refused"
        )
        
      setBookingRequests(
        current =>
          current.map(item =>
            item.id === request.id
              ? {
                  ...item,
                  status: "refused",
                  refusalReason:
                    refusalReason.trim()
                }
              : item
          )
      )

      setRefusingRequestID(null)
      setRefusalReason("")
    } catch (actionError) {
      console.error(
        "Erreur refus BookingRequest :",
        actionError
      )

      setError(
        actionError instanceof Error
          ? actionError.message
          : "Impossible de refuser la demande."
      )
    } finally {
      setProcessingRequestID(null)
    }
  }


  /* =======================================================
     COMPTEURS / TRI
  ======================================================= */

  const statusCounts =
    useMemo(() => ({
      all:
        bookingRequests.length,

      pending:
        bookingRequests.filter(
          request =>
            request.status ===
            "pending"
        ).length,

      alternativeProposed:
        bookingRequests.filter(
          request =>
            request.status ===
            "alternativeProposed"
        ).length,

      accepted:
        bookingRequests.filter(
          request =>
            request.status ===
            "accepted"
        ).length,

      refused:
        bookingRequests.filter(
          request =>
            request.status ===
            "refused"
        ).length
    }), [bookingRequests])

  const displayedBookingRequests =
    useMemo(() => {
      const statusPriority:
        Record<
          BookingRequestStatus,
          number
        > = {
          pending: 0,
          alternativeProposed: 1,
          accepted: 2,
          refused: 3
        }

      const filtered =
        selectedStatus === "all"
          ? bookingRequests
          : bookingRequests.filter(
              request =>
                request.status ===
                selectedStatus
            )

      return [...filtered].sort(
        (a, b) => {
          if (
            selectedStatus === "all"
          ) {
            const difference =
              statusPriority[a.status] -
              statusPriority[b.status]

            if (difference !== 0) {
              return difference
            }
          }

          const dateA =
            Math.max(
              getTimestamp(
                a.requestedDate
              ),
              getTimestamp(
                a.proposedDate
              )
            )

          const dateB =
            Math.max(
              getTimestamp(
                b.requestedDate
              ),
              getTimestamp(
                b.proposedDate
              )
            )

          return dateB - dateA
        }
      )
    }, [
      bookingRequests,
      selectedStatus
    ])


  /* =======================================================
     FORMAT
  ======================================================= */

  const locale =
    localeForLanguage(language)

  function formatDate(
    timestamp:
      | number
      | null
      | undefined
  ): string {
    if (!timestamp) {
      return ""
    }

    const date =
      new Date(timestamp)

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return ""
    }

    return date.toLocaleDateString(
      locale,
      {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
      }
    )
  }

  function formatTime(
    timestamp:
      | number
      | null
      | undefined
  ): string {
    if (!timestamp) {
      return ""
    }

    const date =
      new Date(timestamp)

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return ""
    }

    return date.toLocaleTimeString(
      locale,
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    )
  }

  function getStatusLabel(
    status: BookingRequestStatus
  ): string {
    switch (status) {
      case "pending":
        return translate(
          language,
          "En attente"
        )
      case "alternativeProposed":
        return translate(
          language,
          "Nouveau créneau"
        )
      case "accepted":
        return translate(
          language,
          "Acceptée"
        )
      case "refused":
        return translate(
          language,
          "Refusée"
        )
    }
  }


  /* =======================================================
     PAS DE PROFESSIONNEL
  ======================================================= */

  if (!professional) {
    return (
      <main className="professionalBookingRequestsPage">
        <header className="professionalBookingRequestsHeader">
          <h1>
            {translate(
              language,
              "Vos demandes"
            )}
          </h1>
        </header>

        <p>
          {translate(
            language,
            "Vous devez être connecté."
          )}
        </p>
      </main>
    )
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="professionalBookingRequestsPage">

      <header className="professionalBookingRequestsHeader">
        <div>
          <h1>
            {translate(
              language,
              "Vos demandes"
            )}
          </h1>

          <p>
            {translate(
              language,
              "Consultez et gérez les demandes de rendez-vous reçues."
            )}
          </p>
        </div>
      </header>


      {!isLoading &&
        bookingRequests.length > 0 && (
          <div className="professionalBookingRequestFilters">

            {(
              [
                [
                  "all",
                  "Toutes",
                  statusCounts.all
                ],
                [
                  "pending",
                  "En attente",
                  statusCounts.pending
                ],
                [
                  "alternativeProposed",
                  "Nouveau créneau",
                  statusCounts
                    .alternativeProposed
                ],
                [
                  "accepted",
                  "Acceptées",
                  statusCounts.accepted
                ],
                [
                  "refused",
                  "Refusées",
                  statusCounts.refused
                ]
              ] as const
            ).map(
              ([
                status,
                label,
                count
              ]) => (
                <button
                  key={status}
                  type="button"
                  className={
                    selectedStatus === status
                      ? "professionalBookingRequestFilter active"
                      : "professionalBookingRequestFilter"
                  }
                  onClick={() =>
                    setSelectedStatus(
                      status
                    )
                  }
                >
                  {translate(
                    language,
                    label
                  )}
                  <span>{count}</span>
                </button>
              )
            )}

          </div>
        )}


      {error && (
        <div className="professionalBookingRequestsError">
          {translate(
            language,
            error
          )}
        </div>
      )}


      {isLoading && (
        <div className="professionalBookingRequestsLoading">
          <div className="professionalBookingRequestLoader" />

          <span>
            {translate(
              language,
              "Chargement..."
            )}
          </span>
        </div>
      )}


      {!isLoading &&
        bookingRequests.length === 0 && (
          <div className="professionalBookingRequestsEmpty">
            <div className="professionalBookingRequestsEmptyIcon">
              🕐
            </div>

            <h2>
              {translate(
                language,
                "Aucune demande"
              )}
            </h2>

            <p>
              {translate(
                language,
                "Les nouvelles demandes de rendez-vous apparaîtront ici."
              )}
            </p>
          </div>
        )}


      {!isLoading &&
        bookingRequests.length > 0 &&
        displayedBookingRequests.length === 0 && (
          <div className="professionalBookingRequestsFilteredEmpty">
            <span>🔎</span>

            <p>
              {translate(
                language,
                "Aucune demande avec ce statut."
              )}
            </p>
          </div>
        )}


      {!isLoading &&
        displayedBookingRequests.length > 0 && (
          <div className="professionalBookingRequestsList">

            {displayedBookingRequests.map(
              request => {
                const animal =
                  animalsById[
                    request.animalID
                  ]

                const service =
                  professionalServices.find(
                    item =>
                      item.id ===
                      request.serviceID
                  )

                const serviceName =
                  service?.name ||
                  translate(
                    language,
                    "Prestation"
                  )

                  const parsedNotes =
                    parseRequestNotes(
                      request.notes
                    )


                  const sitterDurationMinutes =
                    isSitter
                      ? getSitterDurationMinutes(
                          request
                        )
                      : 0


                  const sitterEndDate =
                    isSitter &&
                    sitterDurationMinutes > 0
                      ? new Date(
                          new Date(
                            request.requestedDate
                          ).getTime() +
                            sitterDurationMinutes *
                              60_000
                        )
                      : null

                const isProcessing =
                  processingRequestID ===
                  request.id

                const isScheduling =
                  schedulingRequestID ===
                  request.id

                const isRefusing =
                  refusingRequestID ===
                  request.id

                const hasInformations =
                  Boolean(
                    request.behavior ||
                    request.coatCondition ||
                    request.weight ||
                    parsedNotes.notes ||
                    parsedNotes
                      .preferredDays
                      .length ||
                    Object.keys(
                      parsedNotes
                        .customAnswers
                    ).length
                  )

                const requestedSlotAvailable =
                  isScheduling
                    ? isRequestedSlotAvailable(
                        request
                      )
                    : false

                const requestedDate =
                  new Date(
                    request.requestedDate
                  )

                const collaboratorWorksRequestedDay =
                  (collaborator: string) =>
                    !Number.isNaN(
                      requestedDate.getTime()
                    ) &&
                    collaboratorWorksOnDate(
                      collaborator,
                      requestedDate
                    )

                return (
                  <article
                    key={request.id}
                    className={`professionalBookingRequestCard status-${request.status}`}
                  >

                    <div className="professionalBookingRequestCardHeader">
                      <div className="professionalBookingRequestAnimal">
                        <span className="professionalBookingRequestSmallLabel">
                          {translate(
                            language,
                            "Animal"
                          )}
                        </span>

                        <strong>
                          {animal?.name ??
                            translate(
                              language,
                              "Animal"
                            )}
                        </strong>

                        <span className="professionalBookingRequestService">
                          {serviceName}
                        </span>
                      </div>

                      <span
                        className={`professionalBookingRequestStatus status-${request.status}`}
                      >
                        {getStatusLabel(
                          request.status
                        )}
                      </span>
                    </div>


                    <section className="professionalBookingRequestSection">
                      <div className="professionalBookingRequestSectionTitle">
                        <span className="professionalBookingRequestSectionIcon">
                          📅
                        </span>

                        <span>
                          {translate(
                            language,
                            "Créneau demandé"
                          )}
                        </span>
                      </div>

                      <div className="professionalBookingRequestDateCard">
                        <strong>
                          {formatDate(
                            request.requestedDate
                          )}
                        </strong>

                        <span>
                          {formatTime(
                            request.requestedDate
                          )}

                          {isSitter &&
                            sitterEndDate && (
                              <>
                                {" → "}
                                {sitterEndDate.toLocaleTimeString(
                                  locale,
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  }
                                )}
                              </>
                            )}
                        </span>
                      </div>
                    </section>


                    {request.status ===
                      "alternativeProposed" &&
                      request.proposedDate && (
                        <section className="professionalBookingRequestSection">
                          <div className="professionalBookingRequestSectionTitle proposed">
                            <span className="professionalBookingRequestSectionIcon">
                              ✨
                            </span>

                            <span>
                              {translate(
                                language,
                                "Créneau proposé"
                              )}
                            </span>
                          </div>

                          <div className="professionalBookingRequestDateCard proposed">
                            <strong>
                              {formatDate(
                                request.proposedDate
                              )}
                            </strong>

                            <span>
                              {formatTime(
                                request.proposedDate
                              )}
                            </span>
                          </div>
                        </section>
                      )}


                    {hasInformations && (
                      <section className="professionalBookingRequestSection">
                        <div className="professionalBookingRequestSectionTitle">
                          <span className="professionalBookingRequestSectionIcon">
                            🐶
                          </span>

                          <span>
                            {translate(
                              language,
                              "Informations transmises"
                            )}
                          </span>
                        </div>

                        <div className="professionalBookingRequestInformations">

                          {request.behavior && (
                            <div className="professionalBookingRequestInformation">
                              <span>
                                {translate(
                                  language,
                                  "Comportement"
                                )}
                              </span>

                              <strong>
                                {request.behavior}
                              </strong>
                            </div>
                          )}

                          {request.coatCondition && (
                            <div className="professionalBookingRequestInformation">
                              <span>
                                {translate(
                                  language,
                                  "État du pelage"
                                )}
                              </span>

                              <strong>
                                {request.coatCondition}
                              </strong>
                            </div>
                          )}

                          {request.weight > 0 && (
                            <div className="professionalBookingRequestInformation">
                              <span>
                                {translate(
                                  language,
                                  "Poids"
                                )}
                              </span>

                              <strong>
                                {request.weight} kg
                              </strong>
                            </div>
                          )}

                          {parsedNotes
                            .preferredDays
                            .length > 0 && (
                              <div className="professionalBookingRequestInformation professionalBookingRequestInformationFull">
                                <span>
                                  {translate(
                                    language,
                                    "Jours préférés"
                                  )}
                                </span>

                                <strong>
                                  {parsedNotes
                                    .preferredDays
                                    .map(
                                      day =>
                                        translateWeekday(
                                          day,
                                          language
                                        )
                                    )
                                    .join(", ")}
                                </strong>
                              </div>
                            )}

                          {parsedNotes.notes && (
                            <div className="professionalBookingRequestInformation professionalBookingRequestInformationFull">
                              <span>
                                {translate(
                                  language,
                                  "Notes"
                                )}
                              </span>

                              <strong>
                                {parsedNotes.notes}
                              </strong>
                            </div>
                          )}

                          {Object.entries(
                            parsedNotes
                              .customAnswers
                          ).map(
                            ([
                              question,
                              answer
                            ]) => (
                              <div
                                key={question}
                                className="professionalBookingRequestInformation professionalBookingRequestInformationFull"
                              >
                                <span>
                                  {question}
                                </span>

                                <strong>
                                  {answer}
                                </strong>
                              </div>
                            )
                          )}

                        </div>
                      </section>
                    )}


                    {request.status ===
                      "pending" && (
                        <div className="professionalBookingRequestActions">

                        <button
                          type="button"
                          className={
                            isSitter
                              ? "professionalBookingRequestButton sitterAccept"
                              : "professionalBookingRequestButton accept"
                          }
                          disabled={isProcessing}
                          onClick={() => {
                            if (isSitter) {
                              handleSitterAccept(
                                request
                              )
                              return
                            }

                            if (isScheduling) {
                              setSchedulingRequestID(
                                null
                              )
                            } else {
                              openScheduling(
                                request
                              )
                            }
                          }}
                        >
                          {translate(
                            language,
                            isSitter
                              ? isProcessing
                                ? "Traitement..."
                                : "Accepter"
                              : isScheduling
                                ? "Fermer la planification"
                                : "Planifier le rendez-vous"
                          )}
                        </button>

                          <button
                            type="button"
                            className="professionalBookingRequestButton refuse"
                            disabled={
                              isProcessing
                            }
                            onClick={() => {
                              setRefusingRequestID(
                                isRefusing
                                  ? null
                                  : request.id
                              )

                              setSchedulingRequestID(
                                null
                              )
                              setRefusalReason("")
                            }}
                          >
                            {translate(
                              language,
                              "Refuser"
                            )}
                          </button>

                        </div>
                      )}


                    {!isSitter &&
                      request.status ===
                        "pending" &&
                      isScheduling && (
                        <div className="professionalBookingRequestScheduler">

                          <div className="professionalBookingRequestSchedulerHeader">
                            <div>
                              <span className="professionalBookingRequestSmallLabel">
                                {translate(
                                  language,
                                  "Confirmation"
                                )}
                              </span>

                              <h3>
                                {translate(
                                  language,
                                  "Confirmer le rendez-vous"
                                )}
                              </h3>

                              <p>
                                {translate(
                                  language,
                                  "Le propriétaire a déjà choisi son créneau. Indiquez la durée réelle et le collaborateur qui prendra en charge le rendez-vous."
                                )}
                              </p>
                            </div>

                            <span className="professionalBookingRequestDurationValue">
                              {selectedDuration} min
                            </span>
                          </div>


                          <div className="professionalBookingRequestSchedulerBlock">
                            <div className="professionalBookingRequestSchedulerLabel">
                              <strong>
                                {translate(
                                  language,
                                  "Créneau demandé"
                                )}
                              </strong>
                            </div>

                            <div className="professionalBookingRequestSelectionSummary">
                              <div>
                                <span>
                                  {translate(
                                    language,
                                    "Début du rendez-vous"
                                  )}
                                </span>

                                <strong>
                                  {formatDate(
                                    request.requestedDate
                                  )}{" "}
                                  ·{" "}
                                  {formatTime(
                                    request.requestedDate
                                  )}
                                </strong>

                                <small>
                                  {translate(
                                    language,
                                    "Le début du rendez-vous ne change pas."
                                  )}
                                </small>
                              </div>
                            </div>
                          </div>


                          <div className="professionalBookingRequestSchedulerBlock">
                            <div className="professionalBookingRequestSchedulerLabel">
                              <strong>
                                {translate(
                                  language,
                                  "Durée du rendez-vous"
                                )}
                              </strong>

                              <span>
                                {translate(
                                  language,
                                  "Ajustez la durée nécessaire pour cet animal."
                                )}
                              </span>
                            </div>

                            <input
                              className="professionalBookingRequestDurationSlider"
                              type="range"
                              min="15"
                              max="360"
                              step="15"
                              value={
                                selectedDuration
                              }
                              onChange={
                                event =>
                                  setSelectedDuration(
                                    Number(
                                      event
                                        .target
                                        .value
                                    )
                                  )
                              }
                            />

                            <div className="professionalBookingRequestSliderScale">
                              <span>15 min</span>
                              <span>6 h</span>
                            </div>
                          </div>


                          <div className="professionalBookingRequestSchedulerBlock">
                            <div className="professionalBookingRequestSchedulerLabel">
                              <strong>
                                {translate(
                                  language,
                                  "Collaborateur"
                                )}
                              </strong>

                              <span>
                                {translate(
                                  language,
                                  "Choisissez le collaborateur qui prendra en charge ce rendez-vous."
                                )}
                              </span>
                            </div>

                            <div className="professionalBookingRequestCollaborators">
                              {collaborators.map(
                                collaborator => {
                                  const worksThisDay =
                                    collaboratorWorksRequestedDay(
                                      collaborator
                                    )

                                  return (
                                    <button
                                      key={
                                        collaborator
                                      }
                                      type="button"
                                      disabled={
                                        !worksThisDay
                                      }
                                      className={[
                                        "professionalBookingRequestCollaborator",
                                        selectedCollaborator ===
                                          collaborator
                                          ? "active"
                                          : "",
                                        !worksThisDay
                                          ? "unavailable"
                                          : ""
                                      ]
                                        .filter(Boolean)
                                        .join(" ")}
                                      onClick={() =>
                                        setSelectedCollaborator(
                                          collaborator
                                        )
                                      }
                                      title={
                                        worksThisDay
                                          ? ""
                                          : translate(
                                              language,
                                              "Ce collaborateur ne travaille pas ce jour-là."
                                            )
                                      }
                                    >
                                      {collaborator}
                                    </button>
                                  )
                                }
                              )}
                            </div>
                          </div>


                           <div className="professionalBookingRequestSchedulerBlock">

                               <div className="professionalBookingRequestSchedulerLabel">

                                 <strong>
                                   {translate(
                                     language,
                                     "Proposer un autre créneau"
                                   )}
                                 </strong>

                                 <span>
                                   {translate(
                                     language,
                                     "Si le créneau demandé ne vous convient pas, choisissez une autre date et une autre heure."
                                   )}
                                 </span>

                               </div>


                               <div className="professionalBookingRequestAlternativeFields">

                                 <label className="professionalBookingRequestAlternativeField">

                                   <span>
                                     {translate(
                                       language,
                                       "Date"
                                     )}
                                   </span>

                                   <input
                                     type="date"
                                     value={proposedDate}
                                     min={dateInputValue(
                                       new Date()
                                     )}
                                     onChange={event =>
                                       setProposedDate(
                                         event.target.value
                                       )
                                     }
                                   />

                                 </label>


                                 <label className="professionalBookingRequestAlternativeField">

                                   <span>
                                     {translate(
                                       language,
                                       "Heure"
                                     )}
                                   </span>

                                   <input
                                     type="time"
                                     step="900"
                                     value={proposedTime}
                                     onChange={event =>
                                       setProposedTime(
                                         event.target.value
                                       )
                                     }
                                   />

                                 </label>

                               </div>


                               {proposedDate &&
                                 proposedTime && (
                                   <div
                                     className={[
                                       "professionalBookingRequestAlternativeAvailability",
                                       isProposedSlotAvailable()
                                         ? "available"
                                         : "unavailable"
                                     ].join(" ")}
                                   >

                                     <span>
                                       {isProposedSlotAvailable()
                                         ? "✓"
                                         : "!"}
                                     </span>

                                     <div>

                                       <strong>
                                         {translate(
                                           language,
                                           isProposedSlotAvailable()
                                             ? "Ce créneau est disponible"
                                             : "Ce créneau n'est pas disponible"
                                         )}
                                       </strong>

                                       <small>
                                         {formatDate(
                                           buildProposedDate()
                                             ?.getTime()
                                         )}

                                         {" · "}

                                         {proposedTime}

                                         {" → "}

                                         {buildProposedDate()
                                           ? new Date(
                                               buildProposedDate()!
                                                 .getTime() +
                                                 selectedDuration *
                                                   60_000
                                             ).toLocaleTimeString(
                                               locale,
                                               {
                                                 hour:
                                                   "2-digit",
                                                 minute:
                                                   "2-digit"
                                               }
                                             )
                                           : ""}
                                       </small>

                                       {selectedCollaborator && (
                                         <small>
                                           {selectedCollaborator}
                                           {" · "}
                                           {selectedDuration} min
                                         </small>
                                       )}

                                     </div>

                                   </div>
                                 )}


                               <button
                                 type="button"
                                 className="professionalBookingRequestProposeSlotButton"
                                 disabled={
                                   isProcessing ||
                                   isLoadingAppointments ||
                                   !isProposedSlotAvailable()
                                 }
                                 onClick={() =>
                                   handleProposeAlternative(
                                     request
                                   )
                                 }
                               >

                                 {isProcessing
                                   ? translate(
                                       language,
                                       "Traitement..."
                                     )
                                   : translate(
                                       language,
                                       "Proposer ce créneau"
                                     )}

                               </button>

                             </div>
                                       
                          <div className="professionalBookingRequestSchedulerBlock">
                            <div className="professionalBookingRequestSchedulerLabel">
                              <strong>
                                {translate(
                                  language,
                                  "Récapitulatif"
                                )}
                              </strong>
                            </div>

                            <div className="professionalBookingRequestSelectionSummary">
                              <div>
                                <span>
                                  {translate(
                                    language,
                                    requestedSlotAvailable
                                      ? "Disponible"
                                      : selectedCollaborator &&
                                        !collaboratorWorksRequestedDay(
                                          selectedCollaborator
                                        )
                                        ? "Ce collaborateur ne travaille pas ce jour-là"
                                        : "Ce collaborateur n'est pas libre sur cette plage horaire"
                                  )}
                                </span>

                                <strong>
                                  {formatTime(
                                    request.requestedDate
                                  )}
                                  {" → "}
                                  {new Date(
                                    new Date(
                                      request.requestedDate
                                    ).getTime() +
                                      selectedDuration *
                                        60_000
                                  ).toLocaleTimeString(
                                    locale,
                                    {
                                      hour:
                                        "2-digit",
                                      minute:
                                        "2-digit"
                                    }
                                  )}
                                </strong>

                                <small>
                                  {selectedCollaborator}
                                  {" · "}
                                  {selectedDuration} min
                                </small>
                              </div>

                              <button
                                type="button"
                                className="professionalBookingRequestConfirmSlotButton"
                                disabled={
                                  isProcessing ||
                                  isLoadingAppointments ||
                                  !requestedSlotAvailable
                                }
                                onClick={() =>
                                  handleAccept(
                                    request
                                  )
                                }
                              >
                                {isProcessing
                                  ? translate(
                                      language,
                                      "Traitement..."
                                    )
                                  : translate(
                                      language,
                                      "Confirmer le rendez-vous"
                                    )}
                              </button>
                            </div>

                            {!isLoadingAppointments &&
                              !requestedSlotAvailable && (
                                <div className="professionalBookingRequestNoSlots">
                                  {translate(
                                    language,
                                    selectedCollaborator &&
                                      !collaboratorWorksRequestedDay(
                                        selectedCollaborator
                                      )
                                      ? "Ce collaborateur ne travaille pas le jour demandé. Choisissez un collaborateur qui travaille ce jour-là."
                                      : "Ce collaborateur a déjà un rendez-vous sur cette plage horaire, ou la durée dépasse les horaires du salon. Choisissez un autre collaborateur ou ajustez la durée."
                                  )}
                                </div>
                            )}
                          </div>


                          {isLoadingAppointments && (
                            <div className="professionalBookingRequestSchedulerLoading">
                              <div className="professionalBookingRequestLoader" />

                              <span>
                                {translate(
                                  language,
                                  "Vérification du créneau..."
                                )}
                              </span>
                            </div>
                          )}

                        </div>
                      )}


                    {request.status ===
                      "pending" &&
                      isRefusing && (
                        <div className="professionalBookingRequestInlineForm">

                          <label>
                            {translate(
                              language,
                              "Motif du refus"
                            )}
                          </label>

                          <textarea
                            value={
                              refusalReason
                            }
                            onChange={
                              event =>
                                setRefusalReason(
                                  event
                                    .target
                                    .value
                                )
                            }
                            placeholder={translate(
                              language,
                              "Indiquez éventuellement la raison du refus."
                            )}
                            rows={3}
                          />

                          <div className="professionalBookingRequestInlineFormActions">
                            <button
                              type="button"
                              className="professionalBookingRequestConfirmRefuseButton"
                              disabled={
                                isProcessing
                              }
                              onClick={() =>
                                handleRefuse(
                                  request
                                )
                              }
                            >
                              {isProcessing
                                ? translate(
                                    language,
                                    "Traitement..."
                                  )
                                : translate(
                                    language,
                                    "Confirmer le refus"
                                  )}
                            </button>

                            <button
                              type="button"
                              className="professionalBookingRequestCancelButton"
                              disabled={
                                isProcessing
                              }
                              onClick={() => {
                                setRefusingRequestID(
                                  null
                                )
                                setRefusalReason("")
                              }}
                            >
                              {translate(
                                language,
                                "Annuler"
                              )}
                            </button>
                          </div>
                        </div>
                      )}


                    {request.status ===
                      "alternativeProposed" && (
                        <div className="professionalBookingRequestMessage alternative">
                          <span>📅</span>

                          <p>
                            {translate(
                              language,
                              "Vous avez proposé un autre créneau au propriétaire. Le rendez-vous sera créé uniquement s'il accepte."
                            )}
                          </p>
                        </div>
                      )}


                    {request.status ===
                      "accepted" && (
                        <div className="professionalBookingRequestMessage accepted">
                          <span>✓</span>

                          <p>
                            {translate(
                              language,
                              "Cette demande a été acceptée et ajoutée à votre agenda."
                            )}
                          </p>
                        </div>
                      )}


                    {request.status ===
                      "refused" && (
                        <>
                          <div className="professionalBookingRequestMessage refused">
                            <span>×</span>

                            <p>
                              {translate(
                                language,
                                "Cette demande a été refusée."
                              )}
                            </p>
                          </div>

                          {request.refusalReason && (
                            <div className="professionalBookingRequestRefusalReason">
                              <span>
                                {translate(
                                  language,
                                  "Motif du refus"
                                )}
                              </span>

                              <p>
                                {request.refusalReason}
                              </p>
                            </div>
                          )}
                        </>
                      )}

                  </article>
                )
              }
            )}

          </div>
        )}

    </main>
  )
}
