import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { AuthCTA } from "@/components/auth-cta"
import { QojimTopRated } from "@/components/qojim-top-rated"
import { RandomReviews } from "@/components/random-reviews"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Accueil | Qojim Cinéma",
  description:
    "Découvrez les meilleures critiques et recommandations de films et séries sur Qojim Cinéma. Rejoignez notre communauté et partagez vos avis.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Qojim Cinéma | Critiques et recommandations de films et séries",
    description:
      "Découvrez les meilleures critiques et recommandations de films et séries sur Qojim Cinéma. Rejoignez notre communauté et partagez vos avis.",
    url: "/",
  },
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white pt-4">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Hero />
        <AuthCTA />
        <QojimTopRated />
        <RandomReviews />
        <div className="flex justify-center mt-8">
          <Link href="/critiques">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              Voir toutes les critiques
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
