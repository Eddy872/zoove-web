import { configureCloudKit } from "./cloudkit"

export type Appointment = {
  id: string
  groomingID: string
  userID: string
  date: Date
  serviceID: string
  collaborator: string
  phoneNumber: string
  authorizationID: string

  stripePaymentIntentID: string
  stripeTransferID: string
  paymentStatus: string

  serviceName: string
  duration: number
}


function getSitterServiceName(serviceID: string) {
  if (serviceID.startsWith("Sitting-")) {
    return "Garde"
  }

  return serviceID
}

function getSitterDuration(serviceID: string) {
  if (!serviceID.startsWith("Sitting-")) {
    return 0
  }

  const [, duration] = serviceID.split("-")

  return Number(duration) * 60
}

function getSitterPrice(serviceID: string) {
  if (!serviceID.startsWith("Sitting-")) {
    return 0
  }

  const [, , price] = serviceID.split("-")

  return Number(price)
}

function field(
  record: any,
  name: string,
  fallback: any = ""
) {
  return record.fields?.[name]?.value ?? fallback
}

function mapAppointment(record: any): Appointment {
  const rawDate = field(record, "date", null)

  return {
    id: record.recordName,
    groomingID: field(record, "groomingID"),
    userID: field(record, "userID"),
    date: new Date(rawDate),
    serviceID: field(record, "serviceID"),
    collaborator: field(record, "collaborator"),
    phoneNumber: field(record, "phoneNumber"),
    authorizationID: field(
      record,
      "authorizationID"
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
    ),
  serviceName:
    getSitterServiceName(
      field(record, "serviceID")
    ),

  duration:
    Number(
      field(
        record,
        "duration",
        0
      )
    )
  }
}

export async function fetchUserAppointments(
  userID: string
): Promise<Appointment[]> {
  const database = await configureCloudKit()

  const appointments: Appointment[] = []
  let continuationMarker: string | undefined

  do {
    const query: any = {
      recordType: "RDV",

      filterBy: [
        {
          fieldName: "userID",
          comparator: "EQUALS",
          fieldValue: {
            value: userID
          }
        }
      ],

      sortBy: [
        {
          fieldName: "date",
          ascending: true
        }
      ],

      resultsLimit: 100
    }

    if (continuationMarker) {
      query.continuationMarker =
        continuationMarker
    }

    const response =
      await database.performQuery(query)

    const records = response.records ?? []

    appointments.push(
      ...records
        .map(mapAppointment)
        .filter(
          (appointment: Appointment) =>
            !Number.isNaN(
              appointment.date.getTime()
            )
        )
    )

    continuationMarker =
      response.moreComing &&
      response.continuationMarker
        ? response.continuationMarker
        : undefined
  } while (continuationMarker)

  return appointments
}

export async function fetchProAppointments(
  professionalID: string
): Promise<Appointment[]> {
  const database = await configureCloudKit()

  const appointments: Appointment[] = []
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

      resultsLimit: 100
    }

    if (continuationMarker) {
      query.continuationMarker =
        continuationMarker
    }

    const response =
      await database.performQuery(query)

    const records = response.records ?? []

    appointments.push(
      ...records
        .map(mapAppointment)
        .filter(
          (appointment: Appointment) =>
            !Number.isNaN(
              appointment.date.getTime()
            )
        )
    )

    continuationMarker =
      response.moreComing &&
      response.continuationMarker
        ? response.continuationMarker
        : undefined
  } while (continuationMarker)

  return appointments
}

export async function fetchAppointmentById(
  appointmentID: string
): Promise<Appointment | null> {
  const database = await configureCloudKit()

  const response =
    await database.fetchRecords([
      appointmentID
    ])

  const record = response.records?.find(
    (item: any) =>
      item.recordName === appointmentID &&
      !item.serverErrorCode
  )

  if (!record) {
    return null
  }

  const appointment = mapAppointment(record)

  if (
    Number.isNaN(
      appointment.date.getTime()
    )
  ) {
    return null
  }

  return appointment
}

