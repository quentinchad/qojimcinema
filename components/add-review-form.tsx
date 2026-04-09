"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Star } from "lucide-react"

interface AddReviewFormProps {
  movieId: string
  movieTitle: string
  userId: string
  onReviewAdded: (review: any) => void
  onCancel: () => void
}

export function AddReviewForm({ movieId, movieTitle, userId, onReviewAdded, onCancel }: AddReviewFormProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      setError("Veuillez attribuer une note")
      return
    }

    if (!title.trim()) {
      setError("Veuillez ajouter un titre à votre critique")
      return
    }

    if (!content.trim()) {
      setError("Veuillez ajouter un contenu à votre critique")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Récupérer les informations de l'utilisateur
      const { data: userData, error: userError } = await supabase.from("users").select("*").eq("id", userId).single()

      if (userError) throw userError

      // Ajouter la critique
      const { data, error: reviewError } = await supabase
        .from("reviews")
        .insert({
          movie_tmdb_id: movieId,
          movie_title: movieTitle,
          user_id: userId,
          title,
          content,
          rating,
        })
        .select(`
          *,
          users:user_id (
            id,
            username,
            email,
            is_qojim
          ),
          comments:review_comments (
            id,
            content,
            author_name,
            created_at
          )
        `)
        .single()

      if (reviewError) throw reviewError

      onReviewAdded(data)
    } catch (error: any) {
      console.error("Error adding review:", error)
      setError(error.message || "Une erreur est survenue lors de l'ajout de la critique")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-900 rounded-md text-red-800 dark:text-red-300">
          {error}
        </div>
      )}

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
                  i < (hoveredRating || rating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300 dark:text-gray-700"
                }`}
              />
            </button>
          ))}
          <span className="ml-2 font-bold">{hoveredRating || rating || ""}</span>
          <span className="text-gray-500 dark:text-gray-400">/10</span>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="review-title" className="block font-medium">
          Titre de votre critique
        </label>
        <Input
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Un titre percutant..."
          className="bg-white dark:bg-gray-950"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="review-content" className="block font-medium">
          Votre critique
        </label>
        <Textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Partagez votre avis sur ce film..."
          className="min-h-[150px] bg-white dark:bg-gray-950"
          required
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
  )
}
