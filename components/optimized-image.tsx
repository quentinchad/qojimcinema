"use client"

import { useState } from "react"
import Image, { type ImageProps } from "next/image"
import { cn } from "@/lib/utils"

interface OptimizedImageProps extends Omit<ImageProps, "onLoad"> {
  lowQualitySrc?: string
}

export function OptimizedImage({ src, alt, className, lowQualitySrc, ...props }: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)

  // Utiliser une version basse qualité de l'image pendant le chargement
  const placeholderSrc =
    lowQualitySrc ||
    (typeof src === "string" && src.includes("tmdb")
      ? src.replace("/w500/", "/w92/").replace("/w200/", "/w92/")
      : undefined)

  return (
    <Image
      src={src || "/placeholder.svg"}
      alt={alt || "Image"}
      className={cn("transition-opacity duration-300", isLoading ? "opacity-0" : "opacity-100", className)}
      onLoad={() => setIsLoading(false)}
      placeholder={placeholderSrc ? "blur" : "empty"}
      blurDataURL={placeholderSrc}
      {...props}
    />
  )
}
