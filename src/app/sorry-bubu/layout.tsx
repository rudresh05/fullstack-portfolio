import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Bubu — from your Betu",
  description: "A secret place for Bubu.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function SorryBubuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
