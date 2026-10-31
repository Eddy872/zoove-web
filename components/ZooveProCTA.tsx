
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { trackMetaEvent } from "@/components/ZooveProTracking";

import styles from "@/app/zoove-pro/page.module.css";

export default function ZooveProCTA() {
  return (
    <Link
      href="/zoove-pro/participer"
      className={styles.primaryButton}
      onClick={() => {
        trackMetaEvent("ClickParticipation");
      }}
    >
      Je souhaite participer

      <ArrowRight
        size={23}
        strokeWidth={1.8}
        aria-hidden="true"
      />
    </Link>
  );
}

