export type ProfessionalService = {
  id: string
  groomingID?: string
  name: string
  description: string
  price: number
  duration: number
  devise: string
}

type CreateServicesResponse = {
  success?: boolean
  services?: ProfessionalService[]
  error?: string
}

type UpdateServiceResponse = {
  success?: boolean
  service?: ProfessionalService
  error?: string
}

type DeleteServiceResponse = {
  success?: boolean
  error?: string
}

type UpdateServicesParams = {
  professionalID: string
  previousServices: ProfessionalService[]
  services: ProfessionalService[]
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
  response: Response,
  actionName: string
): Promise<T> {
  const responseText =
    await response.text()

  console.log(
    `Réponse ${actionName} :`,
    response.status,
    responseText
  )

  let data = {} as T & {
    success?: boolean
    error?: string
  }

  if (responseText.trim()) {
    try {
      data = JSON.parse(
        responseText
      ) as T & {
        success?: boolean
        error?: string
      }
    } catch {
      throw new Error(
        `Le serveur a renvoyé une réponse invalide (${response.status}) : ${responseText.slice(
          0,
          200
        )}`
      )
    }
  }

  if (
    !response.ok ||
    !data.success
  ) {
    throw new Error(
      data.error ||
        `${actionName} impossible (${response.status}).`
    )
  }

  return data
}

function serviceHasChanged(
  previousService:
    ProfessionalService,
  service:
    ProfessionalService
): boolean {
  return (
    previousService.name !==
      service.name ||
    previousService.description !==
      service.description ||
    Number(
      previousService.price
    ) !==
      Number(service.price) ||
    Number(
      previousService.duration
    ) !==
      Number(service.duration) ||
    previousService.devise !==
      service.devise
  )
}

export async function updateServices({
  professionalID,
  previousServices,
  services
}: UpdateServicesParams): Promise<
  ProfessionalService[]
> {
  const normalizedProfessionalID =
    professionalID?.trim()

  if (!normalizedProfessionalID) {
    throw new Error(
      "L'identifiant du professionnel est obligatoire."
    )
  }

  if (
    !Array.isArray(
      previousServices
    ) ||
    !Array.isArray(services)
  ) {
    throw new Error(
      "Les prestations sont invalides."
    )
  }

  const backendURL =
    getBackendURL()

  const previousByID =
    new Map<
      string,
      ProfessionalService
    >(
      previousServices
        .filter(service =>
          Boolean(
            service.id?.trim()
          )
        )
        .map(service => [
          service.id.trim(),
          service
        ])
    )

  const currentIDs =
    new Set(
      services
        .map(service =>
          service.id?.trim()
        )
        .filter(
          (
            serviceID
          ): serviceID is string =>
            Boolean(serviceID)
        )
    )

  const servicesToCreate =
    services.filter(service => {
      const serviceID =
        service.id?.trim()

      return (
        !serviceID ||
        !previousByID.has(
          serviceID
        )
      )
    })

  const servicesToUpdate =
    services.filter(service => {
      const serviceID =
        service.id?.trim()

      if (!serviceID) {
        return false
      }

      const previousService =
        previousByID.get(
          serviceID
        )

      if (!previousService) {
        return false
      }

      return serviceHasChanged(
        previousService,
        service
      )
    })

  const servicesToDelete =
    previousServices.filter(
      service => {
        const serviceID =
          service.id?.trim()

        return (
          Boolean(serviceID) &&
          !currentIDs.has(
            serviceID
          )
        )
      }
    )

  console.log(
    "Synchronisation services :",
    {
      previousServices,
      services,
      servicesToCreate,
      servicesToUpdate,
      servicesToDelete
    }
  )

  if (
    servicesToCreate.length === 0 &&
    servicesToUpdate.length === 0 &&
    servicesToDelete.length === 0
  ) {
    console.log(
      "Aucune prestation à synchroniser."
    )

    return previousServices
  }

  const createdServices:
    ProfessionalService[] = []

  const updatedServicesByID =
    new Map<
      string,
      ProfessionalService
    >()

  /*
   * Création des nouvelles prestations
   */

  if (
    servicesToCreate.length > 0
  ) {
    const response =
      await fetch(
        `${backendURL}/api/professionals/${encodeURIComponent(
          normalizedProfessionalID
        )}/services`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            services:
              servicesToCreate.map(
                service => ({
                  id:
                    service.id?.trim() ||
                    undefined,

                  name:
                    service.name,

                  description:
                    service.description,

                  price:
                    Number(
                      service.price
                    ),

                  duration:
                    Number(
                      service.duration
                    ),

                  devise:
                    service.devise
                })
              )
          })
        }
      )

    const data =
      await parseResponse<
        CreateServicesResponse
      >(
        response,
        "Création des prestations"
      )

    createdServices.push(
      ...(data.services ?? [])
    )
  }

  /*
   * Modification des prestations existantes
   */

  for (
    const service
    of servicesToUpdate
  ) {
    const serviceID =
      service.id.trim()

    const response =
      await fetch(
        `${backendURL}/api/professionals/services/${encodeURIComponent(
          serviceID
        )}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            professionalID:
              normalizedProfessionalID,

            updates: {
              name:
                service.name,

              description:
                service.description,

              price:
                Number(
                  service.price
                ),

              duration:
                Number(
                  service.duration
                ),

              devise:
                service.devise
            }
          })
        }
      )

    const data =
      await parseResponse<
        UpdateServiceResponse
      >(
        response,
        "Modification de la prestation"
      )

    if (data.service) {
      updatedServicesByID.set(
        serviceID,
        data.service
      )
    }
  }

  /*
   * Suppression des prestations retirées
   */

  for (
    const service
    of servicesToDelete
  ) {
    const serviceID =
      service.id.trim()

    const response =
      await fetch(
        `${backendURL}/api/professionals/services/${encodeURIComponent(
          serviceID
        )}`,
        {
          method: "DELETE",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            professionalID:
              normalizedProfessionalID
          })
        }
      )

    await parseResponse<
      DeleteServiceResponse
    >(
      response,
      "Suppression de la prestation"
    )
  }

  /*
   * Reconstruction du tableau final.
   *
   * Les services existants conservent
   * leur position.
   *
   * Les nouveaux services CloudKit
   * sont ajoutés à la fin avec leur
   * véritable identifiant.
   */

  const existingServices =
    services
      .filter(service => {
        const serviceID =
          service.id?.trim()

        return (
          Boolean(serviceID) &&
          previousByID.has(
            serviceID
          )
        )
      })
      .map(service => {
        const serviceID =
          service.id.trim()

        return (
          updatedServicesByID.get(
            serviceID
          ) ?? service
        )
      })

  return [
    ...existingServices,
    ...createdServices
  ]
}
