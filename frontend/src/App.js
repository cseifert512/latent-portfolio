import { useMemo, useState } from 'react';
import Canvas from './components/Canvas';
import FilterPanel from './components/FilterPanel';
import SearchBar from './components/SearchBar';
import DetailPane from './components/DetailPane';

function App() {
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [allMetadata, setAllMetadata] = useState([]);

  function handleTagClick(tag) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }

  const handleMetadataLoaded = (metas) => setAllMetadata(metas);
  const handleSelectProject = (id) => {
    const proj = allMetadata.find(m => m.id === id) || null;
    setSelectedProject(proj);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', position: 'relative' }}>
      <div style={{ width: 280, flex: '0 0 280px', padding: '1rem', boxSizing: 'border-box' }}>
        <SearchBar onSearch={setSearchQuery} />
        <div style={{ height: 12 }} />
        <FilterPanel onTagClick={handleTagClick} selectedTags={selectedTags} />
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas
          selectedTags={selectedTags}
          searchQuery={searchQuery}
          onSelectProject={handleSelectProject}
          onMetadataLoaded={handleMetadataLoaded}
        />
        <DetailPane project={selectedProject} onClose={() => setSelectedProject(null)} />
      </div>
    </div>
  );
}

export default App;
