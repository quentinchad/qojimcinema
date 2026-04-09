import { NextResponse } from "next/server"

const TMDB_API_KEY = "7b622f89293b5792fb0f8c8eec0862b9"
const TMDB_API_URL = "https://api.themoviedb.org/3"

export async function GET() {
  try {
    const response = await fetch(
      `${TMDB_API_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&language=fr-FR&page=1`,
      { next: { revalidate: 3600 } }, // Cache for 1 hour
    )

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
