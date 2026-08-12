"use client"

import {
  useEffect,
  useState
} from "react"

import "./sitter-profile.css"

import {
  useLanguage
} from "@/context/LanguageContext"

import {
  translate
} from "@/translations/translations"

type DayAvailability = {
  day: string
  enabled: boolean
  start: string
  end: string
}

type Props = {
  availability?: unknown[]
  onBack: () => void
  onSave: (
    availability: DayAvailability[]
  ) => void
}

const days = [
  {
    key: "lundi",
    label: "Lundi"
  },
  {
    key: "mardi",
    label: "Mardi"
  },
  {
    key: "mercredi",
    label: "Mercredi"
  },
  {
    key: "jeudi",
    label: "Jeudi"
  },
  {
    key: "vendredi",
    label: "Vendredi"
  },
  {
    key: "samedi",
    label: "Samedi"
  },
  {
    key: "dimanche",
    label: "Dimanche"
  }
]

function normalizeDay(
  value: string
): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
}

function extractAvailabilityString(
  item: unknown
): string {
  if (
    typeof item === "string"
  ) {
    return item
  }

  if (
    typeof item === "object" &&
    item !== null &&
    "value" in item
  ) {
    const value = (
      item as {
        value?: unknown
      }
    ).value

    if (
      typeof value === "string"
    ) {
      return value
    }
  }

  return ""
}

function parseAvailability(
  availability?: unknown[]
): DayAvailability[] {
  const normalizedAvailability =
    Array.isArray(availability)
      ? availability
          .map(
            extractAvailabilityString
          )
          .filter(Boolean)
      : []

  return days.map(
    ({ key }) => {
      const storedValue =
        normalizedAvailability.find(
          item => {
            const [
              storedDay = ""
            ] =
              item.split("=")

            return (
              normalizeDay(
                storedDay
              ) === key
            )
          }
        )

      if (!storedValue) {
        return {
          day: key,
          enabled: false,
          start: "09:00",
          end: "18:00"
        }
      }

      const separatorIndex =
        storedValue.indexOf("=")

      const hoursValue =
        separatorIndex >= 0
          ? storedValue
              .slice(
                separatorIndex + 1
              )
              .trim()
          : ""

      const normalizedHours =
        normalizeDay(
          hoursValue
        )

      const isClosed =
        normalizedHours === "" ||
        normalizedHours ===
          "ferme" ||
        normalizedHours ===
          "closed"

      if (isClosed) {
        return {
          day: key,
          enabled: false,
          start: "09:00",
          end: "18:00"
        }
      }

      const [
        start = "09:00",
        end = "18:00"
      ] =
        hoursValue
          .split("-")
          .map(
            value =>
              value.trim()
          )

      return {
        day: key,
        enabled: true,
        start,
        end
      }
    }
  )
}

export default function EditAvailabilityModal({
  availability,
  onBack,
  onSave
}: Props) {
  const {
    language
  } = useLanguage()

  const [
    hours,
    setHours
  ] =
    useState<
      DayAvailability[]
    >(
      parseAvailability(
        availability
      )
    )

  useEffect(() => {
    setHours(
      parseAvailability(
        availability
      )
    )
  }, [
    availability
  ])

  function updateDay(
    index: number,
    field: keyof DayAvailability,
    value: string | boolean
  ) {
    setHours(
      current =>
        current.map(
          (
            day,
            currentIndex
          ) =>
            currentIndex ===
            index
              ? {
                  ...day,
                  [field]:
                    value
                }
              : day
        )
    )
  }

  return (
    <div className="sitterEditContainer">
      <div className="sitterEditHeader">
        <button
          type="button"
          className="sitterBackButton"
          onClick={onBack}
        >
          {translate(
            language,
            "Annuler"
          )}
        </button>

        <h1 className="sitterEditTitle">
          {translate(
            language,
            "Horaires"
          )}
        </h1>

        <div className="sitterHeaderSpacer" />
      </div>

      <div className="sitterEditCard">
        <div className="sitterHoursList">
          {hours.map(
            (
              day,
              index
            ) => (
              <div
                key={day.day}
                className="sitterHourRow"
              >
                <strong className="sitterDayLabel">
                  {translate(
                    language,
                    day.day
                  )}
                </strong>

                <input
                  type="time"
                  className="sitterTimeInput"
                  value={
                    day.start
                  }
                  disabled={
                    !day.enabled
                  }
                  onChange={
                    event =>
                      updateDay(
                        index,
                        "start",
                        event
                          .target
                          .value
                      )
                  }
                />

                <input
                  type="time"
                  className="sitterTimeInput"
                  value={
                    day.end
                  }
                  disabled={
                    !day.enabled
                  }
                  onChange={
                    event =>
                      updateDay(
                        index,
                        "end",
                        event
                          .target
                          .value
                      )
                  }
                />

                <label className="sitterOpenLabel">
                  <input
                    type="checkbox"
                    className="sitterEditCheckbox"
                    checked={
                      day.enabled
                    }
                    onChange={
                      event =>
                        updateDay(
                          index,
                          "enabled",
                          event
                            .target
                            .checked
                        )
                    }
                  />

                  {translate(
                    language,
                    day.enabled
                      ? "Ouvert"
                      : "Fermé"
                  )}
                </label>
              </div>
            )
          )}
        </div>

        <button
          type="button"
          className="sitterSaveButton"
          onClick={() =>
            onSave(hours)
          }
        >
          {translate(
            language,
            "Enregistrer"
          )}
        </button>
      </div>
    </div>
  )
}
