
"use client"

import {
  ChangeEvent,
  FormEvent,
  MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"

import {
  translate
} from "@/translations/translations"
import type { Language } from "@/context/LanguageContext"

type GalleryModalProps = {
  photos: string[]
  language: Language
  onClose: () => void
  onSave: (
    existingPhotos: string[],
    newPhotos: File[]
  ) => Promise<void>
}

type NewPhoto = {
  id: string
  file: File
  previewUrl: string
}

const MAX_PHOTOS = 10
const MAX_FILE_SIZE = 5 * 1024 * 1024

export default function GalleryModal({
  photos,
  language,
  onClose,
  onSave
}: GalleryModalProps) {
  const inputRef =
    useRef<HTMLInputElement>(null)

  const [
    existingPhotos,
    setExistingPhotos
  ] = useState<string[]>(photos)

  const [
    newPhotos,
    setNewPhotos
  ] = useState<NewPhoto[]>([])

  const [
    isSaving,
    setIsSaving
  ] = useState(false)

  const [
    error,
    setError
  ] = useState("")

  const totalPhotos =
    existingPhotos.length +
    newPhotos.length

  const canAddPhotos =
    totalPhotos < MAX_PHOTOS

  const remainingPhotoCount =
    MAX_PHOTOS - totalPhotos

  const newPhotoUrls = useMemo(
    () =>
      newPhotos.map(
        photo => photo.previewUrl
      ),
    [newPhotos]
  )

  useEffect(() => {
    setExistingPhotos(photos)
  }, [photos])

  useEffect(() => {
    function handleEscape(
      event: KeyboardEvent
    ) {
      if (
        event.key === "Escape" &&
        !isSaving
      ) {
        onClose()
      }
    }

    document.addEventListener(
      "keydown",
      handleEscape
    )

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow =
      "hidden"

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      )

      document.body.style.overflow =
        previousOverflow
    }
  }, [isSaving, onClose])

  useEffect(() => {
    return () => {
      newPhotoUrls.forEach(
        previewUrl => {
          URL.revokeObjectURL(
            previewUrl
          )
        }
      )
    }
  }, [newPhotoUrls])

  function openFilePicker() {
    if (
      isSaving ||
      !canAddPhotos
    ) {
      return
    }

    inputRef.current?.click()
  }

  function handleFilesChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selectedFiles =
      Array.from(
        event.target.files ?? []
      )

    event.target.value = ""

    if (selectedFiles.length === 0) {
      return
    }

    const validFiles: File[] = []

    for (
      const file of selectedFiles
    ) {
      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        setError(
          translate(
            language,
            "Le fichier sélectionné doit être une image."
          )
        )
        continue
      }

      if (
        file.size >
        MAX_FILE_SIZE
      ) {
        setError(
          translate(
            language,
            "La photo ne doit pas dépasser 5 Mo."
          )
        )
        continue
      }

      validFiles.push(file)
    }

    const availableFiles =
      validFiles.slice(
        0,
        remainingPhotoCount
      )

    if (
      validFiles.length >
      remainingPhotoCount
    ) {
      setError(
        translate(
          language,
          "Vous pouvez ajouter jusqu'à 10 photos."
        )
      )
    } else if (
      availableFiles.length > 0
    ) {
      setError("")
    }

    const formattedPhotos =
      availableFiles.map(file => ({
        id: crypto.randomUUID(),
        file,
        previewUrl:
          URL.createObjectURL(file)
      }))

    setNewPhotos(previous => [
      ...previous,
      ...formattedPhotos
    ])
  }

  function removeExistingPhoto(
    photoUrl: string
  ) {
    if (isSaving) {
      return
    }

    setExistingPhotos(previous =>
      previous.filter(
        photo => photo !== photoUrl
      )
    )

    setError("")
  }

  function removeNewPhoto(
    photoId: string
  ) {
    if (isSaving) {
      return
    }

    setNewPhotos(previous => {
      const photoToRemove =
        previous.find(
          photo =>
            photo.id === photoId
        )

      if (photoToRemove) {
        URL.revokeObjectURL(
          photoToRemove.previewUrl
        )
      }

      return previous.filter(
        photo =>
          photo.id !== photoId
      )
    })

    setError("")
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (isSaving) {
      return
    }

    if (
      existingPhotos.length === 0 &&
      newPhotos.length === 0
    ) {
      setError(
        translate(
          language,
          "Ajoutez au moins une photo de votre établissement."
        )
      )
      return
    }

    try {
      setIsSaving(true)
      setError("")

      await onSave(
        existingPhotos,
        newPhotos.map(
          photo => photo.file
        )
      )
    } catch (saveError) {
      console.error(
        "Erreur modification galerie :",
        saveError
      )

      setError(
        saveError instanceof Error
          ? saveError.message
          : translate(
              language,
              "Impossible de modifier la galerie."
            )
      )
    } finally {
      setIsSaving(false)
    }
  }

  function handleOverlayClick(
    event: MouseEvent<HTMLDivElement>
  ) {
    if (
      event.target ===
        event.currentTarget &&
      !isSaving
    ) {
      onClose()
    }
  }

  return (
    <div
      className="groomingModalOverlay"
      role="presentation"
      onMouseDown={
        handleOverlayClick
      }
    >
      <section
        className="groomingModal groomingGalleryModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="galleryModalTitle"
      >
        <div className="groomingModalHeader">
          <div>
            <h2 id="galleryModalTitle">
              {translate(
                language,
                "Modifier la galerie"
              )}
            </h2>

            <p>
              {translate(
                language,
                "Ajoutez des photos de votre établissement."
              )}
            </p>
          </div>

          <button
            type="button"
            className="groomingModalCloseButton"
            onClick={onClose}
            disabled={isSaving}
            aria-label={translate(
              language,
              "Fermer"
            )}
          >
            ×
          </button>
        </div>

        <form
          className="groomingModalForm"
          onSubmit={handleSubmit}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={
              handleFilesChange
            }
          />

          <div className="groomingGalleryHeader">
            <span>
              {totalPhotos} /{" "}
              {MAX_PHOTOS}{" "}
              {translate(
                language,
                "photos"
              )}
            </span>

            <button
              type="button"
              className="groomingSecondaryButton"
              onClick={openFilePicker}
              disabled={
                isSaving ||
                !canAddPhotos
              }
            >
              +{" "}
              {translate(
                language,
                "Ajouter des photos"
              )}
            </button>
          </div>

          <div className="groomingGalleryGrid">
            {existingPhotos.map(
              (photoUrl, index) => (
                <div
                  key={`${photoUrl}-${index}`}
                  className="groomingGalleryItem"
                >
                  <img
                    src={photoUrl}
                    alt={`${translate(
                      language,
                      "Photo de l'établissement"
                    )} ${index + 1}`}
                  />

                  <button
                    type="button"
                    className="groomingGalleryRemoveButton"
                    onClick={() =>
                      removeExistingPhoto(
                        photoUrl
                      )
                    }
                    disabled={isSaving}
                    aria-label={translate(
                      language,
                      "Supprimer la photo"
                    )}
                  >
                    ×
                  </button>
                </div>
              )
            )}

            {newPhotos.map(
              (photo, index) => (
                <div
                  key={photo.id}
                  className="groomingGalleryItem"
                >
                  <img
                    src={
                      photo.previewUrl
                    }
                    alt={`${translate(
                      language,
                      "Nouvelle photo"
                    )} ${index + 1}`}
                  />

                  <span className="groomingGalleryNewBadge">
                    {translate(
                      language,
                      "Nouvelle"
                    )}
                  </span>

                  <button
                    type="button"
                    className="groomingGalleryRemoveButton"
                    onClick={() =>
                      removeNewPhoto(
                        photo.id
                      )
                    }
                    disabled={isSaving}
                    aria-label={translate(
                      language,
                      "Supprimer la photo"
                    )}
                  >
                    ×
                  </button>
                </div>
              )
            )}

            {canAddPhotos && (
              <button
                type="button"
                className="groomingGalleryAddCard"
                onClick={
                  openFilePicker
                }
                disabled={isSaving}
              >
                <span className="groomingGalleryAddIcon">
                  +
                </span>

                <span>
                  {translate(
                    language,
                    "Ajouter une photo"
                  )}
                </span>

                <small>
                  JPG, PNG ou WEBP
                  <br />
                  5 Mo maximum
                </small>
              </button>
            )}
          </div>

          {error && (
            <div
              className="groomingModalError"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="groomingModalActions">
            <button
              type="button"
              className="groomingSecondaryButton"
              onClick={onClose}
              disabled={isSaving}
            >
              {translate(
                language,
                "Annuler"
              )}
            </button>

            <button
              type="submit"
              className="groomingPrimaryButton"
              disabled={isSaving}
            >
              {isSaving
                ? translate(
                    language,
                    "Enregistrement..."
                  )
                : translate(
                    language,
                    "Enregistrer"
                  )}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
