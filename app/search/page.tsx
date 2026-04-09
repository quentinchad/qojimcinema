"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X, Film, Tv } from "lucide-react"
import Image from "next/image"

interface SearchResult {
  id: number
  title: string
  poster_path: string | null
  release_date?: string
  overview?: string
  media_type: "movie" | "tv"
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get("q") || ""

  const [searchQuery, setSearchQuery] = useState(query)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!query) return

    const searchMedia = async () => {
      setIsLoading(true)
      try {
        // Rechercher les films
        const movieResponse = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}&type=movie`)
        const movieData = await movieResponse.json()

        // Rechercher les séries TV
        const tvResponse = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}&type=tv`)
        const tvData = await tvResponse.json()

        // Combiner et formater les résultats
        const movieResults = (movieData.results || []).map((movie: any) => ({
          ...movie,
          media_type: "movie",
        }))

        const tvResults = (tvData.results || []).map((show: any) => ({
          ...show,
          media_type: "tv",
          // Normaliser les noms de propriétés
          title: show.name,
          release_date: show.first_air_date,
        }))

        // Combiner et trier les résultats
        const combinedResults = [...movieResults, ...tvResults].sort((a, b) => {
          if (a.popularity && b.popularity) {
            return b.popularity - a.popularity
          }
          return (a.title || "").localeCompare(b.title || "")
        })

        setResults(combinedResults)
      } catch (error) {
        console.error("Error searching media:", error)
      } finally {
        setIsLoading(false)
      }
    }

    searchMedia()
  }, [query])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Recherche</h1>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" />
            <Input
              type="search"
              placeholder="Rechercher un film ou une série"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 py-6 text-lg bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <Button type="submit" className="mt-4 w-full md:w-auto">
            Rechercher
          </Button>
        </form>

        {isLoading ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : results.length > 0 ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">Résultats pour "{query}"</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((item) => {
                const href = `/${item.media_type === "tv" ? "tv" : "movies"}/${item.id}`

                return (
                  <a
                    key={`${item.media_type}-${item.id}`}
                    href={href}
                    className="flex bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="w-1/3 relative">
                      <Image
                        src={
                          item.poster_path
                            ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
                            : "/placeholder.svg?height=300&width=200&text=No+Poster"
                        }
                        alt={item.title}
                        width={200}
                        height={300}
                        className="object-cover h-full"
                      />
                    </div>
                    <div className="w-2/3 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold">{item.title}</h3>
                        {item.media_type === "movie" ? (
                          <Film className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Tv className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      {item.release_date && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          {new Date(item.release_date).getFullYear()}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                        {item.overview || "Aucune description disponible."}
                      </p>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        ) : query ? (
          <div className="text-center my-12 p-8 bg-gray-100 dark:bg-gray-900 rounded-lg">
            <p className="text-lg">Aucun résultat trouvé pour "{query}"</p>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Essayez avec d'autres termes de recherche</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
