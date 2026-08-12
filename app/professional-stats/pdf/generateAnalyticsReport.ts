import {
  translate
} from "@/translations/translations"
import {
  fetchProAppointments,
  type Appointment
} from "@/services/appointments"
import type { Language } from "@/context/LanguageContext"
import {
  fetchProfessional,
  fetchServicesForProfessional
} from "@/services/fetchProfessionalById"
import {
  fetchMarketProfessionals
} from "@/services/fetchProfessionals"

type AnalyticsAccountType =
  | "grooming"
  | "healthcare"
  | "sitter"
  | string

type AnalyticsSession = {
  accountType?: string
  user?: Record<
    string,
    unknown
  >
}

type GenerateAnalyticsReportData = {
  session:
    | AnalyticsSession
    | null

  accountType:
    AnalyticsAccountType

  language:
    Language
}

type RGBColor = readonly [
  number,
  number,
  number
]

type MarketStatisticID =
  | "clients"
  | "appointments"
  | "revenue"
  | "basket"
  | "services"
  | "reviews"
  | "rating"
  | "loyalty"

type MarketCalculatedProfessional = {
  professionalID: string
  clients: number
  appointments: number
  revenue: number
  basket: number
  services: number
  reviews: number
  rating: number
  loyalty: number
}

type MarketPDFStatistic = {
  id: MarketStatisticID
  label: string
  value: string
  average: string
  rank: number
  total: number
}

type SummaryItem = {
  title:
    string

  page:
    number

  color:
    RGBColor
}

type PDFDocument =
  InstanceType<
    typeof import(
      "jspdf"
    )["jsPDF"]
  >

type AddSectionPageData = {
  pdf:
    PDFDocument

  title:
    string

  subtitle:
    string

  logoData:
    string | null

  professionalName:
    string

  language:
    Language

  pageNumber:
    number
}

const COLORS = {
  purple: [
    100,
    91,
    239
  ] as RGBColor,

  blue: [
    79,
    125,
    247
  ] as RGBColor,

  performance: [
    124,
    58,
    237
  ] as RGBColor,

  shop: [
    14,
    165,
    233
  ] as RGBColor,

  animals: [
    245,
    158,
    11
  ] as RGBColor,

  team: [
    34,
    197,
    94
  ] as RGBColor,

  reputation: [
    234,
    179,
    8
  ] as RGBColor,

  market: [
    79,
    125,
    247
  ] as RGBColor,

  text: [
    17,
    24,
    39
  ] as RGBColor,

  secondaryText: [
    100,
    116,
    139
  ] as RGBColor,

  border: [
    226,
    232,
    240
  ] as RGBColor
}

function getStringValue(
  user:
    Record<
      string,
      unknown
    >,
  keys:
    string[]
): string {
  for (
    const key
    of keys
  ) {
    const value =
      user[key]

    if (
      typeof value ===
        "string" &&
      value.trim()
    ) {
      return value.trim()
    }
  }

  return ""
}

function resolveCloudKitAssetURL(
  source:
    string,
  fileName =
    "zoove-photo.jpg"
): string {
  return source.replace(
    /\$\{f\}/g,
    encodeURIComponent(
      fileName
    )
  )
}

async function imageToDataURL(
  source:
    string
): Promise<
  string | null
> {
  try {
    const resolvedSource =
      resolveCloudKitAssetURL(
        source
      )

    console.log(
      "Chargement image résolue :",
      resolvedSource
    )

    const response =
      await fetch(
        resolvedSource
      )

    if (
      !response.ok
    ) {
      console.error(
        "Erreur chargement image :",
        response.status,
        response.statusText
      )

      return null
    }

    const blob =
      await response.blob()

    console.log(
      "Type image reçu :",
      blob.type
    )

    return await new Promise<
      string | null
    >(
      (
        resolve,
        reject
      ) => {
        const reader =
          new FileReader()

        reader.onloadend =
          () => {
            resolve(
              typeof reader.result ===
                "string"
                ? reader.result
                : null
            )
          }

        reader.onerror =
          () => {
            reject(
              new Error(
                "Impossible de convertir l’image en Data URL."
              )
            )
          }

        reader.readAsDataURL(
          blob
        )
      }
    )
  } catch (
    error
  ) {
    console.error(
      "Impossible de charger l’image du rapport :",
      error
    )

    return null
  }
}

function getImageFormat(
  dataURL:
    string
): "PNG" | "JPEG" | "WEBP" {
  if (
    dataURL.startsWith(
      "data:image/png"
    )
  ) {
    return "PNG"
  }

  if (
    dataURL.startsWith(
      "data:image/webp"
    )
  ) {
    return "WEBP"
  }

  return "JPEG"
}

function normalizePDFFileName(
  value:
    string
): string {
  return value
    .normalize(
      "NFD"
    )
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    )
}

function resolveLocale(
  language:
    Language
): string {
  switch (
    language
  ) {
    case "fr":
      return "fr-FR"

    case "en":
      return "en-US"

    case "es":
      return "es-ES"

    case "it":
      return "it-IT"

    case "pt":
      return "pt-PT"

    case "de":
      return "de-DE"

    case "ar":
      return "ar"

    default:
      return (
        language ||
        "fr-FR"
      )
  }
}

function getProfessionalName(
  user:
    Record<
      string,
      unknown
    >,
  accountType:
    AnalyticsAccountType,
  language:
    Language
): string {
  const name =
    getStringValue(
      user,
      [
        "name",
        "establishmentName",
        "businessName",
        "companyName"
      ]
    )

  const pseudo =
    getStringValue(
      user,
      [
        "pseudo",
        "username"
      ]
    )

  if (
    accountType ===
    "sitter"
  ) {
    return (
      pseudo ||
      name ||
      translate(
        language,
        "Pet sitter"
      )
    )
  }

  return (
    name ||
    pseudo ||
    translate(
      language,
      "Établissement Zoove"
    )
  )
}


function mixWithWhite(
  color: RGBColor,
  amount = 0.92
): RGBColor {
  return [
    Math.round(
      color[0] +
      (
        255 - color[0]
      ) * amount
    ),
    Math.round(
      color[1] +
      (
        255 - color[1]
      ) * amount
    ),
    Math.round(
      color[2] +
      (
        255 - color[2]
      ) * amount
    )
  ]
}

function addCoverPhotoPlaceholder(
  pdf:
    PDFDocument,
  professionalName:
    string,
  x:
    number,
  y:
    number,
  width:
    number,
  height:
    number
) {
  pdf.setFillColor(
    15,
    23,
    42
  )

  pdf.roundedRect(
    x,
    y,
    width,
    height,
    10,
    10,
    "F"
  )

  pdf.setTextColor(
    255,
    255,
    255
  )

  pdf.setFont(
    "helvetica",
    "bold"
  )

  pdf.setFontSize(
    42
  )

  pdf.text(
    professionalName
      .charAt(
        0
      )
      .toUpperCase() ||
      "Z",
    x +
      width /
        2,
    y +
      height /
        2 +
      7,
    {
      align:
        "center"
    }
  )
}

