import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const movieId = params.id
  const TMDB_API_KEY = process.env.TMDB_API_KEY

  try {
    // 1. Récupérer les détails du film pour obtenir ses genres
    const movieResponse = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&language=fr-FR`,
    )

    if (!movieResponse.ok) {
      throw new Error(`TMDB API error: ${movieResponse.status}`)
    }

    const movieData = await movieResponse.json()
    const genreIds = movieData.genres.map((genre: any) => genre.id)

    if (genreIds.length === 0) {
      return NextResponse.json({ results: [] })
    }

    // 2. Récupérer des films avec les mêmes genres
    // Construire la requête avec tous les genres du film
    const genreQuery = genreIds.join("|")
    const discoverResponse = await fetch(
      `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=fr-FR&with_genres=${genreQuery}&sort_by=popularity.desc&page=1`,
    )

    if (!discoverResponse.ok) {
      throw new Error(`TMDB API error: ${discoverResponse.status}`)
    }

    const discoverData = await discoverResponse.json()

    // 3. Calculer un score de similarité pour chaque film basé sur le nombre de genres en commun
    const results = discoverData.results
      .map((movie: any) => {
        const movieGenreIds = movie.genre_ids || []
        const commonGenres = genreIds.filter((id: number) => movieGenreIds.includes(id))
        const similarityScore = commonGenres.length / genreIds.length // Score normalisé entre 0 et 1

        return {
          ...movie,
          similarity_score: similarityScore,
          common_genres: commonGenres,
        }
      })
      .filter((movie: any) => movie.id.toString() !== movieId) // Exclure le film actuel
      .sort((a: any, b: any) => b.similarity_score - a.similarity_score) // Trier par score de similarité décroissant

    return NextResponse.json({
      results: results.slice(0, 20), // Limiter à 20 résultats
      source_genres: movieData.genres,
    })
  } catch (error) {
    console.error("Error fetching genre recommendations:", error)
    return NextResponse.json({ error: "Failed to fetch genre recommendations" }, { status: 500 })
  }
}
