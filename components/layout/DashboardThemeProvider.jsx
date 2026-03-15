"use client"

import { ThemeProvider } from 'next-themes'

export default function DashboardThemeProvider({ children }) {
  return (
    <ThemeProvider attribute="class" storageKey="dashboard-theme" defaultTheme="dark" enableSystem={false}>
      {children}
    </ThemeProvider>
  )
}
