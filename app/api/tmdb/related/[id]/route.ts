import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  let mediaId = params.id
  const TMDB_API_KEY = process.env.TMDB_API_KEY

  // Déterminer si c'est une série TV ou un film
  const isTV = mediaId.startsWith("tv-")

  // Si c'est une série TV, supprimer le préfixe "tv-"
  if (isTV) {
    mediaId = mediaId.replace("tv-", "")
  }

  // Utiliser l'endpoint approprié en fonction du type de média
  const endpoint = isTV ? "tv" : "movie"

  try {
    // Récupérer les médias similaires
    const similarResponse = await fetch(
      `https://api.themoviedb.org/3/${endpoint}/${mediaId}/similar?api_key=${TMDB_API_KEY}&language=fr-FR`,
    )

    // Récupérer les recommandations
    const recommendationsResponse = await fetch(
      `https://api.themoviedb.org/3/${endpoint}/${mediaId}/recommendations?api_key=${TMDB_API_KEY}&language=fr-FR`,
    )

    let similarMedia = []
    let recommendedMedia = []

    if (similarResponse.ok) {
      const similarData = await similarResponse.json()
      similarMedia = similarData.results || []
    }

    if (recommendationsResponse.ok) {
      const recommendationsData = await recommendationsResponse.json()
      recommendedMedia = recommendationsData.results || []
    }

    // Normaliser les résultats pour les séries TV
    if (isTV) {
      similarMedia = similarMedia.map((item: any) => ({
        ...item,
        title: item.name,
        release_date: item.first_air_date,
        media_type: "tv",
      }))

      recommendedMedia = recommendedMedia.map((item: any) => ({
        ...item,
        title: item.name,
        release_date: item.first_air_date,
        media_type: "tv",
      }))
    } else {
      // Ajouter le type de média pour les films
      similarMedia = similarMedia.map((item: any) => ({
        ...item,
        media_type: "movie",
      }))

      recommendedMedia = recommendedMedia.map((item: any) => ({
        ...item,
        media_type: "movie",
      }))
    }

    return NextResponse.json({
      similar: similarMedia,
      recommendations: recommendedMedia,
    })
  } catch (error) {
    console.error("Error fetching related media:", error)
    return NextResponse.json({ error: "Failed to fetch related media" }, { status: 500 })
  }
}
