import { NextResponse } from "next/server"

const TMDB_API_KEY = "7b622f89293b5792fb0f8c8eec0862b9"
const TMDB_API_URL = "https://api.themoviedb.org/3"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id

  try {
    // Vérifier que l'ID est valide
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 })
    }

    const response = await fetch(
      `${TMDB_API_URL}/movie/${id}?api_key=${TMDB_API_KEY}&language=fr-FR&append_to_response=credits,videos,images`,
      { next: { revalidate: 3600 } }, // Cache for 1 hour
    )

    if (!response.ok) {
      console.error(`TMDB API responded with status: ${response.status} for movie ID: ${id}`)
      return NextResponse.json(
        { error: `Failed to fetch movie data: ${response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching movie details from TMDB:", error)
    return NextResponse.json({ error: "Failed to fetch movie data" }, { status: 500 })
  }
}
