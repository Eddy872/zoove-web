
"use client";

import Link from "next/link";

import Header from "@/components/Header";
import HomeNavbar from "@/components/HomeNavbar";
import Footer from "@/components/Footer";

import { useLanguage } from "@/context/LanguageContext";
import { translate } from "@/translations/translations";

import "../legal-pages.css";

const CONTACT_EMAIL = "n.eddy@zoove.fr";

export default function TermsPage() {
  const { language } = useLanguage();
  const t = (key: string) => translate(language, key);

  return (
    <>
      <Header />
      <HomeNavbar />

      <main className="legal-page">
        <div className="legal-container">
          <h1 className="legal-title">
            {t("Conditions générales d'utilisation")}
          </h1>

          <p className="legal-description">
            {t(
              "Les règles d'utilisation de Zoove pour les propriétaires d'animaux et les professionnels."
            )}
          </p>

          <div className="legal-content">
            <section>
              <h2>{t("Article 1 : Identification")}</h2>

              <p>
                {t(
                  "Zoove est une plateforme éditée par Eddy Nemer, entrepreneur individuel exerçant sous le nom commercial Zoove, immatriculé sous le numéro SIREN 905 056 339."
                )}
              </p>

              <p>
                {t(
                  "Zoove est une plateforme numérique dédiée aux propriétaires d'animaux de compagnie et aux professionnels proposant des services pour animaux."
                )}
              </p>

              <p>
                {t(
                  "Les présentes conditions générales d'utilisation encadrent l'accès et l'utilisation du site internet, de la webapp et de l'application mobile Zoove."
                )}
              </p>

              <p>
                {t(
                  "En créant un compte ou en utilisant les fonctionnalités nécessitant un compte, l'utilisateur s'engage à respecter les présentes conditions générales d'utilisation."
                )}
              </p>

              <p>
                {t(
                  "Le traitement des données personnelles est décrit dans notre politique de confidentialité."
                )}{" "}
                <Link href="/privacy">
                  {t("Consulter la politique de confidentialité")}
                </Link>
              </p>
            </section>

            <section>
              <h2>{t("Article 2 : Objet")}</h2>

              <p>
                {t(
                  "Zoove a pour objectif de faciliter les interactions entre les propriétaires d'animaux et les professionnels qui prennent soin d'eux."
                )}
              </p>

              <p>
                {t(
                  "La plateforme s'adresse principalement à deux catégories d'utilisateurs : les propriétaires d'animaux et les professionnels des services animaliers."
                )}
              </p>

              <p>
                {t(
                  "Selon leur profil et leur plateforme d'accès, les utilisateurs peuvent notamment rechercher des professionnels, demander des rendez-vous, gérer leurs prestations, participer à des activités communautaires ou utiliser les fonctionnalités numériques proposées par Zoove."
                )}
              </p>
            </section>

            <section>
              <h2>{t("Article 3 : Les professionnels")}</h2>

              <h3>{t("3.1 Inscription et informations professionnelles")}</h3>

              <p>
                {t(
                  "Les professionnels utilisant Zoove peuvent notamment être des toiletteurs, des professionnels de santé animale ou des pet sitters."
                )}
              </p>

              <p>
                {t(
                  "Lors de son inscription, le professionnel doit fournir les informations nécessaires à la présentation de son activité et au fonctionnement des services proposés."
                )}
              </p>

              <p>
                {t(
                  "Ces informations peuvent comprendre le nom de l'établissement, ses coordonnées, son adresse, ses horaires, ses collaborateurs, ses prestations, ses tarifs et ses disponibilités."
                )}
              </p>

              <p>
                {t(
                  "Le professionnel s'engage à communiquer des informations exactes et à les mettre à jour en cas de modification."
                )}
              </p>

              <p>
                {t(
                  "Les prestations et tarifs affichés sur Zoove doivent correspondre aux informations effectivement proposées aux clients, sous réserve des conditions particulières clairement annoncées."
                )}
              </p>

              <p>
                {t(
                  "Les photographies publiées doivent représenter fidèlement l'activité concernée et respecter les droits des personnes éventuellement identifiables."
                )}
              </p>

              <h3>{t("3.2 Gestion des rendez-vous")}</h3>

              <p>
                {t(
                  "Zoove met à disposition des professionnels des fonctionnalités de gestion des demandes de rendez-vous, des prestations et du planning."
                )}
              </p>

              <p>
                {t(
                  "Selon le parcours proposé, le propriétaire peut sélectionner un animal, une prestation, un créneau et fournir les informations complémentaires demandées par le professionnel."
                )}
              </p>

              <p>
                {t(
                  "Une demande de rendez-vous n'est pas nécessairement une réservation confirmée. Lorsque la validation du professionnel est requise, le rendez-vous devient confirmé après acceptation selon le parcours prévu par Zoove."
                )}
              </p>

              <p>
                {t(
                  "Le professionnel peut également ajouter manuellement des rendez-vous à son agenda, notamment à la suite d'une demande reçue par téléphone ou par un autre moyen."
                )}
              </p>

              <p>
                {t(
                  "En cas de modification ou d'annulation d'un rendez-vous, les parties concernées doivent être informées dans des conditions adaptées à la prestation."
                )}
              </p>

              <p>
                {t(
                  "Le professionnel demeure responsable de l'exécution des prestations qu'il propose, de ses obligations professionnelles et du respect des règles applicables à son activité."
                )}
              </p>

              <h3>{t("3.3 Avis des utilisateurs")}</h3>

              <p>
                {t(
                  "Les professionnels peuvent consulter les avis publiés par les utilisateurs lorsque cette fonctionnalité est disponible."
                )}
              </p>

              <p>
                {t(
                  "Les avis doivent correspondre à une expérience réelle et ne doivent pas contenir de propos illégaux, injurieux, discriminatoires, diffamatoires, menaçants ou manifestement publicitaires."
                )}
              </p>

              <p>
                {t(
                  "Zoove peut examiner les avis signalés et retirer ceux qui enfreignent les présentes conditions ou la réglementation applicable."
                )}
              </p>

              <h3>{t("3.4 Abonnements et services payants")}</h3>

              <p>
                {t(
                  "Certaines fonctionnalités professionnelles peuvent être accessibles dans le cadre d'offres gratuites ou payantes."
                )}
              </p>

              <p>
                {t(
                  "Les fonctionnalités incluses, les tarifs, les commissions éventuelles et les modalités de facturation sont précisés lors de la souscription à l'offre concernée."
                )}
              </p>

              <p>
                {t(
                  "Selon le service et la plateforme utilisés, les paiements peuvent être traités par un prestataire de paiement ou par le système d'achats intégrés de l'App Store."
                )}
              </p>

              <p>
                {t(
                  "Les conditions de renouvellement et de résiliation des abonnements dépendent de l'offre souscrite et du canal de paiement utilisé."
                )}
              </p>

              <h3>{t("3.5 Suspension et suppression du compte")}</h3>

              <p>
                {t(
                  "Zoove peut prendre des mesures adaptées en cas d'informations trompeuses, de comportement abusif, de fraude ou de violation des présentes conditions."
                )}
              </p>

              <p>
                {t(
                  "Le professionnel peut demander la suppression de son compte, sous réserve des obligations contractuelles et légales restant applicables."
                )}
              </p>
            </section>

            <section>
              <h2>{t("Article 4 : Les propriétaires d'animaux")}</h2>

              <h3>{t("4.1 Inscription et profil de l'animal")}</h3>

              <p>
                {t(
                  "Le propriétaire d'animaux peut créer un compte et renseigner les informations nécessaires à l'utilisation des fonctionnalités de Zoove."
                )}
              </p>

              <p>
                {t(
                  "Il peut notamment ajouter un ou plusieurs animaux, leurs photographies, leur localisation générale et les informations utiles à leur présentation ou à leur prise en charge."
                )}
              </p>

              <p>
                {t(
                  "L'utilisateur s'engage à fournir des informations exactes et à ne publier que des contenus qu'il est autorisé à utiliser."
                )}
              </p>

              <p>
                {t(
                  "Il est interdit de publier des contenus violents, pornographiques, haineux, discriminatoires, menaçants ou portant atteinte aux droits d'autrui."
                )}
              </p>

              <h3>{t("4.2 Groupes de promenade")}</h3>

              <p>
                {t(
                  "Lorsque cette fonctionnalité est disponible, les propriétaires peuvent organiser des promenades collectives ou rejoindre des groupes existants."
                )}
              </p>

              <p>
                {t(
                  "L'organisateur peut renseigner un lieu de rendez-vous, une date et des informations utiles au déroulement de la promenade."
                )}
              </p>

              <p>
                {t(
                  "Les participants doivent adopter un comportement respectueux, veiller à la sécurité de leurs animaux et respecter les règles applicables dans les lieux fréquentés."
                )}
              </p>

              <h3>{t("4.3 Rencontres entre animaux")}</h3>

              <p>
                {t(
                  "Zoove peut proposer des fonctionnalités permettant aux propriétaires d'animaux d'entrer en relation et d'organiser des rencontres."
                )}
              </p>

              <p>
                {t(
                  "Les utilisateurs restent responsables de leurs échanges, de leurs décisions de rencontre et de la surveillance de leurs animaux."
                )}
              </p>

              <p>
                {t(
                  "Pour leur sécurité, les utilisateurs sont invités à protéger leurs informations personnelles, à ne jamais communiquer leurs informations financières et à privilégier les lieux publics pour une première rencontre."
                )}
              </p>

              <p>
                {t(
                  "Tout comportement suspect, menaçant, harcelant ou contraire à la loi peut être signalé à Zoove."
                )}
              </p>

              <h3>{t("4.4 Rendez-vous avec les professionnels")}</h3>

              <p>
                {t(
                  "Les propriétaires d'animaux peuvent rechercher des professionnels et demander des rendez-vous pour les prestations proposées sur Zoove."
                )}
              </p>

              <p>
                {t(
                  "L'utilisateur doit fournir les informations nécessaires à la prestation, notamment celles concernant l'animal, et respecter les rendez-vous confirmés."
                )}
              </p>

              <p>
                {t(
                  "En cas d'empêchement, il lui appartient de prévenir le professionnel dans les meilleurs délais."
                )}
              </p>

              <p>
                {t(
                  "Un professionnel peut refuser une demande ou restreindre de nouvelles réservations lorsqu'un motif légitime le justifie, dans le respect de la réglementation applicable."
                )}
              </p>

              <h3>{t("4.5 Garde d'animaux et pet sitting")}</h3>

              <p>
                {t(
                  "Zoove permet, lorsque le service est disponible, de réserver des prestations auprès de pet sitters, notamment des gardes, visites, promenades, hébergements ou transports d'animaux."
                )}
              </p>

              <p>
                {t(
                  "Les conditions de la prestation, les tarifs applicables et les éventuels frais sont présentés dans le parcours de réservation."
                )}
              </p>

              <p>
                {t(
                  "Certaines prestations peuvent utiliser un QR code afin d'enregistrer le début et la fin de la prise en charge de l'animal."
                )}
              </p>

              <p>
                {t(
                  "Lorsque la facturation dépend de la durée effective de la prestation, le montant est calculé selon les conditions tarifaires annoncées et les informations enregistrées dans le parcours prévu."
                )}
              </p>

              <p>
                {t(
                  "Les commissions éventuellement prélevées par Zoove dépendent de l'offre applicable au pet sitter et ne correspondent pas nécessairement à un taux unique."
                )}
              </p>

              <p>
                {t(
                  "Le propriétaire et le pet sitter s'engagent à communiquer les informations nécessaires à la sécurité et au bien-être de l'animal pendant la prestation."
                )}
              </p>

              <h3>{t("4.6 Communauté")}</h3>

              <p>
                {t(
                  "Lorsque les fonctionnalités communautaires sont disponibles, les utilisateurs peuvent publier des contenus et interagir avec les autres membres."
                )}
              </p>

              <p>
                {t(
                  "Les contenus publiés doivent respecter les autres utilisateurs, les droits de propriété intellectuelle et les lois applicables."
                )}
              </p>

              <p>
                {t(
                  "Zoove peut retirer les contenus manifestement illicites ou contraires aux présentes conditions et prendre des mesures adaptées à l'encontre des comptes concernés."
                )}
              </p>

              <h3>{t("4.7 Animal.IA")}</h3>

              <p>
                {t(
                  "Animal.IA propose des fonctionnalités d'information et d'accompagnement fondées sur l'intelligence artificielle."
                )}
              </p>

              <p>
                {t(
                  "Les réponses générées peuvent comporter des erreurs ou des imprécisions et ne constituent pas un diagnostic vétérinaire."
                )}
              </p>

              <p>
                {t(
                  "En cas de problème de santé ou de situation urgente concernant un animal, l'utilisateur doit consulter un professionnel vétérinaire qualifié."
                )}
              </p>

              <h3>{t("4.8 Achats intégrés et abonnements")}</h3>

              <p>
                {t(
                  "Certaines fonctionnalités destinées aux propriétaires peuvent être proposées dans le cadre d'achats intégrés ou d'abonnements."
                )}
              </p>

              <p>
                {t(
                  "Sur iOS, les achats intégrés sont gérés par l'App Store selon les prix, conditions et modalités affichés au moment de l'achat."
                )}
              </p>

              <p>
                {t(
                  "La résiliation d'un abonnement et la suppression d'un compte sont deux démarches distinctes. La suppression du compte n'entraîne pas automatiquement l'annulation d'un abonnement géré par un prestataire externe."
                )}
              </p>

              <h3>{t("4.9 Suppression du compte")}</h3>

              <p>
                {t(
                  "L'utilisateur peut demander la suppression de son compte selon les modalités proposées par Zoove."
                )}
              </p>

              <p>
                {t(
                  "Certaines informations peuvent être conservées après la suppression lorsque la loi l'exige ou lorsqu'elles sont nécessaires à la gestion d'obligations en cours."
                )}
              </p>
            </section>

            <section>
              <h2>{t("Article 5 : Comportements interdits")}</h2>

              <p>
                {t(
                  "Il est interdit d'utiliser Zoove pour des activités illégales, frauduleuses ou portant atteinte aux personnes, aux animaux ou aux autres utilisateurs."
                )}
              </p>

              <ul>
                <li>
                  {t(
                    "Organiser ou promouvoir des activités illégales, notamment le trafic d'animaux."
                  )}
                </li>
                <li>
                  {t(
                    "Harceler, menacer, intimider ou discriminer d'autres utilisateurs."
                  )}
                </li>
                <li>
                  {t(
                    "Publier des contenus haineux, violents, pornographiques ou diffamatoires."
                  )}
                </li>
                <li>
                  {t(
                    "Usurper une identité ou utiliser le compte d'une autre personne sans autorisation."
                  )}
                </li>
                <li>
                  {t(
                    "Collecter ou diffuser des informations personnelles sans autorisation."
                  )}
                </li>
                <li>
                  {t(
                    "Détourner les fonctionnalités de Zoove à des fins de spam, de fraude ou de publicité non autorisée."
                  )}
                </li>
              </ul>
            </section>

            <section>
              <h2>{t("Article 6 : Responsabilités")}</h2>

              <p>
                {t(
                  "Zoove met à disposition une plateforme facilitant la découverte de professionnels, les échanges et la gestion de certaines prestations."
                )}
              </p>

              <p>
                {t(
                  "Les professionnels restent responsables des prestations qu'ils réalisent et les utilisateurs restent responsables de leurs propres comportements et des informations qu'ils communiquent."
                )}
              </p>

              <p>
                {t(
                  "Zoove s'efforce d'assurer le bon fonctionnement de ses services, sans pouvoir garantir une disponibilité permanente ou l'absence de toute interruption technique."
                )}
              </p>

              <p>
                {t(
                  "Aucune disposition des présentes conditions ne vise à exclure ou limiter une responsabilité qui ne peut légalement l'être."
                )}
              </p>
            </section>

            <section>
              <h2>{t("Article 7 : Données personnelles")}</h2>

              <p>
                {t(
                  "Les modalités de collecte, d'utilisation, de conservation et de protection des données personnelles sont décrites dans la politique de confidentialité de Zoove."
                )}
              </p>

              <p>
                <Link href="/privacy">
                  {t("Consulter la politique de confidentialité")}
                </Link>
              </p>
            </section>

            <section>
              <h2>{t("Article 8 : Modification des CGU")}</h2>

              <p>
                {t(
                  "Zoove peut modifier les présentes conditions afin de tenir compte des évolutions du service ou des exigences légales."
                )}
              </p>

              <p>
                {t(
                  "Les utilisateurs seront informés des modifications importantes par un moyen approprié avant leur entrée en vigueur lorsque cela est nécessaire."
                )}
              </p>
            </section>

            <section>
              <h2>{t("Article 9 : Contact")}</h2>

              <p>
                {t(
                  "Pour toute question relative aux présentes conditions générales d'utilisation, vous pouvez contacter Zoove à l'adresse suivante :"
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
              <h2>{t("Article 10 : Mise à jour")}</h2>

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
