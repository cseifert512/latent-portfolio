import { useState } from 'react';

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');

  function handleChange(e) {
    const q = e.target.value;
    setQuery(q);
    onSearch?.(q);
  }

  return (
    <input
      type="text"
      value={query}
      onChange={handleChange}
      placeholder="Search projects..."
      style={{ padding: '0.5rem', width: '100%', boxSizing: 'border-box' }}
    />
  );
}