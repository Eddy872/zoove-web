
import { NextResponse } from "next/server"
import { Resend } from "resend"

export const runtime = "nodejs"

const contactTypes: Record<string, string> = {
  owner: "Propriétaire d'animal",
  professional: "Professionnel",
  other: "Autre",
}

const professions = [
  "Toiletteur / Toiletteuse",
  "Pet sitter",
  "Vétérinaire",
  "Éducateur canin",
  "Ostéopathe animalier",
  "Nutritionniste animalier",
  "Autre",
]

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
  email.length <= 254

const isValidText = (
  value: unknown,
  maxLength: number,
  required = true
): value is string => {
  if (typeof value !== "string") return false

  const trimmed = value.trim()

  return (
    trimmed.length <= maxLength &&
    (!required || trimmed.length >= 0) &&
    (required ? trimmed.length > 0 : true)
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Données invalides." },
        { status: 400 }
      )
    }

    const isZoovePro = body.type === "zoove-pro"

    let subject = ""
    let emailText = ""
    let replyTo = ""

    if (isZoovePro) {
      // CANDIDATURE ZOOVE PRO

      const {
        name,
        email,
        phone,
        city,
        profession,
        business = "",
        message = "",
      } = body

      if (
        !isValidText(name, 120) ||
        !isValidText(email, 254) ||
        !isValidEmail(email.trim()) ||
        !isValidText(phone, 30) ||
        !isValidText(city, 120) ||
        !isValidText(profession, 100) ||
        !professions.includes(profession) ||
        !isValidText(business, 120, false) ||
        !isValidText(message, 2000, false)
      ) {
        return NextResponse.json(
          { error: "Veuillez vérifier les champs." },
          { status: 400 }
        )
      }

      replyTo = email.trim()

      subject = `Nouvelle candidature Zoove Pro - ${profession}`

      emailText = [
        "NOUVELLE CANDIDATURE ZOOVE PRO",
        "",
        `Nom : ${name.trim()}`,
        `E-mail : ${replyTo}`,
        `Téléphone : ${phone.trim()}`,
        `Ville : ${city.trim()}`,
        `Profession : ${profession}`,
        `Établissement : ${business.trim() || "Non renseigné"}`,
        "",
        "Activité / Motivation :",
        message.trim() || "Non renseigné",
      ].join("\n")
    } else {
      // FORMULAIRE CONTACT CLASSIQUE
      // Fonctionnement existant conservé

      const {
        name,
        email,
        message,
        contactType,
      } = body

      if (
        !isValidText(name, 100) ||
        !isValidText(email, 254) ||
        !isValidEmail(email.trim()) ||
        !isValidText(message, 5000) ||
        typeof contactType !== "string" ||
        !contactTypes[contactType]
      ) {
        return NextResponse.json(
          { error: "Veuillez vérifier les champs." },
          { status: 400 }
        )
      }

      replyTo = email.trim()

      subject = `Nouveau contact Zoove - ${contactTypes[contactType]}`

      emailText = [
        `Profil : ${contactTypes[contactType]}`,
        `Nom : ${name.trim()}`,
        `E-mail : ${replyTo}`,
        "",
        "Message :",
        message.trim(),
      ].join("\n")
    }

    // CONFIGURATION RESEND

    const apiKey = process.env.RESEND_API_KEY
    const recipient = process.env.CONTACT_EMAIL

    if (!apiKey || !recipient) {
      console.error("Configuration e-mail manquante")

      return NextResponse.json(
        { error: "Service indisponible." },
        { status: 503 }
      )
    }

    const resend = new Resend(apiKey)

    const { error } = await resend.emails.send({
      from: "Zoove Contact <n.eddy@zoove.fr>",
      to: recipient,
      replyTo,
      subject,
      text: emailText,
    })

    if (error) {
      console.error("Erreur Resend :", error)

      return NextResponse.json(
        { error: "Impossible d'envoyer le message." },
        { status: 502 }
      )
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  } catch (error) {
    console.error("Erreur API Contact :", error)

    return NextResponse.json(
      { error: "Erreur lors de l'envoi." },
      { status: 500 }
    )
  }
}
