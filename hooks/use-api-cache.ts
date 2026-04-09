"use client"

import { useState, useEffect } from "react"

interface CacheItem {
  data: any
  timestamp: number
}

// Cache global pour stocker les résultats des requêtes API
const globalCache: Record<string, CacheItem> = {}

export function useApiCache(url: string | null, initialData?: any, cacheTime = 5 * 60 * 1000) {
  const [data, setData] = useState<any>(initialData)
  const [isLoading, setIsLoading] = useState<boolean>(!!url)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!url) return

    const fetchData = async () => {
      // Vérifier si les données sont dans le cache et si elles sont encore valides
      const cachedItem = globalCache[url]
      const now = Date.now()

      if (cachedItem && now - cachedItem.timestamp < cacheTime) {
        // Utiliser les données du cache
        setData(cachedItem.data)
        setIsLoading(false)
        return
      }

      // Sinon, effectuer la requête
      setIsLoading(true)

      try {
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const result = await response.json()

        // Mettre à jour le cache
        globalCache[url] = {
          data: result,
          timestamp: now,
        }

        setData(result)
        setError(null)
      } catch (err) {
        console.error(`Error fetching ${url}:`, err)
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [url, cacheTime])

  return { data, isLoading, error }
}
