"use client"

import {
  FormEvent,
  useEffect,
  useState
} from "react"

import type {
  Service
} from "@/types/service"

import {
  translate
} from "@/translations/translations"
import type { Language } from "@/context/LanguageContext"

type ServiceFormItem = {
  id: string
  name: string
  description: string
  price: string
  duration: string
  devise: string

  bookingMode: string
  requiredInformations: string[]
  customQuestions: string[]
}

type ServicesModalProps = {
  isOpen: boolean
  services: Service[]
  healthcareID: string
  language: Language
  onClose: () => void
  onSave: (
    services: Service[]
  ) => Promise<void>
}

const availableCurrencies = [
  {
    code: "€",
    label: "EUR (€)"
  },
  {
    code: "$",
    label: "USD ($)"
  },
  {
    code: "£",
    label: "GBP (£)"
  },
  {
    code: "CHF",
    label: "CHF"
  }
]

function generateID(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID()
  }

  return (
    Date.now().toString(36) +
    Math.random()
      .toString(36)
      .slice(2)
  )
}

function createEmptyService():
  ServiceFormItem {
  return {
    id: generateID(),
    name: "",
    description: "",
    price: "",
    duration: "",
    devise: "€",

    bookingMode: "direct",
    requiredInformations: [],
    customQuestions: []
  }
}

function createInitialServices(
  services: Service[]
): ServiceFormItem[] {
  return services.map(service => ({
    id:
      service.id ||
      generateID(),

    name:
      service.name ?? "",

    description:
      service.description ?? "",

    price:
      service.price !== undefined
        ? String(service.price)
        : "",

    duration:
      service.duration !== undefined
        ? String(service.duration)
        : "",

    devise:
      service.devise || "€",

    bookingMode:
      service.bookingMode ||
      "direct",

    requiredInformations:
      service.requiredInformations ??
      [],

    customQuestions:
      service.customQuestions ??
      []
  }))
}

