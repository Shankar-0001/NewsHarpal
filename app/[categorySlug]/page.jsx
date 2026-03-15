import { permanentRedirect } from 'next/navigation'

export default function LegacyCategoryRedirect({ params, searchParams }) {
  const categorySlug = params.categorySlug
  const page = Math.max(1, parseInt(searchParams?.page || '1', 10))
  const destination = page > 1
    ? `/category/${categorySlug}/page/${page}`
    : `/category/${categorySlug}`

  permanentRedirect(destination)
}
