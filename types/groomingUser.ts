import type { ProfessionalUser } from "@/types/professionalUser"

export type GroomingUser = ProfessionalUser & {
  blockedUserIDs: string[]
}
