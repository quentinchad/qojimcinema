"use client"

import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Star, Edit, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale/fr"
import { CommentsSection } from "./comments-section"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { EditReviewForm } from "./edit-review-form"
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

interface ReviewDetailProps {
  review: any
  currentUser?: any
  onCommentAdded?: (reviewId: string, comment: any) => void
  onReviewUpdated?: (updatedReview: any) => void
  onReviewDeleted?: (reviewId: string) => void
}

export function ReviewDetail({
  review,
  currentUser,
  onCommentAdded,
  onReviewUpdated,
  onReviewDeleted,
}: ReviewDetailProps) {
  const [comments, setComments] = useState(review.comments || [])
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const supabase = createClient()

  // Vérifier si l'utilisateur est le propriétaire de la critique
  const isOwner = currentUser && review.user_id === currentUser.id

  const getInitials = (username: string) => {
    return username?.substring(0, 2).toUpperCase() || "UN"
  }

  const handleCommentAdded = (newComment: any) => {
    setComments([...comments, newComment])
    if (onCommentAdded) {
      onCommentAdded(review.id, newComment)
    }
  }

  const handleReviewUpdated = (updatedReview: any) => {
    setIsEditing(false)
    if (onReviewUpdated) {
      onReviewUpdated(updatedReview)
    }
  }

  const handleDeleteReview = async () => {
    setIsDeleting(true)
    try {
      const { error } = await supabase.from("reviews").delete().eq("id", review.id).eq("user_id", currentUser.id) // Sécurité supplémentaire

      if (error) throw error

      if (onReviewDeleted) {
        onReviewDeleted(review.id)
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la critique:", error)
      alert("Une erreur est survenue lors de la suppression de la critique.")
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  // Si le formulaire d'édition est affiché
  if (isEditing) {
    return <EditReviewForm review={review} onReviewUpdated={handleReviewUpdated} onCancel={() => setIsEditing(false)} />
  }

  return (
    <Card className="overflow-hidden mb-6">
      <CardHeader className="bg-gray-50 dark:bg-gray-900 p-4">
        <div className="flex flex-col space-y-4">
          <div className="flex items-start">
            <Avatar className="h-10 w-10 mr-4">
              <AvatarFallback className={review.users?.is_qojim ? "bg-blue-500" : "bg-gray-500"}>
                {getInitials(review.users?.username || "User")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{review.users?.username || "Utilisateur"}</span>
                {review.users?.is_qojim && (
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-0.5 rounded-full">
                    Expert
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex">
                  {[...Array(10)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300 dark:text-gray-700"
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-1">{review.rating}/10</span>
                <span className="mx-1 hidden sm:inline">•</span>
                <span className="hidden sm:inline">
                  {formatDistanceToNow(new Date(review.created_at), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </span>
                <span className="sm:hidden ml-1">
                  {new Date(review.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Boutons d'action pour le propriétaire de la critique - version améliorée pour mobile */}
          {isOwner && (
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Edit className="h-4 w-4" />
                <span>Modifier</span>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Supprimer</span>
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="font-bold text-lg mb-2">{review.title}</h3>
        {review.content ? (
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line mb-6">{review.content}</p>
        ) : (
          <p className="text-gray-500 dark:text-gray-500 italic mb-6">Aucun commentaire, note uniquement</p>
        )}

        <CommentsSection
          reviewId={review.id}
          comments={comments}
          onCommentAdded={handleCommentAdded}
          currentUser={currentUser}
        />
      </CardContent>

      {/* Boîte de dialogue de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette critique ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Votre critique sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReview}
              className="bg-red-500 hover:bg-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
