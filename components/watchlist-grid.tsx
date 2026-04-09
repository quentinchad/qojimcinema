"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Film, Tv, Search, Trash2, Clock, AlignLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface WatchlistItem {
  id: string
  movie_tmdb_id: string
  movie_title: string
  movie_poster_path: string | null
  user_id: string
  created_at: string
  media_type?: "movie" | "tv"
}

interface WatchlistGridProps {
  initialItems: WatchlistItem[]
  userId: string
}

export function WatchlistGrid({ initialItems, userId }: WatchlistGridProps) {
  const [items, setItems] = useState<WatchlistItem[]>(initialItems)
  const [filteredItems, setFilteredItems] = useState<WatchlistItem[]>(initialItems)
  const [searchQuery, setSearchQuery] = useState("")
  const [mediaType, setMediaType] = useState("all")
  const [sortBy, setSortBy] = useState("date-desc")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Déterminer le type de média pour chaque élément
  useEffect(() => {
    const itemsWithMediaType = items.map((item) => {
      // Si le type de média est déjà défini, le conserver
      if (item.media_type) {
        return item
      }

      // Sinon, déterminer le type en fonction de l'ID
      const isTV = item.movie_tmdb_id.toString().includes("tv-")
      return {
        ...item,
        media_type: isTV ? "tv" : "movie",
      }
    })

    setItems(itemsWithMediaType)
  }, [initialItems])

  // Filtrer et trier les éléments
  useEffect(() => {
    let result = [...items]

    // Filtrer par type de média
    if (mediaType !== "all") {
      result = result.filter((item) => {
        if (item.media_type) {
          return item.media_type === mediaType
        }

        // Fallback pour les anciens éléments sans media_type
        const isTV = item.movie_tmdb_id.toString().includes("tv-")
        return mediaType === "tv" ? isTV : !isTV
      })
    }

    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((item) => item.movie_title.toLowerCase().includes(query))
    }

    // Trier les résultats
    result = sortItems(result, sortBy)

    setFilteredItems(result)
  }, [items, searchQuery, mediaType, sortBy])

  // Fonction pour trier les éléments
  const sortItems = (itemsToSort: WatchlistItem[], sortOption: string) => {
    const sorted = [...itemsToSort]

    switch (sortOption) {
      case "date-desc":
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      case "date-asc":
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      case "alpha-asc":
        return sorted.sort((a, b) => a.movie_title.localeCompare(b.movie_title))
      case "alpha-desc":
        return sorted.sort((a, b) => b.movie_title.localeCompare(a.movie_title))
      default:
        return sorted
    }
  }

  const removeFromWatchlist = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir retirer cet élément de votre liste ?")) {
      return
    }

    setIsLoading(true)
    try {
      const { error } = await supabase.from("watchlist").delete().eq("id", id).eq("user_id", userId) // Sécurité supplémentaire

      if (error) throw error

      // Mettre à jour l'état local
      setItems(items.filter((item) => item.id !== id))
      router.refresh()
    } catch (error) {
      console.error("Error removing from watchlist:", error)
      alert("Une erreur est survenue lors de la suppression de cet élément.")
    } finally {
      setIsLoading(false)
    }
  }

  // Fonction pour obtenir l'URL correcte en fonction du type de média
  const getMediaUrl = (item: WatchlistItem) => {
    const mediaId = item.movie_tmdb_id.replace("tv-", "")
    const mediaType = item.media_type || (item.movie_tmdb_id.includes("tv-") ? "tv" : "movie")

    return mediaType === "tv" ? `/tv/${mediaId}` : `/movies/${mediaId}`
  }

  return (
    <div>
      {/* Filtres et recherche */}
      <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher un titre..."
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
                <Clock className="h-4 w-4" /> Ajouté récemment
              </SelectItem>
              <SelectItem value="date-asc" className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> Ajouté il y a longtemps
              </SelectItem>
              <SelectItem value="alpha-asc" className="flex items-center gap-2">
                <AlignLeft className="h-4 w-4" /> A-Z
              </SelectItem>
              <SelectItem value="alpha-desc" className="flex items-center gap-2">
                <AlignLeft className="h-4 w-4" /> Z-A
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filteredItems.length} élément{filteredItems.length !== 1 ? "s" : ""} dans votre liste
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

      {/* Grille des éléments */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="group relative">
              <Link href={getMediaUrl(item)}>
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden">
                  <Image
                    src={
                      item.movie_poster_path
                        ? `https://image.tmdb.org/t/p/w500${item.movie_poster_path}`
                        : "/placeholder.svg?height=450&width=300&text=No+Poster"
                    }
                    alt={item.movie_title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Badge pour indiquer s'il s'agit d'un film ou d'une série */}
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    {item.media_type === "tv" || item.movie_tmdb_id.includes("tv-") ? (
                      <>
                        <Tv className="h-3 w-3" />
                        <span>Série</span>
                      </>
                    ) : (
                      <>
                        <Film className="h-3 w-3" />
                        <span>Film</span>
                      </>
                    )}
                  </div>
                </div>
                <h3 className="mt-2 font-medium line-clamp-2">{item.movie_title}</h3>
              </Link>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.preventDefault()
                  removeFromWatchlist(item.id)
                }}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-100 dark:bg-gray-900 p-8 rounded-lg text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery || mediaType !== "all"
              ? "Aucun élément ne correspond à vos critères de recherche."
              : "Votre liste est vide. Ajoutez des films et des séries à voir !"}
          </p>
          {searchQuery || mediaType !== "all" ? (
            <Button
              onClick={() => {
                setSearchQuery("")
                setMediaType("all")
                setSortBy("date-desc")
              }}
            >
              Réinitialiser les filtres
            </Button>
          ) : (
            <Link href="/">
              <Button>Découvrir des films et séries</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
