"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function AuthCTA() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      setLoading(false)
    }

    getUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase.auth])

  // Ne pas afficher le composant si l'utilisateur est connecté ou si le chargement est en cours
  if (user || loading) {
    return null
  }

  return (
    <section className="bg-gray-100/60 dark:bg-gray-900/60 rounded-lg p-8 my-12 text-center">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Connectez-vous pour gérer vos propres critiques
      </h2>
      <div className="flex justify-center gap-4">
        <Link href={`/auth/login?redirectTo=${encodeURIComponent(pathname)}`}>
          <Button variant="secondary">Se connecter</Button>
        </Link>
        <Link href="/auth/register">
          <Button className="bg-blue-500 hover:bg-blue-600 text-white">S&apos;inscrire</Button>
        </Link>
      </div>
    </section>
  )
}
