import ExperienceItem from './ExperienceItem'

function Experience({ items, onAdd, onSubmit, onRemove }) {
  return (
    <section className="experience form-section">
      <div className="sec-head">
        <span className="sec-num">04</span>
        <h2>Practical Experience</h2>
      </div>
      {items.map((item) => (
        <ExperienceItem
          key={item.id}
          item={item}
          onSubmit={onSubmit}
          onRemove={onRemove}
        />
      ))}
      <button type="button" className="add-btn" onClick={onAdd}>
        + Add experience
      </button>
    </section>
  )
}

export default Experience
