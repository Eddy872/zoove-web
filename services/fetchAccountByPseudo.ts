import { fetchClientByPseudo } from "./fetchClientUser"
import { fetchGroomingByPseudo } from "./fetchGroomingUser"
import { fetchHealthcareByPseudo } from "./fetchHealthcareUser"
import { fetchSitterByPseudo } from "./fetchSitterUser"

import type { AuthSession } from "@/types/auth"

export async function fetchAccountByPseudo(
  pseudo: string
): Promise<AuthSession | null> {
  const normalizedPseudo = pseudo.trim()

  const animal = await fetchClientByPseudo(normalizedPseudo)

  if (animal) {
    return {
      accountType: "animal",
      user: animal
    }
  }

  const grooming =
    await fetchGroomingByPseudo(normalizedPseudo)

  if (grooming) {
    return {
      accountType: "grooming",
      user: grooming
    }
  }

  const healthcare =
    await fetchHealthcareByPseudo(normalizedPseudo)

  if (healthcare) {
    return {
      accountType: "healthcare",
      user: healthcare
    }
  }

  const sitter =
    await fetchSitterByPseudo(normalizedPseudo)

  if (sitter) {
    return {
      accountType: "sitter",
      user: sitter
    }
  }

  return null
}
