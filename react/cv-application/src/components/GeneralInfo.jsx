import { useState } from 'react'
import '../styles/GeneralInfo.css'

const GitHubIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
)

const LinkedInIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

function GeneralInfo({ data, onSubmit }) {
  const [isEditing, setIsEditing] = useState(true)
  const [draft, setDraft] = useState(data)

  const handleChange = (e) => {
    setDraft({ ...draft, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(draft)
    setIsEditing(false)
  }

  const handleEdit = () => {
    setDraft(data)
    setIsEditing(true)
  }

  if (!isEditing) {
    const hasLinks = data.github || data.linkedin

    return (
      <section className="general-info">
        <h2>General Information</h2>
        <div className="info-grid">
          <div className="info-field">
            <strong>Full Name</strong>
            <span>{data.fullName}</span>
          </div>
          <div className="info-field">
            <strong>Date of Birth</strong>
            <span>{data.dateOfBirth}</span>
          </div>
          <div className="info-field">
            <strong>Email</strong>
            <span>{data.email}</span>
          </div>
          <div className="info-field">
            <strong>Phone</strong>
            <span>{data.phone}</span>
          </div>
        </div>

        {hasLinks && (
          <div className="links-row">
            {data.github && (
              <a
                href={data.github}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
              >
                <GitHubIcon />
                <span>
                  {data.github
                    .replace(/^https?:\/\/(www\.)?/, '')
                    .replace(/\/$/, '')}
                </span>
              </a>
            )}
            {data.linkedin && (
              <a
                href={data.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
              >
                <LinkedInIcon />
                <span>
                  {data.linkedin
                    .replace(/^https?:\/\/(www\.)?/, '')
                    .replace(/\/$/, '')}
                </span>
              </a>
            )}
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleEdit}
          >
            Edit
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="general-info">
      <h2>General Information</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="fullName">Full Name</label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          value={draft.fullName}
          onChange={handleChange}
        />

        <label htmlFor="dateOfBirth">Date of Birth</label>
        <input
          type="date"
          id="dateOfBirth"
          name="dateOfBirth"
          value={draft.dateOfBirth}
          onChange={handleChange}
        />

        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={draft.email}
          onChange={handleChange}
        />

        <label htmlFor="phone">Phone</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={draft.phone}
          onChange={handleChange}
        />

        <label htmlFor="github">
          <GitHubIcon /> GitHub
        </label>
        <input
          type="url"
          id="github"
          name="github"
          value={draft.github}
          onChange={handleChange}
          placeholder="https://github.com/tu-usuario"
        />

        <label htmlFor="linkedin">
          <LinkedInIcon /> LinkedIn
        </label>
        <input
          type="url"
          id="linkedin"
          name="linkedin"
          value={draft.linkedin}
          onChange={handleChange}
          placeholder="https://linkedin.com/in/tu-usuario"
        />

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Submit
          </button>
        </div>
      </form>
    </section>
  )
}

export default GeneralInfo
