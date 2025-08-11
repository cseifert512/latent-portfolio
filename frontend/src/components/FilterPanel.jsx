import { useState, useEffect } from 'react';

export default function FilterPanel({ onTagClick, selectedTags }) {
  const [tags, setTags] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch('http://localhost:8000/tags')
      .then(r => r.json())
      .then(setTags)
      .catch(err => console.error('Failed to load tags', err));
  }, []);

  return (
    <div style={{ position: 'fixed', left: 16, top: 64, zIndex: 999 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          background: '#ededed',
          border: '1px solid #bbb',
          borderRadius: 999,
          padding: '10px 14px',
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 16,
          color: '#111',
          cursor: 'pointer'
        }}
        title="Show all tags"
      >
        Tags ▾
      </button>
      {open && (
        <div
          style={{
            marginTop: 8,
            width: 360,
            maxHeight: '60vh',
            overflowY: 'auto',
            background: 'rgba(255,255,255,0.95)',
            border: '1px solid #bbb',
            borderRadius: 10,
            padding: 12,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {tags.map(({ tag, count }) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => onTagClick(tag)}
                  style={{
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: 999,
                    border: active ? '1px solid #111' : '1px solid #bbb',
                    background: active ? '#111' : '#fff',
                    color: active ? '#fff' : '#111',
                    fontSize: 12,
                    lineHeight: 1.2,
                    fontFamily: 'Space Grotesk, sans-serif'
                  }}
                  title={`${tag} (${count})`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}