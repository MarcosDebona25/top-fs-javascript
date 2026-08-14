import { useState } from "react";

function Counter({ initialCount = 0 }) {
  const [count, setCount] = useState(initialCount);

  return (
    <section>
      <h2>
        Count: <span>{count}</span>
      </h2>
      <button type="button" aria-label="decrement" onClick={() => setCount((c) => c - 1)}>
        -
      </button>
      <button type="button" aria-label="increment" onClick={() => setCount((c) => c + 1)}>
        +
      </button>
      <button type="button" onClick={() => setCount(initialCount)}>
        Reset
      </button>
    </section>
  );
}

export default Counter;
