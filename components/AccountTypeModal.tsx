"use client"

import { useRouter } from "next/navigation"

import {
  useLanguage,
  type Language
} from "@/context/LanguageContext"
import { translate } from "@/translations/translations"

import "./AccountTypeModal.css"

type AccountTypeModalProps = {
  onClose: () => void
}

export default function AccountTypeModal({
  onClose
}: AccountTypeModalProps) {
  const router = useRouter()
  const { language } = useLanguage()

  const navigateTo = (
    route: string
  ) => {
    onClose()
    router.push(route)
  }

  return (
    <div
      className="accountTypeModalOverlay"
      onClick={onClose}
    >
      <div
        className="accountTypeModal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <button
          type="button"
          className="accountTypeModalClose"
          onClick={onClose}
          aria-label={translate(
            language,
            "Fermer"
          )}
        >
          ×
        </button>

        <div className="accountTypeModalHeader">
          <h2>
            {translate(
              language,
              "Quel type de compte souhaitez-vous créer ?"
            )}
          </h2>

          <p>
            {translate(
              language,
              "Choisissez le profil qui vous correspond."
            )}
          </p>
        </div>

        <div className="accountTypeChoices">
          <button
            type="button"
            className="accountTypeChoice"
            onClick={() =>
              navigateTo(
                "/create-account"
              )
            }
          >
            <span className="accountTypeIcon">
              🐾
            </span>

            <div>
              <strong>
                {translate(
                  language,
                  "J'ai un animal de compagnie"
                )}
              </strong>

              <span>
                {translate(
                  language,
                  "Je souhaite trouver et réserver des professionnels."
                )}
              </span>
            </div>
          </button>

          <button
            type="button"
            className="accountTypeChoice"
            onClick={() =>
              navigateTo(
                "/create-account/grooming"
              )
            }
          >
            <span className="accountTypeIcon">
              ✂️
            </span>

            <div>
              <strong>
                {translate(
                  language,
                  "Je suis toiletteur"
                )}
              </strong>

              <span>
                {translate(
                  language,
                  "Je souhaite proposer mes services de toilettage."
                )}
              </span>
            </div>
          </button>

          <button
            type="button"
            className="accountTypeChoice"
            onClick={() =>
              navigateTo(
                "/create-account/healthcare"
              )
            }
          >
            <span className="accountTypeIcon">
              🩺
            </span>

            <div>
              <strong>
                {translate(
                  language,
                  "Je suis un professionnel de santé animale"
                )}
              </strong>

              <span>
                {translate(
                  language,
                  "Je souhaite proposer mes services de santé animale."
                )}
              </span>
            </div>
          </button>

          <button
            type="button"
            className="accountTypeChoice"
            onClick={() =>
              navigateTo(
                "/create-account/sitter"
              )
            }
          >
            <span className="accountTypeIcon">
              🐕
            </span>

            <div>
              <strong>
                {translate(
                  language,
                  "Je suis pet sitter"
                )}
              </strong>

              <span>
                {translate(
                  language,
                  "Je souhaite proposer des gardes, visites ou promenades."
                )}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