export default function ServicesModal({
  isOpen,
  services,
  healthcareID,
  language,
  onClose,
  onSave
}: ServicesModalProps) {
  const [
    formServices,
    setFormServices
  ] = useState<
    ServiceFormItem[]
  >([])

  const [
    error,
    setError
  ] = useState("")

  const [
    isSaving,
    setIsSaving
  ] = useState(false)
    console.log(
      "ServicesModal services =",
      services
    )
  useEffect(() => {
    if (!isOpen) {
      return
    }

    setFormServices(
      createInitialServices(
        services
      )
    )

    setError("")
  }, [
    isOpen,
    services
  ])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow =
      "hidden"

    return () => {
      document.body.style.overflow =
        previousOverflow
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  function addService() {
    setFormServices(
      currentServices => [
        ...currentServices,
        createEmptyService()
      ]
    )
  }

  function removeService(
    serviceIndex: number
  ) {
    setFormServices(
      currentServices =>
        currentServices.filter(
          (_, index) =>
            index !== serviceIndex
        )
    )
  }

    function updateService<K extends keyof Omit<
      ServiceFormItem,
      "id"
    >>(
      serviceIndex: number,
      field: K,
      value: ServiceFormItem[K]
    ) {
      setFormServices(
        currentServices =>
          currentServices.map(
            (service, index) =>
              index === serviceIndex
                ? {
                    ...service,
                    [field]: value
                  }
                : service
          )
      )
    }
    
    function toggleRequiredInformation(
      serviceIndex: number,
      information: string
    ) {
      setFormServices(
        currentServices =>
          currentServices.map(
            (service, index) => {
              if (
                index !== serviceIndex
              ) {
                return service
              }

              const exists =
                service.requiredInformations.includes(
                  information
                )

              return {
                ...service,

                requiredInformations:
                  exists
                    ? service.requiredInformations.filter(
                        item =>
                          item !==
                          information
                      )
                    : [
                        ...service.requiredInformations,
                        information
                      ]
              }
            }
          )
      )
    }
    
    function addCustomQuestion(
      serviceIndex: number
    ) {
      setFormServices(
        currentServices =>
          currentServices.map(
            (service, index) =>
              index === serviceIndex
                ? {
                    ...service,

                    customQuestions: [
                      ...service.customQuestions,
                      ""
                    ]
                  }
                : service
          )
      )
    }

    function updateCustomQuestion(
      serviceIndex: number,
      questionIndex: number,
      value: string
    ) {
      setFormServices(
        currentServices =>
          currentServices.map(
            (service, index) => {
              if (
                index !== serviceIndex
              ) {
                return service
              }

              return {
                ...service,

                customQuestions:
                  service.customQuestions.map(
                    (
                      question,
                      index
                    ) =>
                      index ===
                      questionIndex
                        ? value
                        : question
                  )
              }
            }
          )
      )
    }

    function removeCustomQuestion(
      serviceIndex: number,
      questionIndex: number
    ) {
      setFormServices(
        currentServices =>
          currentServices.map(
            (service, index) =>
              index === serviceIndex
                ? {
                    ...service,

                    customQuestions:
                      service.customQuestions.filter(
                        (_, index) =>
                          index !==
                          questionIndex
                      )
                  }
                : service
          )
      )
    }

  function validate(): boolean {
    const invalidService =
      formServices.find(
        service => {
          const price =
            Number(
              service.price.replace(
                ",",
                "."
              )
            )

          const duration =
            Number(
              service.duration
            )

          return (
            !service.name.trim() ||
            !service.description.trim() ||
            !Number.isFinite(
              price
            ) ||
            price < 0 ||
            !Number.isInteger(
              duration
            ) ||
            duration <= 0 ||
            !service.devise.trim()
          )
        }
      )

    if (invalidService) {
      setError(
        translate(
          language,
          "Vérifiez les prestations renseignées."
        )
      )

      return false
    }

    setError("")
    return true
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (
      isSaving ||
      !validate()
    ) {
      return
    }

    setIsSaving(true)
    setError("")

    try {
        const formattedServices:
          Service[] =
          formServices.map(
            service => ({
              id:
                service.id ||
                generateID(),

              groomingID:
                healthcareID,

              name:
                service.name.trim(),

              description:
                service.description.trim(),

              price:
                Number(
                  service.price.replace(
                    ",",
                    "."
                  )
                ),

              duration:
                Number(
                  service.duration
                ),

              devise:
                service.devise.trim() ||
                "€",

              bookingMode:
                service.bookingMode,

              requiredInformations:
                service.requiredInformations,

              customQuestions:
                service.customQuestions
            })
          )

      await onSave(
        formattedServices
      )
    } catch (saveError) {
      console.error(
        "Erreur sauvegarde prestations :",
        saveError
      )

      setError(
        saveError instanceof Error
          ? saveError.message
          : translate(
              language,
              "Impossible d'enregistrer les prestations."
            )
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="groomingModalOverlay"
      role="presentation"
      onMouseDown={event => {
        if (
          event.target ===
            event.currentTarget &&
          !isSaving
        ) {
          onClose()
        }
      }}
    >
      <div
        className="groomingServicesModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="services-modal-title"
      >
        <div className="groomingModalHeader">
          <div>
            <h2 id="services-modal-title">
              {translate(
                language,
                "Modifier les prestations"
              )}
            </h2>

            <p>
              {translate(
                language,
                "Ajoutez les prestations proposées par votre établissement."
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
          className="servicesModalForm"
          onSubmit={handleSubmit}
        >
          <div className="servicesModalToolbar">
            <span>
              {formServices.length}{" "}
              {translate(
                language,
                formServices.length > 1
                  ? "prestations"
                  : "prestation"
              )}
            </span>

            <button
              type="button"
              className="secondaryButton"
              onClick={addService}
              disabled={isSaving}
            >
              +{" "}
              {translate(
                language,
                "Ajouter une prestation"
              )}
            </button>
          </div>

          {formServices.length ===
          0 ? (
            <div className="servicesModalEmpty">
              <p>
                {translate(
                  language,
                  "Aucune prestation ajoutée."
                )}
              </p>

              <button
                type="button"
                className="secondaryButton"
                onClick={addService}
                disabled={isSaving}
              >
                +{" "}
                {translate(
                  language,
                  "Ajouter une prestation"
                )}
              </button>
            </div>
          ) : (
            <div className="servicesModalList">
              {formServices.map(
                (
                  service,
                  serviceIndex
                ) => (
                  <div
                    className="servicesModalCard"
                    key={service.id}
                  >
                    <div className="servicesModalCardHeader">
                      <h3>
                        {translate(
                          language,
                          "Prestation"
                        )}{" "}
                        {serviceIndex + 1}
                      </h3>

                      <button
                        type="button"
                        className="servicesModalRemoveButton"
                        onClick={() =>
                          removeService(
                            serviceIndex
                          )
                        }
                        disabled={isSaving}
                        aria-label={translate(
                          language,
                          "Supprimer la prestation"
                        )}
                      >
                        ×
                      </button>
                    </div>

                    <div className="servicesModalFieldsGrid">
                      <label>
                        <span>
                          {translate(
                            language,
                            "Nom"
                          )}
                        </span>

                        <input
                          type="text"
                          value={
                            service.name
                          }
                          onChange={event =>
                            updateService(
                              serviceIndex,
                              "name",
                              event
                                .target
                                .value
                            )
                          }
                          disabled={
                            isSaving
                          }
                        />
                      </label>

                      <label>
                        <span>
                          {translate(
                            language,
                            "Devise"
                          )}
                        </span>

                        <select
                          value={
                            service.devise
                          }
                          onChange={event =>
                            updateService(
                              serviceIndex,
                              "devise",
                              event
                                .target
                                .value
                            )
                          }
                          disabled={
                            isSaving
                          }
                        >
                          {availableCurrencies.map(
                            currency => (
                              <option
                                key={
                                  currency.code
                                }
                                value={
                                  currency.code
                                }
                              >
                                {
                                  currency.label
                                }
                              </option>
                            )
                          )}
                        </select>
                      </label>

                      <label className="servicesModalFullWidth">
                        <span>
                          {translate(
                            language,
                            "Description"
                          )}
                        </span>

                        <textarea
                          value={
                            service.description
                          }
                          onChange={event =>
                            updateService(
                              serviceIndex,
                              "description",
                              event
                                .target
                                .value
                            )
                          }
                          rows={4}
                          disabled={
                            isSaving
                          }
                        />
                      </label>

                      <label>
                        <span>
                          {translate(
                            language,
                            "Prix minimum"
                          )}
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            service.price
                          }
                          onChange={event =>
                            updateService(
                              serviceIndex,
                              "price",
                              event
                                .target
                                .value
                            )
                          }
                          disabled={
                            isSaving
                          }
                        />
                      </label>

                      <label>
                        <span>
                          {translate(
                            language,
                            "Durée minimum (minutes)"
                          )}
                        </span>

                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={
                            service.duration
                          }
                          onChange={event =>
                            updateService(
                              serviceIndex,
                              "duration",
                              event
                                .target
                                .value
                            )
                          }
                          disabled={
                            isSaving
                          }
                        />
                      </label>
                      
                      <label className="servicesModalFullWidth">
                        <span>
                          {translate(
                            language,
                            "Mode de réservation"
                          )}
                        </span>

                        <select
                          value={
                            service.bookingMode
                          }
                          onChange={event =>
                            updateService(
                              serviceIndex,
                              "bookingMode",
                              event.target.value
                            )
                          }
                          disabled={isSaving}
                        >
                          <option value="direct">
                            {translate(
                              language,
                              "Réservation directe"
                            )}
                          </option>

                          <option value="approvalRequired">
                            {translate(
                              language,
                              "Demande de rendez-vous"
                            )}
                          </option>
                        </select>
                      </label>
                    </div>
                      <div className="servicesModalFullWidth servicesModalOptionsSection">
                        <span className="servicesModalSectionLabel">
                          {translate(
                            language,
                            "Informations demandées avant le rendez-vous"
                          )}
                        </span>

                        <div className="servicesModalCheckboxGrid">
                          <label className="servicesModalCheckbox">
                            <input
                              type="checkbox"
                              checked={
                                service.requiredInformations.includes(
                                  "behavior"
                                )
                              }
                              onChange={() =>
                                toggleRequiredInformation(
                                  serviceIndex,
                                  "behavior"
                                )
                              }
                              disabled={isSaving}
                            />

                            <span>
                              {translate(
                                language,
                                "Comportement"
                              )}
                            </span>
                          </label>

                          <label className="servicesModalCheckbox">
                            <input
                              type="checkbox"
                              checked={
                                service.requiredInformations.includes(
                                  "coatCondition"
                                )
                              }
                              onChange={() =>
                                toggleRequiredInformation(
                                  serviceIndex,
                                  "coatCondition"
                                )
                              }
                              disabled={isSaving}
                            />

                            <span>
                              {translate(
                                language,
                                "État du pelage"
                              )}
                            </span>
                          </label>

                          <label className="servicesModalCheckbox">
                            <input
                              type="checkbox"
                              checked={
                                service.requiredInformations.includes(
                                  "weight"
                                )
                              }
                              onChange={() =>
                                toggleRequiredInformation(
                                  serviceIndex,
                                  "weight"
                                )
                              }
                              disabled={isSaving}
                            />

                            <span>
                              {translate(
                                language,
                                "Poids"
                              )}
                            </span>
                          </label>

                          <label className="servicesModalCheckbox">
                            <input
                              type="checkbox"
                              checked={
                                service.requiredInformations.includes(
                                  "notes"
                                )
                              }
                              onChange={() =>
                                toggleRequiredInformation(
                                  serviceIndex,
                                  "notes"
                                )
                              }
                              disabled={isSaving}
                            />

                            <span>
                              {translate(
                                language,
                                "Informations complémentaires"
                              )}
                            </span>
                          </label>
                        </div>
                      </div>
                      <div className="servicesModalFullWidth servicesModalQuestionsSection">
                        <span className="servicesModalSectionLabel">
                          {translate(
                            language,
                            "Questions personnalisées"
                          )}
                        </span>

                        {service.customQuestions.length > 0 && (
                          <div className="servicesModalQuestionsList">
                            {service.customQuestions.map(
                              (question, questionIndex) => (
                                <div
                                  className="servicesModalQuestionRow"
                                  key={questionIndex}
                                >
                                  <input
                                    type="text"
                                    value={question}
                                    placeholder={translate(
                                      language,
                                      "Votre question..."
                                    )}
                                    onChange={event =>
                                      updateCustomQuestion(
                                        serviceIndex,
                                        questionIndex,
                                        event.target.value
                                      )
                                    }
                                    disabled={isSaving}
                                  />

                                  <button
                                    type="button"
                                    className="servicesModalQuestionRemove"
                                    onClick={() =>
                                      removeCustomQuestion(
                                        serviceIndex,
                                        questionIndex
                                      )
                                    }
                                    disabled={isSaving}
                                    aria-label={translate(
                                      language,
                                      "Supprimer la question"
                                    )}
                                  >
                                    ×
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          className="servicesModalAddQuestion"
                          onClick={() =>
                            addCustomQuestion(
                              serviceIndex
                            )
                          }
                          disabled={isSaving}
                        >
                          <span>+</span>

                          {translate(
                            language,
                            "Ajouter une question"
                          )}
                        </button>
                      </div>
                  </div>
                )
              )}
            </div>
          )}

          {error && (
            <p
              className="modalError"
              role="alert"
            >
              {error}
            </p>
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
      </div>
    </div>
  )
}

