"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface AddMovieReviewFormProps {
  movieId: string
  movieTitle: string
  moviePosterPath: string | null
  movieBackdropPath?: string | null // Ajout du backdrop path
  userId: string
  onReviewAdded: (review: any) => void
  onCancel: () => void
  mediaType?: "movie" | "tv" // Ajout d'un paramètre explicite pour le type de média
}

export function AddMovieReviewForm({
  movieId,
  movieTitle,
  moviePosterPath,
  movieBackdropPath, // Récupération du backdrop path
  userId,
  onReviewAdded,
  onCancel,
  mediaType = "movie", // Par défaut, c'est un film
}: AddMovieReviewFormProps) {
  const [content, setContent] = useState("")
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Formater l'ID du média avec un préfixe pour les séries TV
  const formattedMovieId = mediaType === "tv" ? `tv-${movieId}` : movieId

  console.log("Ajout d'une critique pour:", {
    mediaType,
    movieId,
    formattedMovieId,
    movieTitle,
    movieBackdropPath, // Log du backdrop path
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      setError("Veuillez attribuer une note (le texte est optionnel)")
      return
    }

    // Le contenu est maintenant optionnel, seule la note est obligatoire

    setIsSubmitting(true)
    setError(null)

    try {
      // Récupérer les informations de l'utilisateur
      const { data: userDataArray, error: userSelectError } = await supabase.from("users").select("*").eq("id", userId)

      if (userSelectError) throw userSelectError

      let userData
      // Si l'utilisateur n'existe pas dans la table users
      if (!userDataArray || userDataArray.length === 0) {
        // Récupérer les informations de l'utilisateur depuis auth
        const { data: authUser } = await supabase.auth.getUser()

        if (!authUser || !authUser.user) {
          throw new Error("Utilisateur non authentifié")
        }

        const userEmail = authUser.user.email || ""
        // Vérifier si l'utilisateur est Qojim
        const isQojim = userEmail === "quentin.qojim@gmail.com"

        // Créer l'utilisateur dans la table users
        const { data: newUserData, error: insertUserError } = await supabase
          .from("users")
          .insert({
            id: userId,
            username: authUser.user.user_metadata?.username || userEmail.split("@")[0] || "Utilisateur",
            email: userEmail,
            is_qojim: isQojim,
          })
          .select("*")

        if (insertUserError) throw insertUserError

        userData = newUserData[0]
      } else {
        userData = userDataArray[0]

        // Vérifier si l'utilisateur est Qojim mais que le flag n'est pas défini
        if (userData.email === "quentin.qojim@gmail.com" && !userData.is_qojim) {
          // Mettre à jour le flag is_qojim
          const { data: updatedUser, error: updateError } = await supabase
            .from("users")
            .update({ is_qojim: true })
            .eq("id", userId)
            .select("*")

          if (updateError) throw updateError

          if (updatedUser && updatedUser.length > 0) {
            userData = updatedUser[0]
          }
        }
      }

      // Ajouter la critique avec le backdrop_path
      const { data: reviewData, error: reviewError } = await supabase
        .from("reviews")
        .insert({
          movie_tmdb_id: formattedMovieId, // L'ID contient déjà le préfixe "tv-" pour les séries
          movie_title: movieTitle,
          movie_poster_path: moviePosterPath,
          movie_backdrop_path: movieBackdropPath, // Ajout du backdrop path
          user_id: userId,
          content,
          rating,
        })
        .select("*")

      if (reviewError) throw reviewError

      // Vérifier que des données ont été retournées
      if (!reviewData || reviewData.length === 0) {
        throw new Error("Aucune donnée retournée après l'insertion de la critique")
      }

      const data = reviewData[0]

// 🔥 AJOUT ICI
if (userData?.is_qojim) {
  try {
    // récupérer tous les users sauf toi
    const { data: users } = await supabase
      .from("users")
      .select("email")
      .neq("email", userData.email)

    await fetch("/api/send-review-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        users,
        movieTitle,
        movieTmdbId: formattedMovieId,
        moviePosterPath,
        rating,
        content,
      }),
    })
  } catch (err) {
    console.error("Erreur envoi email:", err)
  }
}

      // Récupérer les informations complètes pour la nouvelle critique
      const newReview = {
        ...data,
        users: userData,
        comments: [],
      }

      onReviewAdded(newReview)
      router.refresh()
    } catch (error: any) {
      console.error("Error adding review:", error)
      setError(error.message || "Une erreur est survenue lors de l'ajout de la critique")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Ajouter une critique</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-red-900/20 border border-red-800 rounded-md text-red-400">{error}</div>}

        <div className="space-y-2">
          <label className="block font-medium">Votre note</label>
          <div className="flex gap-1">
            {[...Array(10)].map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i + 1)}
                onMouseEnter={() => setHoveredRating(i + 1)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none"
              >
                <Star
                  className={`h-6 w-6 ${
                    i < (hoveredRating || rating) ? "text-yellow-500 fill-yellow-500" : "text-gray-700"
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 font-bold">{hoveredRating || rating || ""}</span>
            <span className="text-gray-400">/10</span>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="review-content" className="block font-medium">
            Votre critique
          </label>
          <Textarea
            id="review-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Partagez votre avis sur ${mediaType === "tv" ? "cette série" : "ce film"}...`}
            className="min-h-[150px] bg-gray-800 border-gray-700"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Envoi en cours..." : "Publier ma critique"}
          </Button>
        </div>
      </form>
    </div>
  )
}
