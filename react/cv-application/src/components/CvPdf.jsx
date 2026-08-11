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
    color: '#1f2937',
    lineHeight: 1.4,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 1,
    paddingBottom: 10,
  },
  contactLine: {
    color: '#6b7280',
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
    borderBottom: '1 solid #e5e7eb',
    color: '#2563eb',
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
    color: '#6b7280',
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
    <Svg viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE}>
      <Path
        fill="#374151"
        d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
      />
    </Svg>
  )
}

function LinkedInIcon() {
  return (
    <Svg viewBox="0 0 24 24" width={ICON_SIZE} height={ICON_SIZE}>
      <Path
        fill="#374151"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
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
