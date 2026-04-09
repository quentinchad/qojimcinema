import { RegisterForm } from "@/components/register-form"
import { Header } from "@/components/header"
import Link from "next/link"

export default function RegisterPage({ searchParams }: { searchParams: { redirectTo?: string } }) {
  const redirectTo = searchParams.redirectTo || "/"

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-center">Inscription</h1>
          <RegisterForm />
          <div className="text-center mt-6">
            <p className="text-gray-600 dark:text-gray-400 mb-2">Vous avez déjà un compte ?</p>
            <Link
              href={`/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
