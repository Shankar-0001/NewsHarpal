'use client'

import { useMemo } from 'react'
import { Facebook, Link as LinkIcon } from 'lucide-react'

export default function StickyShareBar({ articleUrl, articleTitle }) {
  const encodedUrl = useMemo(() => encodeURIComponent(articleUrl || ''), [articleUrl])
  const encodedTitle = useMemo(() => encodeURIComponent(articleTitle || ''), [articleTitle])

  const openShare = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer,width=640,height=640')
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl)
    } catch {
      // ignore
    }
  }

  return (
    <>
      {/* Desktop sticky vertical bar */}
      <div className="hidden lg:flex fixed left-6 top-1/3 z-40 flex-col gap-2">
        <button
          type="button"
          onClick={() => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)}
          className="h-10 w-10 rounded-full bg-[#1877F2] text-white shadow-sm transition-colors hover:bg-[#0e63d6]"
          aria-label="Share on Facebook"
        >
          <Facebook className="h-5 w-5 mx-auto" />
        </button>
        <button
          type="button"
          onClick={() => openShare(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`)}
          className="h-10 w-10 rounded-full bg-black text-white shadow-sm transition-colors hover:bg-[#1a1a1a]"
          aria-label="Share on X"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 mx-auto" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M18.244 2H21l-6.06 6.93L22 22h-6.58l-4.93-6.34L4.4 22H1.64l6.5-7.44L2 2h6.7l4.45 5.72L18.244 2zm-1.15 18h1.82L8.9 3.95H7.02L17.094 20z"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => openShare(`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`)}
          className="h-10 w-10 rounded-full bg-[#25D366] text-white shadow-sm transition-colors hover:bg-[#1fb455]"
          aria-label="Share on WhatsApp"
        >
          <svg viewBox="0 0 32 32" className="h-5 w-5 mx-auto" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M16.01 4C9.93 4 5 8.93 5 15.01c0 2.65.94 5.08 2.5 6.98L6 28l6.18-1.62a10.95 10.95 0 0 0 3.83.68h.01c6.08 0 11.01-4.93 11.01-11.01C27.03 8.93 22.1 4 16.01 4zm0 19.98h-.01a9.03 9.03 0 0 1-3.84-.85l-.28-.12-3.67.96.98-3.58-.15-.3A8.96 8.96 0 0 1 7 15.01C7 10 10.99 6 16.01 6c5.02 0 9.01 4 9.01 9.01 0 5.01-3.99 8.97-9.01 8.97zm4.99-6.75c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.62.14-.19.27-.71.88-.87 1.06-.16.18-.32.2-.59.07-.27-.14-1.12-.41-2.13-1.3-.79-.7-1.32-1.57-1.47-1.83-.15-.27-.02-.42.12-.56.12-.12.27-.32.41-.48.14-.16.19-.27.29-.46.1-.18.05-.34-.02-.48-.07-.14-.62-1.5-.85-2.05-.22-.53-.45-.46-.62-.47l-.53-.01c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.3 0 1.36.98 2.68 1.12 2.86.14.18 1.93 2.95 4.67 4.14.65.28 1.15.45 1.54.58.65.21 1.24.18 1.71.11.52-.08 1.6-.65 1.83-1.28.23-.62.23-1.16.16-1.28-.07-.12-.25-.2-.52-.34z"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={copyLink}
          className="h-10 w-10 rounded-full bg-slate-600 text-white shadow-sm transition-colors hover:bg-slate-500"
          aria-label="Copy link"
        >
          <LinkIcon className="h-5 w-5 mx-auto" />
        </button>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center gap-3 border-t border-border bg-background/95 px-4 py-2 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)}
          className="h-9 w-9 rounded-full bg-[#1877F2] text-white shadow-sm transition-colors hover:bg-[#0e63d6]"
          aria-label="Share on Facebook"
        >
          <Facebook className="h-4 w-4 mx-auto" />
        </button>
        <button
          type="button"
          onClick={() => openShare(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`)}
          className="h-9 w-9 rounded-full bg-black text-white shadow-sm transition-colors hover:bg-[#1a1a1a]"
          aria-label="Share on X"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 mx-auto" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M18.244 2H21l-6.06 6.93L22 22h-6.58l-4.93-6.34L4.4 22H1.64l6.5-7.44L2 2h6.7l4.45 5.72L18.244 2zm-1.15 18h1.82L8.9 3.95H7.02L17.094 20z"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => openShare(`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`)}
          className="h-9 w-9 rounded-full bg-[#25D366] text-white shadow-sm transition-colors hover:bg-[#1fb455]"
          aria-label="Share on WhatsApp"
        >
          <svg viewBox="0 0 32 32" className="h-4 w-4 mx-auto" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M16.01 4C9.93 4 5 8.93 5 15.01c0 2.65.94 5.08 2.5 6.98L6 28l6.18-1.62a10.95 10.95 0 0 0 3.83.68h.01c6.08 0 11.01-4.93 11.01-11.01C27.03 8.93 22.1 4 16.01 4zm0 19.98h-.01a9.03 9.03 0 0 1-3.84-.85l-.28-.12-3.67.96.98-3.58-.15-.3A8.96 8.96 0 0 1 7 15.01C7 10 10.99 6 16.01 6c5.02 0 9.01 4 9.01 9.01 0 5.01-3.99 8.97-9.01 8.97zm4.99-6.75c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.62.14-.19.27-.71.88-.87 1.06-.16.18-.32.2-.59.07-.27-.14-1.12-.41-2.13-1.3-.79-.7-1.32-1.57-1.47-1.83-.15-.27-.02-.42.12-.56.12-.12.27-.32.41-.48.14-.16.19-.27.29-.46.1-.18.05-.34-.02-.48-.07-.14-.62-1.5-.85-2.05-.22-.53-.45-.46-.62-.47l-.53-.01c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.3 0 1.36.98 2.68 1.12 2.86.14.18 1.93 2.95 4.67 4.14.65.28 1.15.45 1.54.58.65.21 1.24.18 1.71.11.52-.08 1.6-.65 1.83-1.28.23-.62.23-1.16.16-1.28-.07-.12-.25-.2-.52-.34z"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={copyLink}
          className="h-9 w-9 rounded-full bg-slate-600 text-white shadow-sm transition-colors hover:bg-slate-500"
          aria-label="Copy link"
        >
          <LinkIcon className="h-4 w-4 mx-auto" />
        </button>
      </div>
    </>
  )
}
