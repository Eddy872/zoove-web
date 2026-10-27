
import { NextResponse } from "next/server"
import { Resend } from "resend"

export const runtime = "nodejs"

const contactTypes: Record<string, string> = {
  owner: "Propriétaire d'animal",
  professional: "Professionnel",
  other: "Autre",
}

export async function POST(request: Request) {
  try {
    const { name, email, message, contactType } =
      await request.json()

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof message !== "string" ||
      typeof contactType !== "string"
    ) {
      return NextResponse.json(
        { error: "Données invalides." },
        { status: 400 }
      )
    }

    const cleanName = name.trim()
    const cleanEmail = email.trim()
    const cleanMessage = message.trim()

    if (
      !cleanName ||
      cleanName.length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
      cleanEmail.length > 254 ||
      !cleanMessage ||
      cleanMessage.length > 5000 ||
      !contactTypes[contactType]
    ) {
      return NextResponse.json(
        { error: "Veuillez vérifier les champs." },
        { status: 400 }
      )
    }

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
      replyTo: cleanEmail,
      subject: `Nouveau contact Zoove - ${contactTypes[contactType]}`,
      text: [
        `Profil : ${contactTypes[contactType]}`,
        `Nom : ${cleanName}`,
        `E-mail : ${cleanEmail}`,
        "",
        "Message :",
        cleanMessage,
      ].join("\n"),
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

