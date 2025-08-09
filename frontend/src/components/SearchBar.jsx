import { useEffect, useState } from 'react';

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');

  function handleChange(e) {
    setQuery(e.target.value);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      onSearch?.(query);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      onSearch?.(query);
    }, 1000); // 1s debounce
    return () => clearTimeout(t);
  }, [query, onSearch]);

  return (
    <input
      type="text"
      value={query}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder="Search projects..."
      style={{ padding: '0.5rem', width: '100%', boxSizing: 'border-box' }}
    />
  );
}