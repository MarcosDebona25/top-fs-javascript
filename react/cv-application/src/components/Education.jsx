import EducationItem from './EducationItem'

function Education({ items, onAdd, onSubmit, onRemove }) {
  return (
    <section className="education form-section">
      <div className="sec-head">
        <span className="sec-num">03</span>
        <h2>Education</h2>
      </div>
      {items.map((item) => (
        <EducationItem
          key={item.id}
          item={item}
          onSubmit={onSubmit}
          onRemove={onRemove}
        />
      ))}
      <button type="button" className="add-btn" onClick={onAdd}>
        + Add education
      </button>
    </section>
  )
}

export default Education
