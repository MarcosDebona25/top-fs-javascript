import { useState } from 'react';
import './App.css';

const COLORS = ['pink', 'green', 'blue', 'yellow', 'purple'];

function App() {
  const [backgroundColor, setBackgroundColor] = useState(COLORS[0]);
  const [count, setCount] = useState(0);

  const onButtonClick = (color) => () => {
    setBackgroundColor(color);
    setCount(count + 1);
  };

  return (
    <>
      <div
        className="App"
        style={{
          backgroundColor,
        }}
      >
        {COLORS.map((color) => (
          <button
            type="button"
            key={color}
            onClick={onButtonClick(color)}
            className={backgroundColor === color ? 'selected' : ''}
          >
            {color}
          </button>
        ))}
        <b>{count}</b>
      </div>
    </>
  );
}

export default App;
