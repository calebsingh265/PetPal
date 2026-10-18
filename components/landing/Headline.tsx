import { Fragment } from 'react'

/**
 * A headline written as plain text with *asterisks* around the accent words.
 * Each word becomes its own span so it can settle into place on its own beat;
 * screen readers get the sentence once, unsplit.
 *
 *   <Headline as="h2" text="Not everything belongs *in the bowl.*" />
 */
export default function Headline({
  text, as: Tag = 'h2', className = '', hero = false, base = 0,
}: {
  text: string
  as?: 'h1' | 'h2' | 'h3'
  className?: string
  /** Hero words animate in pure CSS on load (it is the LCP element). */
  hero?: boolean
  /** Extra delay before the first word, in ms. */
  base?: number
}) {
  const plain = text.replace(/\*/g, '')
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean)
  let w = 0
  return (
    <Tag className={`pp-display ${className}`}>
      <span className="sr-only">{plain}</span>
      <span aria-hidden="true">
        {parts.map((part, i) => {
          const em = part.startsWith('*') && part.endsWith('*')
          const words = (em ? part.slice(1, -1) : part).split(/(\s+)/)
          const nodes = words.map((word, j) => {
            if (/^\s+$/.test(word) || word === '') return <Fragment key={j}>{word}</Fragment>
            const style = { '--w': w++, '--base': `${base}ms` } as React.CSSProperties
            return <span key={j} className={hero ? 'pp-hero-word' : 'pp-word'} style={style}>{word}</span>
          })
          return em ? <em key={i}>{nodes}</em> : <Fragment key={i}>{nodes}</Fragment>
        })}
      </span>
    </Tag>
  )
}
