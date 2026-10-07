"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react"

import {
  useLanguage
} from "@/context/LanguageContext"

import {
  useAuth
} from "@/context/AuthContext"

import {
  translate
} from "@/translations/translations"

import {
  saveRDV
} from "@/services/saveRDV"

import {
  saveClientPaypalID
} from "@/services/saveClientPaypalID"

import {
  fetchLatestAnimalRDV
} from "@/services/fetchLatestAnimalRDV"

import {
  BookedAppointment,
  fetchBookedAppointments
} from "@/services/fetchBookedAppointments"

import "./BookingModal.css"


type Props = {
  pro: any
  service?: any
  onClose: () => void
}


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


const months = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre"
]


const weekDays = [
  "Lun",
  "Mar",
  "Mer",
  "Jeu",
  "Ven",
  "Sam",
  "Dim"
]


function timeToMinutes(
  time: string
): number {
  const [hours, minutes] =
    time
      .split(":")
      .map(Number)

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

  const mins =
    minutes % 60

  return `${String(hours).padStart(
    2,
    "0"
  )}:${String(mins).padStart(
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
          .toLowerCase()
          .startsWith(
            dayName.toLowerCase()
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
    normalized.toLowerCase() ===
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
  ] =
    normalized
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
  if (!schedule.isOpen) {
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


function isValidPaypalID(
  value: string
): boolean {
  const normalizedValue =
    value.trim()

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    normalizedValue
  )
}


export default function BookingModal({
  pro,
  service,
  onClose
}: Props) {

  const {
    language
  } = useLanguage()


  const {
    session,
    updateUser
  } = useAuth()


  const user =
    session?.accountType ===
    "animal"
      ? session.user
      : null


  if (
    session &&
    session.accountType !==
      "animal"
  ) {
    return null
  }


  const today =
    new Date()


  const requiresPaypal =
    pro.type === "Sitter"


  /*
   * =========================
   * DATE
   * =========================
   */

  const [
    selectedDay,
    setSelectedDay
  ] = useState(
    today.getDate()
  )


  const [
    selectedMonth,
    setSelectedMonth
  ] = useState(
    today.getMonth() + 1
  )


  const [
    selectedYear,
    setSelectedYear
  ] = useState(
    today.getFullYear()
  )


  const [
    selectedTime,
    setSelectedTime
  ] = useState("")


  /*
   * =========================
   * SITTER
   * =========================
   */

  const [
    duration,
    setDuration
  ] = useState(1)


  /*
   * =========================
   * COLLABORATEUR
   * =========================
   */

  const [
    selectedCollaborator,
    setSelectedCollaborator
  ] = useState(
    pro.collaborators?.[0] ??
      ""
  )


  /*
   * =========================
   * INFORMATIONS ANIMAL
   * =========================
   */

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
    isLoadingPreviousInformations,
    setIsLoadingPreviousInformations
  ] = useState(false)


  const [
    hasPreviousInformations,
    setHasPreviousInformations
  ] = useState(false)


  /*
   * =========================
   * RDV EXISTANTS
   * =========================
   */

  const [
    bookedAppointments,
    setBookedAppointments
  ] = useState<
    BookedAppointment[]
  >([])


  const [
    isLoadingAppointments,
    setIsLoadingAppointments
  ] = useState(false)


  /*
   * =========================
   * ÉTAT ENREGISTREMENT
   * =========================
   */

  const [
    isConfirmed,
    setIsConfirmed
  ] = useState(false)


  const [
    isSaving,
    setIsSaving
  ] = useState(false)


  const [
    saveError,
    setSaveError
  ] = useState("")


  /*
   * =========================
   * PAYPAL
   * =========================
   */

  const [
    paypalID,
    setPaypalID
  ] = useState(
    user?.paypalID?.trim() ??
      ""
  )


  const [
    savedPaypalID,
    setSavedPaypalID
  ] = useState(
    user?.paypalID?.trim() ??
      ""
  )


  const [
    isSavingPaypal,
    setIsSavingPaypal
  ] = useState(false)


  const [
    paypalError,
    setPaypalError
  ] = useState("")


  useEffect(() => {

    const existingPaypalID =
      user?.paypalID?.trim() ??
      ""


    if (existingPaypalID) {

      setPaypalID(
        existingPaypalID
      )

      setSavedPaypalID(
        existingPaypalID
      )

      setPaypalError("")
    }

  }, [
    user?.paypalID
  ])


  const hasSavedPaypalID =
    savedPaypalID.trim() !==
    ""


  /*
   * =========================
   * RÉCUPÉRATION DES
   * ANCIENNES INFORMATIONS
   * =========================
   */

  useEffect(() => {

    let cancelled =
      false


    async function loadPreviousInformations() {

      /*
       * Pas utilisé pour
       * les pet sitters.
       */
        if (
          !user?.id ||
          !pro.id ||
          (
            pro.type !== "Sitter" &&
            !service?.id
          )
        ) {
          return
        }


      /*
       * On repart toujours
       * de valeurs propres.
       */
      setBehavior("")
      setCoatCondition("")
      setWeight("")
      setNotes("")
        setPhoneNumber("")
      setCustomAnswers({})

      setHasPreviousInformations(
        false
      )


      try {

        setIsLoadingPreviousInformations(
          true
        )


        const previous =
          await fetchLatestAnimalRDV(
            pro.id,
            user.id
          )


        console.log(
          "=== DERNIER RDV CÔTÉ PROPRIÉTAIRE ===",
          previous
        )


        if (cancelled) {
          return
        }


        /*
         * Aucun ancien RDV.
         *
         * Le propriétaire
         * remplira les champs.
         */
        if (!previous) {
          return
        }

          setPhoneNumber(
            previous.phoneNumber ?? ""
          )

        setHasPreviousInformations(
          true
        )


        const required =
          service
            .requiredInformations ??
          []


        /*
         * On reprend uniquement
         * les informations demandées
         * par cette prestation.
         */


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
            previous.coatCondition ??
              ""
          )
        }


        if (
          required.includes(
            "weight"
          )
        ) {
          setWeight(
            previous.weight != null
              ? String(
                  previous.weight
                )
              : ""
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

      } catch (error) {

        console.error(
          "Erreur récupération ancien RDV :",
          error
        )

      } finally {

        if (!cancelled) {

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
    pro.id,
    pro.type,
    service?.id,
    user?.id
  ])


  /*
   * =========================
   * PLANNING
   * =========================
   */

  const planning: string[] =
    pro.type === "Sitter"
      ? (
          pro.disponibilities ??
          pro.availability ??
          []
        )
      : (
          pro.schedules ??
          []
        )


  const appointmentCollaborator =
    pro.type === "Sitter"
      ? pro.name
      : selectedCollaborator


  const selectedDate =
    useMemo(
      () =>
        new Date(
          selectedYear,
          selectedMonth - 1,
          selectedDay
        ),
      [
        selectedDay,
        selectedMonth,
        selectedYear
      ]
    )


  const requiredDurationMinutes =
    pro.type === "Sitter"
      ? duration * 60
      : Number(
          service?.duration ??
          30
        )


  const selectedDaySchedule =
    useMemo(
      () =>
        parseDaySchedule(
          planning,
          selectedDate
        ),
      [
        planning,
        selectedDate
      ]
    )


  /*
   * =========================
   * CHARGEMENT DES RDV
   * =========================
   */

  useEffect(() => {

    let cancelled =
      false


    const loadAppointments =
      async () => {

        if (
          !pro.id ||
          !appointmentCollaborator
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


          const appointments =
            await fetchBookedAppointments(
              pro.id,
              appointmentCollaborator
            )


          if (!cancelled) {

            setBookedAppointments(
              appointments
            )
          }

        } catch (error) {

          console.error(
            "Erreur pendant la récupération des RDV :",
            error
          )


          if (!cancelled) {

            setBookedAppointments(
              []
            )
          }

        } finally {

          if (!cancelled) {

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
    pro.id,
    appointmentCollaborator
  ])


  /*
   * =========================
   * DURÉE DES RDV EXISTANTS
   * =========================
   */

  const getExistingAppointmentDuration =
    useCallback(
      (
        appointment:
          BookedAppointment
      ): number => {

        if (
          appointment.duration >
          0
        ) {
          return appointment.duration
        }


        if (
          pro.type ===
          "Sitter"
        ) {
          return 60
        }


        const existingService =
          pro.services?.find(
            (
              existingService:
                any
            ) =>
              existingService.id ===
                appointment.serviceID ||
              existingService.name ===
                appointment.serviceID
          )


        return Number(
          existingService
            ?.duration ??
          30
        )
      },
      [
        pro.type,
        pro.services
      ]
    )


  /*
   * =========================
   * DISPONIBILITÉ D'UN CRÉNEAU
   * =========================
   */

  const isSlotAvailable =
    useCallback(
      (
        date: Date,
        startTime: string,
        requestedDuration: number
      ): boolean => {

        const [
          hours,
          minutes
        ] =
          startTime
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
            candidateStart.getTime() +
              requestedDuration *
                60_000
          )


        if (
          candidateStart <=
          new Date()
        ) {
          return false
        }


        return !bookedAppointments.some(
          appointment => {

            const bookedStart =
              new Date(
                appointment.date
              )


            const bookedDuration =
              getExistingAppointmentDuration(
                appointment
              )


            const bookedEnd =
              new Date(
                bookedStart.getTime() +
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
        getExistingAppointmentDuration
      ]
    )


  /*
   * =========================
   * CRÉNEAUX DISPONIBLES
   * =========================
   */

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


        const scheduleTimes =
          createTimeSlots(
            schedule,
            requiredDurationMinutes
          )


        return scheduleTimes.filter(
          time =>
            isSlotAvailable(
              date,
              time,
              requiredDurationMinutes
            )
        )
      },
      [
        planning,
        requiredDurationMinutes,
        isSlotAvailable
      ]
    )


  const availableTimes =
    useMemo(
      () =>
        getAvailableTimesForDate(
          selectedDate
        ),
      [
        selectedDate,
        getAvailableTimesForDate
      ]
    )


  useEffect(() => {

    if (
      selectedTime &&
      !availableTimes.includes(
        selectedTime
      )
    ) {

      setSelectedTime("")
    }

  }, [
    availableTimes,
    selectedTime
  ])


  /*
   * =========================
   * CALENDRIER
   * =========================
   */

  const daysInMonth =
    new Date(
      selectedYear,
      selectedMonth,
      0
    ).getDate()


  const firstDayOfMonth =
    new Date(
      selectedYear,
      selectedMonth - 1,
      1
    ).getDay()


  const leadingEmptyDays =
    firstDayOfMonth === 0
      ? 6
      : firstDayOfMonth - 1


  /*
   * Prix actuel.
   *
   * Pour les prestations pro,
   * service.price correspond au
   * prix minimum / de départ.
   *
   * L'interface l'affiche donc
   * comme "Prix estimé".
   */

  const price =
    pro.type === "Sitter"
      ? Number(
          pro.price ?? 0
        ) * duration
      : Number(
          service?.price ?? 0
        )


  const isPastDate =
    (
      date: Date
    ): boolean => {

      const testedDate =
        new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        )


      const currentDate =
        new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        )


      return (
        testedDate <
        currentDate
      )
    }


  const isAvailableDate =
    (
      day: number
    ): boolean => {

      const date =
        new Date(
          selectedYear,
          selectedMonth - 1,
          day
        )


      if (
        isPastDate(
          date
        )
      ) {
        return false
      }


      return (
        getAvailableTimesForDate(
          date
        ).length > 0
      )
    }


  const selectDay =
    (
      day: number
    ) => {

      if (
        !isAvailableDate(
          day
        )
      ) {
        return
      }


      setSelectedDay(
        day
      )

      setSelectedTime(
        ""
      )

      setSaveError(
        ""
      )
    }


  const previousMonth =
    () => {

      if (
        selectedMonth === 1
      ) {

        setSelectedMonth(
          12
        )

        setSelectedYear(
          year =>
            year - 1
        )

      } else {

        setSelectedMonth(
          month =>
            month - 1
        )
      }


      setSelectedDay(1)
      setSelectedTime("")
      setSaveError("")
    }


  const nextMonth =
    () => {

      if (
        selectedMonth === 12
      ) {

        setSelectedMonth(
          1
        )

        setSelectedYear(
          year =>
            year + 1
        )

      } else {

        setSelectedMonth(
          month =>
            month + 1
        )
      }


      setSelectedDay(1)
      setSelectedTime("")
      setSaveError("")
    }


  const buildAppointmentDate =
    (): Date | null => {

      if (!selectedTime) {
        return null
      }


      const [
        hours,
        minutes
      ] =
        selectedTime
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
        return null
      }


      return new Date(
        selectedYear,
        selectedMonth - 1,
        selectedDay,
        hours,
        minutes,
        0
      )
    }


  /*
   * =========================
   * PAYPAL
   * =========================
   */

  const handleSavePaypalID =
    async () => {

      setPaypalError("")
      setSaveError("")


      if (!requiresPaypal) {
        return
      }


      if (!user?.id) {

        setPaypalError(
          translate(
            language,
            "Vous devez être connecté."
          )
        )

        return
      }


      const normalizedPaypalID =
        paypalID
          .trim()
          .toLowerCase()


      if (
        !normalizedPaypalID
      ) {

        setPaypalError(
          translate(
            language,
            "L'adresse PayPal est obligatoire."
          )
        )

        return
      }


      if (
        !isValidPaypalID(
          normalizedPaypalID
        )
      ) {

        setPaypalError(
          translate(
            language,
            "Entrez une adresse PayPal valide."
          )
        )

        return
      }


      try {

        setIsSavingPaypal(
          true
        )


        await saveClientPaypalID({
          userID:
            user.id,

          paypalID:
            normalizedPaypalID
        })


        updateUser({
          paypalID:
            normalizedPaypalID
        })


        setPaypalID(
          normalizedPaypalID
        )


        setSavedPaypalID(
          normalizedPaypalID
        )


        setPaypalError(
          ""
        )

      } catch (error) {

        console.error(
          "Erreur pendant l'enregistrement PayPal :",
          error
        )


        setPaypalError(
          error instanceof Error
            ? error.message
            : translate(
                language,
                "Impossible d'enregistrer l'adresse PayPal."
              )
        )

      } finally {

        setIsSavingPaypal(
          false
        )
      }
    }


  /*
   * =========================
   * CONFIRMATION DU RDV
   * =========================
   */

  const handleConfirmBooking =
    async () => {

      setSaveError("")


      if (!user) {

        setSaveError(
          translate(
            language,
            "Vous devez être connecté pour réserver."
          )
        )

        return
      }
        
        
        if (
          !phoneNumber.trim()
        ) {
          setSaveError(
            translate(
              language,
              "Renseignez votre numéro de téléphone."
            )
          )

          return
        }


      /*
       * PayPal obligatoire
       * uniquement pour Sitter.
       */

      if (
        requiresPaypal &&
        !hasSavedPaypalID
      ) {

        setSaveError(
          translate(
            language,
            "Ajoutez votre adresse PayPal avant de réserver."
          )
        )

        return
      }


      if (
        requiresPaypal &&
        !isValidPaypalID(
          savedPaypalID
        )
      ) {

        setSaveError(
          translate(
            language,
            "Votre adresse PayPal n'est pas valide."
          )
        )

        return
      }


      /*
       * Validation des informations
       * demandées par la prestation.
       */

      if (
        pro.type !== "Sitter" &&
        service
      ) {

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

          setSaveError(
            translate(
              language,
              "Renseignez le comportement de votre animal."
            )
          )

          return
        }


        if (
          required.includes(
            "coatCondition"
          ) &&
          !coatCondition.trim()
        ) {

          setSaveError(
            translate(
              language,
              "Renseignez l'état du pelage de votre animal."
            )
          )

          return
        }


        if (
          required.includes(
            "weight"
          ) &&
          (
            !weight ||
            Number(weight) <= 0
          )
        ) {

          setSaveError(
            translate(
              language,
              "Renseignez le poids de votre animal."
            )
          )

          return
        }


        if (
          required.includes(
            "notes"
          ) &&
          !notes.trim()
        ) {

          setSaveError(
            translate(
              language,
              "Ajoutez les informations complémentaires."
            )
          )

          return
        }
      }


      /*
       * Date du RDV.
       */

      const appointmentDate =
        buildAppointmentDate()


      if (
        !appointmentDate
      ) {

        setSaveError(
          translate(
            language,
            "Sélectionnez une date et une heure."
          )
        )

        return
      }


      const totalPrice =
        Number(
          pro.price ?? 0
        ) * duration


      const serviceID =
        pro.type === "Sitter"
          ? `Sitting-${duration}-${totalPrice}`
          : service?.id ?? ""


      if (!serviceID) {

        setSaveError(
          translate(
            language,
            "Le service sélectionné est invalide."
          )
        )

        return
      }


      /*
       * Dernière vérification
       * du créneau.
       */

      const slotStillAvailable =
        isSlotAvailable(
          selectedDate,
          selectedTime,
          requiredDurationMinutes
        )


      if (
        !slotStillAvailable
      ) {

        setSaveError(
          translate(
            language,
            "Ce créneau n'est plus disponible."
          )
        )


        setSelectedTime(
          ""
        )

        return
      }


      /*
       * Construction de RDV.infos.
       *
       * On sauvegarde uniquement
       * les requiredInformations
       * demandées par le Service.
       */

      const requiredInformations =
        service
          ?.requiredInformations ??
        []


      const rdvInfos =
        JSON.stringify({

          behavior:
            requiredInformations.includes(
              "behavior"
            )
              ? behavior.trim()
              : "",


          coatCondition:
            requiredInformations.includes(
              "coatCondition"
            )
              ? coatCondition.trim()
              : "",


          weight:
            requiredInformations.includes(
              "weight"
            ) &&
            weight
              ? Number(
                  weight
                )
              : null,


          notes:
            requiredInformations.includes(
              "notes"
            )
              ? notes.trim()
              : "",


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
            )
        })


      try {

        setIsSaving(
          true
        )


        await saveRDV({

          groomingID:
            pro.id,


          /*
           * Dans ton modèle actuel :
           *
           * RDV.userID =
           * ID de l'animal.
           */
          userID:
            user.id,


          date:
            appointmentDate,


          serviceID,


          collaborator:
            pro.type ===
            "Sitter"
              ? pro.name
              : selectedCollaborator,


        phoneNumber:
          phoneNumber.trim(),


          /*
           * JSON sauvegardé
           * sous forme de String.
           */
          infos:
            pro.type ===
            "Sitter"
              ? ""
              : rdvInfos,


          authorizationID:
            "",


          stripePaymentIntentID:
            "",


          stripeTransferID:
            "",


          paymentStatus:
            pro.type ===
            "Sitter"
              ? "pending"
              : "confirmed"
        })


        setIsConfirmed(
          true
        )

      } catch (error) {

        console.error(
          "Erreur lors de la création du RDV :",
          error
        )


        setSaveError(
          error instanceof Error
            ? error.message
            : translate(
                language,
                "Impossible d'enregistrer le rendez-vous. Réessayez."
              )
        )

      } finally {

        setIsSaving(
          false
        )
      }
    }


  /*
   * =========================
   * BOUTON CONFIRMER
   * =========================
   */

  const paypalRequirementSatisfied =
    !requiresPaypal ||
    hasSavedPaypalID


    const canConfirm =
      Boolean(user) &&
      Boolean(phoneNumber.trim()) &&
      paypalRequirementSatisfied &&
      !isLoadingAppointments &&
      !isLoadingPreviousInformations &&
      !isSavingPaypal &&
      selectedDaySchedule.isOpen &&
      selectedTime !== "" &&
      (
        pro.type === "Sitter" ||
        !pro.collaborators?.length ||
        selectedCollaborator !== ""
      )


  /*
   * =========================
   * CONFIRMATION
   * =========================
   */

  if (isConfirmed) {

    return (

      <div className="bookingOverlay">

        <div
          className="bookingBackdrop"
          onClick={onClose}
        />


        <aside className="bookingPanel">

          <div className="bookingHeader">

            <h2>
              {translate(
                language,
                "Réservation enregistrée"
              )}
            </h2>


            <button
              type="button"
              onClick={onClose}
            >
              ×
            </button>

          </div>


          <div className="successBox">

            <h3>
              {translate(
                language,
                "Votre rendez-vous est confirmé ✅"
              )}
            </h3>


            <p>

              {translate(
                language,
                "Votre rendez-vous avec"
              )}{" "}


              <strong>
                {pro.name}
              </strong>


              {pro.type !==
                "Sitter" &&
                selectedCollaborator && (
                <>

                  {" "}

                  {translate(
                    language,
                    "avec"
                  )}{" "}


                  <strong>
                    {
                      selectedCollaborator
                    }
                  </strong>

                </>
              )}


              {" "}

              {translate(
                language,
                "est enregistré le"
              )}{" "}


              <strong>
                {selectedDay}/
                {selectedMonth}/
                {selectedYear}
              </strong>


              {" "}

              {translate(
                language,
                "à"
              )}{" "}


              <strong>
                {selectedTime}
              </strong>

              .

            </p>


            <button
              type="button"
              className="confirmBookingButton"
              onClick={onClose}
            >
              {translate(
                language,
                "Terminer"
              )}
            </button>

          </div>

        </aside>

      </div>
    )
  }


  /*
   * =========================
   * MODAL
   * =========================
   */

  return (

    <div className="bookingOverlay">

      <div
        className="bookingBackdrop"
        onClick={onClose}
      />


      <aside className="bookingPanel">

        <div className="bookingHeader">

          <h2>
            {translate(
              language,
              "Réserver"
            )}
          </h2>


          <button
            type="button"
            onClick={onClose}
          >
            ×
          </button>

        </div>


        {/* =========================
            PROFESSIONNEL
        ========================= */}

        <div className="bookingPro">

          <img
            src={pro.image}
            alt={pro.name}
          />


          <div>

            <h3>
              {pro.name}
            </h3>


            <p>
              {translate(
                language,
                pro.speciality
              )}
            </p>


            <span>
              ⭐ {pro.rating}{" "}

              {translate(
                language,
                "avis"
              )}
            </span>

          </div>

        </div>


        {/* =========================
            SERVICE
        ========================= */}

        <div className="bookingBlock">

          <label>
            {translate(
              language,
              "Service"
            )}
          </label>


          <div className="bookingSelect">

            {translate(
              language,
              service?.name ??
                "Garde"
            )}

          </div>

        </div>


        {/* =========================
            INFORMATIONS ANIMAL
        ========================= */}

        {pro.type !== "Sitter" &&
          service &&
          (
            service
              .requiredInformations
              ?.length > 0 ||
            service
              .customQuestions
              ?.length > 0
          ) && (

          <div className="bookingBlock animalInformationsBlock">


            {service
              .requiredInformations
              ?.length > 0 && (
              <>

                <div className="animalInformationHeader">

                  <div>

                    <label>
                      {translate(
                        language,
                        "Informations sur votre animal"
                      )}
                    </label>


                    {isLoadingPreviousInformations ? (

                      <p className="previousInformationsLoading">

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

                </div>


                <div className="serviceInformationsGrid">


                  {/* =====================
                      POIDS
                  ===================== */}

                  {service
                    .requiredInformations
                    .includes(
                      "weight"
                    ) && (

                    <div className="serviceInformationField">

                      <label htmlFor="bookingAnimalWeight">

                        {translate(
                          language,
                          "Poids"
                        )}

                      </label>


                      <div className="weightInput">

                        <input
                          id="bookingAnimalWeight"

                          type="number"

                          min="0"

                          step="0.1"

                          value={
                            weight
                          }

                          disabled={
                            isLoadingPreviousInformations
                          }

                          placeholder="0"

                          onChange={
                            event => {

                              setWeight(
                                event
                                  .target
                                  .value
                              )

                              setSaveError(
                                ""
                              )
                            }
                          }
                        />


                        <span>
                          kg
                        </span>

                      </div>

                    </div>
                  )}


                  {/* =====================
                      COMPORTEMENT
                  ===================== */}

                  {service
                    .requiredInformations
                    .includes(
                      "behavior"
                    ) && (

                    <div className="serviceInformationField">

                      <label htmlFor="bookingAnimalBehavior">

                        {translate(
                          language,
                          "Comportement"
                        )}

                      </label>


                      <input
                        id="bookingAnimalBehavior"

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

                            setSaveError(
                              ""
                            )
                          }
                        }
                      />

                    </div>
                  )}


                  {/* =====================
                      ÉTAT DU PELAGE
                  ===================== */}

                  {service
                    .requiredInformations
                    .includes(
                      "coatCondition"
                    ) && (

                    <div className="serviceInformationField serviceInformationFull">

                      <label htmlFor="bookingAnimalCoatCondition">

                        {translate(
                          language,
                          "État du pelage"
                        )}

                      </label>


                      <textarea
                        id="bookingAnimalCoatCondition"

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

                            setSaveError(
                              ""
                            )
                          }
                        }
                      />

                    </div>
                  )}


                  {/* =====================
                      INFOS COMPLÉMENTAIRES
                  ===================== */}

                  {service
                    .requiredInformations
                    .includes(
                      "notes"
                    ) && (

                    <div className="serviceInformationField serviceInformationFull">

                      <label htmlFor="bookingAnimalNotes">

                        {translate(
                          language,
                          "Informations complémentaires"
                        )}

                      </label>


                      <textarea
                        id="bookingAnimalNotes"

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

                            setSaveError(
                              ""
                            )
                          }
                        }
                      />

                    </div>
                  )}

                </div>

              </>
            )}


            {/* =========================
                QUESTIONS PERSONNALISÉES
            ========================= */}

            {service
              .customQuestions
              ?.length > 0 && (

              <div className="customQuestionsSection">

                <div className="customQuestionsHeader">

                  <label>

                    {translate(
                      language,
                      "Questions complémentaires"
                    )}

                  </label>


                  <p>

                    {translate(
                      language,
                      "Répondez aux questions demandées pour cette prestation."
                    )}

                  </p>

                </div>


                <div className="customQuestions">

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
                        key={`${question}-${index}`}
                        className="customQuestionField"
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

                              setSaveError(
                                ""
                              )
                            }
                          }
                        />

                      </div>
                    )
                  )}

                </div>

              </div>
            )}

          </div>
        )}
          
          {/* =========================
              RAPPEL SMS
          ========================= */}

          <div className="bookingBlock">

            <label htmlFor="phoneNumber">
              {translate(
                language,
                "Numéro de téléphone"
              )}
            </label>

            <p>
              {translate(
                language,
                "Ajoutez votre numéro de téléphone pour recevoir le rappel par SMS avant votre rendez-vous."
              )}
            </p>

            <input
              id="phoneNumber"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              value={phoneNumber}
              placeholder={translate(
                language,
                "Ex. 06 12 34 56 78"
              )}
              onChange={event => {
                setPhoneNumber(
                  event.target.value
                )

                setSaveError("")
              }}
            />

            <p className="bookingFieldHint">
              {translate(
                language,
                "Ce numéro sera uniquement utilisé pour les rappels liés à votre rendez-vous."
              )}
            </p>

          </div>


        {/* =========================
            COLLABORATEUR
        ========================= */}

        {pro.type !== "Sitter" &&
          pro.collaborators?.length >
            0 && (

          <div className="bookingBlock">

            <label>

              {translate(
                language,
                "Collaborateur"
              )}

            </label>


            <select
              value={
                selectedCollaborator
              }

              onChange={
                event => {

                  setSelectedCollaborator(
                    event
                      .target
                      .value
                  )

                  setSelectedTime(
                    ""
                  )

                  setSaveError(
                    ""
                  )
                }
              }
            >

              {pro.collaborators.map(
                (
                  collaborator:
                    string
                ) => (

                <option
                  key={
                    collaborator
                  }

                  value={
                    collaborator
                  }
                >
                  {
                    collaborator
                  }
                </option>

              ))}

            </select>

          </div>
        )}


        {/* =========================
            DURÉE SITTER
        ========================= */}

        {pro.type === "Sitter" && (

          <div className="bookingBlock durationBlock">

            <div className="durationHeader">

              <label>

                {translate(
                  language,
                  "Durée"
                )}

              </label>


              <strong>

                {duration}{" "}

                {duration === 1
                  ? translate(
                      language,
                      "heure"
                    )
                  : translate(
                      language,
                      "heures"
                    )
                }

              </strong>

            </div>


            <input
              className="durationSlider"

              type="range"

              min="1"

              max="10"

              step="1"

              value={
                duration
              }

              onChange={
                event => {

                  setDuration(
                    Number(
                      event
                        .target
                        .value
                    )
                  )

                  setSelectedTime(
                    ""
                  )

                  setSaveError(
                    ""
                  )
                }
              }
            />


            <div className="durationLimits">

              <span>
                1 h
              </span>

              <span>
                10 h
              </span>

            </div>

          </div>
        )}


        {/* =========================
            PAYPAL À AJOUTER
        ========================= */}

        {requiresPaypal &&
          !hasSavedPaypalID && (

          <div className="bookingBlock paypalBlock">

            <label htmlFor="bookingPaypalID">

              {translate(
                language,
                "Adresse PayPal obligatoire"
              )}

            </label>


            <p className="paypalExplanation">

              {translate(
                language,
                "Ajoutez l'adresse e-mail associée à votre compte PayPal pour continuer la réservation."
              )}

            </p>


            <input
              id="bookingPaypalID"

              type="email"

              inputMode="email"

              autoComplete="email"

              value={
                paypalID
              }

              disabled={
                isSavingPaypal
              }

              placeholder={
                translate(
                  language,
                  "Entrez votre adresse PayPal"
                )
              }

              onChange={
                event => {

                  setPaypalID(
                    event
                      .target
                      .value
                  )

                  setPaypalError(
                    ""
                  )

                  setSaveError(
                    ""
                  )
                }
              }
            />


            {paypalError && (

              <p className="bookingError">
                {paypalError}
              </p>

            )}


            <button
              type="button"

              className="savePaypalButton"

              disabled={
                isSavingPaypal ||
                !paypalID.trim() ||
                !isValidPaypalID(
                  paypalID
                )
              }

              onClick={
                handleSavePaypalID
              }
            >

              {isSavingPaypal
                ? translate(
                    language,
                    "Enregistrement..."
                  )
                : translate(
                    language,
                    "Enregistrer l'adresse PayPal"
                  )
              }

            </button>

          </div>
        )}


        {/* =========================
            PAYPAL ENREGISTRÉ
        ========================= */}

        {requiresPaypal &&
          hasSavedPaypalID && (

          <div className="paypalSavedBox">

            <div>

              <strong>

                {translate(
                  language,
                  "Adresse PayPal"
                )}

              </strong>


              <span>
                {savedPaypalID}
              </span>

            </div>


            <span className="paypalSavedCheck">
              ✓
            </span>

          </div>
        )}


        {/* =========================
            DATE + HEURE
        ========================= */}

        <div className="bookingGrid">


          {/* DATE */}

          <div>

            <label>

              {translate(
                language,
                "Date"
              )}

            </label>


            <div className="calendarBox">

              <div className="calendarTitle">

                <button
                  type="button"
                  onClick={
                    previousMonth
                  }
                >
                  ‹
                </button>


                <span>

                  {translate(
                    language,
                    months[
                      selectedMonth -
                      1
                    ]
                  )}{" "}

                  {selectedYear}

                </span>


                <button
                  type="button"
                  onClick={
                    nextMonth
                  }
                >
                  ›
                </button>

              </div>


              <div className="calendarDays">

                {weekDays.map(
                  day => (

                  <strong
                    key={
                      day
                    }
                  >

                    {translate(
                      language,
                      day
                    )}

                  </strong>

                ))}


                {Array.from({
                  length:
                    leadingEmptyDays

                }).map(
                  (
                    _,
                    index
                  ) => (

                  <span
                    key={`empty-${index}`}
                    className="calendarEmptyDay"
                  />

                ))}


                {Array.from({
                  length:
                    daysInMonth

                }).map(
                  (
                    _,
                    index
                  ) => {

                    const day =
                      index + 1


                    const isAvailable =
                      isAvailableDate(
                        day
                      )


                    const isSelected =
                      selectedDay ===
                        day &&
                      isAvailable


                    return (

                      <button
                        key={
                          day
                        }

                        type="button"

                        disabled={
                          !isAvailable
                        }

                        className={[
                          isSelected
                            ? "selectedDay"
                            : "",

                          !isAvailable
                            ? "disabledDay"
                            : ""

                        ]
                          .filter(
                            Boolean
                          )
                          .join(" ")
                        }

                        onClick={
                          () =>
                            selectDay(
                              day
                            )
                        }
                      >

                        {day}

                      </button>
                    )
                  }
                )}

              </div>

            </div>

          </div>


          {/* HEURE */}

          <div>

            <label>

              {translate(
                language,
                "Heure"
              )}

            </label>


            {isLoadingAppointments ? (

              <p className="closedDayMessage">

                {translate(
                  language,
                  "Chargement..."
                )}

              </p>

            ) : !selectedDaySchedule
                  .isOpen ? (

              <p className="closedDayMessage">

                {translate(
                  language,
                  "Fermé"
                )}

              </p>

            ) : availableTimes.length ===
                0 ? (

              <p className="closedDayMessage">

                {translate(
                  language,
                  "Aucun créneau disponible pour cette durée."
                )}

              </p>

            ) : (

              <div className="timeGrid">

                {availableTimes.map(
                  time => (

                  <button
                    key={
                      time
                    }

                    type="button"

                    className={
                      selectedTime ===
                      time
                        ? "selectedTime"
                        : ""
                    }

                    onClick={
                      () => {

                        setSelectedTime(
                          time
                        )

                        setSaveError(
                          ""
                        )
                      }
                    }
                  >

                    {time}

                  </button>

                ))}

              </div>
            )}

          </div>

        </div>


        {/* =========================
            PRIX ESTIMÉ
        ========================= */}

        <div className="priceBox">

          <span>

            {translate(
              language,
              "Prix estimé"
            )}

          </span>


          <strong>

            {price.toFixed(
              2
            )}{" "}

            {pro.devise ??
              service?.devise ??
              "€"
            }

          </strong>

        </div>


        {/* =========================
            ERREUR
        ========================= */}

        {saveError && (

          <p className="bookingError">
            {saveError}
          </p>

        )}


        {/* =========================
            CONFIRMATION
        ========================= */}

        <button
          type="button"

          className="confirmBookingButton"

          disabled={
            !canConfirm ||
            isSaving ||
            isLoadingAppointments ||
            isLoadingPreviousInformations ||
            isSavingPaypal
          }

          onClick={
            handleConfirmBooking
          }
        >

          {isSaving
            ? translate(
                language,
                "Enregistrement..."
              )
            : translate(
                language,
                "Confirmer la réservation"
              )
          }

        </button>

      </aside>

    </div>
  )
}
