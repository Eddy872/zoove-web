import { configureCloudKit } from "./cloudkit"
import type { SitterUser } from "@/types/sitterUser"

function field<T>(
  record: any,
  name: string,
  fallback: T
): T {
  return record.fields?.[name]?.value ?? fallback
}

async function checkPackageExpiration(
  database: any,
  record: any
) {
  const currentPackage = Number(
    field(record, "package", 0)
  )

  const autoRenew = Number(
    field(record, "autoRenew", 0)
  )

  const packageEnd = field<string>(
    record,
    "packageEnd",
    ""
  )

  if (
    currentPackage === 0 ||
    autoRenew !== 0 ||
    !packageEnd
  ) {
    return record
  }

  const expirationDate = new Date(packageEnd).getTime()

  if (
    !Number.isFinite(expirationDate) ||
    expirationDate > Date.now()
  ) {
    return record
  }

  console.log(
    "Abonnement Sitter expiré :",
    record.recordName
  )

  const updatedRecord = {
    recordType: record.recordType,
    recordName: record.recordName,
    recordChangeTag: record.recordChangeTag,

    fields: {
      package: {
        value: 0
      }
    }
  }

  const response = await database.saveRecords(
    updatedRecord
  )

  if (response.hasErrors) {
    throw (
      response.errors?.[0] ??
      new Error("Impossible de réinitialiser le package Sitter")
    )
  }

  record.fields.package = { value: 0 }

  return record
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

    let record = response.records?.[0]

    if (!record) {
      return null
    }

    record = await checkPackageExpiration(
      database,
      record
    )

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
      autoRenew: field(record, "autoRenew", 0),
    share: field(record, "share", 0),

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
