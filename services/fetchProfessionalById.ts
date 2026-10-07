import { configureCloudKit } from "./cloudkit"

function field(
  record: any,
  name: string,
  fallback: any = ""
) {
  return record.fields?.[name]?.value ?? fallback
}

function assetsToUrls(fieldValue: any): string[] {
  const value = fieldValue?.value

  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value
      .map(
        (asset) =>
          asset?.downloadURL ??
          asset?.value?.downloadURL ??
          ""
      )
      .filter(Boolean)
  }

  return [
    value?.downloadURL ??
      fieldValue?.value?.downloadURL ??
      ""
  ].filter(Boolean)
}

async function fetchAnimalsForFeedbacks(
  database: any,
  feedbacks: any[]
) {
  const animalIDs = [
    ...new Set(
      feedbacks
        .map((feedback) =>
          String(feedback.userID ?? "")
        )
        .filter(Boolean)
    )
  ]

  if (animalIDs.length === 0) {
    return new Map()
  }

  const response =
    await database.fetchRecords(
      animalIDs
    )

  const records =
    response.records ?? []

  const animalsMap =
    new Map<string, any>()

  records.forEach((record: any) => {
    if (
      !record ||
      record.serverErrorCode
    ) {
      return
    }

    const photos =
      assetsToUrls(
        record.fields?.photo
      )

    animalsMap.set(
      record.recordName,
      {
        id: record.recordName,

        name:
          field(
            record,
            "pseudo",
            ""
          ) ||
          field(
            record,
            "name",
            "Animal Zoove"
          ),

        photo:
          photos[0] ??
          "/images/demo2.jpg"
      }
    )
  })

  return animalsMap
}

async function fetchServices(
  database: any,
  professionalID: string
) {
  const response = await database.performQuery({
    recordType: "Service",
    filterBy: [
      {
        fieldName: "groomingID",
        comparator: "EQUALS",
        fieldValue: {
          value: professionalID
        }
      }
    ]
  })

  return (response.records ?? []).map(
    (record: any) => ({
      id: record.recordName,

      groomingID: field(
        record,
        "groomingID"
      ),

      name: field(
        record,
        "name"
      ),

      description: field(
        record,
        "description"
      ),

      price: Number(
        field(
          record,
          "price",
          0
        )
      ),

      duration: Number(
        field(
          record,
          "duration",
          30
        )
      ),

      devise: field(
        record,
        "devise",
        "€"
      ),

      // NOUVEAUX ATTRIBUTS

      bookingMode: field(
        record,
        "bookingMode",
        "direct"
      ),

      requiredInformations: field(
        record,
        "requiredInformations",
        []
      ),

      customQuestions: field(
        record,
        "customQuestions",
        []
      )
    })
  )
}

export async function fetchFeedbacks(
  database: any,
  professionalID: string
) {
  const response = await database.performQuery({
    recordType: "FeedBack",
    filterBy: [
      {
        fieldName: "groomingID",
        comparator: "EQUALS",
        fieldValue: {
          value: professionalID
        }
      }
    ]
  })

  return (response.records ?? []).map(
    (record: any) => ({
      id: record.recordName,
      cleanRate: Number(
        field(record, "cleanRate", 0)
      ),
      frameRate: Number(
        field(record, "frameRate", 0)
      ),
      homeRate: Number(
        field(record, "homeRate", 0)
      ),
      qualityRate: Number(
        field(record, "qualityRate", 0)
      ),
      comment: field(record, "comment"),
      date: field(record, "date"),
      groomingID: field(record, "groomingID"),
      userID: field(record, "userID")
    })
  )
}

function calculateFeedbackRating(feedbacks: any[]) {
  if (feedbacks.length === 0) {
    return 0
  }

  const total = feedbacks.reduce(
    (sum: number, feedback: any) => {
      const rating =
        (
          feedback.cleanRate +
          feedback.frameRate +
          feedback.homeRate +
          feedback.qualityRate
        ) / 4

      return sum + rating
    },
    0
  )

  return total / feedbacks.length
}

