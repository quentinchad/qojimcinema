import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { WatchlistGrid } from "@/components/watchlist-grid"
import { redirect } from "next/navigation"

export default async function WatchlistPage() {
  const supabase = await createClient()

  // Vérifier si l'utilisateur est connecté
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    redirect("/auth/login?redirectTo=/a-voir")
  }

  // Récupérer les éléments de la liste à voir de l'utilisateur
  const { data: watchlistItems, error } = await supabase
    .from("watchlist")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching watchlist:", error)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Ma liste à voir</h1>
        <WatchlistGrid initialItems={watchlistItems || []} userId={session.user.id} />
      </div>
    </div>
  )
}
