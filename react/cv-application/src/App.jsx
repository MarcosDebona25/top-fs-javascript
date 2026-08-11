import { useState } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import './App.css'
import GeneralInfo from './components/GeneralInfo'
import PersonalInfo from './components/PersonalInfo'
import Education from './components/Education'
import Experience from './components/Experience'
import CvPdf from './components/CvPdf'

const sampleEducation = [
  { id: 'edu-1', school: 'Universidad Politécnica de Madrid', title: 'MSc Computer Science', date: '2017 – 2019' },
  { id: 'edu-2', school: 'Universidad de Barcelona', title: 'BSc Software Engineering', date: '2013 – 2017' },
]

const sampleExperiences = [
  {
    id: 'exp-1', company: 'TechFin Solutions', position: 'Senior Frontend Engineer',
    responsibilities: 'Led migration from Angular to React for the customer dashboard (200k+ monthly users). Designed and maintained a shared component library adopted by 4 product teams. Reduced bundle size by 40% through code splitting and tree shaking.',
    from: 'Jan 2022', until: 'Present',
  },
  {
    id: 'exp-2', company: 'Ecomarket Labs', position: 'Full-stack Developer',
    responsibilities: 'Built REST APIs and React micro-frontends for the marketplace platform serving 50k+ vendors. Implemented real-time inventory tracking with WebSockets. Mentored 3 junior developers through structured onboarding.',
    from: 'Jun 2019', until: 'Dec 2021',
  },
  {
    id: 'exp-3', company: 'StartupHub', position: 'Junior Developer',
    responsibilities: 'Developed responsive landing pages and internal admin tools using React and Node.js. Wrote unit and integration tests achieving 85% coverage across the frontend codebase.',
    from: 'Sep 2017', until: 'May 2019',
  },
]

function App() {
  const [generalInfo, setGeneralInfo] = useState({
    fullName: 'Elena García López',
    dateOfBirth: '1995-08-14',
    email: 'elena.garcia@example.com',
    phone: '+34 612 345 678',
    github: 'https://github.com/elenagarcia',
    linkedin: 'https://linkedin.com/in/elenagarcia',
  })
  const [personal, setPersonal] = useState({
    profile: 'Full-stack developer with 6+ years of experience building scalable web applications. Passionate about clean architecture, TypeScript, and mentoring junior developers. Strong background in e-commerce and fintech domains.',
    stack: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'GraphQL', 'Tailwind CSS', 'Jest', 'Redis'],
    softSkills: ['Leadership', 'Mentoring', 'Technical Writing', 'Agile / Scrum', 'Problem Solving', 'Cross-team Collaboration'],
  })
  const [education, setEducation] = useState(sampleEducation)
  const [experiences, setExperiences] = useState(sampleExperiences)

  const handleGeneralSubmit = (submitted) => setGeneralInfo(submitted)

  const handlePersonalSubmit = (submitted) => setPersonal(submitted)

  const handleAddEducation = () => {
    setEducation([
      ...education,
      { id: crypto.randomUUID(), school: '', title: '', date: '' },
    ])
  }

  const handleEducationSubmit = (id, submitted) => {
    setEducation(
      education.map((item) =>
        item.id === id ? { ...submitted, id } : item
      )
    )
  }

  const handleRemoveEducation = (id) => {
    setEducation(education.filter((item) => item.id !== id))
  }

  const handleAddExperience = () => {
    setExperiences([
      ...experiences,
      {
        id: crypto.randomUUID(),
        company: '',
        position: '',
        responsibilities: '',
        from: '',
        until: '',
      },
    ])
  }

  const handleExperienceSubmit = (id, submitted) => {
    setExperiences(
      experiences.map((item) =>
        item.id === id ? { ...submitted, id } : item
      )
    )
  }

  const handleRemoveExperience = (id) => {
    setExperiences(experiences.filter((item) => item.id !== id))
  }

  return (
    <div className="app">
      <div className="app-header">
        <h1>CV Application Generator</h1>
        <PDFDownloadLink
          document={
            <CvPdf
              general={generalInfo}
              personal={personal}
              education={education}
              experiences={experiences}
            />
          }
          fileName={
            generalInfo.fullName
              ? `${generalInfo.fullName.trim().replace(/\s+/g, '-').toLowerCase()}-cv.pdf`
              : 'cv.pdf'
          }
          className="btn btn-primary"
        >
          Download PDF
        </PDFDownloadLink>
      </div>
      <GeneralInfo data={generalInfo} onSubmit={handleGeneralSubmit} />
      <PersonalInfo data={personal} onSubmit={handlePersonalSubmit} />
      <Education
        items={education}
        onAdd={handleAddEducation}
        onSubmit={handleEducationSubmit}
        onRemove={handleRemoveEducation}
      />
      <Experience
        items={experiences}
        onAdd={handleAddExperience}
        onSubmit={handleExperienceSubmit}
        onRemove={handleRemoveExperience}
      />
    </div>
  )
}

export default App
