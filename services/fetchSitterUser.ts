import { configureCloudKit } from "./cloudkit"
import type { SitterUser } from "@/types/sitterUser"

function field<T>(
  record: any,
  name: string,
  fallback: T
): T {
  return record.fields?.[name]?.value ?? fallback
}

function assetToUrl(fieldValue: any): string {
  const value = fieldValue?.value

  if (!value) {
    return "/images/demo2.jpg"
  }

  return (
    value.downloadURL ??
    value.value?.downloadURL ??
    "/images/demo2.jpg"
  )
}

export async function fetchSitterByPseudo(
  pseudo: string
): Promise<SitterUser | null> {
  const database = await configureCloudKit()

  const response = await database.performQuery({
    recordType: "SitterUser",
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
      new Error("CloudKit SitterUser query failed")
    )
  }

  const record = response.records?.[0]

  if (!record) {
    return null
  }

  return {
    id: record.recordName,

    pseudo: field(record, "pseudo", ""),
    password: field(record, "password", ""),

    city: field(record, "city", ""),
    country: field(record, "country", ""),

    infos: field(record, "infos", ""),
    language: field(record, "language", "fr"),

    photo: assetToUrl(record.fields?.photo),

    phoneNumber: field(record, "phoneNumber", ""),
    paypalID: field(record, "paypalID", ""),

    tarif: field(record, "tarif", 0),
    devise: field(record, "devise", "EUR"),

    skill: field(record, "skill", 0),
    fiability: field(record, "fiability", 0),
    engagement: field(record, "engagement", 0),
    affinity: field(record, "affinity", 0),

    services: field<string[]>(
      record,
      "services",
      []
    ),

    disponibilities: field<string[]>(
      record,
      "disponibilities",
      []
    ),

    speciesAccepted: field<string[]>(
      record,
      "speciesAccepted",
      []
    ),

    buyers: field<string[]>(
      record,
      "buyers",
      []
    ),

    blockedUserIds: field<string[]>(
      record,
      "blockedUserIds",
      []
    ),

    notifs: field<string[]>(
      record,
      "notifs",
      []
    ),

    notifMatchId: field<string[]>(
      record,
      "notifMatchId",
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

    token: field(record, "token", ""),
    webtoken: field(record, "webtoken", "")
  }
}
