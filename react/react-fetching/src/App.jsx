import UserList, { BrokenList } from './components/UserList'
import UserListWithHook from './components/UserListWithHook'
import ConditionalRenderDemo from './components/ConditionalRenderDemo'

/**
 * Main page that ties all the demos together.
 *
 * - Demo 1: fetch inside useEffect + three states (UserList)
 * - Demo 1b: the error state with a broken URL (BrokenList)
 * - Demo 2: the same request through a custom hook
 * - Demo 3: conditional rendering with false branches
 */
export default function App() {
  return (
    <main className="app">
      <h1>React Fetching</h1>
      <p className="subtitle">Study project: data, loading and error states.</p>

      <section>
        <h2>1. fetch inside useEffect (request on mount)</h2>
        <UserList />
      </section>

      <section>
        <h2>1b. Same component, broken URL (error state)</h2>
        <BrokenList />
      </section>

      <section>
        <h2>2. Same request with a custom hook</h2>
        <UserListWithHook />
      </section>

      <section>
        <h2>3. Conditional rendering</h2>
        <ConditionalRenderDemo />
      </section>
    </main>
  )
}
