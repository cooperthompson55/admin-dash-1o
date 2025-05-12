"use client"

import { Home, Menu, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { ThemeToggle } from "./theme-toggle"
import { useMediaQuery } from "@/hooks/use-media-query"

export function TopNavigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  return (
    <header className="bg-white dark:bg-gray-900 shadow sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Home className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            <Link href="/" className="text-xl font-semibold text-gray-900 dark:text-white">
              RePhotos Admin
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Logged in as Admin</div>
            <ThemeToggle />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 py-2">Logged in as Admin</div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Dark Mode</span>
              <ThemeToggle />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
