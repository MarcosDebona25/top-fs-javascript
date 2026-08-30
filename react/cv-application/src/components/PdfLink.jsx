import { PDFDownloadLink } from '@react-pdf/renderer'
import CvPdf from './CvPdf'

function PdfLink({ general, personal, education, experiences }) {
  const fileName = general.fullName
    ? `${general.fullName.trim().replace(/\s+/g, '-').toLowerCase()}-cv.pdf`
    : 'cv.pdf'

  return (
    <PDFDownloadLink
      document={
        <CvPdf
          general={general}
          personal={personal}
          education={education}
          experiences={experiences}
        />
      }
      fileName={fileName}
      className="btn-pdf"
    >
      Download PDF
    </PDFDownloadLink>
  )
}

export default PdfLink
