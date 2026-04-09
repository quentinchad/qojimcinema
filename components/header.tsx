"use client"

import type React from "react"

import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Film, Search, X, Menu, User } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState, useRef } from "react"
import { SearchResults } from "./search-results"
import { useDebounce } from "@/hooks/use-debounce"
import { ThemeToggle } from "./theme-toggle"
import { UserAvatar } from "./user-avatar"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

interface Movie {
  id: number
  title: string
  poster_path: string | null
  release_date?: string
  overview?: string
}

interface TVShow {
  id: number
  name: string
  poster_path: string | null
  first_air_date?: string
  overview?: string
}

type SearchResult = Movie | (TVShow & { media_type: "movie" | "tv" })

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [totalResults, setTotalResults] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const mobileSearchRef = useRef<HTMLDivElement>(null)
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }

    getUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase.auth])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const searchMediaContent = async () => {
      if (debouncedSearchQuery.trim() === "") {
        setSearchResults([])
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      try {
        // Rechercher les films
        const movieResponse = await fetch(
          `/api/tmdb/search?query=${encodeURIComponent(debouncedSearchQuery)}&type=movie`,
        )
        const movieData = await movieResponse.json()

        // Rechercher les séries TV
        const tvResponse = await fetch(`/api/tmdb/search?query=${encodeURIComponent(debouncedSearchQuery)}&type=tv`)
        const tvData = await tvResponse.json()

        // Combiner et formater les résultats
        const movieResults = (movieData.results || []).map((movie: Movie) => ({
          ...movie,
          media_type: "movie",
        }))

        const tvResults = (tvData.results || []).map((show: TVShow) => ({
          ...show,
          media_type: "tv",
          // Normaliser les noms de propriétés pour correspondre à l'interface de SearchResults
          title: show.name,
          release_date: show.first_air_date,
        }))

        // Combiner et trier les résultats par popularité (si disponible) ou par ordre alphabétique
        const combinedResults = [...movieResults, ...tvResults].sort((a, b) => {
          if (a.popularity && b.popularity) {
            return b.popularity - a.popularity
          }
          return (a.title || a.name || "").localeCompare(b.title || b.name || "")
        })

        // Stocker le nombre total de résultats
        setTotalResults(combinedResults.length)

        // Limiter à 10 résultats pour l'affichage dans le dropdown
        const limitedResults = combinedResults.slice(0, 10)

        setSearchResults(limitedResults)
        setShowResults(true)
      } catch (error) {
        console.error("Error searching media:", error)
      } finally {
        setIsSearching(false)
      }
    }

    searchMediaContent()
  }, [debouncedSearchQuery])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    if (e.target.value.trim() !== "") {
      setShowResults(true)
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
    setSearchResults([])
    setShowResults(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  // Fonction pour déterminer si un lien est actif
  const isActive = (path: string) => {
    return pathname === path
      ? "text-gray-900 dark:text-white font-medium"
      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
  }

  // Composant pour les liens de navigation (réutilisable pour desktop et mobile)
  const NavLinks = ({ isMobile = false, onItemClick = () => {} }) => (
    <>
      <Link
        href="/"
        className={`${isActive("/")} ${isMobile ? "flex items-center py-3 px-4 border-b border-gray-200 dark:border-gray-800" : "text-sm font-medium transition-colors"}`}
        onClick={onItemClick}
      >
        Accueil
      </Link>
      <Link
        href="/critiques"
        className={`${isActive("/critiques")} ${isMobile ? "flex items-center py-3 px-4 border-b border-gray-200 dark:border-gray-800" : "text-sm font-medium transition-colors"}`}
        onClick={onItemClick}
      >
        Critiques de Qojim
      </Link>
      <Link
        href="/a-voir"
        className={`${isActive("/a-voir")} ${isMobile ? "flex items-center py-3 px-4 border-b border-gray-200 dark:border-gray-800" : "text-sm font-medium transition-colors"}`}
        onClick={onItemClick}
      >
        À Voir
      </Link>
      <Link
        href="/feed"
        className={`${isActive("/feed")} ${isMobile ? "flex items-center py-3 px-4 border-b border-gray-200 dark:border-gray-800" : "text-sm font-medium transition-colors"}`}
        onClick={onItemClick}
      >
        <span className="flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M4 11a9 9 0 0 1 9 9" />
            <path d="M4 4a16 16 0 0 1 16 16" />
            <circle cx="5" cy="19" r="1" />
          </svg>
          Feed
        </span>
      </Link>
    </>
  )

  // Composant pour les liens du profil utilisateur (mobile)
  const UserProfileLinks = ({ onItemClick = () => {} }) => (
    <>
      {user ? (
        <>
          <div className="py-3 px-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
              {user.user_metadata?.username?.substring(0, 2).toUpperCase() ||
                user.email?.substring(0, 2).toUpperCase() ||
                "U"}
            </div>
            <div>
              <div className="font-medium">
                {user.user_metadata?.username || user.email?.split("@")[0] || "Utilisateur"}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
            </div>
          </div>
          <Link
            href="/profile"
            className="flex items-center py-3 px-4 border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400"
            onClick={onItemClick}
          >
            Profil
          </Link>
          <Link
            href="/mes-critiques"
            className="flex items-center py-3 px-4 border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400"
            onClick={onItemClick}
          >
            Mes critiques
          </Link>
          <Link
            href="/a-voir"
            className="flex items-center py-3 px-4 border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400"
            onClick={onItemClick}
          >
            Ma liste à voir
          </Link>
          <button
            onClick={() => {
              handleSignOut()
              onItemClick()
            }}
            className="flex items-center py-3 px-4 text-red-600 dark:text-red-400 w-full text-left"
          >
            Se déconnecter
          </button>
        </>
      ) : (
        <>
          <Link
            href={`/auth/login?redirectTo=${encodeURIComponent(pathname)}`}
            className="flex items-center py-3 px-4 border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400"
            onClick={onItemClick}
          >
            Se connecter
          </Link>
          <Link
            href={`/auth/register?redirectTo=${encodeURIComponent(pathname)}`}
            className="flex items-center py-3 px-4 text-gray-600 dark:text-gray-400"
            onClick={onItemClick}
          >
            S'inscrire
          </Link>
        </>
      )}
    </>
  )

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800 dark:border-gray-800 bg-white dark:bg-black text-gray-900 dark:text-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo et navigation desktop */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Film className="h-6 w-6" />
              <span className="text-xl font-bold">Qojim Cinéma</span>
            </Link>

            {/* Navigation desktop */}
            <nav className="hidden md:flex items-center space-x-6">
              <NavLinks />
            </nav>
          </div>

          {/* Recherche et actions */}
          <div className="flex items-center gap-4">
            {/* Recherche desktop */}
            <div className="relative hidden md:block" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Rechercher un film ou une série"
                  className="w-[300px] pl-9 pr-9 bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-400"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => {
                    if (searchResults.length > 0) {
                      setShowResults(true)
                    }
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    aria-label="Effacer la recherche"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {isSearching && (
                <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-500 border-r-2 mx-auto"></div>
                </div>
              )}
              {showResults && !isSearching && searchResults.length > 0 && (
                <SearchResults
                  results={searchResults}
                  onClose={() => setShowResults(false)}
                  query={searchQuery}
                  hasMoreResults={totalResults > 10}
                />
              )}
            </div>

            {/* Bouton de recherche mobile - redirection vers la page de recherche */}
            <Link href="/search" className="md:hidden">
              <Button variant="ghost" size="icon">
                <Search className="h-5 w-5" />
              </Button>
            </Link>

            <ThemeToggle />

            {/* Menu utilisateur desktop */}
            <div className="hidden md:block">
              <UserAvatar user={user} />
            </div>

            {/* Menu mobile */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0 w-[85vw] max-w-[400px]">
                <div className="py-6 px-4 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Film className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">Qojim Cinéma</span>
                    </div>
                    <ThemeToggle />
                  </div>
                </div>

                <div className="overflow-y-auto max-h-[calc(100vh-100px)]">
                  <div className="py-2">
                    <SheetClose asChild>
                      <div>
                        <NavLinks isMobile onItemClick={() => {}} />
                      </div>
                    </SheetClose>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-800 py-2">
                    <SheetClose asChild>
                      <div>
                        <UserProfileLinks />
                      </div>
                    </SheetClose>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Menu utilisateur mobile */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <User className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0 w-[85vw] max-w-[400px]">
                <div className="py-6 px-4 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Mon compte</h2>
                    <ThemeToggle />
                  </div>
                </div>

                <div className="overflow-y-auto max-h-[calc(100vh-100px)]">
                  <SheetClose asChild>
                    <div>
                      <UserProfileLinks />
                    </div>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
