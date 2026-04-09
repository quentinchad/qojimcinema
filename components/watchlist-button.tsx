"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface WatchlistButtonProps {
  movieId: string
  movieTitle: string
  moviePosterPath: string | null
  userId?: string
  initialIsInWatchlist: boolean
  mediaType?: "movie" | "tv" // Ajout du type de média
}

export function WatchlistButton({
  movieId,
  movieTitle,
  moviePosterPath,
  userId,
  initialIsInWatchlist,
  mediaType = "movie", // Par défaut, c'est un film
}: WatchlistButtonProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(initialIsInWatchlist)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Formater l'ID du média avec un préfixe pour les séries TV
  const formattedMovieId = mediaType === "tv" ? `tv-${movieId}` : movieId

  const toggleWatchlist = async () => {
    if (!userId) {
      router.push(`/auth/login?redirectTo=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    setIsLoading(true)

    try {
      // Formater l'ID du média avec un préfixe pour les séries TV
      const formattedMovieId = mediaType === "tv" ? `tv-${movieId}` : movieId

      console.log("Watchlist action:", {
        action: isInWatchlist ? "remove" : "add",
        movieId,
        formattedMovieId,
        userId,
      })

      if (isInWatchlist) {
        // Supprimer de la liste d'attente
        const { error } = await supabase
          .from("watchlist")
          .delete()
          .eq("movie_tmdb_id", formattedMovieId)
          .eq("user_id", userId)

        if (error) {
          console.error("Error removing from watchlist:", error)
          throw error
        }
      } else {
        // Ajouter à la liste d'attente - SUPPRESSION de media_type qui n'existe pas dans la table
        const { error } = await supabase.from("watchlist").insert({
          movie_tmdb_id: formattedMovieId,
          user_id: userId,
          movie_title: movieTitle,
          movie_poster_path: moviePosterPath,
          // Suppression de media_type qui cause l'erreur
        })

        if (error) {
          console.error("Error adding to watchlist:", error)
          throw error
        }
      }

      setIsInWatchlist(!isInWatchlist)
      router.refresh() // Rafraîchir la page pour mettre à jour l'état
    } catch (error) {
      console.error("Error toggling watchlist:", error)
      // Ne pas afficher d'alerte, juste logger l'erreur
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      className="w-full flex items-center justify-center gap-2"
      variant={isInWatchlist ? "outline" : "default"}
      onClick={toggleWatchlist}
      disabled={isLoading}
    >
      {isLoading ? (
        <span>Chargement...</span>
      ) : isInWatchlist ? (
        <>
          <Check className="h-5 w-5" />
          Dans ma liste
        </>
      ) : (
        <>
          <Plus className="h-5 w-5" />
          Ajouter à ma liste
        </>
      )}
    </Button>
  )
}
