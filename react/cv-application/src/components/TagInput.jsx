import { useState } from 'react'

function TagInput({ label, id, tags, onChange, placeholder }) {
  const [input, setInput] = useState('')

  const addTag = () => {
    const newTag = input.trim()
    if (newTag && !tags.includes(newTag)) {
      onChange([...tags, newTag])
    }
    setInput('')
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
  }

  return (
    <div className="tag-input">
      <label htmlFor={id}>{label}</label>
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
      <input
        type="text"
        id={id}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
      />
    </div>
  )
}

export default TagInput
