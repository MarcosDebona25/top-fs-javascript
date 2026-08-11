import '../styles/Experience.css'
import ExperienceItem from './ExperienceItem'

function Experience({ items, onAdd, onSubmit, onRemove }) {
  return (
    <section className="experience">
      <h2>Practical Experience</h2>
      {items.map((item) => (
        <ExperienceItem
          key={item.id}
          item={item}
          onSubmit={onSubmit}
          onRemove={onRemove}
        />
      ))}
      <button type="button" className="btn btn-primary" onClick={onAdd}>
        + Add experience
      </button>
    </section>
  )
}

export default Experience