function addFooter(
  pdf:
    PDFDocument,
  professionalName:
    string,
  language:
    Language,
  pageNumber:
    number
) {
  const pageWidth =
    pdf.internal.pageSize
      .getWidth()

  const pageHeight =
    pdf.internal.pageSize
      .getHeight()

  pdf.setDrawColor(
    ...COLORS.border
  )

  pdf.setLineWidth(
    0.4
  )

  pdf.line(
    18,
    pageHeight -
      20,
    pageWidth -
      18,
    pageHeight -
      20
  )

  pdf.setTextColor(
    ...COLORS.secondaryText
  )

  pdf.setFont(
    "helvetica",
    "normal"
  )

  pdf.setFontSize(
    10
  )

  pdf.text(
    professionalName,
    18,
    pageHeight -
      12,
    {
      maxWidth:
        130
    }
  )

  pdf.text(
    `${translate(
      language,
      "Page"
    )} ${pageNumber}`,
    pageWidth -
      18,
    pageHeight -
      12,
    {
      align:
        "right"
    }
  )
}

function addSectionPage({
  pdf,
  title,
  subtitle,
  logoData,
  professionalName,
  language,
  pageNumber
}: AddSectionPageData) {
  pdf.addPage()

  const pageWidth =
    pdf.internal.pageSize
      .getWidth()

  const pageHeight =
    pdf.internal.pageSize
      .getHeight()

  pdf.setFillColor(
    255,
    255,
    255
  )

  pdf.rect(
    0,
    0,
    pageWidth,
    pageHeight,
    "F"
  )

  /*
   * Logo Zoove.
   */

  const logoWidth =
    28

  const logoHeight =
    28

  const logoX =
    pageWidth -
    18 -
    logoWidth

  const logoY =
    12

  if (
    logoData
  ) {
    pdf.addImage(
      logoData,
      getImageFormat(
        logoData
      ),
      logoX,
      logoY,
      logoWidth,
      logoHeight,
      undefined,
      "FAST"
    )
  } else {
    pdf.setTextColor(
      ...COLORS.purple
    )

    pdf.setFont(
      "helvetica",
      "bold"
    )

    pdf.setFontSize(
      15
    )

    pdf.text(
      "ZOOVE",
      pageWidth -
        18,
      26,
      {
        align:
          "right"
      }
    )
  }

  /*
   * Titre.
   */

  const titleX =
    18

  const titleY =
    40

  pdf.setTextColor(
    ...COLORS.text
  )

  pdf.setFont(
    "helvetica",
    "bold"
  )

  pdf.setFontSize(
    31
  )

  const titleLines =
    pdf.splitTextToSize(
      title,
      pageWidth -
        36 -
        logoWidth -
        12
    )

  pdf.text(
    titleLines,
    titleX,
    titleY,
    {
      lineHeightFactor:
        1.1
    }
  )

  /*
   * Sous-titre.
   */

  const subtitleY =
    titleY +
    titleLines.length *
      12 +
    14

  pdf.setTextColor(
    ...COLORS.secondaryText
  )

  pdf.setFont(
    "helvetica",
    "bold"
  )

  pdf.setFontSize(
    17
  )

  const subtitleLines =
    pdf.splitTextToSize(
      subtitle,
      pageWidth -
        55
    )

  pdf.text(
    subtitleLines,
    titleX,
    subtitleY,
    {
      lineHeightFactor:
        1.45
    }
  )

  /*
   * Trait gris sous l'en-tête.
   */

  const separatorY =
    subtitleY +
    subtitleLines.length *
      11 +
    12

  pdf.setDrawColor(
    ...COLORS.border
  )

  pdf.setLineWidth(
    0.5
  )

  pdf.line(
    18,
    separatorY,
    pageWidth -
      18,
    separatorY
  )

  addFooter(
    pdf,
    professionalName,
    language,
    pageNumber
  )
}

type AddKPIPageData = {
  pdf: PDFDocument
  title: string
  subtitle: string
  items: KPIItem[]
  color: RGBColor
  logoData: string | null
  professionalName: string
  language: Language
  pageNumber: number
}

function addKPIPage({
  pdf,
  title,
  subtitle,
  items,
  color,
  logoData,
  professionalName,
  language,
  pageNumber
}: AddKPIPageData) {
  pdf.addPage()

  const pageWidth =
    pdf.internal.pageSize
      .getWidth()

  const pageHeight =
    pdf.internal.pageSize
      .getHeight()

  pdf.setFillColor(
    255,
    255,
    255
  )

  pdf.rect(
    0,
    0,
    pageWidth,
    pageHeight,
    "F"
  )

  if (logoData) {
    pdf.addImage(
      logoData,
      getImageFormat(
        logoData
      ),
      pageWidth - 34,
      14,
      16,
      16,
      undefined,
      "FAST"
    )
  }

  pdf.setFillColor(
    ...color
  )

  pdf.roundedRect(
    18,
    18,
    10,
    10,
    3,
    3,
    "F"
  )

  pdf.setTextColor(
    ...COLORS.text
  )

  pdf.setFont(
    "helvetica",
    "bold"
  )

  pdf.setFontSize(
    24
  )

  pdf.text(
    title,
    34,
    26
  )

  pdf.setTextColor(
    ...COLORS.secondaryText
  )

  pdf.setFont(
    "helvetica",
    "normal"
  )

  pdf.setFontSize(
    11
  )

  const subtitleLines =
    pdf.splitTextToSize(
      subtitle,
      pageWidth - 36
    )

  pdf.text(
    subtitleLines,
    18,
    40
  )

  pdf.setDrawColor(
    ...COLORS.border
  )

  pdf.setLineWidth(
    0.5
  )

  pdf.line(
    18,
    52,
    pageWidth - 18,
    52
  )

  addKPICards(
    pdf,
    items,
    color,
    64
  )

  addFooter(
    pdf,
    professionalName,
    language,
    pageNumber
  )
}

function buildSummaryItems(
  accountType:
    AnalyticsAccountType,
  language:
    Language
): SummaryItem[] {
  const hasTeamPage =
    accountType !==
    "sitter"

  const items:
    SummaryItem[] = [
      {
        title:
          translate(
            language,
            "Performance"
          ),

        page:
          3,

        color:
          COLORS.performance
      },
      {
        title:
          translate(
            language,
            "Animaux"
          ),

        page:
          4,

        color:
          COLORS.animals
      }
    ]

  if (
    hasTeamPage
  ) {
    items.push({
      title:
        translate(
          language,
          "Équipe"
        ),

      page:
        5,

      color:
        COLORS.team
    })
  }

  items.push(
    {
      title:
        translate(
          language,
          "Notoriété"
        ),

      page:
        hasTeamPage
          ? 6
          : 5,

      color:
        COLORS.reputation
    },
    {
      title:
        translate(
          language,
          "Marché"
        ),

      page:
        hasTeamPage
          ? 7
          : 6,

      color:
        COLORS.market
    }
  )

  return items
}

type ProfessionalService = {
  id: string
  name: string
  price: number
  duration: number
}

type Feedback = {
  cleanRate: number
  homeRate: number
  frameRate: number
  qualityRate: number
}

type KPIItem = {
  label: string
  value: string
}

function average(
  values: number[]
): number {
  if (values.length === 0) {
    return 0
  }

  return (
    values.reduce(
      (total, value) =>
        total + value,
      0
    ) / values.length
  )
}

function parseDate(
  value: unknown
): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(
      value.getTime()
    )
      ? null
      : value
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    const date =
      new Date(value)

    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date
  }

  return null
}

function daysBetween(
  firstDate: Date,
  secondDate: Date
): number {
  const difference =
    Math.abs(
      secondDate.getTime() -
      firstDate.getTime()
    )

  return Math.round(
    difference /
      (1000 * 60 * 60 * 24)
  )
}

function formatMoney(
  value: number,
  language: Language,
  currency: string
): string {
  return new Intl.NumberFormat(
    resolveLocale(language),
    {
      style: "currency",
      currency:
        currency || "EUR",
      maximumFractionDigits: 2
    }
  ).format(value)
}

