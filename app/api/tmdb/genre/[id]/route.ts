import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const genreId = params.id
  const TMDB_API_KEY = process.env.TMDB_API_KEY

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=fr-FR&with_genres=${genreId}&sort_by=popularity.desc`,
    )

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching movies by genre:", error)
    return NextResponse.json({ error: "Failed to fetch movies by genre" }, { status: 500 })
  }
}
