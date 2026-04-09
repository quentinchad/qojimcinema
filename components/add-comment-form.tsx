"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"

interface AddCommentFormProps {
  reviewId: string
  onCommentAdded: (comment: any) => void
  onCancel: () => void
}

export function AddCommentForm({ reviewId, onCommentAdded, onCancel }: AddCommentFormProps) {
  const [authorName, setAuthorName] = useState("")
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!authorName.trim()) {
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
        author_name: authorName,
        content,
      }

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
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "Envoi..." : "Commenter"}
        </Button>
      </div>
    </form>
  )
}
