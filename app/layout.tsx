import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://reponseastrale.fr";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "RéponseAstrale — Votre première analyse astrologique offerte", template: "%s | RéponseAstrale" },
  description: "Posez votre question et recevez une analyse astrologique personnalisée sous 24 à 48 heures. Première analyse offerte, sans carte bancaire.",
  applicationName: "RéponseAstrale",
  authors: [{ name: "OFID" }],
  creator: "RéponseAstrale",
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "fr_FR", url: siteUrl, siteName: "RéponseAstrale", title: "Posez votre question. Votre thème astral vous répond.", description: "Une analyse astrologique personnalisée, offerte et examinée individuellement.", images: [{ url: "/og.png", width: 1200, height: 630, alt: "RéponseAstrale — Analyse astrologique personnalisée" }] },
  twitter: { card: "summary_large_image", title: "RéponseAstrale", description: "Votre première analyse astrologique personnalisée est offerte.", images: ["/og.png"] },
  icons: { icon: [{ url: "/brand/favicon.png", type: "image/png", sizes: "64x64" }], apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180" }] },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f2eff9", colorScheme: "light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
