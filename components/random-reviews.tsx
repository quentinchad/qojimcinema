"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Star, Film, Tv } from "lucide-react"

interface Review {
  id: string
  movie_tmdb_id: string
  movie_title: string
  movie_poster_path: string | null
  rating: number
  user_id: string
  username?: string
  is_qojim?: boolean
  media_type?: "movie" | "tv"
}

export function RandomReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Fonction de mélange Fisher-Yates plus robuste
  const shuffleArray = (array: any[]) => {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  }

  useEffect(() => {
    const fetchRandomReviews = async () => {
      try {
        // 1. Récupérer l'ID de l'utilisateur Qojim
        const { data: qojimUser, error: qojimError } = await supabase
          .from("users")
          .select("id")
          .eq("is_qojim", true)
          .single()

        if (qojimError) {
          console.error("Erreur lors de la récupération de l'utilisateur Qojim:", qojimError)
          throw qojimError
        }

        if (!qojimUser) {
          throw new Error("Utilisateur Qojim non trouvé")
        }

        // 2. Récupérer toutes les critiques de Qojim
        // Ajout d'un paramètre aléatoire pour éviter la mise en cache
        const randomParam = new Date().getTime()
        const { data: allReviews, error: reviewsError } = await supabase
          .from("reviews")
          .select("id, movie_tmdb_id, movie_title, movie_poster_path, rating, user_id, created_at")
          .eq("user_id", qojimUser.id)
          .order("created_at", { ascending: false }) // Récupérer toutes les critiques sans tri spécifique

        if (reviewsError) throw reviewsError

        if (!allReviews || allReviews.length === 0) {
          setReviews([])
          setLoading(false)
          return
        }

        // Filtrer pour exclure les critiques avec une note de 10/10
        const filteredReviews = allReviews.filter((review) => review.rating < 10)

        // Mélanger les critiques avec l'algorithme Fisher-Yates
        const shuffledReviews = shuffleArray(filteredReviews)

        // Filtrer pour éviter les doublons de films/séries (garder une seule critique par film/série)
        const uniqueMediaMap = new Map()
        const uniqueReviews = []

        for (const review of shuffledReviews) {
          // Utiliser movie_tmdb_id comme clé unique pour chaque film/série
          if (!uniqueMediaMap.has(review.movie_tmdb_id)) {
            uniqueMediaMap.set(review.movie_tmdb_id, true)
            uniqueReviews.push(review)

            // Arrêter une fois que nous avons 10 films/séries uniques
            if (uniqueReviews.length >= 10) break
          }
        }

        // Mélanger à nouveau pour plus de randomisation
        const selectedReviews = shuffleArray(uniqueReviews)

        // 3. Récupérer les informations des utilisateurs pour ces critiques
        const userIds = [...new Set(selectedReviews.map((review) => review.user_id))]
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, username, is_qojim")
          .in("id", userIds)

        if (usersError) {
          console.error("Erreur lors de la récupération des utilisateurs:", usersError)
        }

        // Créer un map des utilisateurs par ID
        const usersMap = (usersData || []).reduce((acc, user) => {
          acc[user.id] = user
          return acc
        }, {})

        // 4. Formater les données pour l'affichage
        const formattedReviews = selectedReviews.map((review) => {
          // Déterminer si c'est une série TV ou un film
          const isTV = review.movie_tmdb_id.toString().includes("tv-")
          const user = usersMap[review.user_id] || {}

          return {
            id: review.id,
            movie_tmdb_id: review.movie_tmdb_id,
            movie_title: review.movie_title,
            movie_poster_path: review.movie_poster_path,
            rating: review.rating,
            user_id: review.user_id,
            username: user.username,
            is_qojim: user.is_qojim,
            media_type: isTV ? "tv" : "movie",
          }
        })

        setReviews(formattedReviews)
      } catch (err) {
        console.error("Erreur lors du chargement des critiques aléatoires:", err)
        setError("Erreur lors du chargement des critiques")
      } finally {
        setLoading(false)
      }
    }

    fetchRandomReviews()
  }, [supabase])

  if (loading) {
    return (
      <section className="my-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Critiques aléatoires de Qojim</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, index) => (
            <div key={index} className="bg-gray-200 dark:bg-gray-800 rounded-lg aspect-[2/3] animate-pulse" />
          ))}
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="my-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Critiques aléatoires de Qojim</h2>
        <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-900 rounded-lg text-red-800 dark:text-red-300">
          <p>{error}</p>
        </div>
      </section>
    )
  }

  if (reviews.length === 0) {
    return (
      <section className="my-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Critiques aléatoires de Qojim</h2>
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400 text-center">
          Aucune critique disponible pour le moment.
        </div>
      </section>
    )
  }

  return (
    <section className="my-12">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Critiques aléatoires de Qojim</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {reviews.map((review) => {
          // Extraire l'ID réel (sans le préfixe tv-)
          const mediaId =
            review.media_type === "tv" ? review.movie_tmdb_id.toString().replace("tv-", "") : review.movie_tmdb_id

          return (
            <Link
              key={review.id}
              href={review.media_type === "tv" ? `/tv/${mediaId}` : `/movies/${mediaId}`}
              className="group relative"
            >
              <div className="relative overflow-hidden rounded-lg aspect-[2/3]">
                <Image
                  src={
                    review.movie_poster_path
                      ? `https://image.tmdb.org/t/p/w500${review.movie_poster_path}`
                      : "/placeholder.svg?height=300&width=200&text=No+Poster"
                  }
                  alt={review.movie_title}
                  width={300}
                  height={450}
                  className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-2 right-2 bg-yellow-500 text-black font-bold px-2 py-1 rounded text-sm flex items-center gap-1">
                  <Star className="h-3 w-3 fill-black" />
                  {review.rating} /10
                </div>

                {/* Icône pour indiquer le type de média */}
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  {review.media_type === "tv" ? (
                    <>
                      <Tv className="h-3 w-3" />
                      <span>Série</span>
                    </>
                  ) : (
                    <>
                      <Film className="h-3 w-3" />
                      <span>Film</span>
                    </>
                  )}
                </div>

                {/* Badge pour indiquer si c'est une critique de Qojim */}
                {review.is_qojim && (
                  <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    Qojim
                  </div>
                )}

                {/* Overlay au survol avec le titre du film */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
                  <h3 className="text-white text-center font-medium">{review.movie_title}</h3>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
