
"use client";

import Link from "next/link";

import { useLanguage } from "@/context/LanguageContext";
import { translate } from "@/translations/translations";

export default function Footer() {
  const { language } = useLanguage();

  const t = (key: string) => translate(language, key);

  const links = [
    {
      href: "/privacy",
      label: t("Politique de confidentialité"),
    },
    {
      href: "/terms",
      label: t("Conditions générales d'utilisation"),
    },
    {
      href: "/legal",
      label: t("Mentions légales"),
    },
  ];

  return (
    <footer
      style={{
        width: "100%",
        backgroundColor: "#B794F4",
        padding: "28px 24px",
      }}
    >
      <nav
        aria-label={t("Informations légales")}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "24px 48px",
        }}
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="footer-link"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <style jsx global>{`
        .footer-link {
          color: white;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: opacity 0.2s ease;
        }

        .footer-link:hover {
          opacity: 0.7;
        }
      `}</style>
    </footer>
  );
}
