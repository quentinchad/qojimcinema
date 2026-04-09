import { LoginForm } from "@/components/login-form"
import { Header } from "@/components/header"
import Link from "next/link"

export default function LoginPage({ searchParams }: { searchParams: { redirectTo?: string } }) {
  const redirectTo = searchParams.redirectTo || "/"

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">Connexion</h1>
          <LoginForm redirectTo={redirectTo} />
          <p className="text-center mt-4 text-gray-600 dark:text-gray-400">
            Vous n&apos;avez pas de compte ?{" "}
            <Link
              href={`/auth/register?redirectTo=${encodeURIComponent(redirectTo)}`}
              className="text-blue-600 dark:text-blue-400 hover.underline"
            >
              S&apos;inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
