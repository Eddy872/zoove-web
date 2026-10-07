"use client"

import "./GroomingServicesFilters.css"

export type GroomingService =
  | "coupe"
  | "tonte"
  | "bain"
  | "brossage"
  | "debourrage"
  | "griffes"

type Props = {
  selectedServices: GroomingService[]
  onChange: (services: GroomingService[]) => void
}

const services: {
  id: GroomingService
  label: string
}[] = [
  {
    id: "coupe",
    label: "Coupe"
  },
  {
    id: "tonte",
    label: "Tonte"
  },
  {
    id: "bain",
    label: "Bain"
  },
  {
    id: "brossage",
    label: "Brossage / Démêlage"
  },
  {
    id: "debourrage",
    label: "Débourrage"
  },
  {
    id: "griffes",
    label: "Griffes"
  }
]

export default function GroomingServiceFilters({
  selectedServices,
  onChange
}: Props) {

  const toggleService = (
    service: GroomingService
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
    <section className="groomingServiceFilters">

      <span className="groomingServiceFiltersTitle">
        Services
      </span>

      <div className="groomingServiceFiltersOptions">

        {services.map(service => (

          <label
            key={service.id}
            className="groomingServiceFilter"
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
