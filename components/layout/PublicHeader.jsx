'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Moon, Sun, Search, Menu, X, Sparkles, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'

export default function PublicHeader({ categories }) {
  const DESKTOP_VISIBLE_CATEGORY_COUNT = 7
  const { resolvedTheme, setTheme } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [now, setNow] = useState(new Date())
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const visibleCategories = (categories || []).slice(0, DESKTOP_VISIBLE_CATEGORY_COUNT)
  const overflowCategories = (categories || []).slice(DESKTOP_VISIBLE_CATEGORY_COUNT)

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-white/92 shadow-sm backdrop-blur-md dark:bg-slate-950/92 dark:border-slate-800">
      <div className="border-b border-slate-200/80 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-900/70">
        <div className="w-full max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span className="truncate">Fresh reporting, explainers, and web stories in one news desk</span>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
            <span>Live categories update automatically</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between py-4 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-500 to-sky-400 text-white shadow-md shadow-blue-500/20">
              <span className="text-lg font-black">E</span>
            </div>
            <div className="leading-tight">
              <span className="block text-2xl font-bold tracking-tight text-slate-900 dark:text-white">EkahNews</span>
              <span className="hidden sm:block text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Independent News Desk</span>
            </div>
          </Link>

          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center max-w-xl flex-1 mx-2 lg:mx-8">
            <div className="relative w-full">
              <Input
                id="desktop-search"
                name="q"
                type="search"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 rounded-full border-slate-200 bg-slate-50 pr-12 pl-4 dark:bg-slate-900 dark:text-white dark:border-slate-700"
              />
              <Button
                type="submit"
                size="sm"
                variant="ghost"
                className="absolute right-1 top-1 h-9 w-9 rounded-full"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center space-x-2 md:space-x-3">
            {mounted && (
              <div className="hidden xl:block text-right leading-tight rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(now)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(now)}
                </p>
              </div>
            )}
            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            >
              {mounted && resolvedTheme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* Dashboard Link */}
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="hidden md:inline-flex rounded-full border-slate-300 dark:border-slate-700">
                Dashboard
              </Button>
            </Link>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center justify-between py-3 border-t dark:border-gray-800 gap-4">
          <div className="flex items-center gap-2 min-w-0 overflow-x-auto">
            <Link
              href="/"
              className="rounded-full px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium whitespace-nowrap hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              Home
            </Link>
            {visibleCategories.map(category => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="rounded-full px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 whitespace-nowrap hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                {category.name}
              </Link>
            ))}
            <Link href="/web-stories" className="rounded-full px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 whitespace-nowrap hover:bg-slate-100 dark:hover:bg-slate-900">
              Web Stories
            </Link>
          </div>

          {overflowCategories.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 shrink-0 rounded-full"
                  aria-label="More categories"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {overflowCategories.map((category) => (
                  <DropdownMenuItem key={category.id} asChild>
                    <Link href={`/category/${category.slug}`}>{category.name}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t dark:border-gray-800 space-y-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Input
                  id="mobile-search"
                  name="q"
                  type="search"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-12 rounded-full dark:bg-slate-900 dark:text-white dark:border-slate-700"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1 h-9 w-9 rounded-full"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </form>

            {/* Mobile Navigation */}
            <nav className="grid grid-cols-1 gap-2">
              <Link
                href="/"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium dark:border-slate-800 dark:bg-slate-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              {categories?.map(category => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 dark:border-slate-800 dark:bg-slate-950"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
              <Link
                href="/web-stories"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 dark:border-slate-800 dark:bg-slate-950"
                onClick={() => setMobileMenuOpen(false)}
              >
                Web Stories
              </Link>
              <Link
                href="/dashboard"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 dark:border-slate-800 dark:bg-slate-950"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

