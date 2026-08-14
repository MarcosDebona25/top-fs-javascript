import Counter from "./components/Counter";
import Greeting from "./components/Greeting";
import LoginForm from "./components/LoginForm";
import ProfileCard from "./components/ProfileCard";

function App() {
  return (
    <main>
      <h1>React Testing Library - Examples</h1>
      <Greeting name="Marcos" />
      <Counter initialCount={0} />
      <LoginForm onLogin={() => {}} />
      <ProfileCard name="Marcos Debona" role="Developer" email="marcos@example.com" />
    </main>
  );
}

export default App;
