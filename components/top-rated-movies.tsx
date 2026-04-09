"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"

interface Movie {
  id: number
  title: string
  poster_path: string | null
  vote_average: number
}

export function TopRatedMovies() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTopRatedMovies = async () => {
      try {
        const response = await fetch("/api/tmdb/popular")
        if (!response.ok) {
          throw new Error("Failed to fetch top rated movies")
        }
        const data = await response.json()
        setMovies(data.results.slice(0, 5)) // Prendre les 5 premiers films
      } catch (err) {
        setError("Erreur lors du chargement des films")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchTopRatedMovies()
  }, [])

  if (loading) {
    return (
      <section className="my-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Les mieux notés</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="bg-gray-200 dark:bg-gray-800 rounded-lg aspect-[2/3] animate-pulse" />
          ))}
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="my-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Les mieux notés</h2>
        <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-900 rounded-lg text-red-800 dark:text-red-300">
          <p>{error}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="my-12">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Les mieux notés</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {movies.map((movie) => (
          <Link key={movie.id} href={`/movies/${movie.id}`} className="group">
            <div className="relative overflow-hidden rounded-lg">
              <Image
                src={
                  movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : "/placeholder.svg?height=300&width=200&text=No+Poster"
                }
                alt={movie.title}
                width={300}
                height={450}
                className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute top-2 right-2 bg-yellow-500 text-black font-bold px-2 py-1 rounded text-sm">
                {Math.round(movie.vote_average)} /10
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
