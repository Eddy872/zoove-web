import { configureCloudKit } from "./cloudkit"

type ProfessionalType =
  | "Grooming"
  | "Healthcare"
  | "Sitter"

type ProfessionalSource = {
  recordType:
    | "GroomingUser"
    | "HealthcareUser"
    | "SitterUser"

  type: ProfessionalType
  speciality: string
}

const PROFESSIONAL_SOURCES: ProfessionalSource[] = [
  {
    recordType: "GroomingUser",
    type: "Grooming",
    speciality: "Toiletteur"
  },
  {
    recordType: "HealthcareUser",
    type: "Healthcare",
    speciality: ""
  },
  {
    recordType: "SitterUser",
    type: "Sitter",
    speciality: "Pet Sitter"
  }
]

export type ProfessionalsCursor = {
  groomingMarker?: string
  healthcareMarker?: string
  sitterMarker?: string

  groomingFinished: boolean
  healthcareFinished: boolean
  sitterFinished: boolean
}

export type ProfessionalsPage = {
  professionals: any[]
  cursor: ProfessionalsCursor | null
  hasMore: boolean
}

type SourcePageResult = {
  records: any[]
  continuationMarker?: string
  finished: boolean
}

function field(
  record: any,
  name: string,
  fallback: any = ""
) {
  return (
    record.fields?.[name]?.value ??
    fallback
  )
}

function assetsToUrls(
  fieldValue: any
): string[] {
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
      value?.value?.downloadURL ??
      ""
  ].filter(Boolean)
}

async function fetchServices(
  database: any,
  structureID: string
) {
  try {
    const response =
      await database.performQuery({
        recordType: "Service",

        filterBy: [
          {
            fieldName: "groomingID",
            comparator: "EQUALS",
            fieldValue: {
              value: structureID
            }
          }
        ]
      })

    return (
      response.records ?? []
    ).map((record: any) => ({
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
        field(record, "price", 0)
      ),

      duration: Number(
        field(record, "duration", 0)
      ),

      devise: field(
        record,
        "devise",
        "€"
      )
    }))
  } catch (error) {
    console.error(
      `Erreur services pour ${structureID} :`,
      error
    )

    return []
  }
}

async function fetchFeedbacks(
  database: any,
  structureID: string
) {
  try {
    const response =
      await database.performQuery({
        recordType: "FeedBack",

        filterBy: [
          {
            fieldName: "groomingID",
            comparator: "EQUALS",
            fieldValue: {
              value: structureID
            }
          }
        ]
      })

    return (
      response.records ?? []
    ).map((record: any) => ({
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
        "comment"
      ),

      date: field(
        record,
        "date"
      ),

      groomingID: field(
        record,
        "groomingID"
      ),

      userID: field(
        record,
        "userID"
      )
    }))
  } catch (error) {
    console.error(
      `Erreur feedbacks pour ${structureID} :`,
      error
    )

    return []
  }
}

function calculateStructureRating(
  feedbacks: any[]
): number {
  if (feedbacks.length === 0) {
    return 0
  }

  const total = feedbacks.reduce(
    (
      sum: number,
      feedback: any
    ) => {
      const globalRating =
        (
          Number(
            feedback.cleanRate ?? 0
          ) +
          Number(
            feedback.frameRate ?? 0
          ) +
          Number(
            feedback.homeRate ?? 0
          ) +
          Number(
            feedback.qualityRate ?? 0
          )
        ) / 4

      return sum + globalRating
    },
    0
  )

  return total / feedbacks.length
}

