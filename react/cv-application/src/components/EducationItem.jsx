import { useRef, useState } from 'react'
import { educationValidators, runValidators } from '../validation'

function EducationItem({ item, onSubmit, onRemove }) {
  const [isEditing, setIsEditing] = useState(true)
  const [draft, setDraft] = useState({
    school: item.school,
    title: item.title,
    date: item.date,
  })
  const [errors, setErrors] = useState({})
  const formRef = useRef(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setDraft({ ...draft, [name]: value })
    if (errors[name]) {
      setErrors({ ...errors, [name]: educationValidators[name](value) })
    }
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setErrors({ ...errors, [name]: educationValidators[name](draft[name]) })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const { errors: nextErrors, firstInvalid } = runValidators(
      draft,
      educationValidators
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
    setDraft({ school: item.school, title: item.title, date: item.date })
    setErrors({})
    setIsEditing(true)
  }

  const renderField = (name, labelText, inputProps) => (
    <div className="field" key={name}>
      <label htmlFor={`${name}-${item.id}`}>
        {labelText} <span className="req">*</span>
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
          <h3>{item.school}</h3>
          <span className="date">{item.date}</span>
        </div>
        <p className="item-title">{item.title}</p>
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
        {renderField('school', 'School name', { type: 'text', maxLength: '80' })}
        {renderField('title', 'Title of study', { type: 'text', maxLength: '80' })}
        {renderField('date', 'Date of study', {
          type: 'text',
          maxLength: '20',
          placeholder: 'e.g. 2018 - 2022',
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

export default EducationItem
