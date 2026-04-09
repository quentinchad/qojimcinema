"use client"

import { useEffect, useState, type ReactNode } from "react"

interface ProgressiveHydrationProps {
  children: ReactNode
  delay?: number
}

export function ProgressiveHydration({ children, delay = 0 }: ProgressiveHydrationProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Utiliser un délai pour retarder l'hydratation
    const timer = setTimeout(() => {
      setIsClient(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  // Pendant le rendu côté serveur ou avant l'hydratation, retourner un placeholder
  if (!isClient) {
    return <div className="min-h-[100px] animate-pulse bg-gray-800 rounded-lg" />
  }

  // Une fois hydraté, afficher le contenu
  return <>{children}</>
}
