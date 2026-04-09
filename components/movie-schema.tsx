import Script from "next/script"

interface MovieSchemaProps {
  movie: {
    id: string
    title: string
    poster_path?: string
    release_date?: string
    overview?: string
    vote_average?: number
    vote_count?: number
    genres?: Array<{ id: number; name: string }>
    runtime?: number
  }
}

export function MovieSchema({ movie }: MovieSchemaProps) {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: movie.title,
    description: movie.overview,
    image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
    datePublished: movie.release_date,
    aggregateRating: movie.vote_average
      ? {
          "@type": "AggregateRating",
          ratingValue: movie.vote_average,
          ratingCount: movie.vote_count,
          bestRating: "10",
          worstRating: "0",
        }
      : undefined,
    duration: movie.runtime ? `PT${movie.runtime}M` : undefined,
    genre: movie.genres?.map((genre) => genre.name),
  }

  return (
    <Script id={`movie-schema-${movie.id}`} type="application/ld+json">
      {JSON.stringify(schemaData)}
    </Script>
  )
}
