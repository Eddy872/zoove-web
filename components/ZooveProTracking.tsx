
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const CONSENT_KEY = "zoove_marketing_consent";

type Consent = "accepted" | "rejected" | null;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

export function trackMetaEvent(
  event: string,
  standard = false
) {
  if (typeof window === "undefined") return;

  if (
    localStorage.getItem(CONSENT_KEY) !== "accepted"
  ) {
    return;
  }

  window.fbq?.(
    standard ? "track" : "trackCustom",
    event
  );
}

function loadPixel() {
  if (!PIXEL_ID || window.fbq) return;

  const f = window;
  
    type MetaPixelFunction = {
      (...args: unknown[]): void;
      callMethod?: (...args: unknown[]) => void;
      queue: unknown[][];
      loaded?: boolean;
      version?: string;
      push?: MetaPixelFunction;
    };

    const n = function (...args: unknown[]) {
      if (n.callMethod) {
        n.callMethod(...args);
      } else {
        n.queue.push(args);
      }
    } as MetaPixelFunction;


  n.queue = [];
  n.loaded = true;
  n.version = "2.0";
  n.push = n;

  f.fbq = n;
  f._fbq = n;

  f.fbq("init", PIXEL_ID);

  const script = document.createElement("script");
  script.async = true;
  script.src =
    "https://connect.facebook.net/en_US/fbevents.js";

  document.head.appendChild(script);
}

export default function ZooveProTracking() {
  const pathname = usePathname();

  const [consent, setConsent] =
    useState<Consent>(null);

  const [ready, setReady] = useState(false);
  const [showBanner, setShowBanner] =
    useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(CONSENT_KEY);

    if (saved === "accepted" || saved === "rejected") {
      setConsent(saved);
      setShowBanner(false);
    } else {
      setShowBanner(true);
    }

    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || consent !== "accepted") return;

    loadPixel();
    window.fbq?.("track", "PageView");
  }, [ready, consent, pathname]);

  function saveConsent(value: "accepted" | "rejected") {
    localStorage.setItem(CONSENT_KEY, value);
    setConsent(value);
    setShowBanner(false);

    if (value === "rejected") {
      // Un script déjà chargé ne peut pas être
      // désinstallé de façon fiable.
      window.location.reload();
    }
  }

  if (!ready) return null;

  return (
    <>
      {!showBanner && (
        <button
          type="button"
          onClick={() => setShowBanner(true)}
          style={{
            position: "fixed",
            bottom: 16,
            left: 16,
            zIndex: 9999,
            padding: "8px 12px",
            borderRadius: 10,
            background: "#fff",
            color: "#333",
            border: "1px solid #ddd",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          Gérer les cookies
        </button>
      )}

      {showBanner && (
        <div
          role="dialog"
          aria-label="Préférences de confidentialité"
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(480px, calc(100% - 32px))",
            background: "#fff",
            color: "#222",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 8px 40px #0003",
            zIndex: 10000,
          }}
        >
          <h3 style={{ marginBottom: 10 }}>
            Votre vie privée compte
          </h3>

          <p style={{
            fontSize: 14,
            lineHeight: 1.6,
            marginBottom: 20
          }}>
            Nous utilisons des cookies marketing
            pour mesurer l'efficacité de nos
            campagnes Facebook et Instagram.
            Vous pouvez accepter ou refuser
            ces cookies librement.
          </p>

          <div style={{
            display: "flex",
            gap: 10
          }}>
            <button
              type="button"
              onClick={() => saveConsent("rejected")}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                border: "1px solid #ddd",
                background: "#fff",
                color: "#222",
                cursor: "pointer",
              }}
            >
              Tout refuser
            </button>

            <button
              type="button"
              onClick={() => saveConsent("accepted")}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                border: "none",
                background: "#7545d9",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Tout accepter
            </button>
          </div>

          <p style={{
            marginTop: 14,
            fontSize: 12,
            textAlign: "center"
          }}>
            <Link href="/confidentialite">
              Politique de confidentialité
            </Link>
          </p>
        </div>
      )}
    </>
  );
}

