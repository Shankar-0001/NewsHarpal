'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'

const MAX_KEYWORDS = 10
const MAX_KEYWORD_LENGTH = 60

function normalizeKeyword(value = '') {
  return value
    .toString()
    .trim()
    .replace(/\s+/g, ' ')
}

export default function KeywordInput({
  label = 'Keywords',
  value = [],
  onChange,
  description = 'Add up to 10 manual keywords for SEO. Press Enter or comma to add each keyword.',
}) {
  const [draft, setDraft] = useState('')

  const normalizedValue = useMemo(
    () => (Array.isArray(value) ? value.map(normalizeKeyword).filter(Boolean) : []),
    [value]
  )

  const addKeyword = (rawValue) => {
    const nextKeyword = normalizeKeyword(rawValue)
    if (!nextKeyword) return
    if (nextKeyword.length > MAX_KEYWORD_LENGTH) return

    const exists = normalizedValue.some((item) => item.toLowerCase() === nextKeyword.toLowerCase())
    if (exists || normalizedValue.length >= MAX_KEYWORDS) return

    onChange([...normalizedValue, nextKeyword])
    setDraft('')
  }

  const removeKeyword = (keywordToRemove) => {
    onChange(normalizedValue.filter((item) => item.toLowerCase() !== keywordToRemove.toLowerCase()))
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addKeyword(draft)
    }

    if (event.key === 'Backspace' && !draft && normalizedValue.length > 0) {
      removeKeyword(normalizedValue[normalizedValue.length - 1])
    }
  }

  const slotsLeft = Math.max(0, MAX_KEYWORDS - normalizedValue.length)

  return (
    <div className="space-y-3">
      <div>
        <Label>{label}</Label>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={slotsLeft > 0 ? 'Type a keyword and press Enter' : 'Keyword limit reached'}
          maxLength={MAX_KEYWORD_LENGTH}
          disabled={slotsLeft === 0}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => addKeyword(draft)}
          disabled={!draft.trim() || slotsLeft === 0}
        >
          Add
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 min-h-8">
        {normalizedValue.length > 0 ? normalizedValue.map((keyword) => (
          <Badge key={keyword} variant="secondary" className="flex items-center gap-1 pr-1">
            <span>{keyword}</span>
            <button
              type="button"
              onClick={() => removeKeyword(keyword)}
              className="rounded-full p-0.5 hover:bg-black/10"
              aria-label={`Remove keyword ${keyword}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )) : (
          <p className="text-sm text-gray-500">No manual keywords added yet.</p>
        )}
      </div>

      <p className="text-xs text-gray-500">
        {normalizedValue.length}/{MAX_KEYWORDS} keywords used
      </p>
    </div>
  )
}
