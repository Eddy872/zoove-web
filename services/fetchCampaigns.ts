import { configureCloudKit } from "./cloudkit"

export type Campaign = {
  id: string
  structId: string
  name: string
  icon: string
  type: string
  status: string
  start: Date
  end: Date
  impressions: number
  clicks: number
  results: number
}

function field(
  record: any,
  name: string,
  fallback: any = ""
) {
  return record.fields?.[name]?.value ?? fallback
}

export async function fetchCampaigns(
  structId: string
): Promise<Campaign[]> {
  const database = await configureCloudKit()

  const campaigns: Campaign[] = []
  let continuationMarker: string | undefined

  do {
    const query: any = {
      recordType: "Campaign",
      filterBy: [
        {
          fieldName: "structId",
          comparator: "EQUALS",
          fieldValue: {
            value: structId
          }
        }
      ],
      resultsLimit: 200
    }

    if (continuationMarker) {
      query.continuationMarker =
        continuationMarker
    }

    const response =
      await database.performQuery(query)

    const records =
      response.records ?? []

    for (const record of records) {
      const start = new Date(
        field(record, "start")
      )

      const end = new Date(
        field(record, "end")
      )

        campaigns.push({
          id: record.recordName,
          structId: field(
            record,
            "structId"
          ),
          name: field(record, "name"),
          icon: field(record, "icon"),
          type: field(record, "type"),
          status: field(record, "status"),
          start,
          end,
          impressions: Number(
            field(record, "impressions", 0)
          ),
          clicks: Number(
            field(record, "clicks", 0)
          ),
          results: Number(
            field(record, "results", 0)
          ),
        })
    }

    continuationMarker =
      response.moreComing &&
      response.continuationMarker
        ? response.continuationMarker
        : undefined
  } while (continuationMarker)

  return campaigns
}
