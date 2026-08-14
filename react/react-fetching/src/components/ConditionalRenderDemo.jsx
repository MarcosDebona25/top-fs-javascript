import { useState } from 'react'

/**
 * DEMO 3 - conditional rendering.
 *
 * JSX is just JavaScript under the hood. `condition && <Component />`
 * is an expression: when the condition is falsy the result is `false`
 * and React renders NOTHING. When it becomes truthy, React calls the
 * component and it renders.
 *
 * In React, a component is not rendered until it is actually called.
 * If JSX has conditional logic, the false branches never render until
 * they become true. That is exactly why the three-state pattern works:
 * only one branch exists in the DOM at any moment.
 */
export default function ConditionalRenderDemo() {
  const [showSecret, setShowSecret] = useState(false)

  return (
    <div className="demo-card">
      <button onClick={() => setShowSecret((prev) => !prev)}>
        {showSecret ? 'Hide the secret' : 'Reveal the secret'}
      </button>

      {/* false && <Component /> evaluates to false -> renders nothing */}
      {showSecret && <SecretMessage />}
    </div>
  )
}

function SecretMessage() {
  return (
    <p className="secret">
      I only exist in the DOM while showSecret is true. Before that, this
      component was never called, so it was never rendered.
    </p>
  )
}
