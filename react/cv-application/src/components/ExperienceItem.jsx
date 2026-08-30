import { useRef, useState } from 'react'
import { experienceValidators, runValidators } from '../validation'

function ExperienceItem({ item, onSubmit, onRemove }) {
  const [isEditing, setIsEditing] = useState(true)
  const [draft, setDraft] = useState({
    company: item.company,
    position: item.position,
    responsibilities: item.responsibilities,
    from: item.from,
    until: item.until,
  })
  const [errors, setErrors] = useState({})
  const formRef = useRef(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setDraft({ ...draft, [name]: value })
    if (errors[name]) {
      setErrors({ ...errors, [name]: experienceValidators[name](value) })
    }
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setErrors({ ...errors, [name]: experienceValidators[name](draft[name]) })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const { errors: nextErrors, firstInvalid } = runValidators(
      draft,
      experienceValidators
    )
    if (firstInvalid) {
      setErrors(nextErrors)
      formRef.current?.elements.namedItem(firstInvalid)?.focus()
      return
    }
    onSubmit(item.id, draft)
    setIsEditing(false)
  }

  const handleEdit = () => {
    setDraft({
      company: item.company,
      position: item.position,
      responsibilities: item.responsibilities,
      from: item.from,
      until: item.until,
    })
    setErrors({})
    setIsEditing(true)
  }

  const renderField = (name, labelText, inputProps, optional = false) => (
    <div className="field" key={name}>
      <label htmlFor={`${name}-${item.id}`}>
        {labelText}
        {!optional && <span className="req"> *</span>}
      </label>
      <input
        id={`${name}-${item.id}`}
        name={name}
        value={draft[name]}
        onChange={handleChange}
        onBlur={handleBlur}
        className={errors[name] ? 'invalid' : ''}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `${name}-${item.id}-error` : undefined}
        {...inputProps}
      />
      {errors[name] && (
        <span className="err" id={`${name}-${item.id}-error`}>
          {errors[name]}
        </span>
      )}
    </div>
  )

  if (!isEditing) {
    return (
      <div className="item">
        <div className="item-header">
          <h3>{item.company}</h3>
          <span className="date">
            {item.from} – {item.until}
          </span>
        </div>
        <p className="item-title">{item.position}</p>
        <p className="item-text">{item.responsibilities}</p>
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleEdit}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => onRemove(item.id)}
          >
            Remove
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="item">
      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        {renderField('company', 'Company name', { type: 'text', maxLength: '80' })}
        {renderField('position', 'Position title', { type: 'text', maxLength: '80' })}

        <div className="field">
          <label htmlFor={`responsibilities-${item.id}`}>
            Main responsibilities
          </label>
          <textarea
            id={`responsibilities-${item.id}`}
            name="responsibilities"
            rows={3}
            maxLength={1000}
            value={draft.responsibilities}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {errors.responsibilities && (
            <span className="err" id={`responsibilities-${item.id}-error`}>
              {errors.responsibilities}
            </span>
          )}
        </div>

        {renderField('from', 'From', {
          type: 'text',
          maxLength: '20',
          placeholder: 'e.g. Jan 2022',
        })}
        {renderField('until', 'Until', {
          type: 'text',
          maxLength: '20',
          placeholder: 'e.g. Dec 2024 or Present',
        })}

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => onRemove(item.id)}
          >
            Remove
          </button>
          <button type="submit" className="btn btn-primary">
            Save
          </button>
        </div>
      </form>
    </div>
  )
}

export default ExperienceItem
