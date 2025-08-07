import { useState, useEffect } from 'react';

export default function FilterPanel({ onTagClick, selectedTags }) {
  const [tags, setTags] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/tags')
      .then(r => r.json())
      .then(setTags)
      .catch(err => console.error('Failed to load tags', err));
  }, []);

  return (
    <div style={{ padding: '1rem', maxHeight: '100vh', overflowY: 'auto', width: 280, flex: '0 0 280px' }}>
      <h3 style={{ marginTop: 0 }}>Tags</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {tags.map(({ tag, count }) => {
          const size = Math.min(Math.log(count + 1) * 8 + 12, 28);
          const active = selectedTags.includes(tag);
          return (
            <span
              key={tag}
              onClick={() => onTagClick(tag)}
              style={{
                cursor: 'pointer',
                fontSize: `${size}px`,
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                background: active ? '#333' : '#eee',
                color: active ? '#fff' : '#000'
              }}
              title={`${tag} (${count})`}
            >
              {tag}
            </span>
          );
        })}
      </div>
    </div>
  );
}