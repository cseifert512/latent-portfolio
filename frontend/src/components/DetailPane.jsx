import React from 'react';

export default function DetailPane({ project, onClose, onTagClick, selectedTags = [] }) {
  if (!project) return null;
  return (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        width: '300px',
        height: '100vh',
        background: 'white',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.2)',
        overflowY: 'auto',
        padding: '1rem',
        zIndex: 10
      }}
    >
      <button onClick={onClose} style={{ float: 'right' }}>✕</button>
      <h2 style={{ marginTop: 0 }}>{project.title}</h2>
      <img
        src={`http://localhost:8000${project.url}`}
        alt={project.title}
        style={{ width: '100%', marginBottom: '0.5rem' }}
      />
      <p><strong>Date:</strong> {project.date || 'Unknown'}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
        {(project.tags || []).map(tag => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => onTagClick?.(tag)}
              style={{
                cursor: 'pointer',
                padding: '0.3rem 0.6rem',
                borderRadius: '999px',
                border: isSelected ? '1px solid #111' : '1px solid #bbb',
                background: isSelected ? '#111' : '#fff',
                color: isSelected ? '#fff' : '#111',
                fontSize: '0.8rem'
              }}
              title={isSelected ? 'Click to remove this tag filter' : 'Click to filter by this tag'}
            >
              {tag}
            </button>
          );
        })}
      </div>
      {project.description ? (
        <p style={{ marginTop: '1rem' }}>{project.description}</p>
      ) : null}
    </div>
  );
}