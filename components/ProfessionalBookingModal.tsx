"use client"

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react"

import { useAuth } from "@/context/AuthContext"
import { saveRDV } from "@/services/saveRDV"
import { translate } from "@/translations/translations"

import {
  BookedAppointment,
  fetchBookedAppointments
} from "@/services/fetchBookedAppointments"

import {
  searchAnimalsByName
} from "@/services/fetchAnimalAccount"

import {
  fetchLatestAnimalRDV
} from "@/services/fetchLatestAnimalRDV"

import "./BookingModal.css"


type ProfessionalAccountType =
  | "sitter"
  | "grooming"
  | "healthcare"


type Service = {
  id: string
  name: string
  description?: string
  duration: number
  price?: number
  devise?: string

  bookingMode: string
  requiredInformations: string[]
  customQuestions: string[]
}


type AnimalClient = {
  id: string
  name: string
  species: string
  phoneNumber?: string
  photo?: string
}


type Professional = {
  id: string
  name: string

  tarif?: number
  devise?: string

  disponibilities?: string[]
  availability?: string[]
  schedules?: string[]

  type?: string
}


type Props = {
  accountType: ProfessionalAccountType
  professional: Professional

  /*
   * Animaux déjà associés au professionnel.
   * Sert à déterminer si l'animal est connu.
   */
  animals: AnimalClient[]

  services: Service[]
  collaborators: string[]

  onClose: () => void
  onCreated?: () => void
}


type DaySchedule = {
  isOpen: boolean
  openingMinutes: number
  closingMinutes: number
}


/*
 * Ces valeurs restent en français car elles
 * servent à lire les horaires enregistrés
 * dans CloudKit.
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


/*
 * Clés de traduction.
 */
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
  const [hours, minutes] = time
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

  const remainingMinutes =
    minutes % 60

  return `${String(hours).padStart(
    2,
    "0"
  )}:${String(
    remainingMinutes
  ).padStart(2, "0")}`
}


