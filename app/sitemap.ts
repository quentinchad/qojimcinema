import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://qojim-cinema.vercel.app"

  // Pages statiques
  const staticPages = ["", "/critiques", "/feed", "/auth/login", "/auth/register"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }))

  return [...staticPages]
}
