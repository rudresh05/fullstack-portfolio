import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Good Morning Cutie — For Bubu",
  description: "A secret morning greeting for Bubu.",
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

export default function GoodMorningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
