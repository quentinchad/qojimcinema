"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Star } from "lucide-react"

interface Movie {
  id: string
  title: string
  poster_path: string | null
  rating: number
  media_type?: "movie" | "tv"
}

export function QojimTopRated() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchQojimTopRated = async () => {
      try {
        // 1. Récupérer l'ID de l'utilisateur Qojim
        const { data: qojimUser, error: qojimError } = await supabase
          .from("users")
          .select("id")
          .eq("email", "quentin.qojim@gmail.com")
          .single()

        if (qojimError) throw qojimError

        if (!qojimUser) {
          throw new Error("Utilisateur Qojim non trouvé")
        }

        // 2. Récupérer les critiques de Qojim, triées par note (descendant)
        const { data: reviews, error: reviewsError } = await supabase
          .from("reviews")
          .select("*")
          .eq("user_id", qojimUser.id)
          .order("rating", { ascending: false })

        if (reviewsError) throw reviewsError

        if (!reviews || reviews.length === 0) {
          setMovies([])
          setLoading(false)
          return
        }

        // 3. Trouver la note maximale
        const maxRating = reviews[0].rating

        // 4. Filtrer les critiques avec la note maximale
        const topRatedReviews = reviews.filter((review) => review.rating === maxRating)

        // 5. Sélectionner 5 critiques au hasard si plus de 5 ont la note maximale
        let selectedReviews = topRatedReviews
        if (topRatedReviews.length > 5) {
          // Mélanger le tableau et prendre les 5 premiers
          selectedReviews = [...topRatedReviews].sort(() => 0.5 - Math.random()).slice(0, 5)
        } else {
          // Si moins de 5 critiques ont la note maximale, prendre les suivantes
          const remainingCount = 5 - topRatedReviews.length
          if (remainingCount > 0 && reviews.length > topRatedReviews.length) {
            const nextBestReviews = reviews.slice(topRatedReviews.length).slice(0, remainingCount)
            selectedReviews = [...topRatedReviews, ...nextBestReviews]
          }
        }

        // 6. Formater les données pour l'affichage
        const formattedMovies = selectedReviews.map((review) => {
          // Déterminer si c'est une série TV ou un film
          const isTV = review.movie_tmdb_id.toString().includes("tv-")
          const mediaId = isTV ? review.movie_tmdb_id.toString().replace("tv-", "") : review.movie_tmdb_id

          return {
            id: mediaId,
            title: review.movie_title,
            poster_path: review.movie_poster_path,
            rating: review.rating,
            media_type: isTV ? "tv" : "movie",
          }
        })

        setMovies(formattedMovies)
      } catch (err) {
        console.error("Erreur lors du chargement des films les mieux notés par Qojim:", err)
        setError("Erreur lors du chargement des films")
      } finally {
        setLoading(false)
      }
    }

    fetchQojimTopRated()
  }, [supabase])

  if (loading) {
    return (
      <section className="my-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Les mieux notés par Qojim</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="bg-gray-200 dark:bg-gray-800 rounded-lg aspect-[2/3] animate-pulse" />
          ))}
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="my-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Les mieux notés par Qojim</h2>
        <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-900 rounded-lg text-red-800 dark:text-red-300">
          <p>{error}</p>
        </div>
      </section>
    )
  }

  if (movies.length === 0) {
    return (
      <section className="my-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Les mieux notés par Qojim</h2>
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400 text-center">
          Qojim n'a pas encore noté de films.
        </div>
      </section>
    )
  }

  return (
    <section className="my-12">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Les mieux notés par Qojim</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {movies.map((movie) => (
          <Link
            key={`${movie.media_type}-${movie.id}`}
            href={movie.media_type === "tv" ? `/tv/${movie.id}` : `/movies/${movie.id}`}
            className="group relative"
          >
            <div className="relative overflow-hidden rounded-lg aspect-[2/3]">
              <Image
                src={
                  movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : "/placeholder.svg?height=300&width=200&text=No+Poster"
                }
                alt={movie.title}
                width={300}
                height={450}
                className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute top-2 right-2 bg-yellow-500 text-black font-bold px-2 py-1 rounded text-sm flex items-center gap-1">
                <Star className="h-3 w-3 fill-black" />
                {movie.rating} /10
              </div>

              {/* Overlay au survol avec le titre du film */}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
                <h3 className="text-white text-center font-medium">{movie.title}</h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
