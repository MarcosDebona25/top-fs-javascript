import { useState } from 'react'
import '../styles/PersonalInfo.css'
import TagInput from './TagInput'

function PersonalInfo({ data, onSubmit }) {
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
    const isEmpty =
      !data.profile && data.stack.length === 0 && data.softSkills.length === 0

    return (
      <section className="personal-info">
        <h2>Skills & Profile</h2>
        {isEmpty ? (
          <p className="empty-note">Nothing added yet.</p>
        ) : (
          <>
            {data.profile && <p>{data.profile}</p>}
            {data.stack.length > 0 && (
              <>
                <h3>Technical Stack</h3>
                <div className="tag-list">
                  {data.stack.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}
            {data.softSkills.length > 0 && (
              <>
                <h3>Soft Skills</h3>
                <div className="tag-list">
                  {data.softSkills.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </>
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
    <section className="personal-info">
      <h2>Skills & Profile</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="profile">Professional Profile</label>
        <textarea
          id="profile"
          name="profile"
          rows={4}
          value={draft.profile}
          onChange={handleChange}
        />

        <TagInput
          label="Technical Stack"
          id="stack"
          tags={draft.stack}
          onChange={(next) => setDraft({ ...draft, stack: next })}
          placeholder="e.g. React, Node.js..."
        />

        <TagInput
          label="Soft Skills"
          id="softSkills"
          tags={draft.softSkills}
          onChange={(next) => setDraft({ ...draft, softSkills: next })}
          placeholder="e.g. Teamwork, Communication..."
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

export default PersonalInfo
