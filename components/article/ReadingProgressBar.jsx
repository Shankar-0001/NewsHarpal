'use client'

import { useEffect, useRef, useState } from 'react'

export default function ReadingProgressBar() {
  const [progress, setProgress] = useState(0)
  const rafRef = useRef(null)
  const lastRef = useRef(-1)

  useEffect(() => {
    const updateProgress = () => {
      const doc = document.documentElement
      const total = doc.scrollHeight - doc.clientHeight
      const current = total > 0 ? (window.scrollY / total) * 100 : 0
      const next = Math.min(100, Math.max(0, current))
      if (Math.abs(next - lastRef.current) > 0.2) {
        lastRef.current = next
        setProgress(next)
      }
      rafRef.current = null
    }

    const handleScroll = () => {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(updateProgress)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div className="fixed top-0 left-0 z-50 h-1 w-full bg-transparent">
      <div
        className="h-1 bg-primary transition-[width] duration-150 ease-linear"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
