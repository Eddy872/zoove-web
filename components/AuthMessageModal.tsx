"use client"

import "./AuthMessageModal.css"

type Props = {
  title: string
  pseudo?: string
  photo?: string
  onClose: () => void
}

export default function AuthMessageModal({
  title,
  pseudo,
  photo,
  onClose
}: Props) {
  return (
    <div className="authMessageOverlay">
      <div className="authMessageBackdrop" onClick={onClose} />

      <div className="authMessageCard">
        {photo && (
          <img
            src={photo}
            alt={pseudo ?? "Utilisateur"}
            className="authMessagePhoto"
          />
        )}

        <h2>
          {title}
          {pseudo ? ` ${pseudo}` : ""}
        </h2>

        <button type="button" onClick={onClose}>
          Continuer
        </button>
      </div>
    </div>
  )
}
