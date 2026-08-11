import '../styles/Education.css'
import EducationItem from './EducationItem'

function Education({ items, onAdd, onSubmit, onRemove }) {
  return (
    <section className="education">
      <h2>Education</h2>
      {items.map((item) => (
        <EducationItem
          key={item.id}
          item={item}
          onSubmit={onSubmit}
          onRemove={onRemove}
        />
      ))}
      <button type="button" className="btn btn-primary" onClick={onAdd}>
        + Add education
      </button>
    </section>
  )
}

export default Education
