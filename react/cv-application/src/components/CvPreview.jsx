import '../styles/CvPreview.css'

function CvPreview({ general, personal, education, experiences }) {
  const cleanUrl = (url) =>
    url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

  const contactParts = [general.email, general.phone].filter(Boolean)
  const linkParts = [general.github, general.linkedin]
    .filter(Boolean)
    .map(cleanUrl)
  const contactLine = [...contactParts, ...linkParts].join(' · ')

  return (
    <aside className="sheet-col">
      <div className="sheet" aria-hidden="true">
        <p className={general.fullName ? 's-name' : 's-name s-empty'}>
          {general.fullName || 'Your Name'}
        </p>
        <p className={contactLine ? 's-contact' : 's-contact s-empty'}>
          {contactLine || 'Your contact details will appear here.'}
        </p>

        {personal.profile && (
          <div className="s-sec">
            <h4>Profile</h4>
            <p className="s-text">{personal.profile}</p>
          </div>
        )}

        {experiences.length > 0 && (
          <div className="s-sec">
            <h4>Experience</h4>
            {experiences.map((experience) => (
              <div className="s-entry" key={experience.id}>
                <div className="s-row">
                  <b>{experience.company}</b>
                  <span className="s-date">
                    {experience.from} – {experience.until}
                  </span>
                </div>
                {experience.position && (
                  <p className="s-sub">{experience.position}</p>
                )}
                {experience.responsibilities && (
                  <p className="s-text">{experience.responsibilities}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {education.length > 0 && (
          <div className="s-sec">
            <h4>Education</h4>
            {education.map((item) => (
              <div className="s-entry" key={item.id}>
                <div className="s-row">
                  <b>{item.school}</b>
                  <span className="s-date">{item.date}</span>
                </div>
                {item.title && <p className="s-sub">{item.title}</p>}
              </div>
            ))}
          </div>
        )}

        {(personal.stack.length > 0 || personal.softSkills.length > 0) && (
          <div className="s-sec">
            <h4>Skills</h4>
            <p className="s-text">
              {[...personal.stack, ...personal.softSkills].join(' · ')}
            </p>
          </div>
        )}
      </div>
      <p className="sheet-cap">Live preview</p>
    </aside>
  )
}

export default CvPreview
