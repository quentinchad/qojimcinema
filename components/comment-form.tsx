"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"

interface CommentFormProps {
  reviewId: string
  onCommentAdded: (comment: any) => void
  onCancel?: () => void
  currentUser?: any // Ajout de l'utilisateur connecté
}

export function CommentForm({ reviewId, onCommentAdded, onCancel, currentUser }: CommentFormProps) {
  const [authorName, setAuthorName] = useState("")
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Modifier la fonction handleSubmit pour éviter d'utiliser la colonne user_id si elle n'existe pas

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Si l'utilisateur est connecté, utiliser son nom d'utilisateur
    const finalAuthorName = currentUser
      ? currentUser.user_metadata?.username || currentUser.email?.split("@")[0] || "Utilisateur"
      : authorName.trim()

    if (!currentUser && !finalAuthorName) {
      setError("Veuillez entrer votre nom")
      return
    }

    if (!content.trim()) {
      setError("Veuillez entrer un commentaire")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Créer un objet avec les données de base
      const commentData = {
        review_id: reviewId,
        author_name: finalAuthorName,
        content,
      }

      // Ne pas inclure user_id pour éviter l'erreur si la colonne n'existe pas
      const { data, error: commentError } = await supabase.from("review_comments").insert(commentData).select().single()

      if (commentError) throw commentError

      onCommentAdded(data)
      setAuthorName("")
      setContent("")
    } catch (error: any) {
      console.error("Error adding comment:", error)
      setError(error.message || "Une erreur est survenue lors de l'ajout du commentaire")
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

      {/* Afficher le champ de nom uniquement si l'utilisateur n'est pas connecté */}
      {!currentUser && (
        <div className="space-y-2">
          <label htmlFor="author-name" className="block font-medium text-sm">
            Votre nom
          </label>
          <Input
            id="author-name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Votre nom"
            className="bg-white dark:bg-gray-950"
            required
          />
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="comment-content" className="block font-medium text-sm">
          Votre commentaire
        </label>
        <Textarea
          id="comment-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Votre commentaire..."
          className="min-h-[80px] bg-white dark:bg-gray-950"
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
          {isSubmitting ? "Envoi..." : "Publier"}
        </Button>
      </div>
    </form>
  )
}