async function mapStructureProfessional(
  database: any,
  record: any,
  type: "Grooming" | "Healthcare"
) {
  const id = record.recordName
  const photos = assetsToUrls(record.fields?.photos)

    const [
      services,
      rawFeedbacks
    ] = await Promise.all([
      fetchServices(database, id),
      fetchFeedbacks(database, id)
    ])

    const animalsMap =
      await fetchAnimalsForFeedbacks(
        database,
        rawFeedbacks
      )

    const feedbacks =
      rawFeedbacks.map(
        (feedback: any) => {
          const animal =
            animalsMap.get(
              feedback.userID
            )

          return {
            ...feedback,

            animalName:
              animal?.name ??
              "Animal Zoove",

            animalPhoto:
              animal?.photo ??
              "/images/demo2.jpg"
          }
        }
      )

  const expertise =
    type === "Healthcare"
      ? field(record, "expertise", [])
      : []

  return {
    id,
    type,
      package: Number(
          field(record, "package", 0)
        ),

        packageStart: field(
          record,
          "packageStart",
          ""
        ),

        packageEnd: field(
          record,
          "packageEnd",
          ""
        ),
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
      autoRenew: Number(field(record, "autoRenew", 0)),
    name: field(record, "name"),
    city: field(record, "city"),
    country: field(record, "country"),
    adress: field(record, "adress"),
    phoneNumber: field(record, "phoneNumber"),

    collaborators: field(
      record,
      "collaborators",
      []
    ),

    collaboratorsDispos: field(
      record,
      "collaboratorsDispos",
      []
    ),

    schedules: field(record, "schedules", []),
    informations: field(record, "informations"),

    userIDs: field(record, "userIDs", []),
    blockedUserIDs: field(
      record,
      "blockedUserIDs",
      []
    ),

      device: field(
        record,
        "device",
        ""
      ),

      webtoken: field(
        record,
        "webtoken",
        ""
      ),

      language: field(
        record,
        "language",
        "fr"
      ),

      badge: field(
        record,
        "badge"
      ),

    image: photos[0] ?? "/images/demo2.jpg",

    photos:
      photos.length > 0
        ? photos
        : ["/images/demo2.jpg"],

    expertise,

    speciality:
      type === "Healthcare"
        ? expertise[0] ?? "Vétérinaire"
        : "Toiletteur",

    services,
    feedbacks,

    rating: calculateFeedbackRating(feedbacks),

    description: field(record, "informations")
  }
}

function mapSitterProfessional(record: any) {
  const photos = assetsToUrls(record.fields?.photo)

  const skill = Number(field(record, "skill", 0))
  const fiability = Number(
    field(record, "fiability", 0)
  )
  const engagement = Number(
    field(record, "engagement", 0)
  )
  const affinity = Number(
    field(record, "affinity", 0)
  )

  const rating =
    (skill + fiability + engagement + affinity) /
    4

  return {
    id: record.recordName,
    type: "Sitter",
      package: Number(
          field(record, "package", 0)
        ),

        packageStart: field(
          record,
          "packageStart",
          ""
        ),

        packageEnd: field(
          record,
          "packageEnd",
          ""
        ),
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
      stripeConnectedAccountID: field(
        record,
        "stripeConnectedAccountID",
        ""
      ),
      autoRenew: Number(field(record, "autoRenew", 0)),
    name: field(record, "pseudo"),
    city: field(record, "city"),
    country: field(record, "country"),
    phoneNumber: field(record, "phoneNumber"),

    image: photos[0] ?? "/images/demo1.jpg",

    photos:
      photos.length > 0
        ? photos
        : ["/images/demo1.jpg"],

    speciality: "Pet Sitter",

    skill,
    fiability,
    engagement,
    affinity,
    rating,

    buyers: field(record, "buyers", []),

    price: Number(field(record, "tarif", 0)),
    devise: field(record, "devise", "€"),

    acceptedSpecies: field(
      record,
      "acceptedSpecies",
      []
    ),

    availability: field(
      record,
      "disponibilities",
      []
    ),

      token: field(
        record,
        "token",
        ""
      ),

      webtoken: field(
        record,
        "webtoken",
        ""
      ),

      language: field(
        record,
        "language",
        "fr"
      ),

      notifs: field(
        record,
        "notifs",
        []
      ),
    paypalID: field(record, "paypalID"),

    services: field(record, "services", []),
    feedbacks: [],
    schedules: [],

    description:
      "Pet sitter disponible pour garder, promener et accompagner vos animaux."
  }
}

