import type { BaseUser } from "@/types/baseUser";

export type SitterUser = BaseUser & {
    pseudo: string;
    infos: string;

    phoneNumber: string;
    paypalID: string;
    email?: string;
    tarif: number;
    devise: string;

    skill: number;
    fiability: number;
    engagement: number;
    affinity: number;

    services: string[];
    disponibilities: string[];
    speciesAccepted: string[];

    buyers: string[];
    blockedUserIds: string[];

    notifs: string[];
    notifMatchId: string[];

    blocked: number;
    package: number;
    share: number;

    autoRenew: number;

    packageStart: string;
    packageEnd: string;

    stripeCustomerID: string;
    stripeSubscriptionID: string;

    stripeAccountID: string;
    lastConnection: string;
};
