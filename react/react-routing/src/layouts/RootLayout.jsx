import { Link, Outlet } from "react-router";
import "./RootLayout.css";

const RootLayout = () => {
  const user = { name: "Marcos", role: "admin" };

  return (
    <div>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/profile/popeye">Popeye</Link>
        <Link to="/profile/spinach">Spinach</Link>
      </nav>

      <main className="content">
        <Outlet context={user} />
      </main>
    </div>
  );
};

export default RootLayout;
