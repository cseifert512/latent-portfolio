import React from 'react';

export default function DetailPane({ project, onClose }) {
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
      <div>
        {(project.tags || []).map(tag => (
          <span
            key={tag}
            style={{
              display: 'inline-block',
              margin: '0.25rem',
              padding: '0.25rem 0.5rem',
              background: '#eee',
              borderRadius: '4px',
              fontSize: '0.8rem'
            }}
          >
            {tag}
          </span>
        ))}
      </div>
      {project.description ? (
        <p style={{ marginTop: '1rem' }}>{project.description}</p>
      ) : null}
    </div>
  );
}