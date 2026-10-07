"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react"

import {
  useRouter,
  useSearchParams
} from "next/navigation"

import {
  useAuth
} from "@/context/AuthContext"

import {
  useLanguage
} from "@/context/LanguageContext"

import {
  translate
} from "@/translations/translations"

import {
  fetchProfessional
} from "@/services/fetchProfessionalById"

import {
  fetchLatestAnimalRDV
} from "@/services/fetchLatestAnimalRDV"

import {
  BookedAppointment,
  fetchBookedAppointments
} from "@/services/fetchBookedAppointments"

import {
  sendNotificationToAll
} from "@/services/notifications"

import { Suspense } from "react"

import "./BookingRequest.css"


/* =========================================================
   TYPES
========================================================= */

type DaySchedule = {
  isOpen: boolean
  openingMinutes: number
  closingMinutes: number
}

type AppointmentWithCollaborator = {
  collaborator: string
  appointment: BookedAppointment
}

type PreviousInformations = {
  behavior: string
  coatCondition: string
  weight: number | null
  notes: string
}

type PreferredDay = {
  key: string
  label: string
}


/* =========================================================
   CONSTANTES
========================================================= */

/*
 * Ces valeurs correspondent aux jours
 * enregistrés dans schedules dans CloudKit.
 */
const frenchDays = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi"
]


const preferredDaysList: PreferredDay[] = [
  {
    key: "lundi",
    label: "Lun"
  },
  {
    key: "mardi",
    label: "Mar"
  },
  {
    key: "mercredi",
    label: "Mer"
  },
  {
    key: "jeudi",
    label: "Jeu"
  },
  {
    key: "vendredi",
    label: "Ven"
  },
  {
    key: "samedi",
    label: "Sam"
  },
  {
    key: "dimanche",
    label: "Dim"
  }
]


/* =========================================================
   OUTILS HORAIRES
========================================================= */

function timeToMinutes(
  time: string
): number {

  const [
    hours,
    minutes
  ] = time
    .split(":")
    .map(Number)

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return 0
  }

  return (
    hours * 60 +
    minutes
  )
}


function minutesToTime(
  minutes: number
): string {

  const hours =
    Math.floor(
      minutes / 60
    )

  const remainingMinutes =
    minutes % 60

  return `${String(
    hours
  ).padStart(
    2,
    "0"
  )}:${String(
    remainingMinutes
  ).padStart(
    2,
    "0"
  )}`
}


function parseDaySchedule(
  planning: string[] | undefined,
  date: Date
): DaySchedule {

  const dayName =
    frenchDays[
      date.getDay()
    ]

  const line =
    planning?.find(
      item =>
        item
          .trim()
          .toLocaleLowerCase(
            "fr-FR"
          )
          .startsWith(
            dayName
              .toLocaleLowerCase(
                "fr-FR"
              )
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
      .replace(
        dayName,
        ""
      )
      .replace(
        "=",
        ""
      )
      .trim()


  if (
    !normalized ||
    normalized
      .toLocaleLowerCase(
        "fr-FR"
      ) ===
      "fermé"
  ) {

    return {
      isOpen: false,
      openingMinutes: 0,
      closingMinutes: 0
    }
  }


  const [
    opening,
    closing
  ] = normalized
    .split("-")
    .map(
      value =>
        value.trim()
    )


  if (
    !opening ||
    !closing
  ) {

    return {
      isOpen: false,
      openingMinutes: 0,
      closingMinutes: 0
    }
  }


  return {
    isOpen: true,
    openingMinutes:
      timeToMinutes(
        opening
      ),
    closingMinutes:
      timeToMinutes(
        closing
      )
  }
}


function createTimeSlots(
  schedule: DaySchedule,
  requiredDurationMinutes: number
): string[] {

  if (
    !schedule.isOpen
  ) {
    return []
  }


  const slots: string[] =
    []

  const interval = 30


  for (
    let start =
      schedule.openingMinutes;

    start +
      requiredDurationMinutes <=
      schedule.closingMinutes;

    start += interval
  ) {

    slots.push(
      minutesToTime(
        start
      )
    )
  }


  return slots
}


/* =========================================================
   FORMAT DATE
========================================================= */

function dateToInputValue(
  date: Date
): string {

  const year =
    date.getFullYear()

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    )

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    )


  return `${year}-${month}-${day}`
}


function inputValueToDate(
  value: string
): Date | null {

  if (!value) {
    return null
  }


  const [
    year,
    month,
    day
  ] = value
    .split("-")
    .map(Number)


  if (
    !year ||
    !month ||
    !day
  ) {
    return null
  }


  return new Date(
    year,
    month - 1,
    day,
    0,
    0,
    0,
    0
  )
}


/* =========================================================
   PAGE
========================================================= */

