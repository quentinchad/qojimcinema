"use client"

import { Header } from "@/components/header"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Star, Clock, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { ReviewDetail } from "@/components/review-detail"
import { WatchlistButton } from "@/components/watchlist-button"
import { AddMovieReviewForm } from "@/components/add-movie-review-form"
import { useState, useEffect } from "react"
import { MovieSchema } from "@/components/movie-schema"
import { RelatedReviews } from "@/components/related-reviews"

interface MovieDetailsPageProps {
  params: {
    id: string
  }
}

export default function MovieDetailsPage({ params }: MovieDetailsPageProps) {
  const movieId = params.id
  const router = useRouter()
  const supabase = createClient()

  const [movie, setMovie] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [expertReviews, setExpertReviews] = useState<any[]>([])
  const [userReviews, setUserReviews] = useState<any[]>([])
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddReviewForm, setShowAddReviewForm] = useState(false)

  // Vérifier si l'utilisateur a déjà écrit une critique
  const hasUserReview = user && reviews.some((review) => review.user_id === user.id)

  // Effet pour défiler vers le haut de la page lors du chargement
  useEffect(() => {
    // Vérifier si nous devons défiler vers le haut (après navigation depuis les recommandations)
    const shouldScrollToTop = localStorage.getItem("scrollToTop") === "true"

    if (shouldScrollToTop) {
      // Défiler vers le haut de la page
      window.scrollTo(0, 0)
      // Réinitialiser le flag
      localStorage.removeItem("scrollToTop")
    }
  }, [])

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        // Récupérer les détails du film via notre API
        const response = await fetch(`/api/tmdb/movie-details/${movieId}`)

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const movieData = await response.json()
        setMovie(movieData)

        // Récupérer la session utilisateur
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)

          // Vérifier si le film est dans la liste d'attente
          const { data: watchlistData, error: watchlistError } = await supabase
            .from("watchlist")
            .select("id")
            .eq("movie_tmdb_id", movieId.toString())
            .eq("user_id", session.user.id)

          console.log("Watchlist check for movie:", {
            movieId: movieId.toString(),
            userId: session.user.id,
            result: watchlistData,
            error: watchlistError,
          })

          if (watchlistError) {
            console.error("Error checking watchlist:", watchlistError)
          }

          setIsInWatchlist(watchlistData && watchlistData.length > 0)
        }

        // Récupérer les critiques
        await fetchReviews()
      } catch (err: any) {
        console.error("Error loading movie:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMovieDetails()
  }, [movieId, supabase])

  const fetchReviews = async () => {
    try {
      // 1. Récupérer les critiques pour ce film
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("*")
        .eq("movie_tmdb_id", movieId)
        .order("created_at", { ascending: false })

      if (reviewsError) {
        throw reviewsError
      }

      if (!reviewsData || reviewsData.length === 0) {
        setReviews([])
        setExpertReviews([])
        setUserReviews([])
        return
      }

      // 2. Récupérer les informations des utilisateurs pour ces critiques
      const userIds = [...new Set(reviewsData.map((review) => review.user_id))]
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, username, email, is_qojim")
        .in("id", userIds)

      if (usersError) {
        console.error("Error fetching users:", usersError)
      }

      // 3. Récupérer les commentaires pour ces critiques
      const reviewIds = reviewsData.map((review) => review.id)
      const { data: commentsData, error: commentsError } = await supabase
        .from("review_comments")
        .select("*")
        .in("review_id", reviewIds)
        .order("created_at", { ascending: true })

      if (commentsError) {
        console.error("Error fetching comments:", commentsError)
      }

      // 4. Combiner les données
      const usersMap = (usersData || []).reduce((acc: any, user: any) => {
        acc[user.id] = user
        return acc
      }, {})

      const commentsMap = (commentsData || []).reduce((acc: any, comment: any) => {
        if (!acc[comment.review_id]) {
          acc[comment.review_id] = []
        }
        acc[comment.review_id].push(comment)
        return acc
      }, {})

      // 5. Créer les critiques complètes
      const fullReviews = reviewsData.map((review) => ({
        ...review,
        users: usersMap[review.user_id] || null,
        comments: commentsMap[review.id] || [],
      }))

      setReviews(fullReviews)

      // Séparer les critiques d'expert (Qojim) et les critiques d'utilisateurs
      setExpertReviews(fullReviews.filter((review) => review.users?.is_qojim))
      setUserReviews(fullReviews.filter((review) => !review.users?.is_qojim))
    } catch (err: any) {
      console.error("Error fetching reviews:", err)
    }
  }

  const handleAddReviewClick = () => {
    if (!user) {
      router.push(`/auth/login?redirectTo=${encodeURIComponent(`/movies/${movieId}/details`)}`)
      return
    }
    setShowAddReviewForm(true)
  }

  const handleReviewAdded = (newReview: any) => {
    setReviews([newReview, ...reviews])

    // Mettre à jour les listes de critiques
    if (newReview.users?.is_qojim) {
      setExpertReviews([newReview, ...expertReviews])
    } else {
      setUserReviews([newReview, ...userReviews])
    }

    setShowAddReviewForm(false)
  }

  const handleReviewUpdated = (updatedReview: any) => {
    // Mettre à jour la critique dans toutes les listes
    const updateReviewInList = (list: any[]) =>
      list.map((review) => (review.id === updatedReview.id ? updatedReview : review))

    setReviews(updateReviewInList(reviews))
    setExpertReviews(updateReviewInList(expertReviews))
    setUserReviews(updateReviewInList(userReviews))
  }

  const handleReviewDeleted = (reviewId: string) => {
    // Supprimer la critique de toutes les listes
    const filterReviewFromList = (list: any[]) => list.filter((review) => review.id !== reviewId)

    setReviews(filterReviewFromList(reviews))
    setExpertReviews(filterReviewFromList(expertReviews))
    setUserReviews(filterReviewFromList(userReviews))
  }

  const handleCommentAdded = (reviewId: string, newComment: any) => {
    // Mettre à jour la critique avec le nouveau commentaire
    const updatedReviews = reviews.map((review) => {
      if (review.id === reviewId) {
        return {
          ...review,
          comments: [...(review.comments || []), newComment],
        }
      }
      return review
    })

    setReviews(updatedReviews)
    setExpertReviews(updatedReviews.filter((review) => review.users?.is_qojim))
    setUserReviews(updatedReviews.filter((review) => !review.users?.is_qojim))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Erreur de chargement</h1>
          <p>{error || "Impossible de charger les détails du film."}</p>
          <Button onClick={() => router.push("/")} className="mt-4">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      {movie && <MovieSchema movie={movie} />}

      {/* Grande bannière avec image de fond */}
      <div className="relative w-full h-[60vh] rounded-b-lg overflow-hidden">
        <Image
          src={
            movie.backdrop_path
              ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
              : "/placeholder.svg?height=600&width=1200&text=No+Backdrop"
          }
          alt={movie.title}
          fill
          className="object-cover"
          style={{ objectPosition: "center 20%" }}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent">
          <div className="absolute bottom-0 left-0 p-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{movie.title}</h1>
            <p className="text-gray-300">{movie.release_date?.substring(0, 4)}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Colonne de gauche - Poster */}
          <div className="md:col-span-1">
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-6">
              <Image
                src={
                  movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : "/placeholder.svg?height=450&width=300&text=No+Poster"
                }
                alt={movie.title}
                fill
                className="object-cover"
              />
            </div>

            {/* Bouton d'ajout à la liste */}
            <WatchlistButton
              movieId={movieId}
              movieTitle={movie.title}
              moviePosterPath={movie.poster_path}
              userId={user?.id}
              initialIsInWatchlist={isInWatchlist}
              mediaType="movie"
            />

            {/* Informations du film */}
            <div className="space-y-4 bg-gray-900 p-4 rounded-lg mt-4">
              <div>
                <h3 className="font-semibold text-lg mb-1">Note</h3>
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold">{movie.vote_average?.toFixed(1)}</span>
                  <span className="text-gray-400">/ 10</span>
                  <span className="text-gray-400 text-sm ml-1">({movie.vote_count} votes)</span>
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
                      <span key={genre.id} className="px-2 py-1 bg-gray-800 rounded-full text-sm">
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
              <p className="text-gray-300 leading-relaxed">
                {movie.overview || "Aucun synopsis disponible pour ce film."}
              </p>
            </section>

            {/* Formulaire d'ajout de critique */}
            {showAddReviewForm && (
              <section className="mb-8">
                <AddMovieReviewForm
                  movieId={movieId}
                  movieTitle={movie.title}
                  moviePosterPath={movie.poster_path}
                  movieBackdropPath={movie.backdrop_path} // Passage du backdrop path
                  userId={user.id}
                  onReviewAdded={handleReviewAdded}
                  onCancel={() => setShowAddReviewForm(false)}
                />
              </section>
            )}

            {/* Critiques d'experts */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Critiques d&apos;experts</h2>
              {expertReviews.length > 0 ? (
                <div className="space-y-4">
                  {expertReviews.map((review) => (
                    <ReviewDetail
                      key={review.id}
                      review={review}
                      currentUser={user}
                      onCommentAdded={handleCommentAdded}
                      onReviewUpdated={handleReviewUpdated}
                      onReviewDeleted={handleReviewDeleted}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-gray-900 p-6 rounded-lg text-center">
                  <p className="text-gray-400">Aucune critique d&apos;expert pour le moment.</p>
                </div>
              )}
            </section>

            {/* Critiques d'utilisateurs */}
            <section className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Critiques d&apos;utilisateurs</h2>
                {!hasUserReview && !showAddReviewForm && (
                  <Button onClick={handleAddReviewClick} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Ajouter une critique
                  </Button>
                )}
              </div>

              {userReviews.length > 0 ? (
                <div className="space-y-4">
                  {userReviews.map((review) => (
                    <ReviewDetail
                      key={review.id}
                      review={review}
                      currentUser={user}
                      onCommentAdded={handleCommentAdded}
                      onReviewUpdated={handleReviewUpdated}
                      onReviewDeleted={handleReviewDeleted}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-gray-900 p-6 rounded-lg text-center">
                  <p className="text-gray-400 mb-4">
                    Aucune critique d&apos;utilisateur pour le moment. Soyez le premier à donner votre avis !
                  </p>
                  {!hasUserReview && !showAddReviewForm && (
                    <Button onClick={handleAddReviewClick} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Ajouter une critique
                    </Button>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Section des revues recommandées */}
        <RelatedReviews
          currentMovieId={movieId}
          currentMovieTitle={movie.title}
          currentMovieGenres={movie.genres?.map((g: any) => g.id)}
        />
      </div>
    </div>
  )
}
