"use client"

import { Home, Menu, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export function TopNavigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Home className="h-5 w-5" />
            <Link href="/" className="text-xl font-semibold">
              RePhotos Admin
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:block">
            <div className="text-sm text-gray-600">Logged in as Admin</div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600 py-2">Logged in as Admin</div>
          </div>
        )}
      </div>
    </header>
  )
}
