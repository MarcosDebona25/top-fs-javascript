import { useState } from 'react'
import '../styles/PersonalInfo.css'
import { PROFILE_MAX } from '../validation'
import TagInput from './TagInput'

function PersonalInfo({ data, onSubmit }) {
  const [isEditing, setIsEditing] = useState(true)
  const [draft, setDraft] = useState(data)

  const handleChange = (e) => {
    setDraft({ ...draft, profile: e.target.value })
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
      <section className="personal-info form-section">
        <div className="sec-head">
          <span className="sec-num">02</span>
          <h2>Skills &amp; Profile</h2>
        </div>
        {isEmpty ? (
          <p className="empty-note">Nothing added yet.</p>
        ) : (
          <>
            {data.profile && <p className="profile-text">{data.profile}</p>}
            {data.stack.length > 0 && (
              <>
                <h3>Technical stack</h3>
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
                <h3>Soft skills</h3>
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
    <section className="personal-info form-section">
      <div className="sec-head">
        <span className="sec-num">02</span>
        <h2>Skills &amp; Profile</h2>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="profile">Professional profile</label>
          <textarea
            id="profile"
            name="profile"
            rows={4}
            maxLength={PROFILE_MAX}
            value={draft.profile}
            onChange={handleChange}
          />
          <span className="count">
            {draft.profile.length} / {PROFILE_MAX} characters
          </span>
        </div>

        <TagInput
          label="Technical stack"
          id="stack"
          tags={draft.stack}
          onChange={(next) => setDraft({ ...draft, stack: next })}
          placeholder="e.g. React, Node.js..."
        />

        <TagInput
          label="Soft skills"
          id="softSkills"
          tags={draft.softSkills}
          onChange={(next) => setDraft({ ...draft, softSkills: next })}
          placeholder="e.g. Teamwork, Communication..."
        />

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Save
          </button>
        </div>
      </form>
    </section>
  )
}

export default PersonalInfo
