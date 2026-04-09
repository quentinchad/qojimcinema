"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { PlusCircle, CheckCircle, Star, Clock } from "lucide-react"
import { ReviewsList } from "@/components/reviews-list"
import { AddReviewForm } from "@/components/add-review-form"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface MovieDetailsProps {
  movie: any
  reviews: any[]
  userId?: string
  isInWatchlist: boolean
  type: string
}

export function MovieDetails({
  movie,
  reviews,
  userId,
  isInWatchlist: initialWatchlistStatus,
  type,
}: MovieDetailsProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(initialWatchlistStatus)
  const [isAddingReview, setIsAddingReview] = useState(false)
  const [userReviews, setUserReviews] = useState(reviews || [])
  const router = useRouter()
  const supabase = createClient()

  // Séparer les critiques d'expert (Qojim) et les critiques d'utilisateurs
  const expertReviews = userReviews.filter((review) => review.users?.is_qojim)
  const regularReviews = userReviews.filter((review) => !review.users?.is_qojim)

  // Vérifier si l'utilisateur a déjà écrit une critique
  const hasUserReview = userId && userReviews.some((review) => review.user_id === userId)

  const toggleWatchlist = async () => {
    if (!userId) {
      router.push(`/auth/login?redirectTo=${encodeURIComponent(`/movies/${movie.id}?type=${type}`)}`)
      return
    }

    try {
      if (isInWatchlist) {
        // Supprimer de la liste d'attente
        const { error } = await supabase
          .from("watchlist")
          .delete()
          .eq("movie_tmdb_id", movie.id.toString())
          .eq("user_id", userId)

        if (error) throw error
      } else {
        // Ajouter à la liste d'attente
        const { error } = await supabase.from("watchlist").insert({
          movie_tmdb_id: movie.id.toString(),
          user_id: userId,
          movie_title: movie.title,
          movie_poster_path: movie.poster_path,
        })

        if (error) throw error
      }

      setIsInWatchlist(!isInWatchlist)
    } catch (error) {
      console.error("Error toggling watchlist:", error)
    }
  }

  const handleReviewAdded = (newReview: any) => {
    setUserReviews([newReview, ...userReviews])
    setIsAddingReview(false)
  }

  const handleAddReviewClick = () => {
    if (!userId) {
      router.push(`/auth/login?redirectTo=${encodeURIComponent(`/movies/${movie.id}?type=${type}`)}`)
      return
    }
    setIsAddingReview(true)
  }

  const handleCommentAdded = (reviewId: string, newComment: any) => {
    setUserReviews(
      userReviews.map((review) =>
        review.id === reviewId ? { ...review, comments: [...(review.comments || []), newComment] } : review,
      ),
    )
  }

  // Vérifier que les données du film sont valides
  if (!movie || !movie.id) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Erreur de chargement</h1>
        <p>Impossible de charger les détails du film.</p>
        <Button onClick={() => router.push("/")} className="mt-4">
          Retour à l'accueil
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Bannière du film */}
      <div className="relative w-full h-[50vh] mb-8 rounded-xl overflow-hidden">
        <Image
          src={
            movie.backdrop_path
              ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
              : "/placeholder.svg?height=500&width=1000&text=No+Backdrop"
          }
          alt={movie.title || "Film"}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end">
          <div className="p-8 w-full">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{movie.title || "Film sans titre"}</h1>
            <p className="text-gray-300">{movie.release_date ? movie.release_date.substring(0, 4) : ""}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Colonne de gauche - Poster et infos */}
        <div className="md:col-span-1">
          <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-4">
            <Image
              src={
                movie.poster_path
                  ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                  : "/placeholder.svg?height=450&width=300&text=No+Poster"
              }
              alt={movie.title || "Film"}
              fill
              className="object-cover"
            />
          </div>

          <div className="flex gap-2 mb-6">
            <Button onClick={toggleWatchlist} variant="outline" className="flex-1 gap-2">
              {isInWatchlist ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Dans ma liste
                </>
              ) : (
                <>
                  <PlusCircle className="h-5 w-5" />
                  Ajouter à ma liste
                </>
              )}
            </Button>

            {!hasUserReview && !isAddingReview && (
              <Button onClick={handleAddReviewClick} variant="outline" className="flex-1 gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Critiquer
              </Button>
            )}
          </div>

          <div className="space-y-4 bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
            <div>
              <h3 className="font-semibold text-lg mb-1">Note</h3>
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <span className="font-bold">{movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}</span>
                <span className="text-gray-500 dark:text-gray-400">/ 10</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">
                  ({movie.vote_count ? movie.vote_count : 0} votes)
                </span>
              </div>
            </div>

            {movie.runtime && (
              <div>
                <h3 className="font-semibold text-lg mb-1">Durée</h3>
                <div className="flex items-center gap-1">
                  <Clock className="h-5 w-5" />
                  <span>
                    {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}min
                  </span>
                </div>
              </div>
            )}

            {movie.genres && movie.genres.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-1">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre: any) => (
                    <span key={genre.id} className="px-2 py-1 bg-gray-200 dark:bg-gray-800 rounded-full text-sm">
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Colonne de droite - Synopsis et critiques */}
        <div className="md:col-span-2">
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Synopsis</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {movie.overview || "Aucun synopsis disponible pour ce film."}
            </p>
          </section>

          {isAddingReview && (
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Ajouter une critique</h2>
              <AddReviewForm
                movieId={movie.id.toString()}
                movieTitle={movie.title}
                userId={userId!}
                onReviewAdded={handleReviewAdded}
                onCancel={() => setIsAddingReview(false)}
              />
            </section>
          )}

          {expertReviews.length > 0 && (
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Critiques d&apos;experts</h2>
              <ReviewsList reviews={expertReviews} userId={userId} onCommentAdded={handleCommentAdded} />
            </section>
          )}

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Critiques d&apos;utilisateurs</h2>
            {regularReviews.length > 0 ? (
              <ReviewsList reviews={regularReviews} userId={userId} onCommentAdded={handleCommentAdded} />
            ) : (
              <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-lg text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Aucune critique d&apos;utilisateur pour le moment. Soyez le premier à donner votre avis !
                </p>
                {!hasUserReview && !isAddingReview && (
                  <Button onClick={handleAddReviewClick} variant="outline">
                    <Star className="h-5 w-5 text-yellow-500 mr-2" />
                    Ajouter une critique
                  </Button>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
