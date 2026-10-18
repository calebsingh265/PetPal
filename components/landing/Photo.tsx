import manifest from '@/public/images/landing/manifest.json'

type Slug = keyof typeof manifest

/**
 * A pre-optimised local photo (see docs/image-credits.md). Two widths plus a
 * tiny blurred placeholder painted as the background, and intrinsic size set,
 * so nothing shifts when it loads.
 */
export default function Photo({
  slug, className = '', sizes = '(min-width: 1024px) 40vw, 90vw', priority = false,
}: { slug: Slug; className?: string; sizes?: string; priority?: boolean }) {
  const m = manifest[slug]
  const base = `/images/landing/${slug}`
  return (
    // eslint-disable-next-line @next/next/no-img-element -- files are already optimised; see scripts in docs/image-credits.md
    <img
      src={`${base}-1600.webp`}
      srcSet={`${base}-800.webp 800w, ${base}-1600.webp 1600w`}
      sizes={sizes}
      width={m.width}
      height={m.height}
      alt={m.alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={`object-cover ${className}`}
      style={{ backgroundImage: `url(${base}-blur.webp)`, backgroundSize: 'cover' }}
    />
  )
}
