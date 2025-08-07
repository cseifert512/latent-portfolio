import { useState, useEffect, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { IconLayer } from '@deck.gl/layers';
import { OrthographicView, COORDINATE_SYSTEM } from '@deck.gl/core';
import Fuse from 'fuse.js';

export default function Canvas({ selectedTags = [], searchQuery = '' }) {
  const [points, setPoints] = useState([]);
  const [metadata, setMetadata] = useState([]);
  const [hoverInfo, setHoverInfo] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:8000/embeddings').then(r => r.json()),
      fetch('http://localhost:8000/images').then(r => r.json())
    ])
      .then(([embeds, metas]) => {
        setPoints(embeds);
        setMetadata(metas);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }, []);

  const bounds = useMemo(() => {
    if (!points.length) return null;
    let minX = points[0].x, maxX = points[0].x, minY = points[0].y, maxY = points[0].y;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const dx = Math.max(1, maxX - minX);
    const dy = Math.max(1, maxY - minY);
    return { centerX, centerY, dx, dy };
  }, [points]);

  const icons = useMemo(() => {
    if (!points.length || !metadata.length) return [];
    const embedMap = Object.fromEntries(points.map(d => [d.id, d]));
    return metadata
      .filter(m => embedMap[m.id])
      .map(m => ({
        id: m.id,
        coordinates: [embedMap[m.id].x, embedMap[m.id].y, 0],
        url: `http://localhost:8000/thumbnails/${m.id}.png`,
        tags: m.tags || [],
        title: m.title || m.id
      }));
  }, [points, metadata]);

  const iconsTagFiltered = useMemo(() => {
    if (!icons.length) return [];
    if (!selectedTags || selectedTags.length === 0) return icons;
    const tagSet = new Set(selectedTags);
    return icons.filter(icon => icon.tags?.some(t => tagSet.has(t)));
  }, [icons, selectedTags]);

  const finalIcons = useMemo(() => {
    const base = iconsTagFiltered;
    const q = searchQuery?.trim();
    if (!q) return base;
    const fuse = new Fuse(base, {
      includeScore: false,
      threshold: 0.35,
      ignoreLocation: true,
      keys: ['title', 'tags']
    });
    return fuse.search(q).map(r => r.item);
  }, [iconsTagFiltered, searchQuery]);

  const layers = [
    new IconLayer({
      id: 'thumbnails',
      data: finalIcons,
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      pickable: true,
      getPosition: d => d.coordinates,
      getIcon: d => ({
        url: d.url,
        width: 128,
        height: 128,
        anchorY: 128
      }),
      sizeUnits: 'pixels',
      sizeScale: 1,
      getSize: d => 64,
      onHover: info => setHoverInfo(info)
    })
  ];

  const initialViewState = useMemo(() => {
    if (!bounds) {
      return { target: [0, 0, 0], zoom: 0 };
    }
    return { target: [bounds.centerX, bounds.centerY, 0], zoom: 6 };
  }, [bounds]);

  const hoveredTitle = hoverInfo?.object
    ? (metadata.find(m => m.id === hoverInfo.object.id)?.title || hoverInfo.object.id)
    : null;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }} id="deck-canvas">
      <DeckGL
        views={new OrthographicView()}
        initialViewState={initialViewState}
        controller={true}
        layers={layers}
        width="100%"
        height="100%"
        style={{ position: 'absolute', inset: 0 }}
      />

      <div style={{ position: 'absolute', left: 8, bottom: 8, padding: '6px 8px', background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: 4, fontSize: 12 }}>
        total: {icons.length} • tag-filtered: {iconsTagFiltered.length} • search-filtered: {finalIcons.length}
      </div>

      {hoverInfo && hoveredTitle && (
        <div
          style={{
            position: 'absolute',
            left: hoverInfo.x,
            top: hoverInfo.y,
            transform: 'translate(8px, 8px)',
            background: 'white',
            color: '#111',
            padding: '6px 8px',
            borderRadius: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            pointerEvents: 'none',
            maxWidth: 320,
            fontSize: 12
          }}
        >
          {hoveredTitle}
        </div>
      )}
    </div>
  );
} 