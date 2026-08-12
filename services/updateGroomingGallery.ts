type UpdateGroomingGalleryResponse = {
  success?: boolean
  photos?: string[]
  grooming?: {
    photos?: string[]
  }
  error?: string
}

export async function updateGroomingGallery(
  groomingID: string,
  existingPhotos: string[],
  newPhotos: File[]
): Promise<string[]> {
  if (!groomingID?.trim()) {
    throw new Error(
      "L'identifiant de l'établissement est obligatoire."
    )
  }

  if (
    existingPhotos.length === 0 &&
    newPhotos.length === 0
  ) {
    throw new Error(
      "Ajoutez au moins une photo de votre établissement."
    )
  }

  if (
    existingPhotos.length +
      newPhotos.length >
    10
  ) {
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

  const formData =
    new FormData()

  formData.append(
    "existingPhotos",
    JSON.stringify(
      existingPhotos
    )
  )

  newPhotos.forEach(photo => {
    formData.append(
      "photos",
      photo
    )
  })

  const response =
    await fetch(
      `${backendURL}/api/professionals/grooming-users/${encodeURIComponent(
        groomingID
      )}/gallery`,
      {
        method: "PUT",
        body: formData
      }
    )

  const responseText =
    await response.text()

  let data:
    UpdateGroomingGalleryResponse = {}

  if (responseText.trim()) {
    try {
      data =
        JSON.parse(
          responseText
        ) as UpdateGroomingGalleryResponse
    } catch {
      throw new Error(
        `Le serveur a renvoyé une réponse invalide (${response.status}) : ${responseText.slice(
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
    data.grooming?.photos

  if (!updatedPhotos) {
    throw new Error(
      "Le serveur n'a pas retourné les photos mises à jour."
    )
  }

  return updatedPhotos
}
