import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Fil d'Ariane" className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
      <ol className="flex items-center space-x-1">
        <li>
          <Link href="/" className="flex items-center hover:text-gray-900 dark:hover:text-white">
            <Home className="h-4 w-4 mr-1" />
            <span>Accueil</span>
          </Link>
        </li>

        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-1" />
            {item.href ? (
              <Link href={item.href} className="hover:text-gray-900 dark:hover:text-white">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
