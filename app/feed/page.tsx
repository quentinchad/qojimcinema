import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { FeedContent } from "@/components/feed-content"
import { Suspense } from "react"

// Composant de chargement
function FeedLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Fil d'actualité</h1>
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement du fil d'actualité...</p>
      </div>
    </div>
  )
}

// Composant principal avec les données
async function FeedPageContent() {
  const supabase = await createClient()

  // Récupérer la session utilisateur
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const currentUserId = session?.user?.id

  // Récupérer toutes les critiques
  const { data: reviews, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching reviews:", error)
  }

  // Récupérer les informations des utilisateurs pour ces critiques
  let reviewsWithUsers = []

  if (reviews && reviews.length > 0) {
    // Récupérer les IDs des utilisateurs uniques
    const userIds = [...new Set(reviews.map((review) => review.user_id))]

    // Récupérer les données des utilisateurs
    const { data: users } = await supabase.from("users").select("*").in("id", userIds)

    // Créer un map des utilisateurs par ID pour un accès facile
    const usersMap = {}
    if (users) {
      users.forEach((user) => {
        usersMap[user.id] = user
      })
    }

    // Récupérer les commentaires pour toutes les critiques
    const reviewIds = reviews.map((review) => review.id)
    const { data: allComments } = await supabase.from("review_comments").select("*").in("review_id", reviewIds)

    // Créer un map des commentaires par ID de critique
    const commentsMap = {}
    if (allComments) {
      allComments.forEach((comment) => {
        if (!commentsMap[comment.review_id]) {
          commentsMap[comment.review_id] = []
        }
        commentsMap[comment.review_id].push(comment)
      })
    }

    // Combiner les données
    reviewsWithUsers = reviews.map((review) => ({
      ...review,
      users: usersMap[review.user_id] || null,
      comments: commentsMap[review.id] || [],
    }))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Fil d'actualité</h1>
      <FeedContent initialReviews={reviewsWithUsers} currentUserId={currentUserId} />
    </div>
  )
}

export default function FeedPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      <Header />
      <Suspense fallback={<FeedLoading />}>
        <FeedPageContent />
      </Suspense>
    </div>
  )
}
