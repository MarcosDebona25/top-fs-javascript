import { useState } from 'react'
import './App.css'
import GeneralInfo from './components/GeneralInfo'
import PersonalInfo from './components/PersonalInfo'
import Education from './components/Education'
import Experience from './components/Experience'
import PdfButton from './components/PdfButton'
import ConfirmModal from './components/ConfirmModal'

const emptyGeneral = {
  fullName: '',
  dateOfBirth: '',
  email: '',
  identification: '',
  phone: '',
  github: '',
  linkedin: '',
}

const emptyPersonal = {
  profile: '',
  stack: [],
  softSkills: [],
}

function App() {
  const [generalInfo, setGeneralInfo] = useState(emptyGeneral)
  const [personal, setPersonal] = useState(emptyPersonal)
  const [education, setEducation] = useState([])
  const [experiences, setExperiences] = useState([])
  const [generalConfirmed, setGeneralConfirmed] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const handleGeneralSubmit = (submitted) => {
    setGeneralInfo(submitted)
    setGeneralConfirmed(true)
  }

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
        {generalConfirmed ? (
          <PdfButton
            general={generalInfo}
            personal={personal}
            education={education}
            experiences={experiences}
          />
        ) : (
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            Download PDF
          </button>
        )}
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

      {showModal && <ConfirmModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

export default App
