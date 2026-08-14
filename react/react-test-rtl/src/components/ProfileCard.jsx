function ProfileCard({ name, role, email }) {
  return (
    <article>
      <h2>{name}</h2>
      <p>{role}</p>
      <a href={`mailto:${email}`}>{email}</a>
    </article>
  );
}

export default ProfileCard;
