import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Path,
  Link,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    color: '#1C1B18',
    lineHeight: 1.4,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 1,
    paddingBottom: 10,
  },
  contactLine: {
    color: '#6E6A60',
  },
  socialRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  socialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  socialText: {
    color: '#374151',
    fontSize: 10,
    textDecoration: 'underline',
  },
  sectionTitle: {
    marginTop: 16,
    paddingBottom: 4,
    borderBottom: '1 solid #C8102E',
    color: '#1C1B18',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  entry: {
    marginTop: 8,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  entryTitle: {
    fontWeight: 'bold',
  },
  entryDate: {
    color: '#6E6A60',
  },
  entrySubtitle: {
    marginTop: 2,
    fontWeight: 'medium',
  },
  entryText: {
    marginTop: 2,
    marginBottom: 8,
  },
})

const ICON_SIZE = 11

function GitHubIcon() {
  return (
    <Svg viewBox="0 0 30 30" width={ICON_SIZE} height={ICON_SIZE}>
      <Path
        fill="#374151"
        d="M15 3C8.373 3 3 8.373 3 15c0 5.623 3.872 10.328 9.092 11.63-.056-.162-.092-.35-.092-.583v-2.051c-.487 0-1.303 0-1.508 0-.821 0-1.551-.353-1.905-1.009-.393-.729-.461-1.844-1.435-2.526-.289-.227-.069-.486.264-.451.615.174 1.125.596 1.605 1.222.478.627.703.769 1.596.769.433 0 1.081-.025 1.691-.121.328-.833.895-1.6 1.588-1.962-3.996-.411-5.903-2.399-5.903-5.098 0-1.162.495-2.286 1.336-3.233-.276-.94-.623-2.857.106-3.587 1.798 0 2.885 1.166 3.146 1.481A9.16 9.16 0 0115.495 9c1.036 0 2.024.174 2.922.483.258-.311 1.346-1.483 3.148-1.483.732.731.381 2.656.102 3.594.836.945 1.328 2.066 1.328 3.226 0 2.697-1.904 4.684-5.894 5.097C18.199 20.49 19 22.1 19 23.313v2.734c0 .104-.023.179-.035.268C23.641 24.676 27 20.236 27 15c0-6.627-5.373-12-12-12z"
      />
    </Svg>
  )
}

function LinkedInIcon() {
  return (
    <Svg viewBox="0 0 30 30" width={ICON_SIZE} height={ICON_SIZE}>
      <Path
        fill="#374151"
        d="M24 4H6a2 2 0 00-2 2v18a2 2 0 002 2h18a2 2 0 002-2V6a2 2 0 00-2-2zM10.954 22h-2.95v-9.492h2.95V22zM9.449 11.151a1.72 1.72 0 111.719-1.72 1.72 1.72 0 01-1.719 1.72zM22.004 22h-2.948v-4.616c0-1.101-.02-2.517-1.533-2.517-1.535 0-1.771 1.199-1.771 2.437V22h-2.948v-9.492h2.83v1.297h.04c.394-.746 1.356-1.533 2.791-1.533 2.987 0 3.539 1.966 3.539 4.522V22z"
      />
    </Svg>
  )
}

function Section({ title, children }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

function CvPdf({ general, personal, education, experiences }) {
  const contactDetails = [
    general.email,
    general.phone,
    general.dateOfBirth ? `Born: ${general.dateOfBirth}` : '',
    general.identification ? `${general.identification}` : '',
  ].filter(Boolean)

  const cleanUrl = (url) =>
    url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

  const hasLinks = general.github || general.linkedin

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.name}>{general.fullName}</Text>
          {contactDetails.length > 0 && (
            <Text style={styles.contactLine}>
              {contactDetails.join('  •  ')}
            </Text>
          )}
          {hasLinks && (
            <View style={styles.socialRow}>
              {general.github && (
                <Link src={general.github} style={styles.socialItem}>
                  <GitHubIcon />
                  <Text style={styles.socialText}>
                    {cleanUrl(general.github)}
                  </Text>
                </Link>
              )}
              {general.linkedin && (
                <Link src={general.linkedin} style={styles.socialItem}>
                  <LinkedInIcon />
                  <Text style={styles.socialText}>
                    {cleanUrl(general.linkedin)}
                  </Text>
                </Link>
              )}
            </View>
          )}
        </View>

        {personal.profile && (
          <Section title="Profile">
            <Text style={styles.entryText}>{personal.profile}</Text>
          </Section>
        )}

        {experiences.length > 0 && (
          <Section title="Practical Experience">
            {experiences.map((experience) => (
              <View key={experience.id} style={styles.entry}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{experience.company}</Text>
                  <Text style={styles.entryDate}>
                    {experience.from} – {experience.until}
                  </Text>
                </View>
                <Text style={styles.entrySubtitle}>{experience.position}</Text>
                <Text style={styles.entryText}>
                  {experience.responsibilities}
                </Text>
              </View>
            ))}
          </Section>
        )}

        {education.length > 0 && (
          <Section title="Education">
            {education.map((item) => (
              <View key={item.id} style={styles.entry}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{item.school}</Text>
                  <Text style={styles.entryDate}>{item.date}</Text>
                </View>
                <Text style={styles.entryText}>{item.title}</Text>
              </View>
            ))}
          </Section>
        )}

        {personal.stack.length > 0 && (
          <Section title="Technical Stack">
            <Text style={styles.entryText}>{personal.stack.join(', ')}</Text>
          </Section>
        )}

        {personal.softSkills.length > 0 && (
          <Section title="Soft Skills">
            <Text style={styles.entryText}>
              {personal.softSkills.join(', ')}
            </Text>
          </Section>
        )}
      </Page>
    </Document>
  )
}

export default CvPdf
