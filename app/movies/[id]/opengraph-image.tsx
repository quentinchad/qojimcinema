import { ImageResponse } from "next/og"

// Route segment config
export const runtime = "edge"

// Image metadata
export const alt = "Détails du film sur Qojim Cinéma"
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

// Image generation
export default async function Image({ params }: { params: { id: string } }) {
  const movieId = params.id
  const TMDB_API_KEY = process.env.TMDB_API_KEY || "7b622f89293b5792fb0f8c8eec0862b9"
  const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&language=fr-FR`

  let title = "Film sur Qojim Cinéma"
  let posterUrl = "https://image.tmdb.org/t/p/w500/placeholder.jpg"

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (res.ok) {
      const movie = await res.json()
      title = movie.title
      if (movie.poster_path) {
        posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      }
    }
  } catch (error) {
    console.error("Error fetching movie data for OG image:", error)
  }

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        fontSize: 48,
        background: "linear-gradient(to bottom, #000000, #111827)",
        width: "100%",
        height: "100%",
        padding: 50,
        alignItems: "center",
        justifyContent: "center",
        color: "white",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: "60%" }}>
          <div style={{ fontSize: 36, opacity: 0.8 }}>Qojim Cinéma présente</div>
          <div style={{ fontSize: 72, fontWeight: "bold", marginTop: 20 }}>{title}</div>
          <div style={{ fontSize: 32, marginTop: 20, opacity: 0.8 }}>Découvrez les critiques et avis</div>
        </div>

        <img
          src={posterUrl || "/placeholder.svg"}
          alt={title}
          style={{ height: 500, borderRadius: 10, boxShadow: "0 8px 16px rgba(0, 0, 0, 0.5)" }}
        />
      </div>
    </div>,
    { ...size },
  )
}
