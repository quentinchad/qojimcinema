import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id

  try {
    const TMDB_API_KEY = "7b622f89293b5792fb0f8c8eec0862b9"
    const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}&language=fr-FR`

    console.log(`Test API fetching from: ${url}`)

    const response = await fetch(url)

    if (!response.ok) {
      return NextResponse.json({ error: `TMDB API error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in test-movie API:", error)
    return NextResponse.json({ error: "Failed to fetch movie data" }, { status: 500 })
  }
}
