import { NextResponse } from "next/server"
import { getMovieDetails } from "@/lib/movie-cache"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const movieId = params.id
  const TMDB_API_KEY = process.env.TMDB_API_KEY

  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: "TMDB API key is not configured" }, { status: 500 })
  }

  try {
    // Utiliser la fonction de cache pour récupérer les détails du film
    const movieData = await getMovieDetails(movieId, TMDB_API_KEY)
    return NextResponse.json(movieData)
  } catch (error) {
    console.error("Error fetching movie details:", error)
    return NextResponse.json({ error: "Failed to fetch movie details" }, { status: 500 })
  }
}
