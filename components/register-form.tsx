"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export function RegisterForm() {
  // Corriger le nom de la variable loading
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectTo") || "/"
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return
    }

    setLoading(true)

    try {
      // Créer l'utilisateur avec Supabase Auth avec confirmation d'email
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        throw authError
      }

      // Vérifier si l'utilisateur est Qojim pour définir is_qojim
      const isQojim = email === "quentin.qojim@gmail.com"

      // Insérer les données supplémentaires dans notre table users personnalisée
      const { error: profileError } = await supabase.from("users").insert([
        {
          id: authData.user?.id,
          email,
          username,
          is_qojim: isQojim,
        },
      ])

      if (profileError) {
        throw profileError
      }

      // Afficher un message de succès au lieu de connecter l'utilisateur
      setSuccess(
        "Votre compte a été créé avec succès ! Un email de confirmation a été envoyé à votre adresse email. Veuillez cliquer sur le lien dans l'email pour activer votre compte, puis revenez vous connecter.",
      )

      // Réinitialiser le formulaire
      setUsername("")
      setEmail("")
      setPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      setError(error.message || "Une erreur est survenue lors de l'inscription")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-500/20 border border-red-300 dark:border-red-500 rounded-md text-red-800 dark:text-red-500">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-100 dark:bg-green-500/20 border border-green-300 dark:border-green-500 rounded-md text-green-800 dark:text-green-500">
          {success}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="username">Nom d&apos;utilisateur</Label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700"
        />
      </div>
      <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white" disabled={loading}>
        {loading ? "Inscription en cours..." : "S'inscrire"}
      </Button>
    </form>
  )
}
