import { Star } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

interface UserReviewCardProps {
  review: any
}

export function UserReviewCard({ review }: UserReviewCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{review.users?.username || "Utilisateur"}</span>
          </div>
          <span className="text-sm text-gray-400">
            {formatDistanceToNow(new Date(review.created_at), {
              addSuffix: true,
              locale: fr,
            })}
          </span>
        </div>

        <div className="flex mb-3">
          {[...Array(10)].map((_, i) => (
            <Star
              key={i}
              className={`h-5 w-5 ${i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-700"}`}
            />
          ))}
          <span className="ml-2">{review.rating}/10</span>
        </div>

        <p className="text-gray-300">{review.content}</p>
      </div>
    </div>
  )
}
