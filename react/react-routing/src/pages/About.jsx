import { useOutletContext } from "react-router";

const About = () => {
  const user = useOutletContext();

  return (
    <div>
      <h1>About page</h1>
      <p>
        Data shared by the layout via Outlet context: {user.name} ({user.role})
      </p>
    </div>
  );
};

export default About;
