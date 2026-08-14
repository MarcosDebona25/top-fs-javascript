import { useState } from "react";

function SearchBox({ onSearch }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const data = await onSearch(query);
      setResult(data);
    } catch {
      setResult("Something went wrong");
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="search">Search</label>
        <input
          id="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="submit">Search</button>
      </form>
      {result && <p role="status">{result}</p>}
    </div>
  );
}

export default SearchBox;
