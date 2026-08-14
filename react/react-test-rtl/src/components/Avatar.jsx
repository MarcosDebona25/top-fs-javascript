function Avatar({ name }) {
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div className="avatar" aria-label={`${name} avatar`}>
      {initials}
    </div>
  );
}

export default Avatar;
