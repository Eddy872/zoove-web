
import type { Viewport } from "next";
import ZooveProTracking from "@/components/ZooveProTracking";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function ZooveProLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ZooveProTracking />
    </>
  );
}