function normalizeServices(
  services: unknown[]
): ProfessionalService[] {
  return services
    .map(
      (
        service,
        index
      ) => {
        const value =
          service as Record<
            string,
            unknown
          >

        return {
          id:
            String(
              value.id ??
              value.recordName ??
              `service-${index}`
            ),

          name:
            String(
              value.name ??
              value.title ??
              value.serviceName ??
              ""
            ),

          price:
            Number(
              value.price ??
              0
            ),

          duration:
            Number(
              value.duration ??
              0
            )
        }
      }
    )
    .filter(
      service =>
        Boolean(service.id)
    )
}

function normalizeCollaboratorName(
  value: unknown
): string {
  if (
    typeof value === "string"
  ) {
    return value.trim()
  }

  if (
    value &&
    typeof value === "object"
  ) {
    const collaborator =
      value as Record<
        string,
        unknown
      >

    return String(
      collaborator.name ??
      collaborator.pseudo ??
      collaborator.fullName ??
      collaborator.collaborator ??
      ""
    ).trim()
  }

  return ""
}

function addAnalyticsPageHeader(
  pdf: InstanceType<
    typeof import("jspdf")["jsPDF"]
  >,
  title: string,
  color: RGBColor,
  logoData: string | null
) {
  const pageWidth =
    pdf.internal.pageSize
      .getWidth()

  pdf.setFillColor(
    255,
    255,
    255
  )

  pdf.rect(
    0,
    0,
    pageWidth,
    pdf.internal.pageSize
      .getHeight(),
    "F"
  )

  pdf.setFillColor(
    ...color
  )

  pdf.roundedRect(
    18,
    16,
    12,
    12,
    3,
    3,
    "F"
  )

  pdf.setTextColor(
    ...COLORS.text
  )

  pdf.setFont(
    "helvetica",
    "bold"
  )

  pdf.setFontSize(23)

  pdf.text(
    title,
    36,
    25
  )

  if (logoData) {
    pdf.addImage(
      logoData,
      getImageFormat(
        logoData
      ),
      pageWidth - 32,
      14,
      14,
      14,
      undefined,
      "FAST"
    )
  }

  pdf.setDrawColor(
    ...COLORS.border
  )

  pdf.setLineWidth(0.5)

  pdf.line(
    18,
    35,
    pageWidth - 18,
    35
  )
}

function addKPICards(
  pdf: InstanceType<
    typeof import("jspdf")["jsPDF"]
  >,
  items: KPIItem[],
  color: RGBColor,
  startY = 48
) {
  const pageWidth =
    pdf.internal.pageSize
      .getWidth()

  const gap = 8
  const horizontalMargin = 18

  const cardWidth =
    (
      pageWidth -
      horizontalMargin * 2 -
      gap
    ) / 2

  const cardHeight = 48

  items.forEach(
    (
      item,
      index
    ) => {
      const column =
        index % 2

      const row =
        Math.floor(
          index / 2
        )

      const x =
        horizontalMargin +
        column *
          (
            cardWidth +
            gap
          )

      const y =
        startY +
        row *
          (
            cardHeight +
            10
          )

        const backgroundColor =
          mixWithWhite(
            color
          )

        pdf.setFillColor(
          ...backgroundColor
        )

      pdf.setDrawColor(
        color[0],
        color[1],
        color[2]
      )

      pdf.setLineWidth(0.5)

      pdf.roundedRect(
        x,
        y,
        cardWidth,
        cardHeight,
        8,
        8,
        "FD"
      )

      pdf.setTextColor(
        ...color
      )

      pdf.setFont(
        "helvetica",
        "bold"
      )

      pdf.setFontSize(21)

      const valueLines =
        pdf.splitTextToSize(
          item.value,
          cardWidth - 12
        )

      pdf.text(
        valueLines,
        x +
          cardWidth / 2,
        y + 20,
        {
          align: "center"
        }
      )

      pdf.setTextColor(
        ...COLORS.text
      )

      pdf.setFont(
        "helvetica",
        "bold"
      )

      pdf.setFontSize(12)

      const labelLines =
        pdf.splitTextToSize(
          item.label,
          cardWidth - 12
        )

      pdf.text(
        labelLines,
        x +
          cardWidth / 2,
        y + 36,
        {
          align: "center"
        }
      )
    }
  )
}

function getMarketProfessionalType(
  professional: Record<
    string,
    unknown
  >
): AnalyticsAccountType {
  const type =
    String(
      professional.type ??
      professional.accountType ??
      ""
    ).toLowerCase()

  if (
    type === "sitter"
  ) {
    return "sitter"
  }

  if (
    type === "healthcare"
  ) {
    return "healthcare"
  }

  return "grooming"
}

function getMarketServicePrice(
  professional: Record<
    string,
    unknown
  >,
  appointment:
    Appointment
): number {
  const professionalType =
    getMarketProfessionalType(
      professional
    )

  if (
    professionalType ===
    "sitter"
  ) {
    const serviceParts =
      String(
        appointment.serviceID ??
        ""
      ).split("-")

    return (
      Number(
        serviceParts[2]
      ) || 0
    )
  }

  const services =
    Array.isArray(
      professional.services
    )
      ? professional.services
      : []

  const service =
    services.find(
      item => {
        if (
          !item ||
          typeof item !==
            "object"
        ) {
          return false
        }

        const value =
          item as Record<
            string,
            unknown
          >

        return (
          String(
            value.id ??
            value.recordName ??
            ""
          ) ===
          String(
            appointment.serviceID ??
            ""
          )
        )
      }
    )

  if (
    !service ||
    typeof service !==
      "object"
  ) {
    return 0
  }

  return (
    Number(
      (
        service as Record<
          string,
          unknown
        >
      ).price
    ) || 0
  )
}

function getMarketRating(
  professional: Record<
    string,
    unknown
  >
): number {
  const existingRating =
    Number(
      professional.rating ??
      0
    )

  if (
    existingRating > 0
  ) {
    return existingRating
  }

  const professionalType =
    getMarketProfessionalType(
      professional
    )

  if (
    professionalType ===
    "sitter"
  ) {
    const buyers =
      Array.isArray(
        professional.buyers
      )
        ? professional.buyers
        : []

    const ratings =
      buyers
        .filter(
          buyer =>
            buyer &&
            typeof buyer ===
              "object"
        )
        .map(
          buyer => {
            const value =
              buyer as Record<
                string,
                unknown
              >

            return average([
              Number(
                value.skill ??
                0
              ),
              Number(
                value.fiability ??
                0
              ),
              Number(
                value.engagement ??
                0
              ),
              Number(
                value.affinity ??
                0
              )
            ])
          }
        )

    return average(
      ratings
    )
  }

  const feedbacks =
    Array.isArray(
      professional.feedbacks
    )
      ? professional.feedbacks
      : []

  const ratings =
    feedbacks
      .filter(
        feedback =>
          feedback &&
          typeof feedback ===
            "object"
      )
      .map(
        feedback => {
          const value =
            feedback as Record<
              string,
              unknown
            >

          return average([
            Number(
              value.cleanRate ??
              0
            ),
            Number(
              value.homeRate ??
              0
            ),
            Number(
              value.frameRate ??
              0
            ),
            Number(
              value.qualityRate ??
              0
            )
          ])
        }
      )

  return average(
    ratings
  )
}

