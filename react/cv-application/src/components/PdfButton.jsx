import { lazy, Suspense } from 'react'

const PdfLink = lazy(() => import('./PdfLink'))

function PdfButton({ general, personal, education, experiences }) {
  return (
    <Suspense
      fallback={
        <span className="btn-pdf" style={{ opacity: 0.6, pointerEvents: 'none' }}>
          Loading PDF…
        </span>
      }
    >
      <PdfLink
        general={general}
        personal={personal}
        education={education}
        experiences={experiences}
      />
    </Suspense>
  )
}

export default PdfButton
