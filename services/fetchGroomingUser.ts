import { configureCloudKit } from "./cloudkit"
import type { GroomingUser } from "@/types/groomingUser"

function field<T>(
  record: any,
  name: string,
  fallback: T
): T {
  return record.fields?.[name]?.value ?? fallback
}

function assetsToUrls(fieldValue: any): string[] {
  const value = fieldValue?.value

  if (!value) {
    return []
  }

  if (!Array.isArray(value)) {
    const url =
      value.downloadURL ??
      value.value?.downloadURL ??
      ""

    return url ? [url] : []
  }

  return value
    .map((asset: any) => {
      return (
        asset?.downloadURL ??
        asset?.value?.downloadURL ??
        ""
      )
    })
    .filter((url: string) => Boolean(url))
}

export async function fetchGroomingByPseudo(
  pseudo: string
): Promise<GroomingUser | null> {
  const database = await configureCloudKit()

  const response = await database.performQuery({
    recordType: "GroomingUser",
    filterBy: [
      {
        fieldName: "pseudo",
        comparator: "EQUALS",
        fieldValue: {
          value: pseudo.trim()
        }
      }
    ]
  })

  if (response.hasErrors) {
    throw (
      response.errors?.[0] ??
      new Error("CloudKit GroomingUser query failed")
    )
  }

  const record = response.records?.[0]

  if (!record) {
    return null
  }

  return {
    id: record.recordName,

    name: field(record, "name", ""),
    pseudo: field(record, "pseudo", ""),
    password: field(record, "password", ""),

    adress: field(record, "adress", ""),
    city: field(record, "city", ""),
    country: field(record, "country", ""),
    phoneNumber: field(record, "phoneNumber", ""),

    infos: field(record, "infos", ""),
    language: field(record, "language", "fr"),

    photos: assetsToUrls(record.fields?.photos),

    collaborators: field<string[]>(
      record,
      "collaborators",
      []
    ),

    collaboratorsDispos: field<string[]>(
      record,
      "collaboratorsDispos",
      []
    ),

    schedules: field<string[]>(
      record,
      "schedules",
      []
    ),

    userIDs: field<string[]>(
      record,
      "userIDs",
      []
    ),
      
      services: [],

      feedbacks: [],

    blockedUserIDs: field<string[]>(
      record,
      "blockedUserIDs",
      []
    ),

    notifs: field<string[]>(
      record,
      "notifs",
      []
    ),

    blocked: field(record, "blocked", 0),
    package: field(record, "package", 0),
    share: field(record, "share", 0),
      autoRenew: field(record, "autoRenew", 0),

      stripeCustomerID: field(
        record,
        "stripeCustomerID",
        ""
      ),

      stripeSubscriptionID: field(
        record,
        "stripeSubscriptionID",
        ""
      ),
      
      stripeAccountID: field(
        record,
        "stripeAccountID",
        ""
      ),
      
    packageStart: field(record, "packageStart", ""),
    packageEnd: field(record, "packageEnd", ""),
    lastConnection: field(record, "lastConnection", ""),

    device: field(record, "device", ""),
    webtoken: field(record, "webtoken", "")
  }
}
