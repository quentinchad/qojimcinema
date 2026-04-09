"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { OptimizedImage } from "@/components/optimized-image"

interface RelatedReviewsProps {
  currentMovieId: string
  currentMovieTitle: string
  currentMovieGenres?: number[]
}

const QOJIM_USER_ID = "bc6efc17-35eb-4a59-af6c-8c4e3fcddf86"

// Cache en mémoire pour les genres TMDB (évite les re-fetch dans la même session)
const genreCache: Record<string, number[]> = {}

async function fetchMovieGenres(movieId: string): Promise<number[]> {
  if (genreCache[movieId]) return genreCache[movieId]

  try {
    const res = await fetch(`/api/tmdb/movie-details/${movieId}`)
    if (!res.ok) return []
    const data = await res.json()
    const genres = (data?.genres || []).map((g: any) => g.id)
    genreCache[movieId] = genres
    return genres
  } catch {
    return []
  }
}

function genreOverlapScore(genresA: number[], genresB: number[]): number {
  if (!genresA.length || !genresB.length) return 0
  return genresA.filter((g) => genresB.includes(g)).length
}

function extractFranchiseName(title: string): string {
  return title
    .replace(/[0-9]+/g, "")
    .replace(/\s+(I|II|III|IV|V|VI|VII|VIII|IX|X)(\s+|$)/i, "")
    .replace(/:\s+.*$/g, "")
    .replace(/\s+-\s+.*$/g, "")
    .replace(/\s+(part|chapter|episode)\s+.*$/i, "")
    .trim()
    .toLowerCase()
}

function isSameFranchise(titleA: string, titleB: string): boolean {
  const a = extractFranchiseName(titleA)
  const b = extractFranchiseName(titleB)
  if (!a || !b || a.length < 4 || b.length < 4) return false
  return a.includes(b) || b.includes(a)
}

export function RelatedReviews({ currentMovieId, currentMovieTitle, currentMovieGenres = [] }: RelatedReviewsProps) {
  const [relatedReviews, setRelatedReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [shouldFetch, setShouldFetch] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

  // Ne lancer le fetch que quand la section entre dans le viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldFetch(true)
          observer.disconnect()
        }
      },
      { rootMargin: "200px" } // Commence à charger 200px avant d'arriver à la section
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const fetchRelatedReviews = async () => {
      if (!currentMovieId || !shouldFetch) return

      try {
        setLoading(true)

        // 1. Récupérer toutes les critiques Qojim sauf le film actuel
        const { data: allReviews, error } = await supabase
          .from("reviews")
          .select("*")
          .eq("user_id", QOJIM_USER_ID)
          .neq("movie_tmdb_id", currentMovieId)
          .order("created_at", { ascending: false })

        if (error || !allReviews || allReviews.length === 0) return

        // 2. Détection de franchise sur TOUTES les critiques (pas de limite, pas d'API call)
        const franchiseMatches = allReviews.filter((r) =>
          isSameFranchise(currentMovieTitle, r.movie_title)
        )
        const franchiseIds = new Set(franchiseMatches.map((r) => r.id))

        // 3. Récupérer les genres du film actuel si pas déjà dispo
        let currentGenres = currentMovieGenres
        if (!currentGenres.length) {
          currentGenres = await fetchMovieGenres(currentMovieId)
        }

        // 4. Genre scoring sur les 25 critiques les plus récentes hors franchise
        const nonFranchise = allReviews.filter((r) => !franchiseIds.has(r.id)).slice(0, 25)
        const genreResults = await Promise.all(
          nonFranchise.map((r) => fetchMovieGenres(r.movie_tmdb_id))
        )

        const genreScored = nonFranchise
          .map((review, i) => ({
            ...review,
            _score: genreOverlapScore(currentGenres, genreResults[i]) * 10,
          }))
          .sort((a, b) => b._score - a._score)

        // 5. Franchise en premier, puis par genre, compléter si besoin
        const combined = [...franchiseMatches, ...genreScored]
        const seen = new Set<string>()
        const deduped = combined.filter((r) => {
          if (seen.has(r.id)) return false
          seen.add(r.id)
          return true
        })

        const top5 = deduped.slice(0, 5)
        const topIds = new Set(top5.map((r) => r.id))
        const remaining = allReviews.filter((r) => !topIds.has(r.id))
        const final = top5.length < 5
          ? [...top5, ...remaining.slice(0, 5 - top5.length)]
          : top5

        setRelatedReviews(final)

      } catch (error) {
        console.error("Error in fetchRelatedReviews:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRelatedReviews()
  }, [currentMovieId, currentMovieTitle, currentMovieGenres, supabase, shouldFetch])

  const handleNavigation = useCallback(
    (movieId: string) => {
      localStorage.setItem("scrollToTop", "true")
      router.push(`/movies/${movieId}`)
    },
    [router],
  )

  const handlePosterHover = useCallback((posterPath: string) => {
    if (posterPath) {
      const img = new Image()
      img.src = `https://image.tmdb.org/t/p/w500${posterPath}`
    }
  }, [])

  if (loading || (!shouldFetch && relatedReviews.length === 0)) {
    return (
      <div ref={sectionRef} className="py-4">
        <h2 className="text-2xl font-bold mb-4">Autres critiques Qojim</h2>
        <div className="space-y-4 md:hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg h-24 animate-pulse" />
          ))}
        </div>
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg h-64" />
          ))}
        </div>
      </div>
    )
  }

  if (relatedReviews.length === 0) return <div ref={sectionRef} />

  return (
    <section ref={sectionRef} className="py-8 border-t border-gray-800">
      <h2 className="text-2xl font-bold mb-6">Autres critiques Qojim qui pourraient vous intéresser</h2>

      {/* Mobile */}
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

      {/* Desktop */}
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