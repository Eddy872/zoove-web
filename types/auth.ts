import type { Animal } from "@/types/animal";
import type { GroomingUser } from "@/types/groomingUser";
import type { HealthcareUser } from "@/types/healthcareUser";
import type { SitterUser } from "@/types/sitterUser";

export type AccountType =
    | "animal"
    | "grooming"
    | "healthcare"
    | "sitter";

export type AuthSession =
    | {
          accountType: "animal";
          user: Animal;
      }
    | {
          accountType: "grooming";
          user: GroomingUser;
      }
    | {
          accountType: "healthcare";
          user: HealthcareUser;
      }
    | {
          accountType: "sitter";
          user: SitterUser;
      };