async function mapStructureRecord(
  database: any,
  record: any,
  type: "Grooming" | "Healthcare",
  speciality: string
) {
  const id = record.recordName

  const photos = assetsToUrls(
    record.fields?.photos
  )

  const [
    services,
    feedbacks
  ] = await Promise.all([
    fetchServices(database, id),
    fetchFeedbacks(database, id)
  ])

  const expertise =
    type === "Healthcare"
      ? field(
          record,
          "expertise",
          []
        )
      : []

  const safeExpertise =
    Array.isArray(expertise)
      ? expertise
      : []

  const rating =
    calculateStructureRating(
      feedbacks
    )

  return {
    id,
    type,

    name: field(
      record,
      "name"
    ),

    city: field(
      record,
      "city"
    ),

    country: field(
      record,
      "country"
    ),

    adress: field(
      record,
      "adress"
    ),

    phoneNumber: field(
      record,
      "phoneNumber"
    ),

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

    schedules: field(
      record,
      "schedules",
      []
    ),

    informations: field(
      record,
      "informations"
    ),

    userIDs: field(
      record,
      "userIDs",
      []
    ),

    blockedUserIDs: field(
      record,
      "blockedUserIDs",
      []
    ),

    device: field(
      record,
      "device"
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
      
      package: Number(
        field(record, "package", 0)
      ),

    image:
      photos[0] ??
      "/images/demo2.jpg",

    photos:
      photos.length > 0
        ? photos
        : ["/images/demo2.jpg"],

    expertise: safeExpertise,

    speciality:
      type === "Healthcare"
        ? safeExpertise[0] ??
          "Vétérinaire"
        : speciality,

    services,
    feedbacks,
    rating,

    description: field(
      record,
      "informations"
    )
  }
}

function mapSitterRecord(
  record: any
) {
  const photos = assetsToUrls(
    record.fields?.photo
  )

  const skill = Number(
    field(record, "skill", 0)
  )

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
    (
      skill +
      fiability +
      engagement +
      affinity
    ) / 4

  return {
    id: record.recordName,
    type: "Sitter",
      package: Number(
        field(record, "package", 0)
      ),
    name: field(
      record,
      "pseudo"
    ),

    city: field(
      record,
      "city"
    ),

    country: field(
      record,
      "country"
    ),

    phoneNumber: field(
      record,
      "phoneNumber"
    ),

    image:
      photos[0] ??
      "/images/demo1.jpg",

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

    buyers: field(
      record,
      "buyers",
      []
    ),

    price: Number(
      field(record, "price", 0)
    ),

    devise: field(
      record,
      "devise",
      "€"
    ),

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
      "token"
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

    paypalID: field(
      record,
      "paypalID"
    ),

    services: field(
      record,
      "services",
      []
    ),

    feedbacks: [],
    schedules: [],

    description:
      "Pet sitter disponible pour garder, promener et accompagner vos animaux."
  }
}

async function mapRecords(
  database: any,
  records: any[],
  source: ProfessionalSource
) {
  if (source.type === "Sitter") {
    return records.map(
      mapSitterRecord
    )
  }

  const structureType:
    "Grooming" | "Healthcare" =
    source.type

  return Promise.all(
    records.map(
      record =>
        mapStructureRecord(
          database,
          record,
          structureType,
          source.speciality
        )
    )
  )
}

function formatDateForComparison(
  date: Date
): string {
  const year = date.getFullYear()

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0")

  const day = String(
    date.getDate()
  ).padStart(2, "0")

  return `${year}-${month}-${day} 00:00:00`
}

function hasActivePackage(
  record: any
): boolean {
  const packageValue = Number(
    field(record, "package", 0)
  )

  const packageEnd = String(
    field(record, "packageEnd", "")
  ).trim()

  // Aucun abonnement actif
  if (packageValue <= 0) {
    return false
  }

  /*
   * Une date vide n'est pas considérée comme expirée.
   * Utile si certaines offres n'ont pas de date de fin.
   */
  if (!packageEnd) {
    return true
  }

  const today =
    formatDateForComparison(
      new Date()
    )

  return packageEnd >= today
}

async function fetchProfessionalSourcePage(
  database: any,
  source: ProfessionalSource,
  resultsLimit: number,
  continuationMarker?: string
): Promise<SourcePageResult> {
    const query: any = {
      recordType: source.recordType,

      filterBy: [],

      resultsLimit,

      sortBy: [
        {
          fieldName: "package",
          ascending: false
        },
        {
          fieldName:
            source.type === "Sitter"
              ? "pseudo"
              : "name",

          ascending: true
        }
      ]
    }

  if (continuationMarker) {
    query.continuationMarker =
      continuationMarker
  }

  try {
    const response =
      await database.performQuery(query)
      
      
       const activeRecords =
         (response.records ?? []).filter(
           (record: any) =>
             hasActivePackage(record)
         )
       
      
      /*
       const activeRecords =
         response.records ?? []
       */

    console.log(
      `Fetch ${source.recordType}`,
      {
        count:
          response.records?.length ??
          0,

        moreComing:
          response.moreComing,

        continuationMarker:
          response.continuationMarker
      }
    )

      const records =
        await mapRecords(
          database,
          activeRecords,
          source
        )

    const nextMarker =
      response.moreComing &&
      response.continuationMarker
        ? response.continuationMarker
        : undefined

    return {
      records,
      continuationMarker:
        nextMarker,

      finished:
        !nextMarker
    }
  } catch (error) {
    console.error(
      `Erreur fetch ${source.recordType} :`,
      error
    )

    return {
      records: [],
      continuationMarker:
        undefined,

      finished: true
    }
  }
}

export async function fetchProfessionals(
  cursor: ProfessionalsCursor | null = null
): Promise<ProfessionalsPage> {
  const database =
    await configureCloudKit()

  const currentCursor:
    ProfessionalsCursor =
    cursor ?? {
      groomingFinished: false,
      healthcareFinished: false,
      sitterFinished: false
    }

  const groomingSource =
    PROFESSIONAL_SOURCES.find(
      (source) =>
        source.type === "Grooming"
    )!

  const healthcareSource =
    PROFESSIONAL_SOURCES.find(
      (source) =>
        source.type === "Healthcare"
    )!

  const sitterSource =
    PROFESSIONAL_SOURCES.find(
      (source) =>
        source.type === "Sitter"
    )!

  const [
    groomingResult,
    healthcareResult,
    sitterResult
  ] = await Promise.all([
    currentCursor.groomingFinished
      ? Promise.resolve<SourcePageResult>({
          records: [],
          continuationMarker:
            undefined,
          finished: true
        })
      : fetchProfessionalSourcePage(
          database,
          groomingSource,
          3,
          currentCursor.groomingMarker
        ),

    currentCursor.healthcareFinished
      ? Promise.resolve<SourcePageResult>({
          records: [],
          continuationMarker:
            undefined,
          finished: true
        })
      : fetchProfessionalSourcePage(
          database,
          healthcareSource,
          3,
          currentCursor.healthcareMarker
        ),

    currentCursor.sitterFinished
      ? Promise.resolve<SourcePageResult>({
          records: [],
          continuationMarker:
            undefined,
          finished: true
        })
      : fetchProfessionalSourcePage(
          database,
          sitterSource,
          3,
          currentCursor.sitterMarker
        )
  ])

  const professionals = [
    ...groomingResult.records,
    ...healthcareResult.records,
    ...sitterResult.records
  ]

  const nextCursor:
    ProfessionalsCursor = {
    groomingMarker:
      groomingResult
        .continuationMarker,

    healthcareMarker:
      healthcareResult
        .continuationMarker,

    sitterMarker:
      sitterResult
        .continuationMarker,

    groomingFinished:
      groomingResult.finished,

    healthcareFinished:
      healthcareResult.finished,

    sitterFinished:
      sitterResult.finished
  }

  const hasMore =
    !nextCursor.groomingFinished ||
    !nextCursor.healthcareFinished ||
    !nextCursor.sitterFinished

  return {
    professionals,

    cursor:
      hasMore
        ? nextCursor
        : null,

    hasMore
  }
}

export type MarketScope =
  | "city"
  | "country"
  | "world"

export type MarketAccountType =
  | "grooming"
  | "healthcare"
  | "sitter"

export type FetchMarketProfessionalsData = {
  accountType: MarketAccountType
  scope: MarketScope
  city?: string
  country?: string
}

function getMarketSource(
  accountType: MarketAccountType
): ProfessionalSource {
  switch (accountType) {
    case "grooming":
      return {
        recordType: "GroomingUser",
        type: "Grooming",
        speciality: "Toiletteur",
      }

    case "healthcare":
      return {
        recordType: "HealthcareUser",
        type: "Healthcare",
        speciality: "",
      }

    case "sitter":
      return {
        recordType: "SitterUser",
        type: "Sitter",
        speciality: "Pet Sitter",
      }
  }
}

function buildMarketFilters(
  scope: MarketScope,
  city?: string,
  country?: string
) {
  if (
    scope === "city" &&
    city
  ) {
    return [
      {
        fieldName: "city",
        comparator: "EQUALS",
        fieldValue: {
          value: city,
        },
      },
    ]
  }

  if (
    scope === "country" &&
    country
  ) {
    return [
      {
        fieldName: "country",
        comparator: "EQUALS",
        fieldValue: {
          value: country,
        },
      },
    ]
  }

  /*
   * Monde :
   * aucun filtre CloudKit.
   */
  return []
}

export async function fetchMarketProfessionals({
  accountType,
  scope,
  city,
  country,
}: FetchMarketProfessionalsData) {
  const database =
    await configureCloudKit()

  const source =
    getMarketSource(accountType)

  const filterBy =
    buildMarketFilters(
      scope,
      city,
      country
    )

  const allRecords: any[] = []

  let continuationMarker:
    string | undefined

  let hasMore = true

  while (hasMore) {
    const query: any = {
      recordType:
        source.recordType,

      filterBy,

      resultsLimit: 100,

      sortBy: [
        {
          fieldName: "package",
          ascending: false,
        },
        {
          fieldName:
            source.type === "Sitter"
              ? "pseudo"
              : "name",

          ascending: true,
        },
      ],
    }

    if (continuationMarker) {
      query.continuationMarker =
        continuationMarker
    }

    try {
      const response =
        await database.performQuery(
          query
        )

      const records =
        response.records ?? []
        allRecords.push(
          ...records
        )

      if (
        response.moreComing &&
        response.continuationMarker
      ) {
        continuationMarker =
          response.continuationMarker
      } else {
        continuationMarker =
          undefined

        hasMore = false
      }
    } catch (error) {
      console.error(
        `Erreur fetch marché ${source.recordType} :`,
        error
      )

      hasMore = false
    }
  }

  const professionals =
    await mapRecords(
      database,
      allRecords,
      source
    )

  console.log(
    "Professionnels marché récupérés :",
    {
      accountType,
      scope,
      city,
      country,
      count:
        professionals.length,
    }
  )

  return professionals
}
