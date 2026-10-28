
"use client";

import Link from "next/link";

import Header from "@/components/Header";
import HomeNavbar from "@/components/HomeNavbar";
import Footer from "@/components/Footer";

import { useLanguage } from "@/context/LanguageContext";
import { translate } from "@/translations/translations";

import "../legal-pages.css";


const LEGAL = {
  publisher: "Eddy Nemer",
  businessName: "Zoove",
  legalStatus: "Entrepreneur individuel (micro-entrepreneur)",
  siren: "905 056 339",
  email: "n.eddy@zoove.fr",
  website: "https://zoove.app",
  director: "Eddy Nemer",
  frontendHost: "Vercel",
  backendHost: "Heroku",
  updatedAt: "28 octobre 2026",
};


export default function LegalPage() {
  const { language } = useLanguage();

  const t = (key: string) => translate(language, key);

  return (
    <>
      <Header />
      <HomeNavbar />

      <main className="legal-page">
        <div className="legal-container">

          <h1 className="legal-title">
            {t("Mentions légales")}
          </h1>

          <p className="legal-description">
            {t(
              "Informations relatives à l'éditeur, à l'hébergement et à l'utilisation du site Zoove."
            )}
          </p>

          <div className="legal-content">

            <section>
              <h2>{t("1. Éditeur du site")}</h2>

              <p>
                {t(
                  "Le site Zoove est édité par :"
                )}
              </p>

              <p>
                <strong>{t("Nom de l'éditeur :")}</strong>{" "}
                {LEGAL.publisher}
                <br />

                <strong>{t("Nom commercial :")}</strong>{" "}
                {LEGAL.businessName}
                <br />

                <strong>{t("Statut juridique :")}</strong>{" "}
                {LEGAL.legalStatus}
                <br />

                <strong>{t("SIREN :")}</strong>{" "}
                {LEGAL.siren}
                <br />

                <strong>{t("Adresse électronique :")}</strong>{" "}
                <a href={`mailto:${LEGAL.email}`}>
                  {LEGAL.email}
                </a>
                <br />

                <strong>{t("Site internet :")}</strong>{" "}
                <a
                  href={LEGAL.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {LEGAL.website}
                </a>
              </p>
            </section>

            <section>
              <h2>{t("2. Direction de la publication")}</h2>

              <p>
                {t("Directeur de la publication :")}{" "}
                <strong>{LEGAL.director}</strong>
              </p>

              <p>
                {t(
                  "Pour toute question relative au contenu du site, vous pouvez contacter le directeur de la publication à l'adresse suivante :"
                )}{" "}
                <a href={`mailto:${LEGAL.email}`}>
                  {LEGAL.email}
                </a>
              </p>
            </section>

            <section>
              <h2>{t("3. Hébergement")}</h2>

              <p>
                {t(
                  "Le site Zoove s'appuie sur des services d'hébergement pour son interface web et son infrastructure technique."
                )}
              </p>

              <p>
                <strong>{t("Hébergement du site web :")}</strong>{" "}
                {LEGAL.frontendHost}
                <br />

                <strong>{t("Hébergement du backend :")}</strong>{" "}
                {LEGAL.backendHost}
                <br />
              </p>
            </section>

            <section>
              <h2>{t("4. Présentation du service")}</h2>

              <p>
                {t(
                  "Zoove est une plateforme numérique dédiée aux animaux de compagnie, à leurs propriétaires et aux professionnels qui prennent soin d'eux."
                )}
              </p>

              <p>
                {t(
                  "La plateforme permet notamment de découvrir des professionnels du secteur animalier, de consulter leurs prestations, de demander des rendez-vous et d'accéder à différents services liés aux animaux de compagnie."
                )}
              </p>

              <p>
                {t(
                  "Zoove propose également des outils destinés aux professionnels, notamment pour la présentation de leur activité, la gestion des rendez-vous et l'organisation de leurs services."
                )}
              </p>
            </section>

            <section>
              <h2>{t("5. Propriété intellectuelle")}</h2>

              <p>
                {t(
                  "Les éléments présents sur le site Zoove, notamment les textes, logos, éléments graphiques, interfaces, illustrations, photographies et logiciels, peuvent être protégés par les droits de propriété intellectuelle de leurs titulaires respectifs."
                )}
              </p>

              <p>
                {t(
                  "Toute reproduction, représentation, adaptation ou exploitation non autorisée de contenus protégés est interdite, sauf dans les cas prévus par la législation applicable."
                )}
              </p>

              <p>
                {t(
                  "Les marques, noms commerciaux et contenus appartenant à des tiers restent la propriété de leurs titulaires respectifs."
                )}
              </p>
            </section>

            <section>
              <h2>{t("6. Responsabilité")}</h2>

              <p>
                {t(
                  "Zoove s'efforce de fournir des informations claires et régulièrement actualisées. Toutefois, certaines informations, notamment celles publiées par les professionnels référencés, peuvent évoluer."
                )}
              </p>

              <p>
                {t(
                  "Les informations relatives aux prestations, tarifs, disponibilités et qualifications des professionnels doivent être vérifiées auprès des professionnels concernés."
                )}
              </p>

              <p>
                {t(
                  "Les conditions et limites de responsabilité applicables à l'utilisation de la plateforme sont précisées dans les conditions générales d'utilisation, sous réserve des dispositions légales impératives."
                )}
              </p>
            </section>

            <section>
              <h2>{t("7. Données personnelles")}</h2>

              <p>
                {t(
                  "Dans le cadre de son fonctionnement, Zoove peut être amené à traiter des données personnelles relatives aux utilisateurs et aux professionnels inscrits."
                )}
              </p>

              <p>
                {t(
                  "Les informations relatives aux finalités des traitements, aux destinataires des données, aux durées de conservation et aux droits des personnes concernées sont présentées dans la politique de confidentialité."
                )}
              </p>

              <p>
                <Link href="/privacy">
                  {t("Consulter la politique de confidentialité")}
                </Link>
              </p>
            </section>

            <section>
              <h2>{t("8. Cookies et traceurs")}</h2>

              <p>
                {t(
                  "Le site peut utiliser des cookies ou autres technologies de stockage nécessaires à son fonctionnement, ainsi que d'autres traceurs selon les fonctionnalités et services effectivement activés."
                )}
              </p>

              <p>
                {t(
                  "Pour en savoir plus sur les technologies utilisées et les choix disponibles, consultez la page consacrée à la gestion des cookies."
                )}
              </p>

              <p>
                <Link href="/cookies">
                  {t("Consulter la gestion des cookies")}
                </Link>
              </p>
            </section>

            <section>
              <h2>{t("9. Liens externes")}</h2>

              <p>
                {t(
                  "Le site Zoove peut contenir des liens vers des sites ou services tiers. Ces sites disposent de leurs propres conditions d'utilisation et politiques de confidentialité."
                )}
              </p>
            </section>

            <section>
              <h2>{t("10. Contact")}</h2>

              <p>
                {t(
                  "Pour toute question concernant le site Zoove ou les présentes mentions légales, vous pouvez nous contacter :"
                )}
              </p>

              <p>
                <a href={`mailto:${LEGAL.email}`}>
                  {LEGAL.email}
                </a>
              </p>

              <p>
                <Link href="/contact">
                  {t("Accéder au formulaire de contact")}
                </Link>
              </p>
            </section>

            <section>
              <h2>{t("11. Mise à jour")}</h2>

              <p>
                {t("Dernière mise à jour :")}{" "}
                {LEGAL.updatedAt}
              </p>

              <p>
                {t(
                  "Les présentes mentions légales peuvent être modifiées afin de refléter les évolutions de la plateforme ou les obligations légales applicables."
                )}
              </p>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
