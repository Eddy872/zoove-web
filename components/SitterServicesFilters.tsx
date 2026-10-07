"use client"

import "./SitterServicesFilters.css"

export type SitterService =
  | "garde"
  | "promenades"
  | "visites"
  | "hebergement"
  | "transport"

type Props = {
  selectedServices: SitterService[]
  onChange: (services: SitterService[]) => void
}

const services: {
  id: SitterService
  label: string
}[] = [
  {
    id: "garde",
    label: "Garde"
  },
  {
    id: "promenades",
    label: "Promenade"
  },
  {
    id: "visites",
    label: "Visite"
  },
  {
    id: "hebergement",
    label: "Hébergement"
  },
  {
    id: "transport",
    label: "Transport"
  }
]

export default function SitterServiceFilters({
  selectedServices,
  onChange
}: Props) {

  const toggleService = (
    service: SitterService
  ) => {

    if (selectedServices.includes(service)) {

      onChange(
        selectedServices.filter(
          item => item !== service
        )
      )

      return
    }

    onChange([
      ...selectedServices,
      service
    ])
  }

  return (
    <section className="sitterServiceFilters">

      <span className="sitterServiceFiltersTitle">
        Services
      </span>

      <div className="sitterServiceFiltersOptions">

        {services.map(service => (

          <label
            key={service.id}
            className="sitterServiceFilter"
          >

            <input
              type="checkbox"
              checked={
                selectedServices.includes(
                  service.id
                )
              }
              onChange={() =>
                toggleService(service.id)
              }
            />

            <span>
              {service.label}
            </span>

          </label>

        ))}

      </div>

    </section>
  )
}
