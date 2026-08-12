import type { AccountType } from "@/types/auth"
import type { Animal } from "@/types/animal"
import type { GroomingUser } from "@/types/groomingUser"
import type { HealthcareUser } from "@/types/healthcareUser"
import type { SitterUser } from "@/types/sitterUser"
import type { Language } from "@/context/LanguageContext"

function field<T>(
  record: any,
  name: string,
  fallback: T
): T {
  return (
    record.fields?.[name]?.value ??
    fallback
  )
}

function assetURL(
  record: any,
  name: string
): string {
  const value =
    record.fields?.[name]?.value

  if (!value) {
    return ""
  }

  if (typeof value === "string") {
    return value
  }

  return (
    value.downloadURL ??
    value.fileURL ??
    value.referenceURL ??
    ""
  )
}

function normalizeLanguage(
  value: unknown
): Language {
  if (
    value === "fr" ||
    value === "en" ||
    value === "es" ||
    value === "it" ||
    value === "pt" ||
    value === "de" ||
    value === "ar"
  ) {
    return value
  }

  return "fr"
}

export function mapCloudKitAccount(
  accountType: "animal",
  record: any
): Animal

export function mapCloudKitAccount(
  accountType: "grooming",
  record: any
): GroomingUser

export function mapCloudKitAccount(
  accountType: "healthcare",
  record: any
): HealthcareUser

export function mapCloudKitAccount(
  accountType: "sitter",
  record: any
): SitterUser

