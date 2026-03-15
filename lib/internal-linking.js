function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
])

const BLOCKED_TAGS = new Set([
  'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'pre', 'code', 'script', 'style',
])

function buildKeywordPattern(keyword) {
  const safe = escapeRegExp(keyword.trim())
  if (!safe) return null
  const hasWordChars = /[a-z0-9]/i.test(safe)
  if (!hasWordChars) return null
  const startsWithWord = /^[a-z0-9]/i.test(safe)
  const endsWithWord = /[a-z0-9]$/i.test(safe)
  const prefix = startsWithWord ? '\\b' : ''
  const suffix = endsWithWord ? '\\b' : ''
  return new RegExp(`${prefix}${safe}${suffix}`, 'i')
}

function normalizeCandidates(candidates = []) {
  const seen = new Set()
  return (candidates || [])
    .map((candidate) => ({
      keyword: (candidate?.keyword || '').trim(),
      href: (candidate?.href || '').trim(),
    }))
    .filter((candidate) => candidate.keyword.length >= 3 && candidate.href)
    .filter((candidate) => {
      const key = `${candidate.keyword.toLowerCase()}::${candidate.href}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

export function injectInternalLinks(html = '', candidates = [], maxLinks = 5) {
  if (!html || !candidates?.length || maxLinks <= 0) return html

  const normalized = normalizeCandidates(candidates)
  if (normalized.length === 0) return html

  const usedKeywords = new Set()
  let linksUsed = 0
  let output = ''
  const stack = []

  const processText = (text) => {
    if (!text || linksUsed >= maxLinks) return text

    let updated = text
    for (const candidate of normalized) {
      if (linksUsed >= maxLinks) break
      const keywordLower = candidate.keyword.toLowerCase()
      if (usedKeywords.has(keywordLower)) continue

      const pattern = buildKeywordPattern(candidate.keyword)
      if (!pattern || !pattern.test(updated)) continue

      updated = updated.replace(pattern, (match) => {
        if (linksUsed >= maxLinks) return match
        usedKeywords.add(keywordLower)
        linksUsed += 1
        return `<a href="${candidate.href}">${match}</a>`
      })
    }
    return updated
  }

  let i = 0
  while (i < html.length) {
    const nextTag = html.indexOf('<', i)
    if (nextTag === -1) {
      const tail = html.slice(i)
      if (stack.some((tag) => BLOCKED_TAGS.has(tag))) {
        output += tail
      } else {
        output += processText(tail)
      }
      break
    }

    const textSegment = html.slice(i, nextTag)
    if (textSegment) {
      if (stack.some((tag) => BLOCKED_TAGS.has(tag))) {
        output += textSegment
      } else {
        output += processText(textSegment)
      }
    }

    const tagEnd = html.indexOf('>', nextTag + 1)
    if (tagEnd === -1) {
      output += html.slice(nextTag)
      break
    }

    const tagContent = html.slice(nextTag + 1, tagEnd).trim()
    output += html.slice(nextTag, tagEnd + 1)

    if (tagContent.startsWith('!--')) {
      i = tagEnd + 1
      continue
    }

    const isClosing = tagContent.startsWith('/')
    const tagNameMatch = tagContent.match(/^\/?\s*([a-z0-9-]+)/i)
    const tagName = tagNameMatch ? tagNameMatch[1].toLowerCase() : null

    if (tagName) {
      if (isClosing) {
        const idx = stack.lastIndexOf(tagName)
        if (idx !== -1) stack.splice(idx, 1)
      } else if (!VOID_TAGS.has(tagName) && !tagContent.endsWith('/')) {
        stack.push(tagName)
      }
    }

    i = tagEnd + 1
  }

  return output
}
