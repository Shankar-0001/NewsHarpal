import { permanentRedirect } from 'next/navigation'

function toPageNumber(raw) {
  const page = Number.parseInt(raw, 10)
  return Number.isFinite(page) && page > 0 ? page : 1
}

export default function LegacyCategoryPaginationRedirect({ params }) {
  const page = toPageNumber(params.page)
  const destination = page > 1
    ? `/category/${params.categorySlug}/page/${page}`
    : `/category/${params.categorySlug}`

  permanentRedirect(destination)
}