export async function updateAppointment(
  appointment: Appointment
): Promise<Appointment> {
  const database = await configureCloudKit()

  const existingResponse =
    await database.fetchRecords([
      appointment.id
    ])

  const existingRecord =
    existingResponse.records?.find(
      (item: any) =>
        item.recordName === appointment.id &&
        !item.serverErrorCode
    )

  if (!existingRecord) {
    throw new Error(
      "Rendez-vous introuvable"
    )
  }

  const updatedRecord = {
    ...existingRecord,

    fields: {
      ...existingRecord.fields,

      date: {
        value: appointment.date.getTime(),
        type: "TIMESTAMP"
      },

      collaborator: {
        value: appointment.collaborator,
        type: "STRING"
      },

      phoneNumber: {
        value: appointment.phoneNumber,
        type: "STRING"
      },

      duration: {
        value: appointment.duration,
        type: "INT64"
      }
    }
  }

  const response =
    await database.saveRecords([
      updatedRecord
    ])

  const savedRecord =
    response.records?.find(
      (item: any) =>
        !item.serverErrorCode
    )

  if (!savedRecord) {
    throw new Error(
      "Impossible de modifier le rendez-vous"
    )
  }

  return mapAppointment(savedRecord)
}

export async function cancelAppointment(
  appointmentID: string
): Promise<void> {
  const apiURL =
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3001"

  const url =
    `${apiURL}/api/rdv/${encodeURIComponent(
      appointmentID
    )}`

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json"
    }
  })

  const rawResponse = await response.text()

  let result: any = null

  try {
    result = rawResponse
      ? JSON.parse(rawResponse)
      : null
  } catch {
    result = null
  }

  if (!response.ok) {
    throw new Error(
      result?.error ??
      rawResponse ??
      `Erreur HTTP ${response.status}`
    )
  }
}

export async function fetchProfessionalAppointments(
  groomingID: string
): Promise<Appointment[]> {
  const database = await configureCloudKit()

  const appointments: Appointment[] = []
  let continuationMarker: string | undefined

  do {
    const query: any = {
      recordType: "RDV",

      filterBy: [
        {
          fieldName: "groomingID",
          comparator: "EQUALS",
          fieldValue: {
            value: groomingID
          }
        }
      ],

      sortBy: [
        {
          fieldName: "date",
          ascending: true
        }
      ],

      resultsLimit: 100
    }

    if (continuationMarker) {
      query.continuationMarker =
        continuationMarker
    }

    const response =
      await database.performQuery(query)

    const records = response.records ?? []

      appointments.push(
        ...records
          .map(mapAppointment)
          .filter(
            (appointment: Appointment) =>
              !Number.isNaN(
                appointment.date.getTime()
              )
          )
      )

    continuationMarker =
      response.moreComing &&
      response.continuationMarker
        ? response.continuationMarker
        : undefined
  } while (continuationMarker)

  return appointments
}

export type AppointmentPaymentUpdate = {
  stripePaymentIntentID?: string
  stripeTransferID?: string
  paymentStatus?: string
}

export async function updateAppointmentPayment(
  appointmentID: string,
  data: AppointmentPaymentUpdate
) {
  const apiURL =
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3001"

  const response =
    await fetch(
      `${apiURL}/api/rdv/${encodeURIComponent(
        appointmentID
      )}/payment`,
      {
        method:
          "PATCH",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(data)
      }
    )

  const rawResponse =
    await response.text()

  let result: any = null

  try {
    result =
      rawResponse
        ? JSON.parse(rawResponse)
        : null
  } catch {
    result = null
  }

  if (!response.ok) {
    throw new Error(
      result?.error ??
      rawResponse ??
      `Erreur HTTP ${response.status}`
    )
  }

  return result
}
