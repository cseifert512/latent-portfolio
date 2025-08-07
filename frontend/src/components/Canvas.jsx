import { useState, useEffect } from 'react';

export default function Canvas() {
  const [points, setPoints] = useState([]);
  const [metadata, setMetadata] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:8000/embeddings').then(r => r.json()),
      fetch('http://localhost:8000/images').then(r => r.json())
    ]).then(([embeds, metas]) => {
      setPoints(embeds);
      setMetadata(metas);
    });
  }, []);
  
  return (
    <div style={{ width: '100%', height: '100vh' }} id="deck-canvas"></div>
  );
} 