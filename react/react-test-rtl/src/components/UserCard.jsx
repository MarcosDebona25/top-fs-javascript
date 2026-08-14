import Avatar from "./Avatar";

function UserCard({ user }) {
  return (
    <article>
      <Avatar name={user.name} />
      <h2>{user.name}</h2>
      <p>{user.role}</p>
      <a href={`mailto:${user.email}`}>{user.email}</a>
    </article>
  );
}

export default UserCard;
