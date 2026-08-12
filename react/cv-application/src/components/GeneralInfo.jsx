import { useState } from 'react'
import '../styles/GeneralInfo.css'

const GitHubIcon = () => (
  <img
    src="/icons8-github-logo.svg"
    width="18"
    height="18"
    alt=""
    aria-hidden="true"
  />
)

const LinkedInIcon = () => (
  <img
    src="/icons8-linkedin.svg"
    width="18"
    height="18"
    alt=""
    aria-hidden="true"
  />
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
            <strong>
              Identification
              <span className="tooltip-trigger" tabIndex="0" aria-label="Identification depends on your country. For example, in Argentina it would be DNI: 45758863. In the US, it could be SSN or state ID. Use whatever is standard in your location.">
                &#9432;
                <span className="tooltip-content">
                  This field depends on your country. In Argentina it&rsquo;s <em>DNI: 45758863</em>. In the US, it could be SSN or state ID. Use whatever is standard in your location.
                </span>
              </span>
            </strong>
            <span>{data.identification}</span>
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

        <label htmlFor="identification">
          Identification
          <span className="tooltip-trigger" tabIndex="0" aria-label="This depends on your country. In Argentina it would be DNI: 45758863.">
            &#9432;
            <span className="tooltip-content">
              This field depends on your country. In Argentina it&rsquo;s <em>DNI: 45758863</em>. In the US, it could be SSN or state ID. Use whatever is standard in your location.
            </span>
          </span>
        </label>
        <input
          type="text"
          id="identification"
          name="identification"
          value={draft.identification}
          onChange={handleChange}
          placeholder="e.g. DNI: 45758863"
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
          placeholder="https://github.com/your-user"
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
          placeholder="https://linkedin.com/in/your-user"
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
