import { useState } from 'react'
import { MAX_TAGS, MAX_TAG_LENGTH, validateTagInput } from '../validation'

function TagInput({ label, id, tags, onChange, placeholder }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  const addTag = () => {
    const text = input.trim()
    if (!text) {
      setError('')
      return
    }
    const message = validateTagInput(text, tags)
    if (message) {
      setError(message)
      return
    }
    onChange([...tags, text])
    setInput('')
    setError('')
  }

  const handleChange = (e) => {
    setInput(e.target.value)
    if (error) setError('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
  }

  const handleBlur = () => {
    addTag()
  }

  const handleRemove = (index) => {
    onChange(tags.filter((_, i) => i !== index))
    setError('')
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {tags.length > 0 && (
        <div className="tag-list">
          {tags.map((tag, index) => (
            <span key={tag} className="tag">
              {tag}
              <button
                type="button"
                className="tag-remove"
                aria-label={`Remove ${tag}`}
                onClick={() => handleRemove(index)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        id={id}
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        maxLength={MAX_TAG_LENGTH}
        className={error ? 'invalid' : ''}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error ? (
        <span className="err" id={`${id}-error`}>
          {error}
        </span>
      ) : (
        <span className="count">
          {tags.length} / {MAX_TAGS} tags · max {MAX_TAG_LENGTH} characters
          each
        </span>
      )}
    </div>
  )
}

export default TagInput