function getMarketLoyalty(
  appointments:
    Appointment[]
): number {
  const appointmentsByClient =
    appointments.reduce<
      Record<
        string,
        number
      >
    >(
      (
        result,
        appointment
      ) => {
        const userID =
          String(
            appointment.userID ??
            ""
          )

        if (!userID) {
          return result
        }

        result[userID] =
          (
            result[userID] ??
            0
          ) + 1

        return result
      },
      {}
    )

  const clientCounts =
    Object.values(
      appointmentsByClient
    )

  if (
    clientCounts.length ===
    0
  ) {
    return 0
  }

  const returningClients =
    clientCounts.filter(
      count =>
        count >= 2
    ).length

  return (
    returningClients /
    clientCounts.length
  ) * 100
}

function calculateMarketProfessional(
  professional: Record<
    string,
    unknown
  >,
  appointments:
    Appointment[]
): MarketCalculatedProfessional {
  const professionalID =
    String(
      professional.id ??
      professional.recordName ??
      ""
    )

  const uniqueClients =
    new Set(
      appointments
        .map(
          appointment =>
            String(
              appointment.userID ??
              ""
            )
        )
        .filter(Boolean)
    )

  const revenue =
    appointments.reduce(
      (
        total,
        appointment
      ) =>
        total +
        getMarketServicePrice(
          professional,
          appointment
        ),
      0
    )

  const professionalType =
    getMarketProfessionalType(
      professional
    )

  const feedbacks =
    Array.isArray(
      professional.feedbacks
    )
      ? professional.feedbacks
      : []

  const buyers =
    Array.isArray(
      professional.buyers
    )
      ? professional.buyers
      : []

  const services =
    Array.isArray(
      professional.services
    )
      ? professional.services
      : []

  return {
    professionalID,

    clients:
      uniqueClients.size,

    appointments:
      appointments.length,

    revenue,

    basket:
      appointments.length > 0
        ? revenue /
          appointments.length
        : 0,

    services:
      services.length,

    reviews:
      professionalType ===
      "sitter"
        ? buyers.length
        : feedbacks.length,

    rating:
      getMarketRating(
        professional
      ),

    loyalty:
      getMarketLoyalty(
        appointments
      )
  }
}

function getMarketRank(
  professionals:
    MarketCalculatedProfessional[],
  statisticID:
    MarketStatisticID,
  professionalID:
    string
): number {
  const sorted =
    [
      ...professionals
    ].sort(
      (
        first,
        second
      ) =>
        second[
          statisticID
        ] -
        first[
          statisticID
        ]
    )

  const index =
    sorted.findIndex(
      professional =>
        professional
          .professionalID ===
        professionalID
    )

  return (
    index >= 0
      ? index + 1
      : 0
  )
}


function addCompactKPICards(
  pdf: PDFDocument,
  items: MarketPDFStatistic[],
  color: RGBColor,
  startY: number,
  language: Language
) {
  const pageWidth =
    pdf.internal.pageSize
      .getWidth()

  const margin = 18
  const gap = 7

  const cardWidth =
    (
      pageWidth -
      margin * 2 -
      gap
    ) / 2

  const cardHeight = 38
  const rowGap = 7

  items.forEach(
    (
      item,
      index
    ) => {
      const column =
        index % 2

      const row =
        Math.floor(
          index / 2
        )

      const x =
        margin +
        column *
          (
            cardWidth +
            gap
          )

      const y =
        startY +
        row *
          (
            cardHeight +
            rowGap
          )

      const background =
        mixWithWhite(
          color,
          0.92
        )

      pdf.setFillColor(
        ...background
      )

      pdf.setDrawColor(
        ...color
      )

      pdf.setLineWidth(
        0.4
      )

      pdf.roundedRect(
        x,
        y,
        cardWidth,
        cardHeight,
        6,
        6,
        "FD"
      )

      pdf.setTextColor(
        ...color
      )

      pdf.setFont(
        "helvetica",
        "bold"
      )

      pdf.setFontSize(
        17
      )

      const valueLines =
        pdf.splitTextToSize(
          item.value,
          cardWidth - 10
        )

      pdf.text(
        valueLines,
        x + cardWidth / 2,
        y + 13,
        {
          align: "center"
        }
      )

      pdf.setTextColor(
        ...COLORS.text
      )

      pdf.setFont(
        "helvetica",
        "bold"
      )

      pdf.setFontSize(
        10
      )

      const labelLines =
        pdf.splitTextToSize(
          item.label,
          cardWidth - 10
        )

      pdf.text(
        labelLines,
        x + cardWidth / 2,
        y + 23,
        {
          align: "center"
        }
      )

      pdf.setTextColor(
        ...COLORS.secondaryText
      )

      pdf.setFont(
        "helvetica",
        "normal"
      )

      pdf.setFontSize(
        8
      )

      const comparisonText =
        `${translate(
          language,
          "Moyenne"
        )} : ${item.average} — #${item.rank}/${item.total}`

      const comparisonLines =
        pdf.splitTextToSize(
          comparisonText,
          cardWidth - 8
        )

      pdf.text(
        comparisonLines,
        x + cardWidth / 2,
        y + 31,
        {
          align: "center"
        }
      )
    }
  )
}

type AddMarketPageData = {
  pdf: PDFDocument
  statistics: MarketPDFStatistic[]
  globalRank: number
  totalProfessionals: number
  scopeTitle: string
  logoData: string | null
  professionalName: string
  language: Language
  pageNumber: number
}

function addMarketPage({
  pdf,
  statistics,
  globalRank,
  totalProfessionals,
  scopeTitle,
  logoData,
  professionalName,
  language,
  pageNumber
}: AddMarketPageData) {
  pdf.addPage()

  const pageWidth =
    pdf.internal.pageSize
      .getWidth()

  const pageHeight =
    pdf.internal.pageSize
      .getHeight()

  pdf.setFillColor(
    255,
    255,
    255
  )

  pdf.rect(
    0,
    0,
    pageWidth,
    pageHeight,
    "F"
  )

  if (logoData) {
    pdf.addImage(
      logoData,
      getImageFormat(
        logoData
      ),
      pageWidth - 34,
      14,
      16,
      16,
      undefined,
      "FAST"
    )
  }

  pdf.setFillColor(
    ...COLORS.market
  )

  pdf.roundedRect(
    18,
    18,
    10,
    10,
    3,
    3,
    "F"
  )

  pdf.setTextColor(
    ...COLORS.text
  )

  pdf.setFont(
    "helvetica",
    "bold"
  )

  pdf.setFontSize(
    24
  )

  pdf.text(
    translate(
      language,
      "Marché"
    ),
    34,
    26
  )

  pdf.setTextColor(
    ...COLORS.secondaryText
  )

  pdf.setFont(
    "helvetica",
    "normal"
  )

  pdf.setFontSize(
    11
  )

  pdf.text(
    translate(
      language,
      "Comparez votre activité avec les autres professionnels."
    ),
    18,
    40
  )

  const rankingBackground =
    mixWithWhite(
      COLORS.market,
      0.9
    )

  pdf.setFillColor(
    ...rankingBackground
  )

  pdf.setDrawColor(
    ...COLORS.market
  )

  pdf.setLineWidth(
    0.6
  )

  pdf.roundedRect(
    18,
    51,
    pageWidth - 36,
    38,
    8,
    8,
    "FD"
  )

  pdf.setTextColor(
    ...COLORS.market
  )

  pdf.setFont(
    "helvetica",
    "bold"
  )

  pdf.setFontSize(
    24
  )

  pdf.text(
    globalRank > 0
      ? `#${globalRank}`
      : "—",
    30,
    70
  )

  pdf.setTextColor(
    ...COLORS.text
  )

  pdf.setFontSize(
    13
  )

  pdf.text(
    translate(
      language,
      "Classement global"
    ),
    62,
    64
  )

  pdf.setTextColor(
    ...COLORS.secondaryText
  )

  pdf.setFont(
    "helvetica",
    "normal"
  )

  pdf.setFontSize(
    10
  )

  pdf.text(
    `${translate(
      language,
      "sur"
    )} ${totalProfessionals} — ${scopeTitle}`,
    62,
    74
  )

  addCompactKPICards(
    pdf,
    statistics,
    COLORS.market,
    99,
    language
  )

  addFooter(
    pdf,
    professionalName,
    language,
    pageNumber
  )
}

