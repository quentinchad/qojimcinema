import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const movieId = params.id
  const TMDB_API_KEY = process.env.TMDB_API_KEY || "7b622f89293b5792fb0f8c8eec0862b9"
  const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&language=fr-FR`

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) {
      return {
        title: "Film non trouvé | Qojim Cinéma",
        description: "Ce film n'a pas été trouvé sur Qojim Cinéma.",
      }
    }

    const movie = await res.json()

    const title = movie.title
    const description =
      movie.overview ||
      `Découvrez le film ${movie.title} sur Qojim Cinéma. Consultez les critiques et partagez votre avis.`
    const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : ""

    return {
      title: `${title} (${releaseYear}) | Qojim Cinéma`,
      description: description.substring(0, 160) + (description.length > 160 ? "..." : ""),
      keywords: [movie.title, "film", "critique", "avis", "cinéma", ...(movie.genres || []).map((g: any) => g.name)],
      alternates: {
        canonical: `/movies/${movieId}`,
      },
      openGraph: {
        title: `${title} (${releaseYear}) | Qojim Cinéma`,
        description: description.substring(0, 160) + (description.length > 160 ? "..." : ""),
        url: `/movies/${movieId}`,
        type: "article",
        images: [
          {
            url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "/og-image.png",
            width: 500,
            height: 750,
            alt: movie.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} (${releaseYear}) | Qojim Cinéma`,
        description: description.substring(0, 160) + (description.length > 160 ? "..." : ""),
        images: [movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : "/og-image.png"],
      },
    }
  } catch (error) {
    console.error("Error generating metadata:", error)
    return {
      title: "Erreur | Qojim Cinéma",
      description: "Une erreur s'est produite lors du chargement des informations du film.",
    }
  }
}
