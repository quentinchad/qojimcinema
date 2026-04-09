import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ScrollToTop } from "./scroll-to-top"

const inter = Inter({ subsets: ["latin"] })

// Définir une URL de base valide
const siteUrl = "https://qojim-cinema.vercel.app"

export const metadata = {
  title: {
    default: "Qojim Cinéma | Critiques et recommandations de films et séries",
    template: "%s | Qojim Cinéma",
  },
  description:
    "Découvrez les critiques et recommandations de films et séries par Qojim. Partagez vos avis et trouvez votre prochain film à regarder.",
  keywords: ["cinéma", "films", "séries", "critiques", "avis", "recommandations", "Qojim"],
  authors: [{ name: "Qojim" }],
  creator: "Qojim",
  publisher: "Qojim Cinéma",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Qojim Cinéma | Critiques et recommandations de films et séries",
    description:
      "Découvrez les critiques et recommandations de films et séries par Qojim. Partagez vos avis et trouvez votre prochain film à regarder.",
    url: "/",
    siteName: "Qojim Cinéma",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Qojim Cinéma",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Qojim Cinéma | Critiques et recommandations de films et séries",
    description:
      "Découvrez les critiques et recommandations de films et séries par Qojim. Partagez vos avis et trouvez votre prochain film à regarder.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="jpmNIvi5CB3YpIjA0ZO4gMzBWNaWjH_4vLa6SpAc5Qg" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
          storageKey="qojim-theme"
        >
          <ScrollToTop />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
