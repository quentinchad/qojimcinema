"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Star, MessageCircle, User } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale/fr"
import { AddCommentForm } from "./add-comment-form"
import { createClient } from "@/lib/supabase/client"

interface QojimReviewsListProps {
  reviews: any[]
  userId?: string
}

export function QojimReviewsList({ reviews, userId }: QojimReviewsListProps) {
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [showCommentForm, setShowCommentForm] = useState<Record<string, boolean>>({})
  const [reviewsList, setReviewsList] = useState(reviews)
  const supabase = createClient()

  const toggleComments = (reviewId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }))
  }

  const toggleCommentForm = (reviewId: string) => {
    setShowCommentForm((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }))
  }

  const handleCommentAdded = async (reviewId: string, newComment: any) => {
    setReviewsList(
      reviews.map((review) => {
        if (review.id === reviewId) {
          return {
            ...review,
            comments: [...(review.comments || []), newComment],
          }
        }
        return review
      }),
    )

    setShowCommentForm((prev) => ({
      ...prev,
      [reviewId]: false,
    }))

    setExpandedComments((prev) => ({
      ...prev,
      [reviewId]: true,
    }))
  }

  if (reviewsList.length === 0) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900 p-8 rounded-lg text-center">
        <p className="text-gray-500 dark:text-gray-400">Aucune critique de Qojim pour le moment.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {reviewsList.map((review) => (
        <Card key={review.id} className="overflow-hidden">
          <Link href={`/movies/${review.movie_tmdb_id}?type=movie`}>
            <CardHeader className="p-0">
              <div className="relative h-40 w-full overflow-hidden">
                <Image
                  src={
                    review.movie_backdrop_path
                      ? `https://image.tmdb.org/t/p/w780${review.movie_backdrop_path}`
                      : review.movie_poster_path
                        ? `https://image.tmdb.org/t/p/w500${review.movie_poster_path}`
                        : "/placeholder.svg?height=200&width=400&text=No+Backdrop"
                  }
                  alt={review.movie_title}
                  fill
                  className="object-cover object-center"
                  style={{ objectPosition: "center 20%" }}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg?height=200&width=400&text=No+Backdrop"
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-end">
                  <div className="p-4 w-full">
                    <h3 className="text-xl font-bold text-white">{review.movie_title}</h3>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Link>

          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-500 text-white">
                  {review.users?.username?.substring(0, 2).toUpperCase() || "QJ"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{review.users?.username || "Qojim"}</span>
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-0.5 rounded-full">
                    Expert
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
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
                </div>
              </div>
            </div>

            <h4 className="font-bold text-lg mb-2">{review.title}</h4>
            <p className="text-gray-700 dark:text-gray-300 line-clamp-4">{review.content}</p>

            <Link
              href={`/movies/${review.movie_tmdb_id}?type=movie`}
              className="text-blue-600 dark:text-blue-400 text-sm mt-2 inline-block hover:underline"
            >
              Lire la suite
            </Link>
          </CardContent>

          <CardFooter className="flex flex-col items-stretch p-0 border-t border-gray-200 dark:border-gray-800">
            <div className="flex justify-between p-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 dark:text-gray-400"
                onClick={() => toggleComments(review.id)}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                {review.comments?.length || 0} commentaire{review.comments?.length !== 1 ? "s" : ""}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 dark:text-gray-400"
                onClick={() => toggleCommentForm(review.id)}
              >
                Commenter
              </Button>
            </div>

            {showCommentForm[review.id] && (
              <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                <AddCommentForm
                  reviewId={review.id}
                  onCommentAdded={(comment) => handleCommentAdded(review.id, comment)}
                  onCancel={() => toggleCommentForm(review.id)}
                />
              </div>
            )}

            {expandedComments[review.id] && review.comments && review.comments.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-800">
                {review.comments.map((comment: any) => (
                  <div key={comment.id} className="p-3 border-b border-gray-200 dark:border-gray-800 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="font-medium text-sm">{comment.author_name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 pl-6">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
