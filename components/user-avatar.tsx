"use client"

import { User } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface UserAvatarProps {
  user: any | null
}

export function UserAvatar({ user }: UserAvatarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  // Si l'utilisateur n'est pas connecté, afficher un avatar avec un lien de connexion
  if (!user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <Link href={`/auth/login?redirectTo=${encodeURIComponent(pathname)}`}>
            <DropdownMenuItem>Se connecter</DropdownMenuItem>
          </Link>
          <Link href={`/auth/register?redirectTo=${encodeURIComponent(pathname)}`}>
            <DropdownMenuItem>S'inscrire</DropdownMenuItem>
          </Link>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Récupérer les initiales de l'utilisateur à partir de son email ou username
  const getInitials = () => {
    const username = user.user_metadata?.username || ""
    if (username) {
      return username.substring(0, 2).toUpperCase()
    }
    const email = user.email || ""
    return email.substring(0, 2).toUpperCase()
  }

  // Si l'utilisateur est connecté, afficher son avatar avec un menu déroulant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-500 text-white">{getInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href="/profile">
          <DropdownMenuItem>Profil</DropdownMenuItem>
        </Link>
        <Link href="/mes-critiques">
          <DropdownMenuItem>Mes critiques</DropdownMenuItem>
        </Link>
        <Link href="/a-voir">
          <DropdownMenuItem>Ma liste à voir</DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>Se déconnecter</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
