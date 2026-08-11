import { useState } from 'react'
import '../styles/Experience.css'

function ExperienceItem({ item, onSubmit, onRemove }) {
  const [isEditing, setIsEditing] = useState(true)
  const [draft, setDraft] = useState({
    company: item.company,
    position: item.position,
    responsibilities: item.responsibilities,
    from: item.from,
    until: item.until,
  })

  const handleChange = (e) => {
    setDraft({ ...draft, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
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
    setIsEditing(true)
  }

  const handleRemove = () => {
    onRemove(item.id)
  }

  if (!isEditing) {
    return (
      <div className="experience-item">
        <div className="item-header">
          <h3>{item.company}</h3>
          <span className="date">
            {item.from} – {item.until}
          </span>
        </div>
        <p className="item-title">{item.position}</p>
        <p>{item.responsibilities}</p>
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
            onClick={handleRemove}
          >
            Remove
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="experience-item">
      <form onSubmit={handleSubmit}>
        <label htmlFor={`company-${item.id}`}>Company name</label>
        <input
          type="text"
          id={`company-${item.id}`}
          name="company"
          value={draft.company}
          onChange={handleChange}
        />

        <label htmlFor={`position-${item.id}`}>Position title</label>
        <input
          type="text"
          id={`position-${item.id}`}
          name="position"
          value={draft.position}
          onChange={handleChange}
        />

        <label htmlFor={`responsibilities-${item.id}`}>
          Main responsibilities
        </label>
        <textarea
          id={`responsibilities-${item.id}`}
          name="responsibilities"
          rows={3}
          value={draft.responsibilities}
          onChange={handleChange}
        />

        <label htmlFor={`from-${item.id}`}>From</label>
        <input
          type="text"
          id={`from-${item.id}`}
          name="from"
          value={draft.from}
          onChange={handleChange}
          placeholder="e.g. Jan 2022"
        />

        <label htmlFor={`until-${item.id}`}>Until</label>
        <input
          type="text"
          id={`until-${item.id}`}
          name="until"
          value={draft.until}
          onChange={handleChange}
          placeholder="e.g. Dec 2024"
        />

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleRemove}
          >
            Remove
          </button>
          <button type="submit" className="btn btn-primary">
            Submit
          </button>
        </div>
      </form>
    </div>
  )
}

export default ExperienceItem
