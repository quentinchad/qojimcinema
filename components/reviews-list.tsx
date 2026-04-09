"use client"

import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, MessageCircle, User } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { AddCommentForm } from "./add-comment-form"

interface ReviewsListProps {
  reviews: any[]
  userId?: string
  onCommentAdded: (reviewId: string, newComment: any) => void
}

export function ReviewsList({ reviews, userId, onCommentAdded }: ReviewsListProps) {
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [showCommentForm, setShowCommentForm] = useState<Record<string, boolean>>({})

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

  const handleCommentAdded = (reviewId: string, newComment: any) => {
    onCommentAdded(reviewId, newComment)
    setShowCommentForm((prev) => ({
      ...prev,
      [reviewId]: false,
    }))
    setExpandedComments((prev) => ({
      ...prev,
      [reviewId]: true,
    }))
  }

  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <Card key={review.id} className="overflow-hidden">
          <CardHeader className="bg-gray-50 dark:bg-gray-900 flex flex-row items-center gap-4 p-4">
            <Avatar className="h-10 w-10">
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
                <span className="mx-1">•</span>
                <span>
                  {formatDistanceToNow(new Date(review.created_at), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <h3 className="font-bold text-lg mb-2">{review.title}</h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{review.content}</p>
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
