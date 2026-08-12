import { configureCloudKit } from "./cloudkit"

export type AnimalAccount = {
  id: string
  name: string
  city: string
  country: string
  bio: string
  species: string
  photo: string
  language: string
  phoneNumber?: string
}

function field(
  record: any,
  name: string,
  fallback: any = ""
) {
  return record.fields?.[name]?.value ?? fallback
}

function assetToUrl(fieldValue: any): string {
  const value = fieldValue?.value

  if (!value) {
    return ""
  }

  if (typeof value === "string") {
    return value
  }

  return (
    value.downloadURL ??
    value.value?.downloadURL ??
    ""
  )
}

function recordToAnimal(
  record: any
): AnimalAccount {
  return {
    id: record.recordName,
    name: field(record, "name"),
    city: field(record, "city"),
    country: field(record, "country"),
    bio: field(record, "bio"),
    species: field(record, "species"),
    photo: assetToUrl(
      record.fields?.photo
    ),
    language: field(
      record,
      "language",
      "fr"
    ),
    phoneNumber: field(
      record,
      "phoneNumber"
    )
  }
}

export async function fetchAnimalAccount(
  animalID: string
): Promise<AnimalAccount | null> {
  if (!animalID) {
    return null
  }

  const database =
    await configureCloudKit()

  const response =
    await database.fetchRecords([
      animalID
    ])

  const record =
    response.records?.find(
      (item: any) =>
        item.recordName ===
          animalID &&
        !item.serverErrorCode
    )

  if (!record) {
    return null
  }

  return recordToAnimal(record)
}

export async function searchAnimalsByName(
  search: string
): Promise<AnimalAccount[]> {
  const query =
    search.trim()

  if (query.length < 2) {
    return []
  }

  const database =
    await configureCloudKit()

  const response =
    await database.performQuery({
      recordType: "Animals"
    })

  return (
    response.records ?? []
  )
    .filter(
      (record: any) =>
        !record.serverErrorCode
    )
    .map(recordToAnimal)
    .filter(
      (animal: AnimalAccount) =>
        animal.name
          .toLocaleLowerCase("fr-FR")
          .includes(
            query.toLocaleLowerCase(
              "fr-FR"
            )
          )
    )
    .slice(0, 8)
}
