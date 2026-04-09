import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { ProfileForm } from "@/components/profile-form"
import { UserStats } from "@/components/user-stats"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  const supabase = await createClient()

  // Vérifier si l'utilisateur est connecté
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    redirect("/auth/login?redirectTo=/profile")
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

  // Récupérer le nombre de critiques de l'utilisateur
  const { count: reviewsCount, error: reviewsError } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.user.id)

  if (reviewsError) {
    console.error("Error counting reviews:", reviewsError)
  }

  // Récupérer le nombre d'éléments dans la liste d'attente
  const { count: watchlistCount, error: watchlistError } = await supabase
    .from("watchlist")
    .select("id", { count: "exact", head: true })
    .eq("user_id", session.user.id)

  if (watchlistError) {
    console.error("Error counting watchlist items:", watchlistError)
  }

  // Simplifier la partie de comptage des commentaires pour éviter les erreurs

  // Récupérer le nombre de commentaires de l'utilisateur
  // Utiliser une approche simplifiée pour éviter les erreurs
  let commentsCount = 0
  try {
    // Essayer de compter les commentaires par nom d'auteur
    // Récupérer d'abord le nom d'utilisateur
    const username = userData?.username
    if (username) {
      const { count, error } = await supabase
        .from("review_comments")
        .select("id", { count: "exact", head: true })
        .eq("author_name", username)

      if (!error) {
        commentsCount = count || 0
      }
    }
  } catch (error) {
    console.error("Error counting comments:", error)
    commentsCount = 0
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Mon profil</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Colonne de gauche - Informations du profil */}
          <div className="md:col-span-1">
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Informations personnelles</h2>
              <ProfileForm user={userData} />
            </div>
          </div>

          {/* Colonne de droite - Statistiques */}
          <div className="md:col-span-2">
            <UserStats
              reviewsCount={reviewsCount || 0}
              watchlistCount={watchlistCount || 0}
              commentsCount={commentsCount}
              isQojim={userData?.is_qojim || false}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
