import '../styles/CvPreview.css'

function CvPreview({ general, personal, education, experiences }) {
  const cleanUrl = (url) =>
    url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

  const contactLine = [
    general.email,
    general.phone,
    general.dateOfBirth ? `Born: ${general.dateOfBirth}` : '',
    general.identification,
  ]
    .filter(Boolean)
    .join(' • ')

  const links = [
    general.github && {
      href: general.github,
      label: cleanUrl(general.github),
      icon: '/icons8-github-logo.svg',
    },
    general.linkedin && {
      href: general.linkedin,
      label: cleanUrl(general.linkedin),
      icon: '/icons8-linkedin.svg',
    },
  ].filter(Boolean)

  return (
    <aside className="sheet-col">
      <div className="sheet" aria-hidden="true">
        <p className={general.fullName ? 's-name' : 's-name s-empty'}>
          {general.fullName || 'Your Name'}
        </p>
        <p className={contactLine ? 's-contact' : 's-contact s-empty'}>
          {contactLine || 'Your contact details will appear here.'}
        </p>
        {links.length > 0 && (
          <div className="s-links">
            {links.map((link) => (
              <span className="s-link" key={link.href}>
                <img src={link.icon} alt="" />
                {link.label}
              </span>
            ))}
          </div>
        )}

        {personal.profile && (
          <div className="s-sec">
            <h4>Profile</h4>
            <p className="s-text">{personal.profile}</p>
          </div>
        )}

        {experiences.length > 0 && (
          <div className="s-sec">
            <h4>Practical Experience</h4>
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
                {item.title && <p className="s-text">{item.title}</p>}
              </div>
            ))}
          </div>
        )}

        {personal.stack.length > 0 && (
          <div className="s-sec">
            <h4>Technical Stack</h4>
            <p className="s-text">{personal.stack.join(', ')}</p>
          </div>
        )}

        {personal.softSkills.length > 0 && (
          <div className="s-sec">
            <h4>Soft Skills</h4>
            <p className="s-text">{personal.softSkills.join(', ')}</p>
          </div>
        )}
      </div>
      <p className="sheet-cap">Live preview</p>
    </aside>
  )
}

export default CvPreview
