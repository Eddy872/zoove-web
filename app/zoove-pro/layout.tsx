
import ZooveProTracking from "@/components/ZooveProTracking";

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

