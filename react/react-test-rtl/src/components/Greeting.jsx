function Greeting({ name = "Guest" }) {
  return (
    <section>
      <h1>Welcome, {name}!</h1>
      <p>Thanks for visiting our React Testing Library example.</p>
    </section>
  );
}

export default Greeting;
