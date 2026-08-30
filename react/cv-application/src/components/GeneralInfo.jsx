import { useRef, useState } from 'react'
import { validators, runValidators } from '../validation'
import '../styles/GeneralInfo.css'

const GitHubIcon = () => (
  <img
    src="/icons8-github-logo.svg"
    width="16"
    height="16"
    alt=""
    aria-hidden="true"
  />
)

const LinkedInIcon = () => (
  <img
    src="/icons8-linkedin.svg"
    width="16"
    height="16"
    alt=""
    aria-hidden="true"
  />
)

function GeneralInfo({ data, onSubmit }) {
  const [isEditing, setIsEditing] = useState(true)
  const [draft, setDraft] = useState(data)
  const [errors, setErrors] = useState({})
  const formRef = useRef(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setDraft({ ...draft, [name]: value })
    if (errors[name]) {
      setErrors({ ...errors, [name]: validators[name](value) })
    }
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setErrors({ ...errors, [name]: validators[name](draft[name]) })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const { errors: nextErrors, firstInvalid } = runValidators(draft, validators)
    if (firstInvalid) {
      setErrors(nextErrors)
      formRef.current?.elements.namedItem(firstInvalid)?.focus()
      return
    }
    onSubmit(draft)
    setIsEditing(false)
  }

  const handleEdit = () => {
    setDraft(data)
    setErrors({})
    setIsEditing(true)
  }

  const renderField = (name, labelText, inputProps, labelNode) => (
    <div className="field" key={name}>
      <label htmlFor={name}>{labelNode ?? labelText}</label>
      <input
        id={name}
        name={name}
        value={draft[name]}
        onChange={handleChange}
        onBlur={handleBlur}
        className={errors[name] ? 'invalid' : ''}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `${name}-error` : undefined}
        {...inputProps}
      />
      {errors[name] && (
        <span className="err" id={`${name}-error`}>
          {errors[name]}
        </span>
      )}
    </div>
  )

  if (!isEditing) {
    const hasLinks = data.github || data.linkedin

    return (
      <section className="general-info form-section">
        <div className="sec-head">
          <span className="sec-num">01</span>
          <h2>General Information</h2>
        </div>
        <div className="info-grid">
          <div className="info-field">
            <strong>Full name</strong>
            <span>{data.fullName}</span>
          </div>
          <div className="info-field">
            <strong>Date of birth</strong>
            <span>{data.dateOfBirth}</span>
          </div>
          <div className="info-field">
            <strong>Email</strong>
            <span>{data.email}</span>
          </div>
          <div className="info-field">
            <strong>
              Identification
              <span
                className="tooltip-trigger"
                tabIndex="0"
                aria-label="Identification depends on your country. For example, in Argentina it would be DNI: 45758863. In the US, it could be SSN or state ID. Use whatever is standard in your location."
              >
                &#9432;
                <span className="tooltip-content">
                  This field depends on your country. In Argentina it&rsquo;s{' '}
                  <em>DNI: 45758863</em>. In the US, it could be SSN or state
                  ID. Use whatever is standard in your location.
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
    <section className="general-info form-section">
      <div className="sec-head">
        <span className="sec-num">01</span>
        <h2>General Information</h2>
      </div>
      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        {renderField(
          'fullName',
          'Full name',
          { type: 'text', maxLength: '80' },
          <>
            Full name <span className="req">*</span>
          </>
        )}

        {renderField('dateOfBirth', 'Date of birth', { type: 'date' })}

        {renderField(
          'identification',
          'Identification',
          { type: 'text', maxLength: '20', placeholder: 'e.g. DNI: 45758863' },
          <>
            Identification
            <span
              className="tooltip-trigger"
              tabIndex="0"
              aria-label="Identification depends on your country. For example, in Argentina it would be DNI: 45758863. In the US, it could be SSN or state ID. Use whatever is standard in your location."
            >
              &#9432;
              <span className="tooltip-content">
                This field depends on your country. In Argentina it&rsquo;s{' '}
                <em>DNI: 45758863</em>. In the US, it could be SSN or state ID.
                Use whatever is standard in your location.
              </span>
            </span>
          </>
        )}

        {renderField('email', 'Email', {
          type: 'email',
          placeholder: 'name@domain.com',
        })}

        {renderField('phone', 'Phone', {
          type: 'tel',
          maxLength: '20',
          placeholder: '+54 9 11 5555 5555',
        })}

        {renderField(
          'github',
          'GitHub',
          { type: 'url', placeholder: 'https://github.com/your-user' },
          <>
            <GitHubIcon /> GitHub
          </>
        )}

        {renderField(
          'linkedin',
          'LinkedIn',
          { type: 'url', placeholder: 'https://linkedin.com/in/your-user' },
          <>
            <LinkedInIcon /> LinkedIn
          </>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Save
          </button>
        </div>
      </form>
    </section>
  )
}

export default GeneralInfo
