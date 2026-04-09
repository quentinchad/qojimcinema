import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { redirect } from "next/navigation"
import { ReviewCard } from "@/components/review-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function MyReviewsPage() {
  const supabase = createClient()

  // Vérifier si l'utilisateur est connecté
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login?redirectTo=/mes-critiques")
  }

  // Récupérer les critiques de l'utilisateur
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching user reviews:", error)
  }

  // Récupérer les informations de l'utilisateur
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .single()

  if (userError) {
    console.error("Error fetching user data:", userError)
  }

  // Récupérer les commentaires pour toutes les critiques
  const reviewIds = reviews?.map((review) => review.id) || []
  let commentsData = []

  if (reviewIds.length > 0) {
    const { data: comments, error: commentsError } = await supabase
      .from("review_comments")
      .select("*")
      .in("review_id", reviewIds)

    if (commentsError) {
      console.error("Error fetching comments:", commentsError)
    } else {
      commentsData = comments || []
    }
  }

  // Organiser les commentaires par review_id
  const commentsByReviewId: Record<string, any[]> = {}
  commentsData.forEach((comment) => {
    if (!commentsByReviewId[comment.review_id]) {
      commentsByReviewId[comment.review_id] = []
    }
    commentsByReviewId[comment.review_id].push(comment)
  })

  // Combiner les données
  const reviewsWithData =
    reviews?.map((review) => ({
      ...review,
      users: userData,
      comments: commentsByReviewId[review.id] || [],
    })) || []

  // Calculer les statistiques
  const totalReviews = reviewsWithData.length
  const averageRating =
    totalReviews > 0 ? (reviewsWithData.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1) : "0"
  const totalComments = reviewsWithData.reduce((sum, review) => sum + (review.comments?.length || 0), 0)

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Mes critiques
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Retrouvez toutes les critiques que vous avez publiées
          </p>
        </div>

        {totalReviews > 0 ? (
          <div>
            {/* Statistiques */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Vos statistiques</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{totalReviews}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Critique{totalReviews !== 1 ? "s" : ""} publiée{totalReviews !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="text-center p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">{averageRating}/10</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Note moyenne</div>
                </div>
                <div className="text-center p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">{totalComments}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Commentaire{totalComments !== 1 ? "s" : ""} reçu{totalComments !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            </div>

            {/* Liste des critiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviewsWithData.map((review) => (
                <ReviewCard key={review.id} review={review} currentUserId={session.user.id} />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-12 rounded-2xl text-center border border-gray-200 dark:border-gray-700">
            <div className="mb-6">
              <div className="mx-auto h-24 w-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Aucune critique publiée</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto text-lg">
              Vous n&apos;avez pas encore publié de critique. Commencez par partager votre avis sur les films et séries
              que vous avez vus !
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8">
                  Découvrir des films
                </Button>
              </Link>
              <Link href="/search">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 bg-transparent">
                  Rechercher un film
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
