
"use client";

import Link from "next/link";

import Header from "@/components/Header";
import HomeNavbar from "@/components/HomeNavbar";
import Footer from "@/components/Footer";

import { useLanguage } from "@/context/LanguageContext";
import { translate } from "@/translations/translations";

import "../legal-pages.css";

const CONTACT_EMAIL = "n.eddy@zoove.fr";

export default function PrivacyPage() {
  const { language } = useLanguage();
  const t = (key: string) => translate(language, key);

  return (
    <>
      <Header />
      <HomeNavbar />

      <main className="legal-page">
        <div className="legal-container">

          <h1 className="legal-title">
            {t("Politique de confidentialité")}
          </h1>

          <p className="legal-description">
            {t(
              "Découvrez comment Zoove collecte, utilise et protège vos données personnelles."
            )}
          </p>

          <div className="legal-content">

            <section>
              <h2>{t("1. Introduction")}</h2>

              <p>
                {t(
                  "Bienvenue sur Zoove, une plateforme dédiée aux animaux de compagnie, à leurs propriétaires et aux professionnels qui prennent soin d'eux."
                )}
              </p>

              <p>
                {t(
                  "Nous accordons une grande importance à la protection de votre vie privée et de vos données personnelles. Cette politique explique quelles informations sont susceptibles d'être collectées, pourquoi elles sont utilisées, avec qui elles peuvent être partagées et quels sont vos droits."
                )}
              </p>

              <p>
                {t(
                  "Cette politique concerne le site internet Zoove, sa webapp et son application mobile iOS."
                )}
              </p>

              <p>
                <strong>{t("Responsable du traitement :")}</strong>{" "}
                Eddy Nemer
                <br />
                <strong>{t("Nom commercial :")}</strong>{" "}
                Zoove
                <br />
                <strong>{t("Statut juridique :")}</strong>{" "}
                Entrepreneur individuel (micro-entrepreneur)
                <br />
                <strong>{t("SIREN :")}</strong>{" "}
                905 056 339
                <br />
                <strong>{t("Contact :")}</strong>{" "}
                <a href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
              </p>
            </section>

            <section>
              <h2>{t("2. Données personnelles collectées")}</h2>

              <p>
                {t(
                  "Selon votre utilisation de Zoove et les fonctionnalités auxquelles vous accédez, différentes catégories de données peuvent être traitées."
                )}
              </p>

              <h3>{t("Informations du compte utilisateur")}</h3>
              <ul>
                <li>{t("Nom, prénom ou pseudonyme")}</li>
                <li>{t("Adresse électronique")}</li>
                <li>{t("Photo de profil")}</li>
                <li>{t("Ville et pays")}</li>
                <li>{t("Informations nécessaires à l'authentification et à la gestion du compte")}</li>
                <li>{t("Préférences de langue et de notification")}</li>
              </ul>

              <h3>{t("Informations relatives aux animaux")}</h3>
              <ul>
                <li>{t("Nom, espèce, race et caractéristiques de l'animal")}</li>
                <li>{t("Photos et informations renseignées dans son profil")}</li>
                <li>{t("Informations utiles à certaines prestations ou demandes de rendez-vous")}</li>
              </ul>

              <h3>{t("Informations professionnelles")}</h3>
              <ul>
                <li>{t("Nom et coordonnées professionnelles")}</li>
                <li>{t("Présentation de l'activité et des prestations")}</li>
                <li>{t("Tarifs, disponibilités et horaires")}</li>
                <li>{t("Informations liées aux rendez-vous et aux clients")}</li>
                <li>{t("Informations nécessaires aux abonnements et aux paiements")}</li>
              </ul>

              <h3>{t("Informations techniques")}</h3>
              <ul>
                <li>{t("Informations techniques relatives à l'appareil et au navigateur")}</li>
                <li>{t("Données nécessaires à la sécurité et au fonctionnement du service")}</li>
                <li>{t("Localisation lorsque la fonctionnalité le nécessite et que les autorisations applicables sont accordées")}</li>
              </ul>
            </section>

            <section>
              <h2>{t("3. Utilisation des données")}</h2>

              <p>
                {t(
                  "Les données personnelles sont utilisées pour assurer le fonctionnement de Zoove et fournir les fonctionnalités demandées par les utilisateurs."
                )}
              </p>

              <ul>
                <li>{t("Créer et gérer les comptes utilisateurs")}</li>
                <li>{t("Présenter les profils des animaux et des professionnels")}</li>
                <li>{t("Permettre la recherche de professionnels et la gestion des rendez-vous")}</li>
                <li>{t("Faciliter les échanges nécessaires aux prestations")}</li>
                <li>{t("Gérer les abonnements, commandes et paiements")}</li>
                <li>{t("Envoyer les notifications liées à l'utilisation du service")}</li>
                <li>{t("Assurer la sécurité et prévenir les utilisations abusives")}</li>
                <li>{t("Respecter les obligations légales applicables")}</li>
              </ul>

              <p>
                {t(
                  "Selon le traitement concerné, la base légale peut être l'exécution d'un contrat, le respect d'une obligation légale, l'intérêt légitime ou le consentement de la personne concernée."
                )}
              </p>
            </section>

            <section>
              <h2>{t("4. Fonctionnalités Animal.IA")}</h2>

              <p>
                {t(
                  "Zoove propose des fonctionnalités utilisant l'intelligence artificielle afin d'accompagner les propriétaires dans la compréhension de leurs animaux."
                )}
              </p>

              <p>
                {t(
                  "Les informations, questions, images ou autres contenus transmis dans le cadre de ces fonctionnalités peuvent faire l'objet de traitements techniques nécessaires à la génération des résultats."
                )}
              </p>

              <p>
                {t(
                  "Les fonctionnalités Animal.IA sont proposées à titre informatif et ne remplacent pas un diagnostic ou un avis vétérinaire."
                )}
              </p>
            </section>

            <section>
              <h2>{t("5. Partage des données")}</h2>

              <p>
                {t(
                  "Zoove ne vend pas les données personnelles de ses utilisateurs."
                )}
              </p>

              <p>
                {t(
                  "Certaines données peuvent être communiquées uniquement lorsque cela est nécessaire au fonctionnement des services, à la réalisation des prestations ou au respect d'obligations légales."
                )}
              </p>

              <ul>
                <li>{t("Aux professionnels concernés par une demande de rendez-vous ou une prestation")}</li>
                <li>{t("Aux autres utilisateurs lorsque certaines fonctionnalités impliquent un partage d'informations")}</li>
                <li>{t("Aux prestataires techniques nécessaires au fonctionnement de la plateforme")}</li>
                <li>{t("Aux prestataires de paiement pour le traitement des transactions")}</li>
                <li>{t("Aux autorités compétentes lorsque la loi l'exige")}</li>
              </ul>

              <p>
                {t(
                  "Les données accessibles aux autres utilisateurs dépendent des fonctionnalités utilisées et des informations rendues visibles dans la plateforme."
                )}
              </p>
            </section>

            <section>
              <h2>{t("6. Hébergement et sécurité des données")}</h2>

              <p>
                {t(
                  "Zoove utilise notamment des services Apple CloudKit pour certaines données applicatives, Vercel pour l'hébergement de la webapp et Heroku pour son infrastructure backend."
                )}
              </p>

              <p>
                {t(
                  "Des prestataires spécialisés peuvent également intervenir dans le traitement des paiements, des notifications et d'autres fonctionnalités techniques."
                )}
              </p>

              <p>
                {t(
                  "Zoove met en œuvre des mesures techniques et organisationnelles destinées à protéger les données personnelles contre les accès non autorisés, la perte, l'altération et la divulgation."
                )}
              </p>

              <p>
                {t(
                  "Aucun système informatique ne pouvant garantir une sécurité absolue, ces mesures sont adaptées aux risques identifiés et aux technologies utilisées."
                )}
              </p>
            </section>

            <section>
              <h2>{t("7. Durée de conservation")}</h2>

              <p>
                {t(
                  "Les données personnelles sont conservées pendant une durée adaptée aux finalités pour lesquelles elles ont été collectées, aux besoins de fonctionnement du service et aux obligations légales applicables."
                )}
              </p>

              <p>
                {t(
                  "Certaines données liées aux transactions, aux obligations comptables ou à la gestion des litiges peuvent devoir être conservées après la fermeture d'un compte."
                )}
              </p>

              <p>
                {t(
                  "Les durées précises de conservation dépendent de la catégorie de données et du traitement concerné."
                )}
              </p>
            </section>

            <section>
              <h2>{t("8. Vos droits")}</h2>

              <p>
                {t(
                  "Conformément au Règlement général sur la protection des données (RGPD), vous disposez de droits concernant vos données personnelles, dans les conditions prévues par la réglementation."
                )}
              </p>

              <ul>
                <li>{t("Droit d'accès à vos données")}</li>
                <li>{t("Droit de rectification des informations inexactes")}</li>
                <li>{t("Droit à l'effacement dans les conditions légales applicables")}</li>
                <li>{t("Droit à la limitation du traitement")}</li>
                <li>{t("Droit d'opposition à certains traitements")}</li>
                <li>{t("Droit à la portabilité lorsque celui-ci est applicable")}</li>
                <li>{t("Droit de retirer votre consentement lorsqu'un traitement repose sur celui-ci")}</li>
              </ul>

              <p>
                {t(
                  "Pour exercer vos droits, vous pouvez adresser votre demande à :"
                )}{" "}
                <a href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
              </p>

              <p>
                {t(
                  "Vous disposez également du droit d'introduire une réclamation auprès de la Commission nationale de l'informatique et des libertés (CNIL)."
                )}
              </p>

              <p>
                <a
                  href="https://www.cnil.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  www.cnil.fr
                </a>
              </p>
            </section>

            <section>
              <h2>{t("9. Cookies et technologies similaires")}</h2>

              <p>
                {t(
                  "Zoove ne recourt pas volontairement à des cookies publicitaires dans le cadre de son fonctionnement actuel."
                )}
              </p>

              <p>
                {t(
                  "Certaines fonctionnalités peuvent néanmoins utiliser des mécanismes de stockage local ou des technologies nécessaires au fonctionnement du service."
                )}
              </p>

              <p>
                {t(
                  "Les éventuels traceurs non exemptés de consentement feront l'objet des informations et des choix requis par la réglementation applicable."
                )}
              </p>
            </section>

            <section>
              <h2>{t("10. Modifications de la politique")}</h2>

              <p>
                {t(
                  "Cette politique de confidentialité peut être mise à jour afin de tenir compte des évolutions de Zoove, de ses fonctionnalités ou de la réglementation applicable."
                )}
              </p>

              <p>
                {t(
                  "En cas de modification importante, les utilisateurs seront informés par un moyen approprié."
                )}
              </p>
            </section>

            <section>
              <h2>{t("11. Contact")}</h2>

              <p>
                {t(
                  "Pour toute question concernant cette politique ou le traitement de vos données personnelles, vous pouvez nous contacter :"
                )}
              </p>

              <p>
                <a href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
              </p>

              <p>
                <Link href="/contact">
                  {t("Accéder au formulaire de contact")}
                </Link>
              </p>
            </section>

            <section>
              <h2>{t("12. Mise à jour")}</h2>

              <p>
                {t("Dernière mise à jour :")}{" "}
                28 octobre 2026
              </p>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
