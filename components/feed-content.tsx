"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Film, Tv, Star, Clock, AlignLeft } from "lucide-react"
import { ReviewCard } from "@/components/review-card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EditReviewForm } from "@/components/edit-review-form"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Pagination } from "@/components/pagination"

interface FeedContentProps {
  initialReviews: any[]
  currentUserId?: string
}

export function FeedContent({ initialReviews, currentUserId }: FeedContentProps) {
  const [reviews, setReviews] = useState(initialReviews)
  const [filteredReviews, setFilteredReviews] = useState(initialReviews)
  const [paginatedReviews, setPaginatedReviews] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [mediaType, setMediaType] = useState("all")
  const [sortBy, setSortBy] = useState("date-desc")
  const [reviewToEdit, setReviewToEdit] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(30)
  const router = useRouter()
  const supabase = createClient()

  // Filtrer et trier les critiques lorsque les filtres changent
  useEffect(() => {
    // Commencer par filtrer les critiques de Qojim
    let result = reviews.filter((review) => !review.users?.is_qojim)

    // Filtrer par type de média (film/série)
    if (mediaType !== "all") {
      result = result.filter((review) => {
        // Plusieurs façons de déterminer si c'est une série TV:
        // 1. Le champ media_type est explicitement défini
        if (review.media_type) {
          return mediaType === review.media_type
        }

        // 2. L'ID du média a un préfixe "tv-"
        const isTV = review.movie_tmdb_id.toString().includes("tv-")
        return mediaType === "tv" ? isTV : !isTV
      })
    }

    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (review) =>
          review.movie_title.toLowerCase().includes(query) ||
          review.content.toLowerCase().includes(query) ||
          review.users?.username.toLowerCase().includes(query),
      )
    }

    // Trier les résultats
    result = sortReviews(result, sortBy)

    setFilteredReviews(result)
    // Réinitialiser à la première page quand les filtres changent
    setCurrentPage(1)
  }, [reviews, searchQuery, mediaType, sortBy])

  // Mettre à jour les critiques paginées quand la page ou les filtres changent
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setPaginatedReviews(filteredReviews.slice(startIndex, endIndex))
  }, [filteredReviews, currentPage, itemsPerPage])

  // Fonction pour trier les critiques
  const sortReviews = (reviewsToSort: any[], sortOption: string) => {
    const sorted = [...reviewsToSort]

    switch (sortOption) {
      case "date-desc":
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      case "date-asc":
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      case "alpha-asc":
        return sorted.sort((a, b) => a.movie_title.localeCompare(b.movie_title))
      case "alpha-desc":
        return sorted.sort((a, b) => b.movie_title.localeCompare(a.movie_title))
      case "rating-desc":
        return sorted.sort((a, b) => b.rating - a.rating)
      case "rating-asc":
        return sorted.sort((a, b) => a.rating - b.rating)
      default:
        return sorted
    }
  }

  const handleReviewDeleted = (reviewId: string) => {
    setReviews(reviews.filter((review) => review.id !== reviewId))
  }

  const handleEditClick = (review: any) => {
    setReviewToEdit(review)
  }

  const handleReviewUpdated = (updatedReview: any) => {
    setReviews(reviews.map((review) => (review.id === updatedReview.id ? updatedReview : review)))
    setReviewToEdit(null)
  }

  // Modifier la fonction handlePageChange pour un défilement instantané
  const handlePageChange = (newPage: number) => {
    // Défiler instantanément vers le haut de la page
    window.scrollTo(0, 0)
    setCurrentPage(newPage)
  }

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage)

  return (
    <div>
      {/* Formulaire d'édition de critique */}
      {reviewToEdit && (
        <div className="mb-8">
          <EditReviewForm
            review={reviewToEdit}
            onReviewUpdated={handleReviewUpdated}
            onCancel={() => setReviewToEdit(null)}
          />
        </div>
      )}

      {/* Filtres et recherche */}
      <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher un film, une critique..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-800"
            />
          </div>

          {/* Type de média */}
          <Tabs defaultValue="all" onValueChange={setMediaType} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">Tous</TabsTrigger>
              <TabsTrigger value="movie" className="flex items-center gap-1">
                <Film className="h-4 w-4" />
                Films
              </TabsTrigger>
              <TabsTrigger value="tv" className="flex items-center gap-1">
                <Tv className="h-4 w-4" />
                Séries
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Tri */}
          <Select defaultValue="date-desc" onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc" className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> Plus récent
              </SelectItem>
              <SelectItem value="date-asc" className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> Plus ancien
              </SelectItem>
              <SelectItem value="alpha-asc" className="flex items-center gap-2">
                <AlignLeft className="h-4 w-4" /> A-Z
              </SelectItem>
              <SelectItem value="alpha-desc" className="flex items-center gap-2">
                <AlignLeft className="h-4 w-4" /> Z-A
              </SelectItem>
              <SelectItem value="rating-desc" className="flex items-center gap-2">
                <Star className="h-4 w-4" /> Note ↓
              </SelectItem>
              <SelectItem value="rating-asc" className="flex items-center gap-2">
                <Star className="h-4 w-4" /> Note ↑
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filteredReviews.length} critique{filteredReviews.length !== 1 ? "s" : ""} trouvée
            {filteredReviews.length !== 1 ? "s" : ""}
            {filteredReviews.length > itemsPerPage && (
              <span>
                {" "}
                (affichage {(currentPage - 1) * itemsPerPage + 1} à{" "}
                {Math.min(currentPage * itemsPerPage, filteredReviews.length)})
              </span>
            )}
          </p>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("")
              setMediaType("all")
              setSortBy("date-desc")
            }}
          >
            Réinitialiser les filtres
          </Button>
        </div>
      </div>

      {/* Liste des critiques */}
      {filteredReviews.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                currentUserId={currentUserId}
                onReviewDeleted={handleReviewDeleted}
                onEditClick={handleEditClick}
              />
            ))}
          </div>

          {/* Pagination */}
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </>
      ) : (
        <div className="bg-gray-100 dark:bg-gray-900 p-8 rounded-lg text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Aucune critique ne correspond à vos critères de recherche.
          </p>
          <Button
            onClick={() => {
              setSearchQuery("")
              setMediaType("all")
              setSortBy("date-desc")
            }}
          >
            Réinitialiser les filtres
          </Button>
        </div>
      )}
    </div>
  )
}
