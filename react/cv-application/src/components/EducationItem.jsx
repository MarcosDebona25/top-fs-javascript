import { useState } from 'react'
import '../styles/Education.css'

function EducationItem({ item, onSubmit, onRemove }) {
  const [isEditing, setIsEditing] = useState(true)
  const [draft, setDraft] = useState({
    school: item.school,
    title: item.title,
    date: item.date,
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
    setDraft({ school: item.school, title: item.title, date: item.date })
    setIsEditing(true)
  }

  const handleRemove = () => {
    onRemove(item.id)
  }

  if (!isEditing) {
    return (
      <div className="education-item">
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
            onClick={handleRemove}
          >
            Remove
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="education-item">
      <form onSubmit={handleSubmit}>
        <label htmlFor={`school-${item.id}`}>School name</label>
        <input
          type="text"
          id={`school-${item.id}`}
          name="school"
          value={draft.school}
          onChange={handleChange}
        />

        <label htmlFor={`title-${item.id}`}>Title of study</label>
        <input
          type="text"
          id={`title-${item.id}`}
          name="title"
          value={draft.title}
          onChange={handleChange}
        />

        <label htmlFor={`date-${item.id}`}>Date of study</label>
        <input
          type="text"
          id={`date-${item.id}`}
          name="date"
          value={draft.date}
          onChange={handleChange}
          placeholder="e.g. 2018 - 2022"
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

export default EducationItem