export async function fetchProfessional(
  id: string
) {
  const database = await configureCloudKit()

  if (!id) {
    return null
  }

  try {
    const response = await database.fetchRecords([
      id
    ])

    const record = response.records?.find(
      (item: any) =>
        item.recordName === id &&
        !item.serverErrorCode
    )

    if (!record) {
      return null
    }

    switch (record.recordType) {
      case "GroomingUser":
        return await mapStructureProfessional(
          database,
          record,
          "Grooming"
        )

      case "HealthcareUser":
        return await mapStructureProfessional(
          database,
          record,
          "Healthcare"
        )

      case "SitterUser":
        return mapSitterProfessional(record)

      default:
        console.error(
          "Type de professionnel inconnu :",
          record.recordType
        )

        return null
    }
  } catch (error) {
    console.error(
      "Erreur lors de la récupération du professionnel :",
      error
    )

    return null
  }
}

export async function fetchServicesForProfessional(
  professionalID: string
) {
  const database = await configureCloudKit()

  const response = await database.performQuery({
    recordType: "Service",
    filterBy: [
      {
        fieldName: "groomingID",
        comparator: "EQUALS",
        fieldValue: {
          value: professionalID
        }
      }
    ]
  })

  if (response.hasErrors) {
    throw (
      response.errors?.[0] ??
      new Error(
        "Erreur lors de la récupération des prestations"
      )
    )
  }

  const records =
    response.records ??
    response._results ??
    response._httpResponse?.body?.records ??
    []

  return records.map((record: any) => ({
    id: record.recordName,

    groomingID: field(
      record,
      "groomingID"
    ),

    name: field(
      record,
      "name"
    ),

    description: field(
      record,
      "description"
    ),

    price: Number(
      field(
        record,
        "price",
        0
      )
    ),

    duration: Number(
      field(
        record,
        "duration",
        30
      )
    ),

    devise: field(
      record,
      "devise",
      "€"
    ),

    // NOUVEAUX ATTRIBUTS

    bookingMode: field(
      record,
      "bookingMode",
      "direct"
    ),

    requiredInformations: field(
      record,
      "requiredInformations",
      []
    ),

    customQuestions: field(
      record,
      "customQuestions",
      []
    )
  }))
}

export async function fetchFeedbacksForProfessional(
  professionalID: string
) {
  const database = await configureCloudKit()

  if (!professionalID) {
    return []
  }

  try {
    const response = await database.performQuery({
      recordType: "FeedBack",
      filterBy: [
        {
          fieldName: "groomingID",
          comparator: "EQUALS",
          fieldValue: {
            value: professionalID
          }
        }
      ],
      resultsLimit: 200
    })

    if (response.hasErrors) {
      throw (
        response.errors?.[0] ??
        new Error(
          "Erreur lors de la récupération des avis"
        )
      )
    }

    const records =
      response.records ??
      response._results ??
      response._httpResponse?.body?.records ??
      []

    return records.map((record: any) => ({
      id: record.recordName,

      cleanRate: Number(
        field(record, "cleanRate", 0)
      ),

      frameRate: Number(
        field(record, "frameRate", 0)
      ),

      homeRate: Number(
        field(record, "homeRate", 0)
      ),

      qualityRate: Number(
        field(record, "qualityRate", 0)
      ),

      comment: field(
        record,
        "comment",
        ""
      ),

      date: field(
        record,
        "date",
        ""
      ),

      groomingID: field(
        record,
        "groomingID",
        ""
      ),

      userID: field(
        record,
        "userID",
        ""
      )
    }))
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des avis :",
      error
    )

    return []
  }
}
