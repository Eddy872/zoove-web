import { configureCloudKit } from "./cloudkit"
import type { Animal } from "@/types/animal"

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

  // Aucun abonnement ou renouvellement automatique activé
  if (currentPackage === 0 || autoRenew !== 0 || !packageEnd) {
    return record
  }

  const expirationDate = new Date(packageEnd).getTime()

  // Date invalide ou abonnement encore actif
  if (
    !Number.isFinite(expirationDate) ||
    expirationDate > Date.now()
  ) {
    return record
  }

  // Abonnement expiré sans renouvellement automatique
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

  const response = await database.saveRecords(updatedRecord)

  if (response.hasErrors) {
    throw (
      response.errors?.[0] ??
      new Error("Impossible de réinitialiser le package")
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

export async function fetchClientByPseudo(
  pseudo: string
): Promise<Animal | null> {
  const database = await configureCloudKit()

  const response = await database.performQuery({
    recordType: "Animals",
    filterBy: [
      {
        fieldName: "name",
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
      new Error("CloudKit Animals query failed")
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

    name: field(record, "name", ""),
    password: field(record, "password", ""),

    bio: field(record, "bio", ""),
    city: field(record, "city", ""),
    country: field(record, "country", ""),
    language: field(record, "language", "fr"),
    species: field(record, "species", ""),

    photo: assetToUrl(record.fields?.photo),

    paypalID: field(record, "paypalID", ""),

    badges: field<string[]>(record, "badges", []),
    selectedBadge: field(record, "selectedBadge", ""),

    items: field<string[]>(record, "items", []),
    skins: field<string[]>(record, "skins", []),
    selectedSkin: field(record, "selectedSkin", ""),

    likes: field<string[]>(record, "likes", []),
    dislikes: field<string[]>(record, "dislikes", []),

    dailyQuests: field<string[]>(
      record,
      "dailyQuests",
      []
    ),

    weeklyQuests: field<string[]>(
      record,
      "weeklyQuests",
      []
    ),

    rewards: field<number[]>(
      record,
      "rewards",
      []
    ),

    speciesAccepted: field<string[]>(
      record,
      "speciesAccepted",
      []
    ),

    notifMatchId: field<string[]>(
      record,
      "notifMatchId",
      []
    ),

    package: field(record, "package", 0),
    share: field(record, "share", 0),
    shareOnTiktok: field(
      record,
      "shareOnTiktok",
      0
    ),

    pawpoints: field(record, "pawpoints", 0),
    requestsPerDay: field(
      record,
      "requestsPerDay",
      0
    ),
    swipeCount: field(record, "swipeCount", 0),

    packageStart: field(record, "packageStart", ""),
      autoRenew: field<number>(record, "autoRenew", 0),
    packageEnd: field(record, "packageEnd", ""),
    lastConnection: field(
      record,
      "lastConnection",
      ""
    ),

    token: field(record, "token", ""),
    webtoken: field(record, "webtoken", "")
  }
}

export async function fetchClientById(
  id: string
): Promise<Animal | null> {
  const database = await configureCloudKit()

    const recordName = id.trim()

      if (!recordName) {
        return null
      }

      const response = await database.fetchRecords(
        recordName
      )

  if (response.hasErrors) {
    throw (
      response.errors?.[0] ??
      new Error("CloudKit Animals query failed")
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

    name: field(record, "name", ""),
    password: field(record, "password", ""),

    bio: field(record, "bio", ""),
    city: field(record, "city", ""),
    country: field(record, "country", ""),
    language: field(record, "language", "fr"),
    species: field(record, "species", ""),

    photo: assetToUrl(record.fields?.photo),

    paypalID: field(record, "paypalID", ""),

    badges: field<string[]>(record, "badges", []),
    selectedBadge: field(record, "selectedBadge", ""),

    items: field<string[]>(record, "items", []),
    skins: field<string[]>(record, "skins", []),
    selectedSkin: field(record, "selectedSkin", ""),

    likes: field<string[]>(record, "likes", []),
    dislikes: field<string[]>(record, "dislikes", []),

    dailyQuests: field<string[]>(
      record,
      "dailyQuests",
      []
    ),

    weeklyQuests: field<string[]>(
      record,
      "weeklyQuests",
      []
    ),

    rewards: field<number[]>(
      record,
      "rewards",
      []
    ),

    speciesAccepted: field<string[]>(
      record,
      "speciesAccepted",
      []
    ),

    notifMatchId: field<string[]>(
      record,
      "notifMatchId",
      []
    ),

    package: field(record, "package", 0),
      autoRenew: field<number>(record, "autoRenew", 0),
    share: field(record, "share", 0),
    shareOnTiktok: field(
      record,
      "shareOnTiktok",
      0
    ),

    pawpoints: field(record, "pawpoints", 0),
    requestsPerDay: field(
      record,
      "requestsPerDay",
      0
    ),
    swipeCount: field(record, "swipeCount", 0),

    packageStart: field(record, "packageStart", ""),
    packageEnd: field(record, "packageEnd", ""),
    lastConnection: field(
      record,
      "lastConnection",
      ""
    ),

    token: field(record, "token", ""),
    webtoken: field(record, "webtoken", "")
  }
}
