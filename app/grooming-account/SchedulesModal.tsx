"use client"

import {
  FormEvent,
  useEffect,
  useState
} from "react"

type ScheduleDay = {
  day: string
  isOpen: boolean
  startTime: string
  endTime: string
}

type SchedulesModalProps = {
  isOpen: boolean
  schedules: string[]
  onClose: () => void
  onSave: (
    schedules: string[]
  ) => Promise<void> | void
}

const days = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche"
] as const

function createDefaultSchedules():
  ScheduleDay[] {
  return days.map(day => ({
    day,
    isOpen: false,
    startTime: "09:00",
    endTime: "18:00"
  }))
}

function normalizeTime(
  value: string | undefined,
  fallback: string
): string {
  if (!value) {
    return fallback
  }

  const match = value
    .trim()
    .match(/^(\d{1,2}):(\d{2})$/)

  if (!match) {
    return fallback
  }

  const hours =
    match[1].padStart(2, "0")

  const minutes =
    match[2]

  return `${hours}:${minutes}`
}

function parseSchedules(
  values: string[]
): ScheduleDay[] {
  const safeValues =
    Array.isArray(values)
      ? values.filter(
          value =>
            typeof value === "string"
        )
      : []

  return days.map(day => {
    const savedSchedule =
      safeValues.find(value => {
        const separatorIndex =
          value.indexOf("=")

        if (separatorIndex === -1) {
          return false
        }

        const savedDay =
          value
            .slice(0, separatorIndex)
            .trim()

        return savedDay === day
      })

    if (!savedSchedule) {
      return {
        day,
        isOpen: false,
        startTime: "09:00",
        endTime: "18:00"
      }
    }

    const separatorIndex =
      savedSchedule.indexOf("=")

    const scheduleValue =
      savedSchedule
        .slice(separatorIndex + 1)
        .trim()

    if (
      !scheduleValue ||
      scheduleValue.toLowerCase() ===
        "fermé"
    ) {
      return {
        day,
        isOpen: false,
        startTime: "09:00",
        endTime: "18:00"
      }
    }

    const [
      rawStartTime,
      rawEndTime
    ] = scheduleValue.split("-")

    if (
      !rawStartTime ||
      !rawEndTime
    ) {
      return {
        day,
        isOpen: false,
        startTime: "09:00",
        endTime: "18:00"
      }
    }

    return {
      day,
      isOpen: true,
      startTime: normalizeTime(
        rawStartTime,
        "09:00"
      ),
      endTime: normalizeTime(
        rawEndTime,
        "18:00"
      )
    }
  })
}

function serializeSchedules(
  values: ScheduleDay[]
): string[] {
  return days.map(
    (
      day,
      index
    ) => {
      const schedule =
        values[index]

      if (
        !schedule ||
        !schedule.isOpen
      ) {
        return `${day}=Fermé`
      }

      const startTime =
        normalizeTime(
          schedule.startTime,
          "09:00"
        )

      const endTime =
        normalizeTime(
          schedule.endTime,
          "18:00"
        )

      return `${day}=${startTime}-${endTime}`
    }
  )
}

