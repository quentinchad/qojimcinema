"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useApiCache } from "@/hooks/use-api-cache"
import { OptimizedImage } from "@/components/optimized-image"

interface RelatedReviewsProps {
  currentMovieId: string
  currentMovieTitle: string
  currentMovieGenres?: number[]
}

export function RelatedReviews({ currentMovieId, currentMovieTitle, currentMovieGenres = [] }: RelatedReviewsProps) {
  const [relatedReviews, setRelatedReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  // ID utilisateur spécifique pour les critiques Qojim
  const QOJIM_USER_ID = "bc6efc17-35eb-4a59-af6c-8c4e3fcddf86"

  // Utiliser le hook de cache pour les requêtes API
  const { data: genreRecommendations } = useApiCache(
    currentMovieId ? `/api/tmdb/genre-recommendations/${currentMovieId}` : null,
    undefined,
    30 * 60 * 1000, // Cache de 30 minutes
  )

  const { data: relatedMovies } = useApiCache(
    currentMovieId ? `/api/tmdb/related/${currentMovieId}` : null,
    undefined,
    30 * 60 * 1000, // Cache de 30 minutes
  )

  // Mémoriser la fonction d'extraction du nom de franchise
  const extractFranchiseName = useCallback((title: string): string => {
    // Supprimer les numéros, les chiffres romains, et les suffixes courants
    const cleanTitle = title
      .replace(/[0-9]+/g, "") // Supprimer les chiffres
      .replace(/\s+(I|II|III|IV|V|VI|VII|VIII|IX|X)(\s+|$)/i, "") // Supprimer les chiffres romains
      .replace(/:\s+.*$/g, "") // Supprimer tout ce qui suit un deux-points
      .replace(/\s+-\s+.*$/g, "") // Supprimer tout ce qui suit un tiret
      .replace(/\s+part\s+.*$/i, "") // Supprimer "Part X"
      .replace(/\s+chapter\s+.*$/i, "") // Supprimer "Chapter X"
      .replace(/\s+episode\s+.*$/i, "") // Supprimer "Episode X"
      .replace(/\s+the\s+.*$/i, "") // Supprimer "The X" (comme dans "The Beginning")
      .trim()

    return cleanTitle
  }, [])

  // Mémoriser le nom de base de la franchise
  const baseFranchiseName = useMemo(() => {
    return extractFranchiseName(currentMovieTitle)
  }, [currentMovieTitle, extractFranchiseName])

  // Fonction utilitaire pour compléter jusqu'à 5 critiques avec des critiques aléatoires
  const completeWithRandomReviews = useCallback((selectedReviews: any[], allReviews: any[], targetCount = 5) => {
    if (selectedReviews.length >= targetCount) {
      return selectedReviews.slice(0, targetCount)
    }

    // Créer un ensemble des IDs déjà sélectionnés
    const selectedIds = new Set(selectedReviews.map((review) => review.id))

    // Filtrer les critiques qui ne sont pas déjà sélectionnées
    const availableReviews = allReviews.filter((review) => !selectedIds.has(review.id))

    // Mélanger les critiques disponibles
    const shuffledReviews = [...availableReviews].sort(() => 0.5 - Math.random())

    // Ajouter des critiques aléatoires jusqu'à atteindre le nombre cible
    const additionalReviews = shuffledReviews.slice(0, targetCount - selectedReviews.length)

    return [...selectedReviews, ...additionalReviews]
  }, [])

  useEffect(() => {
    const fetchRelatedReviews = async () => {
      if (!currentMovieId) return

      try {
        setLoading(true)

        // 1. Récupérer toutes les critiques Qojim en utilisant l'ID utilisateur spécifique
        const { data: allQojimReviews, error: reviewsError } = await supabase
          .from("reviews")
          .select("*")
          .eq("user_id", QOJIM_USER_ID) // Utiliser l'ID utilisateur spécifique
          .neq("movie_tmdb_id", currentMovieId)
          .order("created_at", { ascending: false })

        if (reviewsError) {
          console.error("Error fetching Qojim reviews:", reviewsError)
          return
        }

        if (!allQojimReviews || allQojimReviews.length === 0) {
          console.log("No Qojim reviews found")
          return
        }

        // PRIORITÉ 1: Filtrer pour trouver les critiques de la même franchise
        let franchiseReviews: any[] = []
        if (baseFranchiseName && baseFranchiseName.length > 3) {
          // Éviter les titres trop courts
          franchiseReviews = allQojimReviews.filter((review) => {
            const reviewFranchiseName = extractFranchiseName(review.movie_title)
            // Vérifier si les noms de franchise correspondent (insensible à la casse)
            return (
              reviewFranchiseName.toLowerCase().includes(baseFranchiseName.toLowerCase()) ||
              baseFranchiseName.toLowerCase().includes(reviewFranchiseName.toLowerCase())
            )
          })

          // Exclure le film actuel si par hasard il est inclus
          franchiseReviews = franchiseReviews.filter(
            (review) => review.movie_tmdb_id !== currentMovieId && review.movie_title !== currentMovieTitle,
          )

          if (franchiseReviews.length > 0) {
            console.log(`Found ${franchiseReviews.length} reviews from the same franchise: ${baseFranchiseName}`)

            // Si nous avons trouvé des critiques de la même franchise, les utiliser et compléter si nécessaire
            const finalReviews = completeWithRandomReviews(franchiseReviews, allQojimReviews)
            setRelatedReviews(finalReviews)
            setLoading(false)
            return
          }
        }

        // PRIORITÉ 2: Utiliser les recommandations basées sur les genres
        if (genreRecommendations?.results && genreRecommendations.results.length > 0) {
          // Extraire les IDs des films similaires
          const similarMovieIds = genreRecommendations.results.map((movie: any) => movie.id.toString())

          // Filtrer les critiques Qojim pour les films similaires
          const genreBasedReviews = allQojimReviews.filter((review) => similarMovieIds.includes(review.movie_tmdb_id))

          if (genreBasedReviews.length > 0) {
            console.log(`Found ${genreBasedReviews.length} reviews for movies with similar genres`)

            // Trier les critiques en fonction de l'ordre des films similaires dans l'API
            const sortedGenreReviews = genreBasedReviews.sort((a, b) => {
              const indexA = similarMovieIds.indexOf(a.movie_tmdb_id)
              const indexB = similarMovieIds.indexOf(b.movie_tmdb_id)
              return indexA - indexB
            })

            // Utiliser les critiques basées sur les genres et compléter si nécessaire
            const finalReviews = completeWithRandomReviews(sortedGenreReviews, allQojimReviews)
            setRelatedReviews(finalReviews)
            setLoading(false)
            return
          }
        }

        // PRIORITÉ 3: Utiliser les recommandations TMDB standard
        if (relatedMovies) {
          // Extraire les IDs des films similaires et recommandés
          let similarMovieIds: string[] = []

          if (relatedMovies.similar && relatedMovies.similar.length > 0) {
            similarMovieIds = [...similarMovieIds, ...relatedMovies.similar.map((m: any) => m.id.toString())]
          }

          if (relatedMovies.recommendations && relatedMovies.recommendations.length > 0) {
            // Ajouter uniquement les IDs qui ne sont pas déjà dans similarMovieIds
            relatedMovies.recommendations.forEach((movie: any) => {
              const id = movie.id.toString()
              if (!similarMovieIds.includes(id)) {
                similarMovieIds.push(id)
              }
            })
          }

          // Filtrer les critiques Qojim pour les films similaires
          const similarReviews = allQojimReviews.filter((review) => similarMovieIds.includes(review.movie_tmdb_id))

          if (similarReviews.length > 0) {
            console.log(`Found ${similarReviews.length} reviews for similar movies via TMDB API`)

            // Utiliser les critiques de films similaires et compléter si nécessaire
            const finalReviews = completeWithRandomReviews(similarReviews, allQojimReviews)
            setRelatedReviews(finalReviews)
            setLoading(false)
            return
          }
        }

        // PRIORITÉ 4: Fallback - sélectionner 5 critiques au hasard
        console.log("No related reviews found, selecting random reviews")
        // Mélanger le tableau pour obtenir des critiques aléatoires
        const shuffledReviews = [...allQojimReviews].sort(() => 0.5 - Math.random())
        setRelatedReviews(shuffledReviews.slice(0, 5))
      } catch (error) {
        console.error("Error in fetchRelatedReviews:", error)
        // En cas d'erreur, essayer de récupérer 5 critiques aléatoires
        try {
          const { data: randomReviews } = await supabase
            .from("reviews")
            .select("*")
            .eq("user_id", QOJIM_USER_ID) // Utiliser l'ID utilisateur spécifique
            .neq("movie_tmdb_id", currentMovieId)
            .limit(5)
            .order("created_at", { ascending: false })

          setRelatedReviews(randomReviews || [])
        } catch (fallbackError) {
          console.error("Error fetching fallback reviews:", fallbackError)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchRelatedReviews()
  }, [
    currentMovieId,
    currentMovieTitle,
    baseFranchiseName,
    extractFranchiseName,
    completeWithRandomReviews,
    supabase,
    genreRecommendations,
    relatedMovies,
  ])

  // Fonction pour gérer la navigation avec défilement vers le haut
  const handleNavigation = useCallback(
    (movieId: string) => {
      // Stocker l'ID du film dans le localStorage pour indiquer qu'un défilement est nécessaire
      localStorage.setItem("scrollToTop", "true")
      // Naviguer vers la page du film
      router.push(`/movies/${movieId}`)
    },
    [router],
  )

  // Précharger les images au survol
  const handlePosterHover = useCallback((posterPath: string) => {
    if (posterPath) {
      const img = new Image()
      img.src = `https://image.tmdb.org/t/p/w500${posterPath}`
    }
  }, [])

  if (loading) {
    return (
      <div className="py-4">
        <h2 className="text-2xl font-bold mb-4">Autres critiques Qojim</h2>
        <div className="space-y-4 md:hidden">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-gray-800 rounded-lg h-24 animate-pulse"></div>
          ))}
        </div>
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 animate-pulse">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="bg-gray-800 rounded-lg h-64"></div>
          ))}
        </div>
      </div>
    )
  }

  if (relatedReviews.length === 0) {
    return null
  }

  return (
    <section className="py-8 border-t border-gray-800">
      <h2 className="text-2xl font-bold mb-6">Autres critiques Qojim qui pourraient vous intéresser</h2>

      {/* Version mobile: affichage en liste */}
      <div className="md:hidden space-y-4">
        {relatedReviews.map((review) => (
          <div
            key={review.id}
            onClick={() => handleNavigation(review.movie_tmdb_id)}
            onMouseEnter={() => handlePosterHover(review.movie_poster_path)}
            className="flex bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <div className="w-1/3 relative">
              <OptimizedImage
                src={
                  review.movie_poster_path
                    ? `https://image.tmdb.org/t/p/w200${review.movie_poster_path}`
                    : "/placeholder.svg?height=300&width=200&text=No+Poster"
                }
                alt={review.movie_title}
                width={100}
                height={150}
                className="object-cover h-full w-full"
              />
              <div className="absolute top-1 right-1 bg-black/70 text-white px-1.5 py-0.5 rounded-md flex items-center text-xs">
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-0.5" />
                <span className="font-bold">{review.rating}/10</span>
              </div>
            </div>
            <div className="w-2/3 p-3">
              <h3 className="font-bold text-sm mb-1 line-clamp-1">{review.movie_title}</h3>
              <p className="text-xs text-gray-400 mb-1">Critique Qojim</p>
              <p className="text-xs text-gray-300 line-clamp-2">{review.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Version desktop: affichage en grille */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {relatedReviews.map((review) => (
          <div
            key={review.id}
            onClick={() => handleNavigation(review.movie_tmdb_id)}
            onMouseEnter={() => handlePosterHover(review.movie_poster_path)}
            className="bg-gray-900 rounded-lg overflow-hidden transition-transform hover:scale-105 hover:shadow-xl cursor-pointer"
          >
            <div className="relative aspect-[2/3] w-full">
              <OptimizedImage
                src={
                  review.movie_poster_path
                    ? `https://image.tmdb.org/t/p/w500${review.movie_poster_path}`
                    : "/placeholder.svg?height=450&width=300&text=No+Poster"
                }
                alt={review.movie_title}
                fill
                className="object-cover"
              />
              <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-md flex items-center">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                <span className="text-sm font-bold">{review.rating}/10</span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg mb-1 line-clamp-1">{review.movie_title}</h3>
              <p className="text-sm text-gray-400 mb-2">Critique Qojim</p>
              <p className="text-sm text-gray-300 line-clamp-2">{review.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <Button
          onClick={() => {
            localStorage.setItem("scrollToTop", "true")
            router.push("/critiques")
          }}
          variant="outline"
        >
          Voir toutes les critiques Qojim
        </Button>
      </div>
    </section>
  )
}
