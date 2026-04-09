import { NextResponse } from "next/server"

const TMDB_API_KEY = "7b622f89293b5792fb0f8c8eec0862b9"
const TMDB_API_URL = "https://api.themoviedb.org/3"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")
  const type = searchParams.get("type") || "movie" // Par défaut, rechercher des films

  if (!query) {
    return NextResponse.json({ results: [] })
  }

  try {
    let endpoint = ""

    if (type === "movie") {
      endpoint = `${TMDB_API_URL}/search/movie?api_key=${TMDB_API_KEY}&language=fr-FR&query=${query}&page=1&include_adult=false`
    } else if (type === "tv") {
      endpoint = `${TMDB_API_URL}/search/tv?api_key=${TMDB_API_KEY}&language=fr-FR&query=${query}&page=1&include_adult=false`
    } else if (type === "multi") {
      endpoint = `${TMDB_API_URL}/search/multi?api_key=${TMDB_API_KEY}&language=fr-FR&query=${query}&page=1&include_adult=false`
    }

    const response = await fetch(endpoint, { next: { revalidate: 60 } })

    if (!response.ok) {
      throw new Error(`TMDB API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching from TMDB:", error)
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
  }
}