export default function SchedulesModal({
  isOpen,
  schedules,
  onClose,
  onSave
}: SchedulesModalProps) {
  const [
    editedSchedules,
    setEditedSchedules
  ] = useState<ScheduleDay[]>(
    createDefaultSchedules
  )

  const [
    error,
    setError
  ] = useState("")

  const [
    isSaving,
    setIsSaving
  ] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const parsedSchedules =
      parseSchedules(schedules)

    console.log(
      "Horaires reçus :",
      schedules
    )

    console.log(
      "Horaires parsés :",
      parsedSchedules
    )

    setEditedSchedules(
      parsedSchedules
    )

    setError("")
    setIsSaving(false)
  }, [
    isOpen,
    schedules
  ])

  if (!isOpen) {
    return null
  }

  function updateSchedule(
    index: number,
    updates:
      Partial<Omit<
        ScheduleDay,
        "day"
      >>
  ) {
    setEditedSchedules(
      currentSchedules =>
        currentSchedules.map(
          (
            schedule,
            scheduleIndex
          ) => {
            if (
              scheduleIndex !==
              index
            ) {
              return schedule
            }

            return {
              ...schedule,
              ...updates,
              day:
                days[
                  scheduleIndex
                ]
            }
          }
        )
    )

    setError("")
  }

  function validateSchedules():
    string {
    for (
      const schedule
      of editedSchedules
    ) {
      if (!schedule.isOpen) {
        continue
      }

      if (
        !schedule.startTime ||
        !schedule.endTime
      ) {
        return `Renseignez les horaires du ${schedule.day.toLowerCase()}.`
      }

      if (
        schedule.startTime >=
        schedule.endTime
      ) {
        return `L'heure de fermeture du ${schedule.day.toLowerCase()} doit être après l'heure d'ouverture.`
      }
    }

    return ""
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    const validationError =
      validateSchedules()

    if (validationError) {
      setError(
        validationError
      )
      return
    }

    try {
      setIsSaving(true)
      setError("")

      console.log(
        "editedSchedules :",
        editedSchedules
      )

      const serializedSchedules =
        serializeSchedules(
          editedSchedules
        )

      console.log(
        "serializedSchedules :",
        serializedSchedules
      )

      await onSave(
        serializedSchedules
      )

      onClose()
    } catch (saveError) {
      console.error(
        "Erreur modification horaires :",
        saveError
      )

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Impossible de modifier les horaires."
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="groomingModalOverlay"
      onMouseDown={event => {
        if (
          event.target ===
            event.currentTarget &&
          !isSaving
        ) {
          onClose()
        }
      }}
    >
      <div
        className="groomingSchedulesModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedulesModalTitle"
      >
        <div className="groomingModalHeader">
          <div>
            <h2
              id="schedulesModalTitle"
            >
              Modifier les horaires
            </h2>

            <p>
              Renseignez les horaires habituels de votre établissement.
            </p>
          </div>

          <button
            type="button"
            className="groomingModalCloseButton"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
        >
          <div className="groomingSchedulesList">
            {editedSchedules.map(
              (
                schedule,
                index
              ) => (
                <div
                  key={
                    days[index]
                  }
                  className="groomingScheduleRow"
                >
                  <div className="groomingScheduleDay">
                    <span>
                      {
                        days[
                          index
                        ]
                      }
                    </span>

                    <label className="groomingScheduleSwitch">
                      <input
                        type="checkbox"
                        checked={
                          schedule.isOpen
                        }
                        onChange={
                          event =>
                            updateSchedule(
                              index,
                              {
                                isOpen:
                                  event
                                    .target
                                    .checked
                              }
                            )
                        }
                        disabled={
                          isSaving
                        }
                      />

                      <span>
                        {schedule.isOpen
                          ? "Ouvert"
                          : "Fermé"}
                      </span>
                    </label>
                  </div>

                  {schedule.isOpen && (
                    <div className="groomingScheduleTimes">
                      <label>
                        <span>
                          Ouverture
                        </span>

                        <input
                          type="time"
                          value={
                            schedule.startTime
                          }
                          onChange={
                            event =>
                              updateSchedule(
                                index,
                                {
                                  startTime:
                                    event
                                      .target
                                      .value
                                }
                              )
                          }
                          disabled={
                            isSaving
                          }
                          required
                        />
                      </label>

                      <span className="groomingScheduleSeparator">
                        à
                      </span>

                      <label>
                        <span>
                          Fermeture
                        </span>

                        <input
                          type="time"
                          value={
                            schedule.endTime
                          }
                          onChange={
                            event =>
                              updateSchedule(
                                index,
                                {
                                  endTime:
                                    event
                                      .target
                                      .value
                                }
                              )
                          }
                          disabled={
                            isSaving
                          }
                          required
                        />
                      </label>
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          {error && (
            <p
              className="groomingModalError"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="groomingModalActions">
            <button
              type="button"
              className="groomingSecondaryButton"
              onClick={onClose}
              disabled={isSaving}
            >
              Annuler
            </button>

            <button
              type="submit"
              className="groomingPrimaryButton"
              disabled={isSaving}
            >
              {isSaving
                ? "Enregistrement..."
                : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

