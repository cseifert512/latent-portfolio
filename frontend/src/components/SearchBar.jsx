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
    <div
      style={{
        position: 'fixed',
        left: 16,
        top: 16,
        zIndex: 1000
      }}
    >
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Search projects..."
        style={{
          width: 360,
          maxWidth: 420,
          minWidth: 240,
          padding: '12px 14px',
          boxSizing: 'border-box',
          background: '#ededed',
          color: '#111',
          border: '1px solid #bbb',
          borderRadius: 999,
          outline: 'none',
          fontSize: 16,
          fontFamily: 'Space Grotesk, sans-serif',
        }}
      />
    </div>
  );
}