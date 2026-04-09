export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { QojimFeedContent } from "@/components/qojim-feed-content"
import { Suspense } from "react"

// Composant de chargement
function QojimReviewsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Les critiques de Qojim</h1>
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement des critiques...</p>
      </div>
    </div>
  )
}

// Composant principal avec les données
async function QojimReviewsContent() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const currentUserId = session?.user?.id

  // Récupérer l'ID de l'utilisateur Qojim
  const { data: qojimUser } = await supabase.from("users").select("id").eq("is_qojim", true).single()

  const qojimId = qojimUser?.id

  // Récupérer les critiques de Qojim
  const { data: reviewsData, error: reviewsError } = await supabase
    .from("reviews")
    .select("*")
    .eq("user_id", qojimId)
    .order("created_at", { ascending: false })

  if (reviewsError) {
    console.error("Error fetching Qojim reviews:", reviewsError)
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Les critiques de Qojim</h1>
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-900 rounded-lg p-4 text-red-800 dark:text-red-300">
          Erreur lors du chargement des critiques. Veuillez réessayer plus tard.
        </div>
      </div>
    )
  }

  // Si aucune critique n'est trouvée, retourner une liste vide
  if (!reviewsData || reviewsData.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Les critiques de Qojim</h1>
        <QojimFeedContent initialReviews={[]} currentUserId={currentUserId} />
      </div>
    )
  }

  // Récupérer les informations de l'utilisateur Qojim
  const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", qojimId).single()

  if (userError) {
    console.error("Error fetching Qojim user data:", userError)
  }

  // Récupérer les commentaires pour toutes les critiques
  const reviewIds = reviewsData.map((review) => review.id)
  const { data: commentsData, error: commentsError } = await supabase
    .from("review_comments")
    .select("*")
    .in("review_id", reviewIds)

  if (commentsError) {
    console.error("Error fetching review comments:", commentsError)
  }

  // Organiser les commentaires par review_id
  const commentsByReviewId = {}
  if (commentsData) {
    commentsData.forEach((comment) => {
      if (!commentsByReviewId[comment.review_id]) {
        commentsByReviewId[comment.review_id] = []
      }
      commentsByReviewId[comment.review_id].push(comment)
    })
  }

  // Combiner les données
  const reviews = reviewsData.map((review) => ({
    ...review,
    users: userData,
    comments: commentsByReviewId[review.id] || [],
  }))

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Les critiques de Qojim</h1>
      <QojimFeedContent initialReviews={reviews} currentUserId={currentUserId} />
    </div>
  )
}

export default function QojimReviewsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      <Header />
      <Suspense fallback={<QojimReviewsLoading />}>
        <QojimReviewsContent />
      </Suspense>
    </div>
  )
}