function parseDaySchedule(
  planning: string[] | undefined,
  date: Date
): DaySchedule {
  const dayName =
    frenchDays[date.getDay()]

  const line = planning?.find(item =>
    item
      .trim()
      .toLocaleLowerCase("fr-FR")
      .startsWith(
        dayName.toLocaleLowerCase(
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

  const normalized = line
    .replace(dayName, "")
    .replace("=", "")
    .trim()

  if (
    !normalized ||
    normalized.toLocaleLowerCase(
      "fr-FR"
    ) === "fermé"
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


function createTimeSlots(
  schedule: DaySchedule,
  requiredDurationMinutes: number
): string[] {
  if (!schedule.isOpen) {
    return []
  }

  const slots: string[] = []
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
      minutesToTime(start)
    )
  }

  return slots
}


export default function ProfessionalBookingModal({
  accountType,
  professional,
  animals,
  services,
  collaborators,
  onClose,
  onCreated
}: Props) {
  const { session } = useAuth()

  const language =
    session?.user?.language ?? "fr"

  const today = new Date()

  const isSitter =
    accountType === "sitter"


  /*
   * =========================
   * ANIMAL
   * =========================
   */

  const [
    animalSearch,
    setAnimalSearch
  ] = useState("")

  const [
    animalResults,
    setAnimalResults
  ] = useState<AnimalClient[]>([])

  const [
    isSearchingAnimals,
    setIsSearchingAnimals
  ] = useState(false)

  const [
    selectedAnimal,
    setSelectedAnimal
  ] = useState<AnimalClient | null>(
    null
  )


  /*
   * =========================
   * SERVICE
   * =========================
   */

  const [
    selectedServiceID,
    setSelectedServiceID
  ] = useState("")


  /*
   * =========================
   * INFORMATIONS ANIMAL / RDV
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
    isLoadingPreviousInformations,
    setIsLoadingPreviousInformations
  ] = useState(false)

  const [
    customAnswers,
    setCustomAnswers
  ] = useState<Record<string, string>>(
    {}
  )


  /*
   * =========================
   * COLLABORATEUR
   * =========================
   */

  const [
    selectedCollaborator,
    setSelectedCollaborator
  ] = useState(
    isSitter
      ? professional.name
      : collaborators[0] ?? ""
  )


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
   * RDV EXISTANTS
   * =========================
   */

  const [
    bookedAppointments,
    setBookedAppointments
  ] = useState<BookedAppointment[]>(
    []
  )

  const [
    isLoadingAppointments,
    setIsLoadingAppointments
  ] = useState(false)


  /*
   * =========================
   * SAVE
   * =========================
   */

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
   * RECHERCHE ANIMAL
   * =========================
   */

  useEffect(() => {
    const query =
      animalSearch.trim()

    if (query.length < 2) {
      setAnimalResults([])
      setIsSearchingAnimals(false)

      return
    }

    let cancelled = false

    const timeoutID =
      window.setTimeout(
        async () => {
          try {
            setIsSearchingAnimals(
              true
            )

            const results =
              await searchAnimalsByName(
                query
              )

            if (!cancelled) {
              setAnimalResults(
                results
              )
            }
          } catch (error) {
            console.error(
              "Erreur recherche animaux :",
              error
            )

            if (!cancelled) {
              setAnimalResults([])
            }
          } finally {
            if (!cancelled) {
              setIsSearchingAnimals(
                false
              )
            }
          }
        },
        350
      )

    return () => {
      cancelled = true

      window.clearTimeout(
        timeoutID
      )
    }
  }, [animalSearch])


  const filteredAnimals =
    useMemo(() => {
      const query =
        animalSearch
          .trim()
          .toLocaleLowerCase(
            "fr-FR"
          )

      if (query.length < 2) {
        return []
      }

      return animalResults
        .filter(animal =>
          [
            animal.name,
            animal.species,
            animal.phoneNumber ?? ""
          ].some(value =>
            value
              .toLocaleLowerCase(
                "fr-FR"
              )
              .includes(query)
          )
        )
        .slice(0, 8)
    }, [
      animalSearch,
      animalResults
    ])


  /*
   * =========================
   * SERVICE SÉLECTIONNÉ
   * =========================
   */

  const selectedService =
    useMemo(
      () =>
        services.find(
          service =>
            service.id ===
            selectedServiceID
        ),
      [
        services,
        selectedServiceID
      ]
    )


  /*
   * =========================
   * ANIMAL CONNU ?
   * =========================
   */

  const isKnownAnimal =
    useMemo(() => {
      if (!selectedAnimal) {
        return false
      }

      return animals.some(
        animal =>
          animal.id ===
          selectedAnimal.id
      )
    }, [
      animals,
      selectedAnimal
    ])


  /*
   * =========================
   * ANCIENNES INFORMATIONS
   * DE L'ANIMAL
   * =========================
   *
   * Pour un animal déjà connu :
   *
   * - on cherche son dernier RDV
   *   chez CE professionnel ;
   *
   * - on lit RDV.infos ;
   *
   * - on préremplit uniquement
   *   les requiredInformations
   *   de la prestation actuelle.
   *
   * Les customQuestions ne sont
   * volontairement pas reprises.
   */

  useEffect(() => {
    let cancelled = false

    async function loadPreviousInformations() {
      /*
       * On repart de champs vides
       * à chaque combinaison
       * animal / prestation.
       */
      setBehavior("")
      setCoatCondition("")
      setWeight("")
      setNotes("")
        setPhoneNumber("")

      if (
        isSitter ||
        !selectedAnimal ||
        !selectedService ||
        !isKnownAnimal
      ) {
        setIsLoadingPreviousInformations(
          false
        )

        return
      }

      try {
        setIsLoadingPreviousInformations(
          true
        )

        const previous =
          await fetchLatestAnimalRDV(
            professional.id,
            selectedAnimal.id
          )
          
          console.log(
            "=== DERNIER RDV ANIMAL ===",
            previous
          )

        if (cancelled) {
          return
        }

        if (!previous) {
            console.log("AUcun LAST RDV")
          return
        }
          
          setPhoneNumber(
            previous.phoneNumber ?? ""
          )

        const required =
          selectedService
            .requiredInformations ??
          []

        /*
         * POIDS
         */
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

        /*
         * COMPORTEMENT
         */
        if (
          required.includes(
            "behavior"
          )
        ) {
          setBehavior(
            previous.behavior ?? ""
          )
        }

        /*
         * ÉTAT DU PELAGE
         */
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

        /*
         * INFORMATIONS
         * COMPLÉMENTAIRES
         */
        if (
          required.includes(
            "notes"
          )
        ) {
          setNotes(
            previous.notes ?? ""
          )
        }
      } catch (error) {
        console.error(
          "Erreur récupération anciennes informations animal :",
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
    isSitter,
    selectedAnimal,
    selectedService,
    isKnownAnimal,
    professional.id
  ])


  /*
   * Les réponses aux questions personnalisées
   * appartiennent à la prestation.
   *
   * On les efface lorsqu'on change de service.
   */
  useEffect(() => {
    setCustomAnswers({})
  }, [selectedServiceID])


  /*
   * =========================
   * PLANNING
   * =========================
   */

  const planning: string[] =
    isSitter
      ? professional.disponibilities ??
        professional.availability ??
        []
      : professional.schedules ?? []


  const appointmentCollaborator =
    isSitter
      ? professional.name
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
    isSitter
      ? duration * 60
      : Number(
          selectedService?.duration ??
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
    let cancelled = false

    async function loadAppointments() {
      if (
        !professional.id ||
        !appointmentCollaborator
      ) {
        setBookedAppointments([])
        return
      }

      try {
        setIsLoadingAppointments(
          true
        )

        const appointments =
          await fetchBookedAppointments(
            professional.id,
            appointmentCollaborator
          )

        if (!cancelled) {
          setBookedAppointments(
            appointments
          )
        }
      } catch (error) {
        console.error(
          "Erreur pendant la récupération des rendez-vous :",
          error
        )

        if (!cancelled) {
          setBookedAppointments([])
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
    professional.id,
    appointmentCollaborator
  ])


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

        if (isSitter) {
          return 60
        }

        const existingService =
          services.find(
            service =>
              service.id ===
                appointment.serviceID ||
              service.name ===
                appointment.serviceID
          )

        return Number(
          existingService?.duration ??
          30
        )
      },
      [
        isSitter,
        services
      ]
    )


  const isSlotAvailable =
    useCallback(
      (
        date: Date,
        startTime: string,
        requestedDuration: number
      ): boolean => {
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


  const getAvailableTimesForDate =
    useCallback(
      (
        date: Date
      ): string[] => {
        if (
          !isSitter &&
          !selectedService
        ) {
          return []
        }

        if (
          !appointmentCollaborator
        ) {
          return []
        }

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
        isSitter,
        selectedService,
        appointmentCollaborator,
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


  useEffect(() => {
    setSelectedTime("")
  }, [
    selectedServiceID,
    selectedCollaborator,
    duration
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


  function isPastDate(
    date: Date
  ): boolean {
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

    return testedDate < currentDate
  }


  function isAvailableDate(
    day: number
  ): boolean {
    const date =
      new Date(
        selectedYear,
        selectedMonth - 1,
        day
      )

    if (isPastDate(date)) {
      return false
    }

    return (
      getAvailableTimesForDate(
        date
      ).length > 0
    )
  }


  function selectDay(
    day: number
  ) {
    if (!isAvailableDate(day)) {
      return
    }

    setSelectedDay(day)
    setSelectedTime("")
    setSaveError("")
  }


  function previousMonth() {
    if (selectedMonth === 1) {
      setSelectedMonth(12)

      setSelectedYear(
        year => year - 1
      )
    } else {
      setSelectedMonth(
        month => month - 1
      )
    }

    setSelectedDay(1)
    setSelectedTime("")
  }


  function nextMonth() {
    if (selectedMonth === 12) {
      setSelectedMonth(1)

      setSelectedYear(
        year => year + 1
      )
    } else {
      setSelectedMonth(
        month => month + 1
      )
    }

    setSelectedDay(1)
    setSelectedTime("")
  }


  function buildAppointmentDate():
    Date | null {
    if (!selectedTime) {
      return null
    }

    const [hours, minutes] =
      selectedTime
        .split(":")
        .map(Number)

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {
      return null
    }

    return new Date(
      selectedYear,
      selectedMonth - 1,
      selectedDay,
      hours,
      minutes,
      0,
      0
    )
  }


  /*
   * =========================
   * ENREGISTREMENT
   * =========================
   */

  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault()

    setSaveError("")


    /*
     * Animal obligatoire
     */
    if (!selectedAnimal) {
      setSaveError(
        translate(
          language,
          "Sélectionnez un animal."
        )
      )

      return
    }
      
      
      /*
       * Numéro de téléphone obligatoire
       */
      if (
        !phoneNumber.trim()
      ) {
        setSaveError(
          translate(
            language,
            "Renseignez le numéro de téléphone du client."
          )
        )

        return
      }


    /*
     * Service obligatoire
     */
    if (
      !isSitter &&
      !selectedService
    ) {
      setSaveError(
        translate(
          language,
          "Sélectionnez une prestation."
        )
      )

      return
    }


    /*
     * Vérification des informations
     * demandées par la prestation.
     */
    if (
      !isSitter &&
      selectedService
    ) {
      const required =
        selectedService
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
            "Renseignez le comportement de l'animal."
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
            "Renseignez l'état du pelage."
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
            "Renseignez le poids de l'animal."
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
     * Collaborateur obligatoire
     */
    if (
      !appointmentCollaborator
    ) {
      setSaveError(
        translate(
          language,
          "Sélectionnez un collaborateur."
        )
      )

      return
    }


    const appointmentDate =
      buildAppointmentDate()


    if (!appointmentDate) {
      setSaveError(
        translate(
          language,
          "Sélectionnez une date et un créneau."
        )
      )

      return
    }


    /*
     * Dernière vérification du créneau
     */
    const slotStillAvailable =
      isSlotAvailable(
        selectedDate,
        selectedTime,
        requiredDurationMinutes
      )


    if (!slotStillAvailable) {
      setSaveError(
        translate(
          language,
          "Ce créneau n'est plus disponible."
        )
      )

      setSelectedTime("")

      return
    }


    /*
     * Pet sitter
     */
    const totalPrice =
      Number(
        professional.tarif ?? 0
      ) * duration


    const serviceID =
      isSitter
        ? `Sitting-${duration}-${totalPrice}`
        : selectedService?.id ?? ""


    /*
     * On n'enregistre que les informations
     * demandées par la prestation actuelle.
     */
    const requiredInformations =
      selectedService
        ?.requiredInformations ??
      []


    const rdvInfos =
      JSON.stringify({
        knownAnimal:
          isKnownAnimal,

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
            ? Number(weight)
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
              ([, answer]) =>
                answer.trim() !== ""
            )
          )
      })


    try {
      setIsSaving(true)


      await saveRDV({
        groomingID:
          professional.id,

        /*
         * RDV.userID = animalID
         */
        userID:
          selectedAnimal.id,

        date:
          appointmentDate,

        serviceID,

        collaborator:
          appointmentCollaborator,

      phoneNumber:
        phoneNumber.trim(),

        infos:
          rdvInfos,

        authorizationID:
          "",

        stripePaymentIntentID:
          "",

        stripeTransferID:
          "",

        paymentStatus:
          professional.type ===
          "Sitter"
            ? "pending"
            : "confirmed"
      })


      onCreated?.()
      onClose()

    } catch (error) {
      console.error(
        "Erreur lors de la création du rendez-vous :",
        error
      )


      setSaveError(
        error instanceof Error &&
          error.message
          ? error.message
          : translate(
              language,
              "Impossible d'enregistrer le rendez-vous."
            )
      )

    } finally {
      setIsSaving(false)
    }
  }


  /*
   * =========================
   * CAN SAVE
   * =========================
   */

    const canSave =
      Boolean(selectedAnimal) &&
      Boolean(phoneNumber.trim()) &&
      Boolean(
        isSitter ||
        selectedService
      ) &&
      Boolean(
        appointmentCollaborator
      ) &&
      Boolean(selectedTime) &&
      !isLoadingAppointments &&
      !isLoadingPreviousInformations &&
      !isSaving


  /*
   * =========================
   * RENDER
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
              "Nouveau rendez-vous"
            )}
          </h2>


          <button
            type="button"
            aria-label={translate(
              language,
              "Fermer"
            )}
            onClick={onClose}
          >
            ×
          </button>

        </div>


        <form onSubmit={handleSubmit}>


          {/* =========================
              ANIMAL
          ========================= */}

          <div className="bookingBlock">

            <label htmlFor="animalSearch">
              {translate(
                language,
                "Animal"
              )}
            </label>


            <div className="animalSearchContainer">

              <input
                id="animalSearch"
                type="search"

                value={animalSearch}

                placeholder={translate(
                  language,
                  "Rechercher un animal..."
                )}

                autoComplete="off"

                onChange={event => {
                  setAnimalSearch(
                    event.target.value
                  )

                  setSelectedAnimal(
                    null
                  )

                  setBehavior("")
                  setCoatCondition("")
                  setWeight("")
                  setNotes("")
                    setPhoneNumber("")
                  setCustomAnswers({})

                  setSaveError("")
                }}
              />


              {isSearchingAnimals && (
                <div className="animalSearchMessage">
                  {translate(
                    language,
                    "Recherche..."
                  )}
                </div>
              )}


              {!isSearchingAnimals &&
                animalSearch
                  .trim()
                  .length >= 2 &&
                filteredAnimals.length ===
                  0 &&
                !selectedAnimal && (

                <div className="animalSearchMessage">
                  {translate(
                    language,
                    "Aucun animal trouvé."
                  )}
                </div>
              )}


              {!isSearchingAnimals &&
                filteredAnimals.length >
                  0 &&
                !selectedAnimal && (

                <div className="professionalAnimalResults">

                  {filteredAnimals.map(
                    animal => (

                      <button
                        key={animal.id}

                        type="button"

                        className="professionalAnimalResult"

                        onClick={() => {
                          setSelectedAnimal(
                            animal
                          )

                          setAnimalSearch(
                            animal.name
                          )

                          setAnimalResults(
                            []
                          )

                          setBehavior("")
                          setCoatCondition("")
                          setWeight("")
                          setNotes("")
                            setPhoneNumber("")
                          setCustomAnswers({})

                          setSaveError("")
                        }}
                      >

                        {animal.photo ? (
                          <img
                            src={
                              animal.photo
                            }
                            alt={
                              animal.name
                            }
                          />
                        ) : (
                          <span className="animalPhotoPlaceholder">
                            🐾
                          </span>
                        )}


                        <div className="professionalAnimalResultContent">

                          <strong>
                            {animal.name}
                          </strong>

                          {animal.species && (
                            <span>
                              {animal.species}
                            </span>
                          )}

                        </div>

                      </button>
                    )
                  )}

                </div>
              )}

            </div>


            {selectedAnimal && (
              <>

                <div className="selectedAnimalCard">

                  {selectedAnimal.photo ? (
                    <img
                      src={
                        selectedAnimal.photo
                      }
                      alt={
                        selectedAnimal.name
                      }
                    />
                  ) : (
                    <span className="animalPhotoPlaceholder">
                      🐾
                    </span>
                  )}


                  <div className="selectedAnimalContent">

                    <strong>
                      {selectedAnimal.name}
                    </strong>

                    {selectedAnimal.species && (
                      <span>
                        {selectedAnimal.species}
                      </span>
                    )}

                  </div>


                  <button
                    type="button"

                    aria-label={translate(
                      language,
                      "Supprimer"
                    )}

                    onClick={() => {
                      setSelectedAnimal(
                        null
                      )

                      setAnimalSearch("")
                      setAnimalResults([])

                      setBehavior("")
                      setCoatCondition("")
                      setWeight("")
                      setNotes("")
                        setPhoneNumber("")
                      setCustomAnswers({})

                      setSaveError("")
                    }}
                  >
                    ×
                  </button>

                </div>


                {!isSitter && (

                  <div
                    className={[
                      "clientStatus",

                      isKnownAnimal
                        ? "clientStatusKnown"
                        : "clientStatusNew"

                    ].join(" ")}
                  >

                    <span className="clientStatusIcon">
                      {isKnownAnimal
                        ? "✓"
                        : "+"
                      }
                    </span>


                    <div>

                      <strong>
                        {translate(
                          language,

                          isKnownAnimal
                            ? "Animal connu"
                            : "Nouvel animal"
                        )}
                      </strong>


                      <p>
                        {translate(
                          language,

                          isKnownAnimal
                            ? "Cet animal a déjà été reçu par votre établissement."
                            : "Cet animal n'a pas encore été reçu par votre établissement."
                        )}
                      </p>

                    </div>

                  </div>

                )}

              </>
            )}

          </div>

          {/* =========================
              TÉLÉPHONE
          ========================= */}

          {selectedAnimal && (

            <div className="bookingBlock">

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
                  "Confirmez ce numéro avec le client. Il sera utilisé pour le rappel SMS du rendez-vous."
                )}
              </p>

            </div>

          )}
          

          {/* =========================
              PRESTATION
          ========================= */}

          {!isSitter && (

            <div className="bookingBlock">

              <label>
                {translate(
                  language,
                  "Prestation"
                )}
              </label>


              <select
                required

                value={
                  selectedServiceID
                }

                onChange={event => {
                  setSelectedServiceID(
                    event.target.value
                  )

                  setSelectedTime("")
                  setSaveError("")
                }}
              >

                <option value="">
                  {translate(
                    language,
                    "Sélectionner une prestation"
                  )}
                </option>


                {services.map(
                  service => (

                    <option
                      key={service.id}
                      value={service.id}
                    >
                      {service.name}
                      {" — "}
                      {service.duration}
                      {" "}
                      {translate(
                        language,
                        "min"
                      )}
                    </option>

                  )
                )}

              </select>

            </div>
          )}


          {/* =========================
              INFORMATIONS DEMANDÉES
              PAR LA PRESTATION
          ========================= */}

          {selectedAnimal &&
            !isSitter &&
            selectedService &&
            (
              selectedService
                .requiredInformations
                ?.length > 0 ||
              selectedService
                .customQuestions
                ?.length > 0
            ) && (

            <div className="bookingBlock animalInformationsBlock">

              {selectedService
                .requiredInformations
                ?.length > 0 && (
                <>

                  <div className="animalInformationHeader">

                    <div>

                      <label>
                        {translate(
                          language,
                          "Informations sur l'animal"
                        )}
                      </label>

                      <p>
                        {translate(
                          language,
                          "Renseignez les informations demandées pour cette prestation."
                        )}
                      </p>

                      {isLoadingPreviousInformations && (
                        <p className="previousInformationsLoading">
                          {translate(
                            language,
                            "Récupération des informations précédentes..."
                          )}
                        </p>
                      )}

                    </div>


                    <span
                      className={[
                        "clientStatusBadge",

                        isKnownAnimal
                          ? "clientStatusBadgeKnown"
                          : "clientStatusBadgeNew"

                      ].join(" ")}
                    >
                      {translate(
                        language,

                        isKnownAnimal
                          ? "Animal connu"
                          : "Nouvel animal"
                      )}
                    </span>

                  </div>


                  <div className="serviceInformationsGrid">


                    {/* POIDS */}

                    {selectedService
                      .requiredInformations
                      .includes(
                        "weight"
                      ) && (

                      <div className="serviceInformationField">

                        <label htmlFor="weight">
                          {translate(
                            language,
                            "Poids"
                          )}
                        </label>

                        <div className="weightInput">

                          <input
                            id="weight"
                            type="number"
                            min="0"
                            step="0.1"

                            value={weight}

                            placeholder="0"

                            disabled={
                              isLoadingPreviousInformations
                            }

                            onChange={event => {
                              setWeight(
                                event.target.value
                              )

                              setSaveError("")
                            }}
                          />

                          <span>
                            kg
                          </span>

                        </div>

                      </div>
                    )}


                    {/* COMPORTEMENT */}

                    {selectedService
                      .requiredInformations
                      .includes(
                        "behavior"
                      ) && (

                      <div className="serviceInformationField">

                        <label htmlFor="behavior">
                          {translate(
                            language,
                            "Comportement"
                          )}
                        </label>

                        <input
                          id="behavior"
                          type="text"

                          value={behavior}

                          disabled={
                            isLoadingPreviousInformations
                          }

                          placeholder={translate(
                            language,
                            "Ex. calme, anxieux, réactif..."
                          )}

                          onChange={event => {
                            setBehavior(
                              event.target.value
                            )

                            setSaveError("")
                          }}
                        />

                      </div>
                    )}


                    {/* ÉTAT DU PELAGE */}

                    {selectedService
                      .requiredInformations
                      .includes(
                        "coatCondition"
                      ) && (

                      <div className="serviceInformationField serviceInformationFull">

                        <label htmlFor="coatCondition">
                          {translate(
                            language,
                            "État du pelage"
                          )}
                        </label>

                        <textarea
                          id="coatCondition"

                          value={
                            coatCondition
                          }

                          disabled={
                            isLoadingPreviousInformations
                          }

                          placeholder={translate(
                            language,
                            "Ex. bon état, quelques nœuds, très emmêlé..."
                          )}

                          onChange={event => {
                            setCoatCondition(
                              event.target.value
                            )

                            setSaveError("")
                          }}
                        />

                      </div>
                    )}


                    {/* INFORMATIONS COMPLÉMENTAIRES */}

                    {selectedService
                      .requiredInformations
                      .includes(
                        "notes"
                      ) && (

                      <div className="serviceInformationField serviceInformationFull">

                        <label htmlFor="notes">
                          {translate(
                            language,
                            "Informations complémentaires"
                          )}
                        </label>

                        <textarea
                          id="notes"

                          value={notes}

                          disabled={
                            isLoadingPreviousInformations
                          }

                          placeholder={translate(
                            language,
                            "Ajouter une information..."
                          )}

                          onChange={event => {
                            setNotes(
                              event.target.value
                            )

                            setSaveError("")
                          }}
                        />

                      </div>
                    )}

                  </div>

                </>
              )}


              {/* =========================
                  CUSTOM QUESTIONS
              ========================= */}

              {selectedService
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
                        "Informations demandées pour cette prestation."
                      )}
                    </p>

                  </div>


                  <div className="customQuestions">

                    {selectedService
                      .customQuestions
                      .map(
                        (
                          question,
                          index
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

                            placeholder={translate(
                              language,
                              "Votre réponse..."
                            )}

                            onChange={event => {
                              setCustomAnswers(
                                current => ({
                                  ...current,

                                  [question]:
                                    event
                                      .target
                                      .value
                                })
                              )

                              setSaveError("")
                            }}
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
              SITTER
          ========================= */}

          {isSitter && (
            <>

              <div className="bookingBlock">

                <label>
                  {translate(
                    language,
                    "Prestation"
                  )}
                </label>


                <div className="bookingSelect">
                  {translate(
                    language,
                    "Garde"
                  )}
                </div>

              </div>


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

                  value={duration}

                  onChange={event => {
                    setDuration(
                      Number(
                        event
                          .target
                          .value
                      )
                    )

                    setSelectedTime("")
                  }}
                />


                <div className="durationLimits">

                  <span>
                    1{" "}
                    {translate(
                      language,
                      "h"
                    )}
                  </span>

                  <span>
                    10{" "}
                    {translate(
                      language,
                      "h"
                    )}
                  </span>

                </div>

              </div>

            </>
          )}


          {/* =========================
              COLLABORATEUR
          ========================= */}

          {!isSitter &&
            collaborators.length >
              0 && (

            <div className="bookingBlock">

              <label>
                {translate(
                  language,
                  "Collaborateur"
                )}
              </label>


              <select
                required

                value={
                  selectedCollaborator
                }

                onChange={event => {
                  setSelectedCollaborator(
                    event.target.value
                  )

                  setSelectedTime("")
                  setSaveError("")
                }}
              >

                <option value="">
                  {translate(
                    language,
                    "Sélectionner un collaborateur"
                  )}
                </option>


                {collaborators.map(
                  collaborator => (

                    <option
                      key={
                        collaborator
                      }

                      value={
                        collaborator
                      }
                    >
                      {collaborator}
                    </option>

                  )
                )}

              </select>

            </div>
          )}


          {isSitter && (

            <div className="bookingBlock">

              <label>
                {translate(
                  language,
                  "Pet sitter"
                )}
              </label>


              <div className="bookingSelect">
                {professional.name}
              </div>

            </div>
          )}


          {/* =========================
              DATE + HEURE
          ========================= */}

          <div className="bookingGrid">

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

                    aria-label={translate(
                      language,
                      "Mois précédent"
                    )}

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

                    aria-label={translate(
                      language,
                      "Mois suivant"
                    )}

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
                        key={day}
                      >
                        {translate(
                          language,
                          day
                        )}
                      </strong>

                    )
                  )}


                  {Array.from({
                    length:
                      leadingEmptyDays

                  }).map(
                    (_, index) => (

                      <span
                        key={`empty-${index}`}

                        className="calendarEmptyDay"
                      />

                    )
                  )}


                  {Array.from({
                    length:
                      daysInMonth

                  }).map(
                    (_, index) => {

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
                          key={day}

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

                          onClick={() =>
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
                    "Aucun créneau disponible."
                  )}
                </p>

              ) : (

                <div className="timeGrid">

                  {availableTimes.map(
                    time => (

                      <button
                        key={time}

                        type="button"

                        className={
                          selectedTime ===
                          time
                            ? "selectedTime"
                            : ""
                        }

                        onClick={() => {
                          setSelectedTime(
                            time
                          )

                          setSaveError(
                            ""
                          )
                        }}
                      >
                        {time}
                      </button>

                    )
                  )}

                </div>
              )}

            </div>

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
              ACTIONS
          ========================= */}

          <div className="agendaModalActions">

            <button
              type="button"

              className="agendaSecondaryButton"

              onClick={onClose}
            >
              {translate(
                language,
                "Annuler"
              )}
            </button>


            <button
              type="submit"

              className="confirmBookingButton"

              disabled={!canSave}
            >

              {isSaving
                ? translate(
                    language,
                    "Enregistrement..."
                  )
                : translate(
                    language,
                    "Enregistrer le rendez-vous"
                  )
              }

            </button>

          </div>

        </form>

      </aside>

    </div>
  )
}
