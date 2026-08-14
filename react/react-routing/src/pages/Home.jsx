import { Link, useNavigate } from "react-router";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h1>Hello from the main page of the app!</h1>
      <p>Here are some examples of links to other pages</p>

      <Link to="/profile/popeye">Go to Popeye (Link)</Link>

      <button type="button" onClick={() => navigate("/profile/spinach")}>
        Go to Spinach (useNavigate)
      </button>
    </div>
  );
};

export default Home;
