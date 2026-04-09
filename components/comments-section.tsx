"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, User, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale/fr"
import { CommentForm } from "./comment-form"
import { createClient } from "@/lib/supabase/client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface CommentsSectionProps {
  reviewId: string
  comments: any[]
  onCommentAdded: (comment: any) => void
  currentUser?: any
}

export function CommentsSection({
  reviewId,
  comments: initialComments,
  onCommentAdded,
  currentUser,
}: CommentsSectionProps) {
  const [comments, setComments] = useState(initialComments || [])
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const supabase = createClient()

  const handleCommentAdded = (newComment: any) => {
    setComments([...comments, newComment])
    setShowCommentForm(false)
    onCommentAdded(newComment)
  }

  // Vérifier si un commentaire appartient à l'utilisateur connecté
  const isUserComment = (comment: any) => {
    if (!currentUser) return false

    // Vérifier par nom d'utilisateur
    const username = currentUser.user_metadata?.username || currentUser.email?.split("@")[0] || ""
    return comment.author_name === username
  }

  // Fonction pour supprimer un commentaire
  const deleteComment = async (commentId: string) => {
    setIsDeleting(true)
    try {
      const { error } = await supabase.from("review_comments").delete().eq("id", commentId)

      if (error) throw error

      // Mettre à jour la liste des commentaires
      setComments(comments.filter((comment) => comment.id !== commentId))
    } catch (error) {
      console.error("Erreur lors de la suppression du commentaire:", error)
    } finally {
      setIsDeleting(false)
      setCommentToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  // Ouvrir la boîte de dialogue de confirmation
  const confirmDelete = (commentId: string) => {
    setCommentToDelete(commentId)
    setDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Commentaires ({comments.length})
        </h3>
        {!showCommentForm && (
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowCommentForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Commenter
          </Button>
        )}
      </div>

      {showCommentForm && (
        <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
          <CommentForm
            reviewId={reviewId}
            onCommentAdded={handleCommentAdded}
            onCancel={() => setShowCommentForm(false)}
            currentUser={currentUser}
          />
        </div>
      )}

      {comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="font-medium">{comment.author_name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                </div>

                {/* Bouton de suppression pour les commentaires de l'utilisateur */}
                {isUserComment(comment) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                    onClick={() => confirmDelete(comment.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Supprimer</span>
                  </Button>
                )}
              </div>
              <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          Aucun commentaire pour le moment. Soyez le premier à commenter !
        </div>
      )}

      {/* Boîte de dialogue de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce commentaire ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le commentaire sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => commentToDelete && deleteComment(commentToDelete)}
              className="bg-red-500 hover:bg-red-600"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
