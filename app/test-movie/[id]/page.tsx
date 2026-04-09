import Link from "next/link"

interface TestMoviePageProps {
  params: {
    id: string
  }
}

export default function TestMoviePage({ params }: TestMoviePageProps) {
  const movieId = params.id

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Test Movie Page</h1>
      <p className="mb-4">Movie ID: {movieId}</p>
      <div className="flex gap-4">
        <Link href="/" className="text-blue-500 hover:underline">
          Retour à l'accueil
        </Link>
        <Link href={`/movies/${movieId}`} className="text-blue-500 hover:underline">
          Voir la page du film
        </Link>
      </div>
    </div>
  )
}
