export async function POST(req: Request) {
  try {
    const { users, movieTitle, movieTmdbId, moviePosterPath, rating, content } = await req.json()

    if (!users || !Array.isArray(users) || users.length === 0) {
      return Response.json({ success: true, message: "Aucun destinataire" })
    }

    const movieUrl = `https://qojimcinema.vercel.app/movies/${movieTmdbId}`

    const response = await fetch("https://www.quentin-chirat.com/qojimcinema/send-mail.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: process.env.PHP_MAIL_SECRET,
        users,
        movieTitle,
        movieUrl,
        rating,
        content,
      }),
    })

    const data = await response.json()
    console.log("PHP mail response:", response.status, JSON.stringify(data))

    return Response.json({ success: true, sent: users.length })
  } catch (error) {
    console.error("Erreur envoi email:", error)
    return Response.json({ error: "Erreur envoi email" }, { status: 500 })
  }
}