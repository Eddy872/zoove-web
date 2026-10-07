import { configureCloudKit } from "./cloudkit"


export type PreviousAnimalInformations = {
  behavior: string
  coatCondition: string
  weight: number | null
  notes: string
  phoneNumber: string
}


export async function fetchLatestAnimalRDV(
  professionalID: string,
  animalID: string
): Promise<PreviousAnimalInformations | null> {
  if (!professionalID || !animalID) {
    return null
  }


  const database =
    await configureCloudKit()


  const response =
    await database.performQuery({
      recordType: "RDV",

      filterBy: [
        {
          fieldName: "groomingID",
          comparator: "EQUALS",
          fieldValue: {
            value: professionalID
          }
        },

        {
          fieldName: "userID",
          comparator: "EQUALS",
          fieldValue: {
            value: animalID
          }
        }
      ],

      sortBy: [
        {
          fieldName: "date",
          ascending: false
        }
      ],

      resultsLimit: 1
    })


  if (response.hasErrors) {
    console.error(
      "Erreur récupération ancien RDV :",
      response.errors
    )

    return null
  }


  const records =
    response.records ??
    response._results ??
    response._httpResponse
      ?.body?.records ??
    []


  const record =
    records[0]


  if (!record) {
    return null
  }


  const phoneNumber =
    typeof record.fields
      ?.phoneNumber
      ?.value === "string"
      ? record.fields
          .phoneNumber
          .value
      : ""


  const rawInfos =
    record.fields?.infos?.value


  /*
   * Un ancien RDV peut ne pas avoir
   * d'infos JSON, mais son numéro de
   * téléphone reste tout de même utile.
   */
  if (
    !rawInfos ||
    typeof rawInfos !== "string"
  ) {
    return {
      behavior: "",
      coatCondition: "",
      weight: null,
      notes: "",
      phoneNumber
    }
  }


  try {
    const infos =
      JSON.parse(rawInfos)


    return {
      behavior:
        typeof infos.behavior ===
        "string"
          ? infos.behavior
          : "",

      coatCondition:
        typeof infos.coatCondition ===
        "string"
          ? infos.coatCondition
          : "",

      weight:
        typeof infos.weight ===
        "number"
          ? infos.weight
          : null,

      notes:
        typeof infos.notes ===
        "string"
          ? infos.notes
          : "",

      phoneNumber
    }

  } catch (error) {
    console.error(
      "Impossible de lire RDV.infos :",
      error
    )

    /*
     * Même si les anciennes infos sont
     * illisibles, on conserve le numéro
     * récupéré directement depuis RDV.
     */
    return {
      behavior: "",
      coatCondition: "",
      weight: null,
      notes: "",
      phoneNumber
    }
  }
}
