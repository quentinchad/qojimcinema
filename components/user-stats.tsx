"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Film, Star, MessageCircle } from "lucide-react"

interface UserStatsProps {
  reviewsCount: number
  watchlistCount: number
  commentsCount: number
  isQojim: boolean
}

export function UserStats({ reviewsCount, watchlistCount, commentsCount, isQojim }: UserStatsProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Mes statistiques</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Critiques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{reviewsCount}</div>
              <Star className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {reviewsCount === 0
                ? "Vous n'avez pas encore publié de critique"
                : reviewsCount === 1
                  ? "Vous avez publié 1 critique"
                  : `Vous avez publié ${reviewsCount} critiques`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Liste à voir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{watchlistCount}</div>
              <Film className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {watchlistCount === 0
                ? "Votre liste à voir est vide"
                : watchlistCount === 1
                  ? "1 élément dans votre liste"
                  : `${watchlistCount} éléments dans votre liste`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Commentaires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{commentsCount}</div>
              <MessageCircle className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {commentsCount === 0
                ? "Vous n'avez pas encore commenté"
                : commentsCount === 1
                  ? "Vous avez publié 1 commentaire"
                  : `Vous avez publié ${commentsCount} commentaires`}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Mes critiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              {reviewsCount === 0
                ? "Vous n'avez pas encore publié de critique. Partagez votre avis sur les films et séries que vous avez vus !"
                : `Vous avez publié ${reviewsCount} critique${reviewsCount > 1 ? "s" : ""}. Continuez à partager vos avis !`}
            </p>
            <div className="flex justify-between">
              <Link href="/mes-critiques">
                <Button variant="outline">Voir mes critiques</Button>
              </Link>
              <Link href="/feed">
                <Button>Explorer le feed</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ma liste à voir</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              {watchlistCount === 0
                ? "Votre liste à voir est vide. Ajoutez des films et séries que vous souhaitez regarder plus tard !"
                : `Vous avez ${watchlistCount} élément${
                    watchlistCount > 1 ? "s" : ""
                  } dans votre liste à voir. Continuez à explorer !`}
            </p>
            <div className="flex justify-between">
              <Link href="/a-voir">
                <Button variant="outline">Voir ma liste</Button>
              </Link>
              <Link href="/">
                <Button>Découvrir plus</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {isQojim && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-300">Statut Expert</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700 dark:text-blue-300">
              Vous avez le statut d&apos;expert sur Qojim Cinéma. Vos critiques sont mises en avant et considérées comme
              des références pour notre communauté.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
