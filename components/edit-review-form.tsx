"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface EditReviewFormProps {
  review: any
  onReviewUpdated: (updatedReview: any) => void
  onCancel: () => void
}

export function EditReviewForm({ review, onReviewUpdated, onCancel }: EditReviewFormProps) {
  const [content, setContent] = useState(review.content || "")
  const [rating, setRating] = useState(review.rating || 0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Déterminer si c'est une série TV ou un film
  const isTV = review.media_type === "tv" || review.movie_tmdb_id.toString().includes("tv-")

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
      const { data: updatedReviewData, error: updateError } = await supabase
        .from("reviews")
        .update({
          content,
          rating,
        })
        .eq("id", review.id)
        .eq("user_id", review.user_id) // Sécurité supplémentaire
        .select("*")

      if (updateError) throw updateError

      if (!updatedReviewData || updatedReviewData.length === 0) {
        throw new Error("Aucune donnée retournée après la mise à jour de la critique")
      }

      // Mettre à jour la critique avec les nouvelles données
      const updatedReview = {
        ...review,
        ...updatedReviewData[0],
      }

      onReviewUpdated(updatedReview)
      router.refresh()
    } catch (error: any) {
      console.error("Error updating review:", error)
      setError(error.message || "Une erreur est survenue lors de la mise à jour de la critique")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Modifier votre critique</h3>
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
            placeholder={`Partagez votre avis sur ${isTV ? "cette série" : "ce film"}...`}
            className="min-h-[150px] bg-gray-800 border-gray-700"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Mise à jour..." : "Mettre à jour"}
          </Button>
        </div>
      </form>
    </div>
  )
}
