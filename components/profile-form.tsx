"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, Mail, Check, X } from "lucide-react"

interface ProfileFormProps {
  user: any
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [username, setUsername] = useState(user?.username || "")
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!username.trim()) {
      setError("Le nom d'utilisateur ne peut pas être vide")
      return
    }

    setIsSubmitting(true)

    try {
      // Mettre à jour le nom d'utilisateur dans la base de données
      const { error: updateError } = await supabase.from("users").update({ username }).eq("id", user.id)

      if (updateError) {
        if (updateError.code === "23505") {
          // Code d'erreur pour violation de contrainte unique
          throw new Error("Ce nom d'utilisateur est déjà utilisé")
        }
        throw updateError
      }

      // Mettre à jour les métadonnées de l'utilisateur dans auth
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: { username },
      })

      if (authUpdateError) {
        throw authUpdateError
      }

      setSuccess("Votre profil a été mis à jour avec succès")
      setIsEditing(false)
      router.refresh()
    } catch (error: any) {
      setError(error.message || "Une erreur est survenue lors de la mise à jour du profil")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getInitials = (username: string) => {
    return username?.substring(0, 2).toUpperCase() || "UN"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className={user?.is_qojim ? "bg-blue-500" : "bg-gray-500"}>
            {getInitials(user?.username || "")}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-lg">{user?.username || "Utilisateur"}</h3>
          {user?.is_qojim && (
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-0.5 rounded-full">
              Expert
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-900 rounded-md text-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-900 rounded-md text-green-800 dark:text-green-300">
          {success}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Mail className="h-4 w-4" />
          <span>{user?.email || "Email non disponible"}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Nom d&apos;utilisateur
            </Label>
            {isEditing ? (
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
                className="bg-white dark:bg-gray-800"
              />
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300">{username}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Modifier
                </Button>
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false)
                  setUsername(user?.username || "")
                  setError(null)
                }}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-1" />
                Annuler
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? (
                  "Enregistrement..."
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