export function mapCloudKitAccount(
  accountType: AccountType,
  record: any
):
  | Animal
  | GroomingUser
  | HealthcareUser
  | SitterUser {
  const commonFields = {
    id: field(
      record,
      "id",
      record.recordName ?? ""
    ),

    name: field(
      record,
      "name",
      ""
    ),

    pseudo: field(
      record,
      "pseudo",
      ""
    ),

    password: field(
      record,
      "password",
      ""
    ),

    city: field(
      record,
      "city",
      ""
    ),

    country: field(
      record,
      "country",
      ""
    ),

    language: normalizeLanguage(
      field(
        record,
        "language",
        "fr"
      )
    ),

    photo: assetURL(
      record,
      "photo"
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
    )
  }

  switch (accountType) {
    case "animal":
      return {
        ...commonFields,

        bio: field(
          record,
          "bio",
          ""
        ),

        species: field(
          record,
          "species",
          ""
        ),

        paypalID: field(
          record,
          "paypalID",
          ""
        ),

        badges: field<string[]>(
          record,
          "badges",
          []
        ),

        selectedBadge: field(
          record,
          "selectedBadge",
          ""
        ),

        items: field<string[]>(
          record,
          "items",
          []
        ),

        skins: field<string[]>(
          record,
          "skins",
          []
        ),

        selectedSkin: field(
          record,
          "selectedSkin",
          ""
        ),

        likes: field<string[]>(
          record,
          "likes",
          []
        ),

        dislikes: field<string[]>(
          record,
          "dislikes",
          []
        ),

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

        package: field(
          record,
          "package",
          0
        ),

        share: field(
          record,
          "share",
          0
        ),

        shareOnTiktok: field(
          record,
          "shareOnTiktok",
          0
        ),

        pawpoints: field(
          record,
          "pawpoints",
          0
        ),

        requestsPerDay: field(
          record,
          "requestsPerDay",
          0
        ),

        swipeCount: field(
          record,
          "swipeCount",
          0
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

        lastConnection: field(
          record,
          "lastConnection",
          ""
        )
      }

    case "sitter":
      return {
        ...commonFields,

        infos: field(
          record,
          "infos",
          ""
        ),

        phoneNumber: field(
          record,
          "phoneNumber",
          ""
        ),

        paypalID: field(
          record,
          "paypalID",
          ""
        ),

        tarif: field(
          record,
          "tarif",
          0
        ),

        devise: field(
          record,
          "devise",
          "EUR"
        ),

        skill: field(
          record,
          "skill",
          0
        ),

        fiability: field(
          record,
          "fiability",
          0
        ),

        engagement: field(
          record,
          "engagement",
          0
        ),

        affinity: field(
          record,
          "affinity",
          0
        ),

        services: field<string[]>(
          record,
          "services",
          []
        ),

        disponibilities:
          field<string[]>(
            record,
            "disponibilities",
            []
          ),

        speciesAccepted:
          field<string[]>(
            record,
            "speciesAccepted",
            []
          ),

        buyers: field<string[]>(
          record,
          "buyers",
          []
        ),

        blockedUserIds:
          field<string[]>(
            record,
            "blockedUserIds",
            []
          ),

        notifs: field<string[]>(
          record,
          "notifs",
          []
        ),

        notifMatchId:
          field<string[]>(
            record,
            "notifMatchId",
            []
          ),

        blocked: field(
          record,
          "blocked",
          0
        ),

        package: field(
          record,
          "package",
          0
        ),

        share: field(
          record,
          "share",
          0
        ),

        autoRenew: field(
          record,
          "autoRenew",
          0
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

        stripeSubscriptionID:
          field(
            record,
            "stripeSubscriptionID",
            ""
          ),

        stripeAccountID: field(
          record,
          "stripeAccountID",
          ""
        ),

        lastConnection: field(
          record,
          "lastConnection",
          ""
        ),

        email: field(
          record,
          "email",
          ""
        )
      }

    case "grooming":
      return {
        ...commonFields,

        adress: field(
          record,
          "adress",
          ""
        ),

        phoneNumber: field(
          record,
          "phoneNumber",
          ""
        ),

        infos: field(
          record,
          "infos",
          ""
        ),

        photos: field<string[]>(
          record,
          "photos",
          []
        ),

        collaborators:
          field<string[]>(
            record,
            "collaborators",
            []
          ),

        collaboratorsDispos:
          field<string[]>(
            record,
            "collaboratorsDispos",
            []
          ),

        schedules:
          field<string[]>(
            record,
            "schedules",
            []
          ),

        services: [],

        feedbacks: [],

        userIDs: field<string[]>(
          record,
          "userIDs",
          []
        ),

        notifs: field<string[]>(
          record,
          "notifs",
          []
        ),

        blocked: field(
          record,
          "blocked",
          0
        ),

        package: field(
          record,
          "package",
          0
        ),

        share: field(
          record,
          "share",
          0
        ),

        autoRenew: field(
          record,
          "autoRenew",
          0
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

        stripeCustomerID:
          field(
            record,
            "stripeCustomerID",
            ""
          ),

        stripeSubscriptionID:
          field(
            record,
            "stripeSubscriptionID",
            ""
          ),

        stripeAccountID: field(
          record,
          "stripeAccountID",
          ""
        ),

        lastConnection: field(
          record,
          "lastConnection",
          ""
        ),

        device: field(
          record,
          "device",
          ""
        ),

        email: field(
          record,
          "email",
          ""
        ),

        blockedUserIDs:
          field<string[]>(
            record,
            "blockedUserIDs",
            []
          )
      }

    case "healthcare":
      return {
        ...commonFields,

        adress: field(
          record,
          "adress",
          ""
        ),

        phoneNumber: field(
          record,
          "phoneNumber",
          ""
        ),

        infos: field(
          record,
          "infos",
          ""
        ),

        photos: field<string[]>(
          record,
          "photos",
          []
        ),

        collaborators:
          field<string[]>(
            record,
            "collaborators",
            []
          ),

        collaboratorsDispos:
          field<string[]>(
            record,
            "collaboratorsDispos",
            []
          ),

        schedules:
          field<string[]>(
            record,
            "schedules",
            []
          ),

        services: [],

        feedbacks: [],

        userIDs: field<string[]>(
          record,
          "userIDs",
          []
        ),

        notifs: field<string[]>(
          record,
          "notifs",
          []
        ),

        blocked: field(
          record,
          "blocked",
          0
        ),

        package: field(
          record,
          "package",
          0
        ),

        share: field(
          record,
          "share",
          0
        ),

        autoRenew: field(
          record,
          "autoRenew",
          0
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

        stripeCustomerID:
          field(
            record,
            "stripeCustomerID",
            ""
          ),

        stripeSubscriptionID:
          field(
            record,
            "stripeSubscriptionID",
            ""
          ),

        stripeAccountID: field(
          record,
          "stripeAccountID",
          ""
        ),

        lastConnection: field(
          record,
          "lastConnection",
          ""
        ),

        device: field(
          record,
          "device",
          ""
        ),

        email: field(
          record,
          "email",
          ""
        ),

        expertise: field<string[]>(
          record,
          "expertise",
          []
        ),

        blockedUserIds:
          field<string[]>(
            record,
            "blockedUserIds",
            []
          )
      }
  }
}
