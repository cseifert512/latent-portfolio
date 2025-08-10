import { useMemo, useState } from 'react';
import './ui.css';
import ThreeViewer from './components/ThreeViewer.tsx';
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
    <div style={{ height: '100vh', position: 'relative' }}>
      <ThreeViewer
        onSelectProject={handleSelectProject}
        onReady={() => { /* noop */ }}
        selectedTags={selectedTags}
      />

      <div className="overlay-panel">
        <div className="overlay-content">
          <SearchBar onSearch={setSearchQuery} />
          <div style={{ height: 12 }} />
          <FilterPanel onTagClick={handleTagClick} selectedTags={selectedTags} />
        </div>
      </div>

      <DetailPane
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onTagClick={handleTagClick}
        selectedTags={selectedTags}
      />
    </div>
  );
}

export default App;
