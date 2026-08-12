import type { ProfessionalUser } from "@/types/professionalUser"

export type HealthcareUser = ProfessionalUser & {
  expertise: string[]
  blockedUserIds: string[]
}
