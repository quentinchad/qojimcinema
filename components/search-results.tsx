"use client"

import Image from "next/image"
import { Film, Tv } from "lucide-react"
import Link from "next/link"

interface SearchResult {
  id: number
  title: string
  poster_path: string | null
  release_date?: string
  overview?: string
  media_type: "movie" | "tv"
}

interface SearchResultsProps {
  results: SearchResult[]
  onClose: () => void
  query: string
  hasMoreResults: boolean
}

export function SearchResults({ results, onClose, query, hasMoreResults }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4">
        <p className="text-gray-500 dark:text-gray-400">Aucun résultat trouvé</p>
      </div>
    )
  }

  return (
    <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-[70vh] overflow-y-auto">
      <div className="p-2 sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700 flex justify-between items-center z-10">
        <h3 className="font-medium">Résultats de recherche</h3>
        <button
          onClick={onClose}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          aria-label="Fermer les résultats de recherche"
        >
          ✕
        </button>
      </div>
      <ul>
        {results.map((item) => {
          // Créer l'URL directement
          const href = `/${item.media_type === "tv" ? "tv" : "movies"}/${item.id}`

          return (
            <li
              key={`${item.media_type}-${item.id}`}
              className="border-b border-gray-200 dark:border-gray-800 last:border-0"
            >
              {/* Utiliser un lien HTML natif */}
              <a
                href={href}
                className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full text-left"
              >
                <div className="flex-shrink-0 w-12 h-18 relative">
                  <Image
                    src={
                      item.poster_path
                        ? `https://image.tmdb.org/t/p/w92${item.poster_path}`
                        : "/placeholder.svg?height=92&width=62&text=No+Poster"
                    }
                    alt={item.title}
                    width={62}
                    height={92}
                    className="rounded object-cover"
                  />
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{item.title}</h4>
                    {item.media_type === "movie" ? (
                      <Film className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Tv className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  {item.release_date && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(item.release_date).getFullYear()}
                    </p>
                  )}
                </div>
              </a>
            </li>
          )
        })}
      </ul>

      {/* Bouton "Voir plus" uniquement sur desktop et s'il y a plus de résultats */}
      {hasMoreResults && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 text-center">
          <Link
            href={`/search?q=${encodeURIComponent(query)}`}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            onClick={onClose}
          >
            Voir tous les résultats
          </Link>
        </div>
      )}
    </div>
  )
}
