import { configureCloudKit } from "./cloudkit"

export type BookedAppointment = {
  id: string
  date: Date
  collaborator: string
  serviceID: string
  duration: number

  stripePaymentIntentID: string
  stripeTransferID: string
  paymentStatus: string
}

function field(
  record: any,
  name: string,
  fallback: any = ""
) {
  return record.fields?.[name]?.value ?? fallback
}

export async function fetchBookedAppointments(
  professionalID: string,
  collaborator: string
): Promise<BookedAppointment[]> {
  const database = await configureCloudKit()

  const appointments: BookedAppointment[] = []
  let continuationMarker: string | undefined

  do {
    const query: any = {
      recordType: "RDV",

      filterBy: [
        {
          fieldName: "groomingID",
          comparator: "EQUALS",
          fieldValue: {
            value: professionalID
          }
        }
      ],

      sortBy: [
        {
          fieldName: "date",
          ascending: true
        }
      ],

      resultsLimit: 200
    }

    if (continuationMarker) {
      query.continuationMarker =
        continuationMarker
    }

    const response =
      await database.performQuery(query)

    const records =
      response.records ?? []

    for (const record of records) {
      const appointmentCollaborator =
        field(
          record,
          "collaborator"
        )

      if (
        collaborator &&
        appointmentCollaborator !== collaborator
      ) {
        continue
      }

      const rawDate =
        field(
          record,
          "date",
          null
        )

      if (!rawDate) {
        continue
      }

      const date =
        new Date(rawDate)

      if (Number.isNaN(date.getTime())) {
        continue
      }

      appointments.push({
        id:
          record.recordName,

        date,

        collaborator:
          appointmentCollaborator,

        serviceID:
          field(
            record,
            "serviceID"
          ),

        duration:
          Number(
            field(
              record,
              "duration",
              0
            )
          ),

        stripePaymentIntentID:
          field(
            record,
            "stripePaymentIntentID",
            ""
          ),

        stripeTransferID:
          field(
            record,
            "stripeTransferID",
            ""
          ),

        paymentStatus:
          field(
            record,
            "paymentStatus",
            "pending"
          )
      })
    }

    continuationMarker =
      response.moreComing &&
      response.continuationMarker
        ? response.continuationMarker
        : undefined

  } while (continuationMarker)

  return appointments
}
