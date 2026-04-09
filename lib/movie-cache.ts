// Cache global pour les données de films
const movieCache: Record<string, { data: any; timestamp: number }> = {}

// Durée de validité du cache en millisecondes (1 heure)
const CACHE_DURATION = 60 * 60 * 1000

export async function getMovieDetails(movieId: string, apiKey: string): Promise<any> {
  // Vérifier si les données sont dans le cache et si elles sont encore valides
  const cachedMovie = movieCache[movieId]
  const now = Date.now()

  if (cachedMovie && now - cachedMovie.timestamp < CACHE_DURATION) {
    console.log(`Using cached data for movie ${movieId}`)
    return cachedMovie.data
  }

  // Sinon, récupérer les données
  console.log(`Fetching fresh data for movie ${movieId}`)

  try {
    const isTV = movieId.startsWith("tv-")
    const actualId = isTV ? movieId.replace("tv-", "") : movieId
    const endpoint = isTV ? "tv" : "movie"

    const url = `https://api.themoviedb.org/3/${endpoint}/${actualId}?api_key=${apiKey}&language=fr-FR&append_to_response=credits,videos,images`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }

    const data = await response.json()

    // Normaliser les noms de propriétés pour les séries TV
    const normalizedData = isTV
      ? {
          ...data,
          title: data.name,
          release_date: data.first_air_date,
        }
      : data

    // Mettre à jour le cache
    movieCache[movieId] = {
      data: normalizedData,
      timestamp: now,
    }

    return normalizedData
  } catch (error) {
    console.error(`Error fetching movie ${movieId}:`, error)
    throw error
  }
}

// Fonction pour précharger les détails d'un film
export function prefetchMovieDetails(movieId: string, apiKey: string): void {
  // Vérifier si les données sont déjà dans le cache
  if (movieCache[movieId]) return

  // Précharger les données en arrière-plan
  getMovieDetails(movieId, apiKey).catch((err) => {
    console.error(`Error prefetching movie ${movieId}:`, err)
  })
}

// Fonction pour invalider le cache d'un film spécifique
export function invalidateMovieCache(movieId?: string): void {
  if (movieId) {
    delete movieCache[movieId]
  } else {
    // Vider tout le cache
    Object.keys(movieCache).forEach((key) => {
      delete movieCache[key]
    })
  }
}