function BookingRequestContent() {

  const router =
    useRouter()

  const searchParams =
    useSearchParams()

  const {
    session
  } = useAuth()

  const {
    language
  } = useLanguage()


  const user =
    session?.accountType ===
    "animal"
      ? session.user
      : null


  const professionalID =
    searchParams.get(
      "professionalID"
    ) ?? ""


  const serviceID =
    searchParams.get(
      "serviceID"
    ) ?? ""


  const professionalType =
    searchParams.get(
      "professionalType"
    ) ?? ""


  const isSitter =
    professionalType ===
    "sitter"


  /* =======================================================
     PROFESSIONNEL / SERVICE
  ======================================================= */

  const [
    professional,
    setProfessional
  ] = useState<any | null>(
    null
  )


  const [
    service,
    setService
  ] = useState<any | null>(
    null
  )


  const [
    isLoading,
    setIsLoading
  ] = useState(true)


  const [
    loadError,
    setLoadError
  ] = useState("")


  /* =======================================================
     INFORMATIONS ANIMAL
  ======================================================= */

  const [
    behavior,
    setBehavior
  ] = useState("")


  const [
    coatCondition,
    setCoatCondition
  ] = useState("")


  const [
    weight,
    setWeight
  ] = useState("")


  const [
    notes,
    setNotes
  ] = useState("")
    
    const [
      phoneNumber,
      setPhoneNumber
    ] = useState("")


  const [
    customAnswers,
    setCustomAnswers
  ] = useState<
    Record<string, string>
  >({})


  const [
    hasPreviousInformations,
    setHasPreviousInformations
  ] = useState(false)


  const [
    isLoadingPreviousInformations,
    setIsLoadingPreviousInformations
  ] = useState(false)


  /* =======================================================
     DATE / HEURE
  ======================================================= */

  const [
    requestedDate,
    setRequestedDate
  ] = useState("")


  const [
    requestedTime,
    setRequestedTime
  ] = useState("")


  /* =======================================================
     SITTER : DURÉE / ADRESSE
  ======================================================= */

  const [
    sitterDurationHours,
    setSitterDurationHours
  ] = useState(1)


  const [
    pickupAddress,
    setPickupAddress
  ] = useState("")


  /* =======================================================
     JOURS PRÉFÉRÉS
  ======================================================= */

  const [
    preferredDays,
    setPreferredDays
  ] = useState<string[]>(
    []
  )


  /* =======================================================
     RDV EXISTANTS
  ======================================================= */

  const [
    bookedAppointments,
    setBookedAppointments
  ] = useState<
    AppointmentWithCollaborator[]
  >([])


  const [
    isLoadingAppointments,
    setIsLoadingAppointments
  ] = useState(false)


  /* =======================================================
     ENVOI
  ======================================================= */

  const [
    isSending,
    setIsSending
  ] = useState(false)


  const [
    error,
    setError
  ] = useState("")


  const [
    isSent,
    setIsSent
  ] = useState(false)


  /* =======================================================
     CHARGEMENT PROFESSIONNEL
  ======================================================= */

  useEffect(() => {

    let cancelled =
      false


    async function load() {

      if (
        !professionalID ||
        !serviceID
      ) {

        setLoadError(
          "Demande invalide."
        )

        setIsLoading(
          false
        )

        return
      }


      try {

        setIsLoading(
          true
        )

        setLoadError(
          ""
        )


        const foundProfessional =
          await fetchProfessional(
            professionalID
          )


        console.log(
          "=== PROFESSIONNEL BOOKING REQUEST ===",
          foundProfessional
        )


        if (cancelled) {
          return
        }


        if (
          !foundProfessional
        ) {

          setLoadError(
            "Professionnel introuvable."
          )

          return
        }


        let foundService: any =
          null


        if (isSitter) {

          const sitterServices:
            string[] =
            Array.isArray(
              foundProfessional.services
            )
              ? foundProfessional.services
              : []


          const hasService =
            sitterServices.includes(
              serviceID
            )


          if (!hasService) {

            setLoadError(
              "Service introuvable."
            )

            return
          }


          const sitterServiceNames:
            Record<string, string> = {
              garde: "Garde",
              visites: "Visites",
              promenades: "Promenades",
              hebergement: "Hébergement",
              transport: "Transport"
            }


            const sitterProfessional =
              foundProfessional as typeof foundProfessional & {
                price?: number
                devise?: string
              }


            foundService = {
              id: serviceID,
              name:
                sitterServiceNames[
                  serviceID
                ] ?? serviceID,
              description: "",
              price:
                Number(
                  sitterProfessional.price ??
                  0
                ),
              devise:
                sitterProfessional.devise ??
                "€",
              duration: 60,
              bookingMode:
                "approvalRequired",
              requiredInformations: [],
              customQuestions: []
            }

        } else {

          foundService =
            foundProfessional
              .services
              ?.find(
                (item: any) =>
                  item.id ===
                  serviceID
              )


          if (!foundService) {

            setLoadError(
              "Service introuvable."
            )

            return
          }


          if (
            foundService
              .bookingMode !==
            "approvalRequired"
          ) {

            setLoadError(
              "Cette prestation ne nécessite pas de demande de créneau."
            )

            return
          }
        }


        console.log(
          "=== SERVICE BOOKING REQUEST ===",
          foundService
        )


        setProfessional(
          foundProfessional
        )

        setService(
          foundService
        )

      } catch (
        loadError
      ) {

        console.error(
          "Erreur chargement BookingRequest :",
          loadError
        )


        if (
          !cancelled
        ) {

          setLoadError(
            "Impossible de charger la prestation."
          )
        }

      } finally {

        if (
          !cancelled
        ) {

          setIsLoading(
            false
          )
        }
      }
    }


    load()


    return () => {
      cancelled = true
    }

  }, [
    professionalID,
    serviceID,
    isSitter
  ])
    
    const sitterEstimatedPrice =
      isSitter
        ? Number(professional?.price ?? 0) *
          sitterDurationHours
        : Number(service?.price ?? 0)
    
    const sitterBookingServiceID =
      `Sitting-${sitterDurationHours}-${sitterEstimatedPrice}`


  /* =======================================================
     ANCIENNES INFORMATIONS
  ======================================================= */

  useEffect(() => {

    let cancelled =
      false


    async function loadPreviousInformations() {

      if (isSitter) {

        setBehavior("")
        setCoatCondition("")
        setWeight("")
        setNotes("")
        setCustomAnswers({})

        setHasPreviousInformations(
          false
        )

        setIsLoadingPreviousInformations(
          false
        )

        return
      }


      if (
        !professional?.id ||
        !service?.id ||
        !user?.id
      ) {
        return
      }


      setBehavior("")
      setCoatCondition("")
      setWeight("")
      setNotes("")
      setCustomAnswers({})

      setHasPreviousInformations(
        false
      )


      try {

        setIsLoadingPreviousInformations(
          true
        )


        const previous:
          PreviousInformations | null =
          await fetchLatestAnimalRDV(
            professional.id,
            user.id
          )


        console.log(
          "=== DERNIER RDV BOOKING REQUEST ===",
          previous
        )


        if (
          cancelled
        ) {
          return
        }


        if (!previous) {
          return
        }


        setHasPreviousInformations(
          true
        )


        const required =
          service
            .requiredInformations ??
          []


        if (
          required.includes(
            "behavior"
          )
        ) {

          setBehavior(
            previous.behavior ??
              ""
          )
        }


        if (
          required.includes(
            "coatCondition"
          )
        ) {

          setCoatCondition(
            previous
              .coatCondition ??
              ""
          )
        }


        if (
          required.includes(
            "weight"
          )
        ) {

            const normalizedWeight =
              previous.weight != null
                ? String(previous.weight)
                    .replace(",", ".")
                    .replace(/[^\d.]/g, "")
                : ""

            setWeight(
              normalizedWeight
            )
        }


        if (
          required.includes(
            "notes"
          )
        ) {

          setNotes(
            previous.notes ??
              ""
          )
        }

      } catch (
        previousError
      ) {

        console.error(
          "Erreur récupération ancien RDV :",
          previousError
        )

      } finally {

        if (
          !cancelled
        ) {

          setIsLoadingPreviousInformations(
            false
          )
        }
      }
    }


    loadPreviousInformations()


    return () => {
      cancelled = true
    }

  }, [
    professional?.id,
    service?.id,
    user?.id,
    isSitter
  ])


  /* =======================================================
     PLANNING
  ======================================================= */

  const planning:
    string[] =
    isSitter
      ? professional
          ?.availability ??
        []
      : professional
          ?.schedules ??
        []


  /*
   * Si plusieurs collaborateurs existent,
   * on vérifie leurs agendas séparément.
   *
   * Si aucun collaborateur n'est défini,
   * on utilise le nom du professionnel.
   */
  const collaborators =
    useMemo(
      () => {

        const values:
          string[] =
          professional
            ?.collaborators
            ?.filter(
              (
                value: string
              ) =>
                Boolean(
                  value?.trim()
                )
            ) ??
          []


        if (
          values.length > 0
        ) {
          return values
        }


        if (
          professional?.name
        ) {

          return [
            professional.name
          ]
        }


        return []

      },
      [
        professional
      ]
    )


  /* =======================================================
     CHARGEMENT DES RDV
  ======================================================= */

  useEffect(() => {

    let cancelled =
      false


    async function loadAppointments() {

      if (
        !professional?.id ||
        collaborators.length ===
          0
      ) {

        setBookedAppointments(
          []
        )

        return
      }


      try {

        setIsLoadingAppointments(
          true
        )


        const results =
          isSitter
            ? [
                (
                 await fetchBookedAppointments(
                   professional.id,
                   ""
                 )
                ).map(
                  appointment => ({
                    collaborator:
                      professional.name ??
                      "sitter",
                    appointment
                  })
                )
              ]
            : await Promise.all(
                collaborators.map(
                  async collaborator => {

                    const appointments =
                      await fetchBookedAppointments(
                        professional.id,
                        collaborator
                      )


                    return appointments.map(
                      appointment => ({
                        collaborator,
                        appointment
                      })
                    )
                  }
                )
              )


        if (
          !cancelled
        ) {

          setBookedAppointments(
            results.flat()
          )
        }

      } catch (
        appointmentError
      ) {

        console.error(
          "Erreur récupération des RDV :",
          appointmentError
        )


        if (
          !cancelled
        ) {

          setBookedAppointments(
            []
          )
        }

      } finally {

        if (
          !cancelled
        ) {

          setIsLoadingAppointments(
            false
          )
        }
      }
    }


    loadAppointments()


    return () => {
      cancelled = true
    }

  }, [
    professional?.id,
    collaborators,
    isSitter,
    sitterDurationHours
  ])


  /* =======================================================
     DURÉE PRESTATION
  ======================================================= */

  const requiredDurationMinutes =
    isSitter
      ? Math.max(
          sitterDurationHours * 60,
          60
        )
      : Math.max(
          Number(
            service?.duration ??
            30
          ),
          1
        )


  /* =======================================================
     DURÉE D'UN RDV EXISTANT
  ======================================================= */

  const getExistingAppointmentDuration =
    useCallback(
      (
        appointment:
          BookedAppointment
      ): number => {

        if (
          Number(
            appointment.duration
          ) > 0
        ) {

          return Number(
            appointment.duration
          )
        }


        const existingService =
          professional
            ?.services
            ?.find(
              (
                existingService:
                  any
              ) =>
                existingService.id ===
                  appointment
                    .serviceID ||
                existingService.name ===
                  appointment
                    .serviceID
            )


        return Number(
          existingService
            ?.duration ??
          30
        )
      },
      [
        professional?.services
      ]
    )


  /* =======================================================
     COLLABORATEUR DISPONIBLE ?
  ======================================================= */

  const isCollaboratorAvailable =
    useCallback(
      (
        collaborator:
          string,
        date:
          Date,
        startTime:
          string
      ): boolean => {

        const [
          hours,
          minutes
        ] = startTime
          .split(":")
          .map(Number)


        if (
          Number.isNaN(
            hours
          ) ||
          Number.isNaN(
            minutes
          )
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


        const candidateEnd =
          new Date(
            candidateStart
              .getTime() +
            requiredDurationMinutes *
              60_000
          )


        if (
          candidateStart <=
          new Date()
        ) {
          return false
        }


        const collaboratorAppointments =
          bookedAppointments.filter(
            item =>
              item.collaborator ===
              collaborator
          )


        return !collaboratorAppointments.some(
          item => {

            const bookedStart =
              new Date(
                item
                  .appointment
                  .date
              )


            const bookedDuration =
              getExistingAppointmentDuration(
                item.appointment
              )


            const bookedEnd =
              new Date(
                bookedStart
                  .getTime() +
                bookedDuration *
                  60_000
              )


            return (
              candidateStart <
                bookedEnd &&
              candidateEnd >
                bookedStart
            )
          }
        )
      },
      [
        bookedAppointments,
        getExistingAppointmentDuration,
        requiredDurationMinutes
      ]
    )


  /* =======================================================
     CRÉNEAU DISPONIBLE ?
  ======================================================= */

  const isSlotAvailable =
    useCallback(
      (
        date: Date,
        startTime: string
      ): boolean => {

        if (
          collaborators.length ===
          0
        ) {
          return false
        }


        /*
         * Un créneau est disponible
         * si AU MOINS UN collaborateur
         * est libre.
         */
        return collaborators.some(
          collaborator =>
            isCollaboratorAvailable(
              collaborator,
              date,
              startTime
            )
        )
      },
      [
        collaborators,
        isCollaboratorAvailable
      ]
    )


  /* =======================================================
     HORAIRES DISPONIBLES POUR UNE DATE
  ======================================================= */

  const getAvailableTimesForDate =
    useCallback(
      (
        date: Date
      ): string[] => {

        const schedule =
          parseDaySchedule(
            planning,
            date
          )


        if (
          !schedule.isOpen
        ) {
          return []
        }


        const scheduleTimes =
          createTimeSlots(
            schedule,
            requiredDurationMinutes
          )


        return scheduleTimes.filter(
          time =>
            isSlotAvailable(
              date,
              time
            )
        )
      },
      [
        planning,
        requiredDurationMinutes,
        isSlotAvailable
      ]
    )


  /* =======================================================
     DATE SÉLECTIONNÉE
  ======================================================= */

  const selectedDate =
    useMemo(
      () =>
        inputValueToDate(
          requestedDate
        ),
      [
        requestedDate
      ]
    )


  const selectedDaySchedule =
    useMemo(
      () => {

        if (
          !selectedDate
        ) {
          return null
        }


        return parseDaySchedule(
          planning,
          selectedDate
        )
      },
      [
        planning,
        selectedDate
      ]
    )


  const availableTimes =
    useMemo(
      () => {

        if (
          !selectedDate
        ) {
          return []
        }


        return getAvailableTimesForDate(
          selectedDate
        )
      },
      [
        selectedDate,
        getAvailableTimesForDate
      ]
    )


  /*
   * Si l'heure sélectionnée devient
   * indisponible, on la retire.
   */
  useEffect(() => {

    if (
      requestedTime &&
      !availableTimes.includes(
        requestedTime
      )
    ) {

      setRequestedTime(
        ""
      )
    }

  }, [
    availableTimes,
    requestedTime
  ])


  /* =======================================================
     DATE MINIMUM
  ======================================================= */

  const minimumDate =
    useMemo(
      () =>
        dateToInputValue(
          new Date()
        ),
      []
    )


  /* =======================================================
     JOURS PRÉFÉRÉS
  ======================================================= */

  const togglePreferredDay =
    (
      day: string
    ) => {

      setPreferredDays(
        current => {

          if (
            current.includes(
              day
            )
          ) {

            return current.filter(
              item =>
                item !==
                day
            )
          }


          return [
            ...current,
            day
          ]
        }
      )
    }


  /* =======================================================
     ENVOI
  ======================================================= */
    
    async function sendNewBookingRequestNotification(
      requestID: string
    ) {

      if (!professional) {
        return
      }


      /*
       * Grooming / Healthcare :
       * token iOS = device
       *
       * Sitter :
       * token iOS = token
       *
       * Tous :
       * token navigateur = webtoken
       */

      const iphoneToken =
        isSitter
          ? (
              typeof professional.token ===
              "string"
                ? professional.token.trim()
                : ""
            )
          : (
              typeof professional.device ===
              "string"
                ? professional.device.trim()
                : ""
            )


      const webToken =
        typeof professional.webtoken ===
        "string"
          ? professional.webtoken.trim()
          : ""


      if (
        !iphoneToken &&
        !webToken
      ) {

        console.warn(
          "⚠️ Aucun token de notification pour le professionnel :",
          professional.id
        )

        return
      }


      const professionalLanguage =
        professional.language ||
        "fr"


      const animalName =
        user?.name?.trim() ||
        user?.pseudo?.trim() ||
        translate(
          professionalLanguage,
          "Un propriétaire"
        )


      const title =
        translate(
          professionalLanguage,
          "Nouvelle demande de rendez-vous"
        )


      const body =
        translate(
          professionalLanguage,
          "_ vous a envoyé une demande de rendez-vous."
        ).replace(
          "_",
          animalName
        )


      try {

        await sendNotificationToAll({
          iphoneToken,
          webToken,

          title,
          body,

          data: {
            type:
              "newBookingRequest",

            requestID,

            animalID:
              user?.id ?? "",

            professionalID:
              professional.id ?? ""
          }
        })


        console.log(
          "✅ Notification nouvelle BookingRequest envoyée iOS/Web"
        )

      } catch (notificationError) {

        /*
         * Une erreur de notification ne doit PAS
         * faire échouer la BookingRequest,
         * puisqu'elle est déjà créée.
         */

        console.error(
          "❌ Erreur notification nouvelle BookingRequest :",
          notificationError
        )
      }
    }

  const handleSubmit =
    async () => {

      setError("")


      if (
        !user?.id
      ) {

        setError(
          "Vous devez être connecté pour envoyer une demande."
        )

        return
      }


      if (
        !professional ||
        !service
      ) {

        setError(
          "La prestation est introuvable."
        )

        return
      }


      const required =
        service
          .requiredInformations ??
        []


      if (
        required.includes(
          "behavior"
        ) &&
        !behavior.trim()
      ) {

        setError(
          "Renseignez le comportement de votre animal."
        )

        return
      }


      if (
        required.includes(
          "coatCondition"
        ) &&
        !coatCondition.trim()
      ) {

        setError(
          "Renseignez l'état du pelage de votre animal."
        )

        return
      }


      if (
        required.includes(
          "weight"
        ) &&
        (
          !weight ||
          Number(
            weight
          ) <= 0
        )
      ) {

        setError(
          "Renseignez le poids de votre animal."
        )

        return
      }


      if (
        required.includes(
          "notes"
        ) &&
        !notes.trim()
      ) {

        setError(
          "Ajoutez les informations complémentaires."
        )

        return
      }

        if (
          !phoneNumber.trim()
        ) {

          setError(
            "Renseignez votre numéro de téléphone."
          )

          return
        }

      const unansweredQuestion =
        (
          service
            .customQuestions ??
          []
        ).find(
          (
            question:
              string
          ) =>
            !customAnswers[
              question
            ]?.trim()
        )


      if (
        unansweredQuestion
      ) {

        setError(
          `Répondez à la question : ${unansweredQuestion}`
        )

        return
      }


      if (
        isSitter &&
        !pickupAddress.trim()
      ) {

        setError(
          "Indiquez où récupérer l'animal."
        )

        return
      }


      if (
        !selectedDate ||
        !requestedTime
      ) {

        setError(
          "Sélectionnez un créneau disponible."
        )

        return
      }


      /*
       * Revérification côté interface
       * juste avant l'envoi.
       */
      if (
        !availableTimes.includes(
          requestedTime
        )
      ) {

        setError(
          "Ce créneau n'est plus disponible. Sélectionnez un autre horaire."
        )

        return
      }


      const [
        hours,
        minutes
      ] = requestedTime
        .split(":")
        .map(Number)


      const appointmentDate =
        new Date(
          selectedDate
            .getFullYear(),
          selectedDate
            .getMonth(),
          selectedDate
            .getDate(),
          hours,
          minutes,
          0,
          0
        )


        /*
         * notes reste un String CloudKit.
         *
         * On y stocke un JSON pour conserver :
         * - les notes générales,
         * - les jours préférés,
         * - les réponses aux questions,
         * - le numéro de téléphone optionnel,
         * - les informations Sitter.
         */
        const requestNotes =
          isSitter
            ? JSON.stringify({

                pickupAddress:
                  pickupAddress.trim(),

                duration:
                  sitterDurationHours * 60,

                phoneNumber:
                  phoneNumber.trim()
              })
            : JSON.stringify({

                notes:
                  required.includes(
                    "notes"
                  )
                    ? notes.trim()
                    : "",

                preferredDays,

                customAnswers:
                  Object.fromEntries(
                    Object.entries(
                      customAnswers
                    ).filter(
                      (
                        [, answer]
                      ) =>
                        answer
                          .trim() !==
                        ""
                    )
                  ),

                phoneNumber:
                  phoneNumber.trim()
              })


      try {

        setIsSending(
          true
        )


        const response =
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/booking-requests`,
            {

              method:
                "POST",

              headers: {

                "Content-Type":
                  "application/json"
              },

            body:
              JSON.stringify({

                animalID:
                  user.id,

                professionalID:
                  professional.id,

                serviceID:
                  isSitter
                    ? sitterBookingServiceID
                    : service.id,

                requestedDate:
                  appointmentDate
                    .toISOString(),

                duration:
                  isSitter
                    ? sitterDurationHours * 60
                    : 0,

                behavior:
                  required.includes(
                    "behavior"
                  )
                    ? behavior.trim()
                    : "",

                coatCondition:
                  required.includes(
                    "coatCondition"
                  )
                    ? coatCondition.trim()
                    : "",

                weight:
                  required.includes(
                    "weight"
                  )
                    ? Number(weight)
                    : 0,

                notes:
                  requestNotes
              })
            }
          )


        const result =
          await response.json()


        if (
          !response.ok ||
          !result.success
        ) {

          throw new Error(
            result.error ??
            "Impossible d'envoyer la demande."
          )
        }


          console.log(
            "=== BOOKING REQUEST CRÉÉE ===",
            result
          )


          const createdRequestID =
            String(
              result.id ?? ""
            )


          if (createdRequestID) {

            await sendNewBookingRequestNotification(
              createdRequestID
            )

          }


          setIsSent(
            true
          )

      } catch (
        submitError
      ) {

        console.error(
          "Erreur création BookingRequest :",
          submitError
        )


        setError(
          submitError instanceof
          Error
            ? submitError.message
            : "Impossible d'envoyer la demande."
        )

      } finally {

        setIsSending(
          false
        )
      }
    }


  /* =======================================================
     CHARGEMENT
  ======================================================= */

  if (
    isLoading
  ) {

    return (

      <main className="bookingRequestPage">

        <div className="bookingRequestState">

          <div className="bookingRequestLoader" />

          <p>
            {translate(
              language,
              "Chargement..."
            )}
          </p>

        </div>

      </main>
    )
  }


  /* =======================================================
     ERREUR
  ======================================================= */

  if (
    loadError ||
    !professional ||
    !service
  ) {

    return (

      <main className="bookingRequestPage">

        <div className="bookingRequestState">

          <h1>
            Demande de créneau
          </h1>

          <p>
            {loadError}
          </p>

          <button
            type="button"
            className="bookingRequestSecondaryButton"
            onClick={
              () =>
                router.back()
            }
          >
            Retour
          </button>

        </div>

      </main>
    )
  }


  /* =======================================================
     SUCCÈS
  ======================================================= */

  if (
    isSent
  ) {

    return (

      <main className="bookingRequestPage">

        <section className="bookingRequestSuccess">

          <div className="bookingRequestSuccessIcon">
            ✓
          </div>

          <h1>
            Demande envoyée
          </h1>

          <p>
            Votre demande de créneau a été envoyée à{" "}
            <strong>
              {professional.name}
            </strong>.
          </p>

          <p className="bookingRequestSuccessExplanation">
            Le professionnel pourra accepter votre demande, vous proposer un autre créneau ou la refuser.
          </p>

          <button
            type="button"
            className="bookingRequestPrimaryButton"
            onClick={
              () =>
                router.back()
            }
          >
            Terminer
          </button>

        </section>

      </main>
    )
  }


    /* =======================================================
       PAGE
    ======================================================= */

    return (

      <main className="bookingRequestPage">

        <div className="bookingRequestContainer">


          {/* HEADER */}

          <div className="bookingRequestTopBar">

            <button
              type="button"
              className="bookingRequestBackButton"
              onClick={
                () =>
                  router.back()
              }
              aria-label={
                translate(
                  language,
                  "Retour"
                )
              }
            >
              ‹
            </button>

            <div>

              <span className="bookingRequestEyebrow">
                {translate(
                  language,
                  "Demande de rendez-vous"
                )}
              </span>

              <h1>
                {translate(
                  language,
                  "Demander un créneau"
                )}
              </h1>

            </div>

          </div>


          {/* PROFESSIONNEL */}

          <section className="bookingRequestCard bookingRequestProfessional">

            {professional.image && (

              <img
                src={
                  professional.image
                }
                alt={
                  professional.name
                }
              />

            )}

            <div>

              <span className="bookingRequestSmallLabel">
                {translate(
                  language,
                  "Professionnel"
                )}
              </span>

              <h2>
                {professional.name}
              </h2>

              {professional.speciality && (

                <p>
                  {translate(
                    language,
                    professional.speciality
                  )}
                </p>

              )}

            </div>

          </section>


          {/* PRESTATION */}

          <section className="bookingRequestCard">

            <div className="bookingRequestSectionHeader">

              <div>

                <span className="bookingRequestSmallLabel">
                  {translate(
                    language,
                    "Prestation"
                  )}
                </span>

                <h2>
                  {translate(
                    language,
                    service.name
                  )}
                </h2>

              </div>

              <div className="bookingRequestPrice">

                <span>
                  {translate(
                    language,
                    "Prix estimé"
                  )}
                </span>

                <strong>
                  {Number(
                    service.price ??
                    0
                  ).toFixed(
                    2
                  )}{" "}
                  {service.devise ??
                    professional.devise ??
                    "€"
                  }
                </strong>

              </div>


              <div className="bookingRequestPrice">

                {isSitter ? (
                  <>
                    <span>
                      {translate(
                        language,
                        "Prix estimé"
                      )}
                    </span>

                    <strong>
                      {sitterEstimatedPrice.toFixed(2)}{" "}
                      {professional.devise ?? "€"}
                    </strong>

                    <small>
                      {Number(
                        professional.price ?? 0
                      ).toFixed(2)}{" "}
                      {professional.devise ?? "€"}/h ×{" "}
                      {sitterDurationHours} h
                    </small>
                  </>
                ) : (
                  <>
                    <span>
                      {translate(
                        language,
                        "Prix estimé"
                      )}
                    </span>

                    <strong>
                      {Number(
                        service.price ?? 0
                      ).toFixed(2)}{" "}
                      {service.devise ??
                        professional.devise ??
                        "€"}
                    </strong>
                  </>
                )}

              </div>

            </div>

            {service.description && (

              <p className="bookingRequestServiceDescription">
                {translate(
                  language,
                  service.description
                )}
              </p>

            )}

          </section>


          {/* INFORMATIONS ANIMAL */}

          {(
            (
              service
                .requiredInformations
                ?.length ??
              0
            ) > 0 ||
            (
              service
                .customQuestions
                ?.length ??
              0
            ) > 0
          ) && (

            <section className="bookingRequestCard">

              <div className="bookingRequestSectionTitle">

                <h2>
                  {translate(
                    language,
                    "Informations sur votre animal"
                  )}
                </h2>

                {isLoadingPreviousInformations ? (

                  <p>
                    {translate(
                      language,
                      "Récupération des informations précédentes..."
                    )}
                  </p>

                ) : (

                  <p>
                    {hasPreviousInformations
                      ? translate(
                          language,
                          "Vérifiez les informations enregistrées et modifiez-les si nécessaire."
                        )
                      : translate(
                          language,
                          "Renseignez les informations demandées pour cette prestation."
                        )
                    }
                  </p>

                )}

              </div>


              <div className="bookingRequestFields">


                {service
                  .requiredInformations
                  ?.includes(
                    "weight"
                  ) && (

                  <div className="bookingRequestField">

                    <label>
                      {translate(
                        language,
                        "Poids"
                      )}
                    </label>

                    <div className="bookingRequestWeight">

                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={
                          weight
                        }
                        disabled={
                          isLoadingPreviousInformations
                        }
                        onChange={
                          event => {

                            setWeight(
                              event
                                .target
                                .value
                            )

                            setError("")
                          }
                        }
                      />

                      <span>
                        kg
                      </span>

                    </div>

                  </div>
                )}


                {service
                  .requiredInformations
                  ?.includes(
                    "behavior"
                  ) && (

                  <div className="bookingRequestField">

                    <label>
                      {translate(
                        language,
                        "Comportement"
                      )}
                    </label>

                    <input
                      type="text"
                      value={
                        behavior
                      }
                      disabled={
                        isLoadingPreviousInformations
                      }
                      placeholder={
                        translate(
                          language,
                          "Ex. calme, anxieux, réactif..."
                        )
                      }
                      onChange={
                        event => {

                          setBehavior(
                            event
                              .target
                              .value
                          )

                          setError("")
                        }
                      }
                    />

                  </div>
                )}


                {service
                  .requiredInformations
                  ?.includes(
                    "coatCondition"
                  ) && (

                  <div className="bookingRequestField bookingRequestFieldFull">

                    <label>
                      {translate(
                        language,
                        "État du pelage"
                      )}
                    </label>

                    <textarea
                      value={
                        coatCondition
                      }
                      disabled={
                        isLoadingPreviousInformations
                      }
                      placeholder={
                        translate(
                          language,
                          "Ex. bon état, quelques nœuds, très emmêlé..."
                        )
                      }
                      onChange={
                        event => {

                          setCoatCondition(
                            event
                              .target
                              .value
                          )

                          setError("")
                        }
                      }
                    />

                  </div>
                )}


                {service
                  .requiredInformations
                  ?.includes(
                    "notes"
                  ) && (

                  <div className="bookingRequestField bookingRequestFieldFull">

                    <label>
                      {translate(
                        language,
                        "Informations complémentaires"
                      )}
                    </label>

                    <textarea
                      value={
                        notes
                      }
                      disabled={
                        isLoadingPreviousInformations
                      }
                      placeholder={
                        translate(
                          language,
                          "Ajouter une information..."
                        )
                      }
                      onChange={
                        event => {

                          setNotes(
                            event
                              .target
                              .value
                          )

                          setError("")
                        }
                      }
                    />

                  </div>
                )}

              </div>


              {(service
                .customQuestions
                ?.length ??
                0) > 0 && (

                <div className="bookingRequestCustomQuestions">

                  <div className="bookingRequestSectionTitle">

                    <h3>
                      {translate(
                        language,
                        "Questions du professionnel"
                      )}
                    </h3>

                    <p>
                      {translate(
                        language,
                        "Répondez aux questions demandées pour cette prestation."
                      )}
                    </p>

                  </div>


                  <div className="bookingRequestQuestions">

                    {service
                      .customQuestions
                      .map(
                        (
                          question:
                            string,
                          index:
                            number
                        ) => (

                        <div
                          className="bookingRequestField"
                          key={`${question}-${index}`}
                        >

                          <label>
                            {question}
                          </label>

                          <textarea
                            value={
                              customAnswers[
                                question
                              ] ?? ""
                            }
                            placeholder={
                              translate(
                                language,
                                "Votre réponse..."
                              )
                            }
                            onChange={
                              event => {

                                setCustomAnswers(
                                  current => ({
                                    ...current,

                                    [question]:
                                      event
                                        .target
                                        .value
                                  })
                                )

                                setError("")
                              }
                            }
                          />

                        </div>

                      ))}

                  </div>

                </div>

              )}

            </section>

          )}


            {/* TÉLÉPHONE */}

            <section className="bookingRequestCard">

              <div className="bookingRequestSectionTitle">

                <h2>
                  {translate(
                    language,
                    "Rappel par SMS"
                  )}
                </h2>

                <p>
                  {translate(
                    language,
                    "Ajoutez votre numéro de téléphone pour recevoir le rappel par SMS avant votre rendez-vous."
                  )}
                </p>

              </div>

              <div className="bookingRequestField bookingRequestFieldFull bookingRequestPhoneField">

                <label htmlFor="phoneNumber">
                  {translate(
                    language,
                    "Numéro de téléphone"
                  )}
                </label>

                <input
                  id="phoneNumber"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  value={
                    phoneNumber
                  }
                  placeholder={
                    translate(
                      language,
                      "Ex. 06 12 34 56 78"
                    )
                  }
                  onChange={
                    event => {

                      setPhoneNumber(
                        event.target.value
                      )

                      setError("")
                    }
                  }
                />

                <p className="bookingRequestPhoneHint">
                  {translate(
                    language,
                    "Ce numéro sera uniquement utilisé pour les rappels liés à votre rendez-vous."
                  )}
                </p>

              </div>

            </section>


          {/* CRÉNEAU */}

          <section className="bookingRequestCard">

            <div className="bookingRequestSectionTitle">

              <h2>
                {translate(
                  language,
                  "Créneau souhaité"
                )}
              </h2>

              <p>
                {isSitter
                  ? translate(
                      language,
                      "Choisissez la date, la durée de garde puis une heure disponible."
                    )
                  : translate(
                      language,
                      "Choisissez un créneau disponible dans les horaires du professionnel."
                    )
                }
              </p>

            </div>


            <div className="bookingRequestDateGrid">

              <div className="bookingRequestField">

                <label htmlFor="requestedDate">
                  {translate(
                    language,
                    "Date souhaitée"
                  )}
                </label>

                <input
                  id="requestedDate"
                  type="date"
                  min={
                    minimumDate
                  }
                  value={
                    requestedDate
                  }
                  onChange={
                    event => {

                      setRequestedDate(
                        event
                          .target
                          .value
                      )

                      setRequestedTime(
                        ""
                      )

                      setError("")
                    }
                  }
                />

              </div>


              {isSitter &&
                requestedDate && (

                <div className="bookingRequestField bookingRequestFieldFull bookingRequestDurationField">

                  <div className="bookingRequestDurationHeader">

                    <label htmlFor="sitterDuration">
                      {translate(
                        language,
                        "Durée souhaitée"
                      )}
                    </label>

                    <strong>
                      {sitterDurationHours} h
                    </strong>

                  </div>

                  <input
                    id="sitterDuration"
                    className="bookingRequestDurationSlider"
                    type="range"
                    min="1"
                    max="24"
                    step="1"
                    value={
                      sitterDurationHours
                    }
                    onChange={
                      event => {

                        setSitterDurationHours(
                          Number(
                            event.target.value
                          )
                        )

                        setRequestedTime(
                          ""
                        )

                        setError("")
                      }
                    }
                  />

                  <div className="bookingRequestDurationScale">
                    <span>
                      1 h
                    </span>

                    <span>
                      24 h
                    </span>
                  </div>

                  {isLoadingAppointments && (

                    <p className="bookingRequestDurationLoading">
                      {translate(
                        language,
                        "Mise à jour des disponibilités..."
                      )}
                    </p>

                  )}

                </div>
              )}


              <div className="bookingRequestField bookingRequestFieldFull">

                <label>
                  {translate(
                    language,
                    "Heure souhaitée"
                  )}
                </label>


                {!requestedDate ? (

                  <div className="bookingRequestEmptyTime">
                    {translate(
                      language,
                      "Sélectionnez d'abord une date."
                    )}
                  </div>

                ) : isSitter &&
                  isLoadingAppointments ? (

                  <div className="bookingRequestEmptyTime">
                    {translate(
                      language,
                      "Vérification des rendez-vous du pet sitter..."
                    )}
                  </div>

                ) : !selectedDaySchedule?.isOpen ? (

                  <div className="bookingRequestEmptyTime">
                    {translate(
                      language,
                      "Le professionnel n'est pas disponible ce jour-là."
                    )}
                  </div>

                ) : availableTimes.length === 0 ? (

                  <div className="bookingRequestEmptyTime">
                    {translate(
                      language,
                      "Aucun créneau disponible pour cette durée."
                    )}
                  </div>

                ) : (

                  <div className="bookingRequestTimeSlots">

                    {availableTimes.map(
                      time => (

                        <button
                          type="button"
                          key={
                            time
                          }
                          className={
                            requestedTime ===
                            time
                              ? "bookingRequestTimeSlot bookingRequestTimeSlotSelected"
                              : "bookingRequestTimeSlot"
                          }
                          onClick={
                            () => {

                              setRequestedTime(
                                time
                              )

                              setError("")
                            }
                          }
                        >
                          {time}
                        </button>

                      )
                    )}

                  </div>

                )}

              </div>

            </div>

          </section>


          {/* SITTER : ADRESSE */}

          {isSitter && (

            <section className="bookingRequestCard">

              <div className="bookingRequestSectionTitle">

                <h2>
                  {translate(
                    language,
                    "Où récupérer l'animal ?"
                  )}
                </h2>

                <p>
                  {translate(
                    language,
                    "Indiquez l'adresse ou le lieu de récupération de votre animal."
                  )}
                </p>

              </div>

              <div className="bookingRequestField bookingRequestFieldFull">

                <label htmlFor="pickupAddress">
                  {translate(
                    language,
                    "Adresse de récupération"
                  )}
                </label>

                <textarea
                  id="pickupAddress"
                  value={
                    pickupAddress
                  }
                  placeholder={
                    translate(
                      language,
                      "Ex. 24 rue Paradis, 13001 Marseille"
                    )
                  }
                  onChange={
                    event => {

                      setPickupAddress(
                        event.target.value
                      )

                      setError("")
                    }
                  }
                />

              </div>

            </section>

          )}


          {/* JOURS PRÉFÉRÉS */}

          {!isSitter && (
            <>

              <section className="bookingRequestCard">

                <div className="bookingRequestSectionTitle">

                  <div className="bookingRequestOptionalTitle">

                    <h2>
                      {translate(
                        language,
                        "Vos disponibilités"
                      )}
                    </h2>

                    <span>
                      {translate(
                        language,
                        "Optionnel"
                      )}
                    </span>

                  </div>

                  <p>
                    {translate(
                      language,
                      "Avez-vous des jours que vous préférez ? Cela aidera le professionnel à vous proposer un autre créneau si nécessaire."
                    )}
                  </p>

                </div>


                <div className="bookingRequestPreferredDays">

                  {preferredDaysList.map(
                    day => {

                      const selected =
                        preferredDays.includes(
                          day.key
                        )

                      return (

                        <button
                          key={
                            day.key
                          }
                          type="button"
                          className={
                            selected
                              ? "bookingRequestDayButton bookingRequestDayButtonSelected"
                              : "bookingRequestDayButton"
                          }
                          aria-pressed={
                            selected
                          }
                          onClick={
                            () =>
                              togglePreferredDay(
                                day.key
                              )
                          }
                        >
                          {translate(
                            language,
                            day.label
                          )}
                        </button>

                      )
                    }
                  )}

                </div>

              </section>

            </>
          )}


            {/* ERREUR */}

            {error && (

              <div className="bookingRequestError">
                {error}
              </div>

            )}


          {/* ACTIONS */}

          <div className="bookingRequestActions">

            <button
              type="button"
              className="bookingRequestSecondaryButton"
              disabled={
                isSending
              }
              onClick={
                () =>
                  router.back()
              }
            >
              {translate(
                language,
                "Annuler"
              )}
            </button>


            <button
              type="button"
              className="bookingRequestPrimaryButton"
              disabled={
                isSending ||
                isLoadingPreviousInformations ||
                isLoadingAppointments
              }
              onClick={
                handleSubmit
              }
            >
              {isSending
                ? translate(
                    language,
                    "Envoi..."
                  )
                : translate(
                    language,
                    "Envoyer la demande"
                  )
              }
            </button>

          </div>

        </div>

      </main>
    )
}

export default function BookingRequestPage() {
  return (
    <Suspense fallback={null}>
      <BookingRequestContent />
    </Suspense>
  )
}
