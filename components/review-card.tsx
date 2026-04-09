"use client"

import Image from "next/image"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale/fr"
import { Star, MessageCircle, Film, Tv, Edit, Trash2, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface ReviewCardProps {
  review: any
  currentUserId?: string
  onReviewDeleted?: (reviewId: string) => void
  onEditClick?: (review: any) => void
}

export function ReviewCard({ review, currentUserId, onReviewDeleted, onEditClick }: ReviewCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const formattedDate = formatDistanceToNow(new Date(review.created_at), {
    addSuffix: true,
    locale: fr,
  })

  const getInitials = (username: string) => {
    return username?.substring(0, 2).toUpperCase() || "UN"
  }

  // Déterminer si c'est une série TV ou un film
  let isTV = review.media_type === "tv"

  // Si media_type n'est pas défini, vérifier l'ID
  if (review.media_type === undefined) {
    isTV = review.movie_tmdb_id.toString().includes("tv-")
  }

  const mediaId = isTV ? review.movie_tmdb_id.toString().replace("tv-", "") : review.movie_tmdb_id

  // Vérifier si l'utilisateur est le propriétaire de la critique
  const isOwner = currentUserId && review.user_id === currentUserId

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const { error } = await supabase.from("reviews").delete().eq("id", review.id).eq("user_id", currentUserId)

      if (error) throw error

      if (onReviewDeleted) {
        onReviewDeleted(review.id)
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la critique:", error)
      alert("Une erreur est survenue lors de la suppression de la critique.")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <Card className="overflow-hidden h-full flex flex-col hover:shadow-xl transition-all duration-300 group">
        <Link href={isTV ? `/tv/${mediaId}` : `/movies/${mediaId}`}>
          <CardHeader className="p-0">
            <div className="relative h-48 w-full overflow-hidden">
              <Image
                src={
                  review.movie_backdrop_path
                    ? `https://image.tmdb.org/t/p/w780${review.movie_backdrop_path}`
                    : review.movie_poster_path
                      ? `https://image.tmdb.org/t/p/w500${review.movie_poster_path}`
                      : "/placeholder.svg?height=200&width=400&text=No+Image"
                }
                alt={review.movie_title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-white line-clamp-2">{review.movie_title}</h3>
                  {isTV ? (
                    <Tv className="h-5 w-5 text-gray-300 flex-shrink-0" />
                  ) : (
                    <Film className="h-5 w-5 text-gray-300 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => {
                      const starValue = i + 1
                      const fillStar = starValue <= Math.round(review.rating / 2)

                      return (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${fillStar ? "text-yellow-400 fill-yellow-400" : "text-gray-400"}`}
                        />
                      )
                    })}
                  </div>
                  <span className="text-white font-semibold text-sm">{review.rating}/10</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Link>

        <CardContent className="p-4 flex-grow">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback
                  className={review.users?.is_qojim ? "bg-blue-600 text-white" : "bg-gray-500 text-white"}
                >
                  {getInitials(review.users?.username)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{review.users?.username || "Utilisateur"}</span>
                  {review.users?.is_qojim && (
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full font-medium">
                      Expert
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</div>
              </div>
            </div>

            {/* Menu d'actions pour le propriétaire de la critique */}
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <span className="sr-only">Menu d'actions</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEditClick && onEditClick(review)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {review.title && (
            <h4 className="font-bold text-lg mb-2 line-clamp-2 text-gray-900 dark:text-white">{review.title}</h4>
          )}

          {review.content ? (
            <p className="text-gray-700 dark:text-gray-300 line-clamp-3 text-sm leading-relaxed">{review.content}</p>
          ) : (
            <p className="text-gray-500 dark:text-gray-500 italic text-sm">Note uniquement</p>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0 border-t border-gray-200 dark:border-gray-800 mt-auto">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center text-gray-500 dark:text-gray-400">
              <MessageCircle className="h-4 w-4 mr-2" />
              <span className="text-sm">
                {review.comments?.length || 0} commentaire{review.comments?.length !== 1 ? "s" : ""}
              </span>
            </div>

            <Link
              href={isTV ? `/tv/${mediaId}` : `/movies/${mediaId}`}
              className="text-blue-600 dark:text-blue-400 text-sm hover:underline font-medium transition-colors"
            >
              Voir plus
            </Link>
          </div>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la critique</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette critique ? Cette action est irréversible et supprimera également
              tous les commentaires associés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
