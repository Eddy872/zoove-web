type UpdateHealthcareGalleryResponse = {
  success?: boolean
  photos?: string[]
  healthcare?: {
    photos?: string[]
  }
  error?: string
}

export async function updateHealthcareGallery(
  healthcareID: string,
  existingPhotos: string[],
  newPhotos: File[]
): Promise<string[]> {
  if (!healthcareID?.trim()) {
    throw new Error(
      "L'identifiant du professionnel est obligatoire."
    )
  }

  const totalPhotos =
    existingPhotos.length +
    newPhotos.length

  if (totalPhotos === 0) {
    throw new Error(
      "Ajoutez au moins une photo."
    )
  }

  if (totalPhotos > 10) {
    throw new Error(
      "Vous pouvez ajouter jusqu'à 10 photos."
    )
  }

  const backendURL =
    process.env.NEXT_PUBLIC_API_URL

  if (!backendURL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL n'est pas configurée."
    )
  }

  const formData = new FormData()

  formData.append(
    "existingPhotos",
    JSON.stringify(existingPhotos)
  )

  newPhotos.forEach(photo => {
    formData.append(
      "photos",
      photo
    )
  })

  const response = await fetch(
    `${backendURL}/api/professionals/healthcare-users/${encodeURIComponent(
      healthcareID
    )}/gallery`,
    {
      method: "PUT",
      body: formData
    }
  )

  const responseText =
    await response.text()

  let data:
    UpdateHealthcareGalleryResponse = {}

  if (responseText.trim()) {
    try {
      data =
        JSON.parse(
          responseText
        ) as UpdateHealthcareGalleryResponse
    } catch {
      throw new Error(
        `Réponse serveur invalide (${response.status}) : ${responseText.slice(
          0,
          200
        )}`
      )
    }
  }

  if (
    !response.ok ||
    !data.success
  ) {
    throw new Error(
      data.error ||
      `Impossible de modifier la galerie (${response.status}).`
    )
  }

  const updatedPhotos =
    data.photos ??
    data.healthcare?.photos

  if (!Array.isArray(updatedPhotos)) {
    throw new Error(
      "Le serveur n'a pas retourné les photos mises à jour."
    )
  }

  return updatedPhotos
}
