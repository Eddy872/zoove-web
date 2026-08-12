import type { AccountType } from "@/types/auth";
import { configureCloudKit } from "@/services/cloudkit";

export const ACCOUNT_RECORD_TYPES = [
    {
        recordType: "Animals",
        accountType: "animal",
    },
    {
        recordType: "GroomingUser",
        accountType: "grooming",
    },
    {
        recordType: "HealthcareUser",
        accountType: "healthcare",
    },
    {
        recordType: "SitterUser",
        accountType: "sitter",
    },
] as const satisfies ReadonlyArray<{
    recordType: string;
    accountType: AccountType;
}>;

export type FoundAccount = {
    accountType: AccountType;
    record: any;
};

async function fetchRecordByPseudo(
    recordType: string,
    pseudo: string
): Promise<any | null> {
    const database = await configureCloudKit()

    const response = await database.performQuery({
        recordType,
        filterBy: [
            {
                fieldName: "pseudo",
                comparator: "EQUALS",
                fieldValue: {
                    value: pseudo,
                },
            },
        ],
    });

    return response.records?.[0] ?? null;
}

export async function findAccountByPseudo(
    pseudo: string
): Promise<FoundAccount | null> {
    for (const account of ACCOUNT_RECORD_TYPES) {
        const record = await fetchRecordByPseudo(
            account.recordType,
            pseudo
        );

        if (record) {
            return {
                accountType: account.accountType,
                record,
            };
        }
    }

    return null;
}