export async function generateAnalyticsReport({
  session,
  accountType,
  language
}: GenerateAnalyticsReportData): Promise<void> {
  if (
    typeof window ===
    "undefined"
  ) {
    throw new Error(
      "La génération du rapport doit être lancée depuis le navigateur."
    )
  }

  if (
    !session?.user
  ) {
    throw new Error(
      "Utilisateur non connecté."
    )
  }

  const {
    jsPDF
  } =
    await import(
      "jspdf"
    )

  const user =
    session.user

  const professionalName =
    getProfessionalName(
      user,
      accountType,
      language
    )

  const address =
    getStringValue(
      user,
      [
        "address",
        "adresse",
        "adress",
        "street",
        "location"
      ]
    )

  const city =
    getStringValue(
      user,
      [
        "city",
        "ville"
      ]
    )

  const country =
    getStringValue(
      user,
      [
        "country",
        "pays"
      ]
    )

  const phoneNumber =
    getStringValue(
      user,
      [
        "phoneNumber",
        "phone",
        "telephone"
      ]
    )

  const professionalID =
    getStringValue(
      user,
      [
        "id",
        "recordName"
      ]
    )
    
    let freshProfessional:
      Record<
        string,
        unknown
      > | null = null

    if (
      professionalID &&
      (
        accountType === "grooming" ||
        accountType === "healthcare"
      )
    ) {
      try {
        freshProfessional =
          await fetchProfessional(
            professionalID
          ) as Record<
            string,
            unknown
          >
      } catch (error) {
        console.error(
          "Impossible de récupérer les données fraîches du professionnel :",
          error
        )
      }
    }
    
    const currency =
      getStringValue(
        user,
        [
          "devise",
          "currency"
        ]
      ) || "EUR"

    const isSitter =
      accountType ===
      "sitter"

    const hasTeamPage =
      accountType ===
        "grooming" ||
      accountType ===
        "healthcare"

    let appointments:
      Appointment[] = []

    let services:
      ProfessionalService[] = []

    try {
      appointments =
        professionalID
          ? await fetchProAppointments(
              professionalID
            )
          : []

      if (isSitter) {
        const rawServices =
          Array.isArray(
            user.services
          )
            ? user.services
            : []

        services =
          normalizeServices(
            rawServices
          )
      } else {
        const fetchedServices =
          professionalID
            ? await fetchServicesForProfessional(
                professionalID
              )
            : []

        services =
          normalizeServices(
            Array.isArray(
              fetchedServices
            )
              ? fetchedServices
              : []
          )
      }
    } catch (error) {
      console.error(
        "Impossible de charger les KPI du rapport :",
        error
      )

      appointments = []
      services = []
    }
    
    const servicesByID =
      new Map(
        services.map(
          service => [
            service.id,
            service
          ]
        )
      )

    const enrichedAppointments =
      appointments.map(
        appointment => {
          if (isSitter) {
            const [
              ,
              ,
              priceValue
            ] =
              String(
                appointment.serviceID ??
                ""
              ).split("-")

            return {
              ...appointment,
              amount:
                Number(
                  priceValue
                ) || 0
            }
          }

          const service =
            servicesByID.get(
              appointment.serviceID
            )

          return {
            ...appointment,
            amount:
              Number(
                service?.price ??
                0
              )
          }
        }
      )

    const totalRevenue =
      enrichedAppointments.reduce(
        (
          total,
          appointment
        ) =>
          total +
          appointment.amount,
        0
      )

    const appointmentsCount =
      enrichedAppointments.length

    const averageRevenue =
      appointmentsCount > 0
        ? totalRevenue /
          appointmentsCount
        : 0

    const uniqueAnimalIDs =
      new Set(
        enrichedAppointments
          .map(
            appointment =>
              String(
                appointment.userID ??
                ""
              )
          )
          .filter(Boolean)
      )

    const animalsCount =
      uniqueAnimalIDs.size

    const sortedAppointmentDates =
      enrichedAppointments
        .map(
          appointment =>
            parseDate(
              appointment.date
            )
        )
        .filter(
          (
            date
          ): date is Date =>
            date !== null
        )
        .sort(
          (
            first,
            second
          ) =>
            first.getTime() -
            second.getTime()
        )

    const frequencyDifferences:
      number[] = []

    for (
      let index = 1;
      index <
      sortedAppointmentDates.length;
      index += 1
    ) {
      frequencyDifferences.push(
        daysBetween(
          sortedAppointmentDates[
            index - 1
          ],
          sortedAppointmentDates[
            index
          ]
        )
      )
    }

    const averageFrequency =
      Math.round(
        average(
          frequencyDifferences
        )
      )

    const lastAppointmentDate =
      sortedAppointmentDates.at(
        -1
      ) ?? null

    const daysSinceLastVisit =
      lastAppointmentDate
        ? daysBetween(
            lastAppointmentDate,
            new Date()
          )
        : null

    const performanceKPIs:
      KPIItem[] = [
        {
          label:
            translate(
              language,
              "Prestations"
            ),

          value:
            String(
              services.length
            )
        },
        {
          label:
            translate(
              language,
              isSitter
                ? "Gardes"
                : "Visites"
            ),

          value:
            String(
              appointmentsCount
            )
        },
        {
          label:
            translate(
              language,
              "Revenus"
            ),

          value:
            formatMoney(
              totalRevenue,
              language,
              currency
            )
        },
        {
          label:
            translate(
              language,
              "Revenu moyen"
            ),

          value:
            formatMoney(
              averageRevenue,
              language,
              currency
            )
        },
        {
          label:
            translate(
              language,
              "Fréquence moyenne"
            ),

          value:
            `${averageFrequency} ${translate(
              language,
              "jours"
            )}`
        },
        {
          label:
            translate(
              language,
              isSitter
                ? "Dernière garde"
                : "Dernière visite"
            ),

          value:
            daysSinceLastVisit ===
            null
              ? translate(
                  language,
                  isSitter
                    ? "Aucune garde"
                    : "Aucune visite"
                )
              : translate(
                  language,
                  "Il y a _ jours"
                ).replace(
                  "_",
                  String(
                    daysSinceLastVisit
                  )
                )
        }
      ]

    const animalKPIs:
      KPIItem[] = [
        {
          label:
            translate(
              language,
              "Animaux"
            ),

          value:
            String(
              animalsCount
            )
        },
        {
          label:
            translate(
              language,
              "Réservations"
            ),

          value:
            String(
              appointmentsCount
            )
        },
        {
          label:
            translate(
              language,
              "Dépenses totales"
            ),

          value:
            formatMoney(
              totalRevenue,
              language,
              currency
            )
        },
        {
          label:
            translate(
              language,
              "Dépense moyenne"
            ),

          value:
            formatMoney(
              averageRevenue,
              language,
              currency
            )
        },
        {
          label:
            translate(
              language,
              "Fréquence moyenne"
            ),

          value:
            `${averageFrequency} ${translate(
              language,
              "jours"
            )}`
        },
        {
          label:
            translate(
              language,
              isSitter
                ? "Dernière garde"
                : "Dernière visite"
            ),

          value:
            daysSinceLastVisit ===
            null
              ? translate(
                  language,
                  isSitter
                    ? "Aucune garde"
                    : "Aucune visite"
                )
              : translate(
                  language,
                  "Il y a _ jours"
                ).replace(
                  "_",
                  String(
                    daysSinceLastVisit
                  )
                )
        }
      ]
    
    const rawCollaborators =
      Array.isArray(
        user.collaborateurs
      )
        ? user.collaborateurs
        : Array.isArray(
            user.collaborators
          )
          ? user.collaborators
          : []

    const collaborators =
      Array.from(
        new Set(
          rawCollaborators
            .map(
              normalizeCollaboratorName
            )
            .filter(Boolean)
        )
      )

    const collaboratorAppointments =
      enrichedAppointments.filter(
        appointment =>
          normalizeCollaboratorName(
            appointment.collaborator
          )
      )

    const teamRevenue =
      collaboratorAppointments.reduce(
        (
          total,
          appointment
        ) =>
          total +
          appointment.amount,
        0
      )

    const teamClients =
      new Set(
        collaboratorAppointments
          .map(
            appointment =>
              String(
                appointment.userID ??
                ""
              )
          )
          .filter(Boolean)
      ).size

    const teamBasket =
      collaboratorAppointments.length >
      0
        ? teamRevenue /
          collaboratorAppointments.length
        : 0

    const teamKPIs:
      KPIItem[] = [
        {
          label:
            translate(
              language,
              "CA équipe"
            ),

          value:
            formatMoney(
              teamRevenue,
              language,
              currency
            )
        },
        {
          label:
            translate(
              language,
              "Clients"
            ),

          value:
            String(
              teamClients
            )
        },
        {
          label:
            translate(
              language,
              "Prestations"
            ),

          value:
            String(
              collaboratorAppointments.length
            )
        },
        {
          label:
            translate(
              language,
              "Panier moyen"
            ),

          value:
            formatMoney(
              teamBasket,
              language,
              currency
            )
        }
      ]
    
    const freshFeedbacks =
      freshProfessional?.[
        "feedbacks"
      ]

    const rawFeedbacks =
      Array.isArray(
        freshFeedbacks
      )
        ? freshFeedbacks
        : Array.isArray(
            user.feedbacks
          )
          ? user.feedbacks
          : []

    const feedbacks =
      rawFeedbacks
        .filter(
          feedback =>
            feedback &&
            typeof feedback ===
              "object"
        )
        .map(
          feedback =>
            feedback as Feedback
        )

    const homeRating =
      average(
        feedbacks.map(
          feedback =>
            Number(
              feedback.homeRate ??
              0
            )
        )
      )

    const cleanRating =
      average(
        feedbacks.map(
          feedback =>
            Number(
              feedback.cleanRate ??
              0
            )
        )
      )

    const frameRating =
      average(
        feedbacks.map(
          feedback =>
            Number(
              feedback.frameRate ??
              0
            )
        )
      )

    const qualityRating =
      average(
        feedbacks.map(
          feedback =>
            Number(
              feedback.qualityRate ??
              0
            )
        )
      )

    const globalRating =
      average(
        feedbacks.map(
          feedback =>
            average([
              Number(
                feedback.homeRate ??
                0
              ),
              Number(
                feedback.cleanRate ??
                0
              ),
              Number(
                feedback.frameRate ??
                0
              ),
              Number(
                feedback.qualityRate ??
                0
              )
            ])
        )
      )

    const reputationKPIs:
      KPIItem[] = [
        {
          label:
            translate(
              language,
              "Global"
            ),

          value:
            `${globalRating.toFixed(
              1
            )} / 5`
        },
        {
          label:
            translate(
              language,
              "Accueil"
            ),

          value:
            `${homeRating.toFixed(
              1
            )} / 5`
        },
        {
          label:
            translate(
              language,
              "Propreté"
            ),

          value:
            `${cleanRating.toFixed(
              1
            )} / 5`
        },
        {
          label:
            translate(
              language,
              "Cadre & Ambiance"
            ),

          value:
            `${frameRating.toFixed(
              1
            )} / 5`
        },
        {
          label:
            translate(
              language,
              "Qualité"
            ),

          value:
            `${qualityRating.toFixed(
              1
            )} / 5`
        }
      ]

  let marketProfessionals:
    Record<
      string,
      unknown
    >[] = []

  try {
    const fetchedMarketProfessionals =
      await fetchMarketProfessionals({
        accountType:
          accountType as
            | "grooming"
            | "healthcare"
            | "sitter",

        scope:
          "city",

        city,
        country
      })

    marketProfessionals =
      fetchedMarketProfessionals as Record<
        string,
        unknown
      >[]
  } catch (error) {
    console.error(
      "Impossible de charger les données du marché :",
      error
    )

    marketProfessionals = []
  }

  const currentProfessionalExists =
    marketProfessionals.some(
      professional =>
        String(
          professional.id ??
          professional.recordName ??
          ""
        ) === professionalID
    )

  if (
    professionalID &&
    !currentProfessionalExists
  ) {
    marketProfessionals.push({
      ...user,
      ...(freshProfessional ?? {}),

      id:
        professionalID,

      accountType,
      services,
      feedbacks
    })
  }

  const marketAppointmentsResults =
    await Promise.all(
      marketProfessionals.map(
        async professional => {
          const id =
            String(
              professional.id ??
              professional.recordName ??
              ""
            )

          if (!id) {
            return {
              professionalID:
                "",

              appointments:
                [] as Appointment[]
            }
          }

          try {
            const professionalAppointments =
              id === professionalID
                ? appointments
                : await fetchProAppointments(
                    id
                  )

            return {
              professionalID:
                id,

              appointments:
                professionalAppointments
            }
          } catch (error) {
            console.error(
              `Impossible de charger les RDV marché de ${id} :`,
              error
            )

            return {
              professionalID:
                id,

              appointments:
                [] as Appointment[]
            }
          }
        }
      )
    )

  const calculatedMarketProfessionals =
    marketProfessionals.map(
      professional => {
        const id =
          String(
            professional.id ??
            professional.recordName ??
            ""
          )

        const professionalAppointments =
          marketAppointmentsResults.find(
            result =>
              result.professionalID ===
              id
          )?.appointments ?? []

        return calculateMarketProfessional(
          professional,
          professionalAppointments
        )
      }
    )

  const currentMarketStatistics =
    calculatedMarketProfessionals.find(
      professional =>
        professional.professionalID ===
        professionalID
    )

  const marketStatisticDefinitions: {
    id: MarketStatisticID
    label: string
    format: (
      value: number
    ) => string
  }[] = [
    {
      id:
        "clients",

      label:
        translate(
          language,
          "Clients"
        ),

      format:
        value =>
          String(
            Math.round(
              value
            )
          )
    },
    {
      id:
        "appointments",

      label:
        translate(
          language,
          "Réservations"
        ),

      format:
        value =>
          String(
            Math.round(
              value
            )
          )
    },
    {
      id:
        "revenue",

      label:
        translate(
          language,
          "CA généré"
        ),

      format:
        value =>
          formatMoney(
            value,
            language,
            currency
          )
    },
    {
      id:
        "basket",

      label:
        translate(
          language,
          "Panier moyen"
        ),

      format:
        value =>
          formatMoney(
            value,
            language,
            currency
          )
    },
    {
      id:
        "services",

      label:
        translate(
          language,
          "Prestations"
        ),

      format:
        value =>
          String(
            Math.round(
              value
            )
          )
    },
    {
      id:
        "reviews",

      label:
        translate(
          language,
          "Avis clients"
        ),

      format:
        value =>
          String(
            Math.round(
              value
            )
          )
    },
    {
      id:
        "rating",

      label:
        translate(
          language,
          "Note moyenne"
        ),

      format:
        value =>
          `${value.toFixed(
            1
          )} / 5`
    },
    {
      id:
        "loyalty",

      label:
        translate(
          language,
          "Fidélisation"
        ),

      format:
        value =>
          `${value.toFixed(
            1
          )} %`
    }
  ]

  const marketStatistics:
    MarketPDFStatistic[] =
    currentMarketStatistics
      ? marketStatisticDefinitions.map(
          definition => {
            const values =
              calculatedMarketProfessionals.map(
                professional =>
                  professional[
                    definition.id
                  ]
              )

            return {
              id:
                definition.id,

              label:
                definition.label,

              value:
                definition.format(
                  currentMarketStatistics[
                    definition.id
                  ]
                ),

              average:
                definition.format(
                  average(
                    values
                  )
                ),

              rank:
                getMarketRank(
                  calculatedMarketProfessionals,
                  definition.id,
                  professionalID
                ),

              total:
                calculatedMarketProfessionals.length
            }
          }
        )
      : []

  const marketGlobalScores =
    calculatedMarketProfessionals.map(
      professional => ({
        professionalID:
          professional.professionalID,

        score:
          professional.clients * 0.15 +
          professional.appointments * 0.2 +
          professional.revenue * 0.3 +
          professional.rating * 0.2 +
          professional.loyalty * 0.15
      })
    )

  const sortedMarketGlobalScores =
    [
      ...marketGlobalScores
    ].sort(
      (
        first,
        second
      ) =>
        second.score -
        first.score
    )

  const marketGlobalRankIndex =
    sortedMarketGlobalScores.findIndex(
      professional =>
        professional.professionalID ===
        professionalID
    )

  const marketGlobalRank =
    marketGlobalRankIndex >= 0
      ? marketGlobalRankIndex + 1
      : 0

  const marketTotalProfessionals =
    calculatedMarketProfessionals.length

  const freshPhotos =
    freshProfessional
      ?.[
        "photos"
      ]

  const professionalPhoto =
    accountType ===
        "grooming" ||
      accountType ===
        "healthcare"
      ? (
          Array.isArray(
            freshPhotos
          ) &&
          typeof freshPhotos[0] ===
            "string"
            ? freshPhotos[0]
            : "/images/demo2.jpg"
        )
      : (
          getStringValue(
            user,
            [
              "photo"
            ]
          ) ||
          "/images/demo2.jpg"
        )

  console.log(
    "Photo fraîche utilisée :",
    professionalPhoto
  )

  const logoPath =
    "/images/logo.png"

  const [
    logoData,
    professionalPhotoData
  ] =
    await Promise.all([
      imageToDataURL(
        logoPath
      ),

      professionalPhoto
        ? imageToDataURL(
            professionalPhoto
          )
        : Promise.resolve(
            null
          )
    ])

  const pdf =
    new jsPDF({
      orientation:
        "portrait",

      unit:
        "mm",

      format:
        "a4"
    })

  pdf.setProperties({
    title:
      `Rapport Zoove Analytics - ${professionalName}`,

    subject:
      "Rapport d'activité Zoove Analytics",

    author:
      "Zoove Analytics",

    creator:
      "Zoove"
  })

  const pageWidth =
    pdf.internal.pageSize
      .getWidth()

  const pageHeight =
    pdf.internal.pageSize
      .getHeight()

  const locale =
    resolveLocale(
      language
    )

  const reportDate =
    new Intl.DateTimeFormat(
      locale,
      {
        day:
          "2-digit",

        month:
          "2-digit",

        year:
          "numeric"
      }
    ).format(
      new Date()
    )

  /*
   * ==========================================
   * PAGE 1 — COUVERTURE
   * ==========================================
   */

  pdf.setFillColor(
    255,
    255,
    255
  )

  pdf.rect(
    0,
    0,
    pageWidth,
    pageHeight,
    "F"
  )

  if (
    logoData
  ) {
    pdf.addImage(
      logoData,
      getImageFormat(
        logoData
      ),
      pageWidth /
        2 -
        14,
      12,
      28,
      28,
      undefined,
      "FAST"
    )
  } else {
    pdf.setTextColor(
      ...COLORS.purple
    )

    pdf.setFont(
      "helvetica",
      "bold"
    )

    pdf.setFontSize(
      18
    )

    pdf.text(
      "ZOOVE",
      pageWidth /
        2,
      27,
      {
        align:
          "center"
      }
    )
  }

  pdf.setTextColor(
    ...COLORS.text
  )

  pdf.setFont(
    "helvetica",
    "bold"
  )

  pdf.setFontSize(
    24
  )

  const title =
    translate(
      language,
      "Rapport d'activité Zoove Analytics"
    )

  const titleLines =
    pdf.splitTextToSize(
      title,
      180
    )

  pdf.text(
    titleLines,
    pageWidth /
      2,
    55,
    {
      align:
        "center"
    }
  )

  const photoX =
    18

  const photoY =
    88

  const photoWidth =
    pageWidth -
    36

  const photoHeight =
    82

  if (
    professionalPhotoData
  ) {
    pdf.setFillColor(
      15,
      23,
      42
    )

    pdf.roundedRect(
      photoX,
      photoY,
      photoWidth,
      photoHeight,
      10,
      10,
      "F"
    )

    try {
      pdf.addImage(
        professionalPhotoData,
        getImageFormat(
          professionalPhotoData
        ),
        photoX,
        photoY,
        photoWidth,
        photoHeight,
        undefined,
        "FAST"
      )
    } catch (
      error
    ) {
      console.error(
        "Impossible d'ajouter la photo professionnelle au PDF :",
        error
      )

      addCoverPhotoPlaceholder(
        pdf,
        professionalName,
        photoX,
        photoY,
        photoWidth,
        photoHeight
      )
    }
  } else {
    addCoverPhotoPlaceholder(
      pdf,
      professionalName,
      photoX,
      photoY,
      photoWidth,
      photoHeight
    )
  }

  pdf.setTextColor(
    ...COLORS.purple
  )

  pdf.setFont(
    "helvetica",
    "bold"
  )

  pdf.setFontSize(
    21
  )

  const nameLines =
    pdf.splitTextToSize(
      professionalName,
      170
    )

  pdf.text(
    nameLines,
    pageWidth /
      2,
    188,
    {
      align:
        "center"
    }
  )

  const details =
    (
      accountType ===
      "sitter"
        ? [
            {
              icon:
                "--->",

              value:
                city
            },
            {
              icon:
                "--->",

              value:
                country
            },
            {
              icon:
                "--->",

              value:
                phoneNumber
            }
          ]
        : [
            {
              icon:
                "--->",

              value:
                address
            },
            {
              icon:
                "--->",

              value:
                city
            },
            {
              icon:
                "--->",

              value:
                country
            },
            {
              icon:
                "--->",

              value:
                phoneNumber
            }
          ]
    ).filter(
      item =>
        item.value
    )

  const detailsWidth =
    112

  const detailsX =
    (
      pageWidth -
      detailsWidth
    ) /
    2

  const detailsStartY =
    nameLines.length >
    1
      ? 210
      : 204

  const detailLineHeight =
    12

  details.forEach(
    (
      detail,
      index
    ) => {
      const y =
        detailsStartY +
        index *
          detailLineHeight

      pdf.setTextColor(
        ...COLORS.text
      )

      pdf.setFont(
        "helvetica",
        "bold"
      )

      pdf.setFontSize(
        16
      )

      pdf.text(
        detail.icon,
        detailsX,
        y
      )

      pdf.setFont(
        "helvetica",
        "normal"
      )

      pdf.setFontSize(
        12
      )

      const detailLines =
        pdf.splitTextToSize(
          detail.value,
          detailsWidth -
            16
        )

      pdf.text(
        detailLines,
        detailsX +
          12,
        y
      )
    }
  )

  /*
   * Vague violette.
   */

  pdf.setFillColor(
    ...COLORS.purple
  )

  pdf.moveTo(
    0,
    245
  )

  pdf.curveTo(
    42,
    230,
    105,
    260,
    155,
    256
  )

  pdf.curveTo(
    180,
    254,
    195,
    249,
    pageWidth,
    246
  )

  pdf.lineTo(
    pageWidth,
    pageHeight
  )

  pdf.lineTo(
    0,
    pageHeight
  )

  pdf.close()

  pdf.fill()

  pdf.setTextColor(
    255,
    255,
    255
  )

  pdf.setFont(
    "helvetica",
    "normal"
  )

  pdf.setFontSize(
    11
  )

  pdf.text(
    translate(
      language,
      "Généré par Zoove Analytics"
    ),
    pageWidth /
      2,
    276,
    {
      align:
        "center"
    }
  )

  pdf.text(
    `${translate(
      language,
      "Le"
    )} ${reportDate}`,
    pageWidth /
      2,
    283,
    {
      align:
        "center"
    }
  )

  /*
   * ==========================================
   * PAGE 2 — SOMMAIRE
   * ==========================================
   */

  pdf.addPage()

  pdf.setFillColor(
    255,
    255,
    255
  )

  pdf.rect(
    0,
    0,
    pageWidth,
    pageHeight,
    "F"
  )

  const summaryTitle =
    translate(
      language,
      "Sommaire"
    ).toUpperCase()

  const summaryTitleY =
    22

  pdf.setTextColor(
    ...COLORS.text
  )

  pdf.setFont(
    "helvetica",
    "bold"
  )

  pdf.setFontSize(
    26
  )

  pdf.text(
    summaryTitle,
    18,
    summaryTitleY
  )

  const summaryTitleWidth =
    pdf.getTextWidth(
      summaryTitle
    )

  const summaryLogoSize =
    14

  const summaryLogoX =
    pageWidth -
    18 -
    summaryLogoSize

  pdf.setDrawColor(
    ...COLORS.border
  )

  pdf.setLineWidth(
    0.6
  )

  pdf.line(
    18 +
      summaryTitleWidth +
      6,
    summaryTitleY -
      1,
    summaryLogoX -
      6,
    summaryTitleY -
      1
  )

  if (
    logoData
  ) {
    pdf.addImage(
      logoData,
      getImageFormat(
        logoData
      ),
      summaryLogoX,
      summaryTitleY -
        10,
      summaryLogoSize,
      summaryLogoSize,
      undefined,
      "FAST"
    )
  }

  const summaryItems =
    buildSummaryItems(
      accountType,
      language
    )

  const summaryStartY =
    44

  const summaryRowHeight =
    25

  summaryItems.forEach(
    (
      item,
      index
    ) => {
      const y =
        summaryStartY +
        index *
          summaryRowHeight

      pdf.setFillColor(
        ...item.color
      )

      pdf.roundedRect(
        18,
        y -
          7,
        9,
        9,
        2,
        2,
        "F"
      )

      pdf.setTextColor(
        ...COLORS.text
      )

      pdf.setFont(
        "helvetica",
        "bold"
      )

      pdf.setFontSize(
        15
      )

      pdf.text(
        item.title,
        34,
        y
      )

      pdf.setDrawColor(
        203,
        213,
        225
      )

      pdf.setLineDashPattern(
        [
          1.5,
          1.5
        ],
        0
      )

      pdf.line(
        82,
        y -
          1,
        pageWidth -
          31,
        y -
          1
      )

      pdf.setLineDashPattern(
        [],
        0
      )

      pdf.setTextColor(
        ...item.color
      )

      pdf.setFont(
        "helvetica",
        "bold"
      )

      pdf.setFontSize(
        14
      )

      pdf.text(
        String(
          item.page
        ),
        pageWidth -
          20,
        y,
        {
          align:
            "right"
        }
      )
    }
  )

  addFooter(
    pdf,
    professionalName,
    language,
    2
  )

  /*
   * ==========================================
   * PAGE 3 — PERFORMANCE
   * ==========================================
   */

    addKPIPage({
      pdf,

      title:
        translate(
          language,
          "Performance"
        ),

      subtitle:
        translate(
          language,
          "Vue d'ensemble de votre activité : chiffre d'affaires, prestations, agenda…"
        ),

      items:
        performanceKPIs,

      color:
        COLORS.performance,

      logoData,
      professionalName,
      language,

      pageNumber:
        3
    })

  /*
   * ==========================================
   * PAGE 4 — ANIMAUX
   * ==========================================
   */

    addKPIPage({
      pdf,

      title:
        translate(
          language,
          "Animaux"
        ),

      subtitle:
        translate(
          language,
          "Fiches animaux, prestations réalisées, fréquence, dépenses et fidélité."
        ),

      items:
        animalKPIs,

      color:
        COLORS.animals,

      logoData,
      professionalName,
      language,

      pageNumber:
        4
    })

  /*
   * ==========================================
   * PAGE 5 — ÉQUIPE
   * Grooming et Healthcare uniquement.
   * ==========================================
   */

    if (hasTeamPage) {
      addKPIPage({
        pdf,

        title:
          translate(
            language,
            "Équipe"
          ),

        subtitle:
          translate(
            language,
            "Analysez l'activité de vos collaborateurs, leurs réservations et performances."
          ),

        items:
          teamKPIs,

        color:
          COLORS.team,

        logoData,
        professionalName,
        language,

        pageNumber:
          5
      })
    }

  /*
   * ==========================================
   * NOTORIÉTÉ
   * ==========================================
   */

    const reputationPageNumber =
      hasTeamPage
        ? 6
        : 5

    addKPIPage({
      pdf,

      title:
        translate(
          language,
          "Notoriété"
        ),

      subtitle:
        translate(
          language,
          "Analysez vos avis et votre réputation."
        ),

      items:
        reputationKPIs,

      color:
        COLORS.reputation,

      logoData,
      professionalName,
      language,

      pageNumber:
        reputationPageNumber
    })
  /*
   * ==========================================
   * MARCHÉ
   * ==========================================
   */

  const marketPageNumber =
    accountType ===
    "sitter"
      ? 6
      : 7

  addMarketPage({
    pdf,

    statistics:
      marketStatistics,

    globalRank:
      marketGlobalRank,

    totalProfessionals:
      marketTotalProfessionals,

    scopeTitle:
      city ||
      country ||
      translate(
        language,
        "Monde"
      ),

    logoData,
    professionalName,
    language,

    pageNumber:
      marketPageNumber
  })

  /*
   * Téléchargement.
   */

  const safeName =
    normalizePDFFileName(
      professionalName
    ) ||
    "zoove"

  pdf.save(
    `rapport-zoove-${safeName}.pdf`
  )
}

