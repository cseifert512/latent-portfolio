import { useState } from 'react';
import Canvas from './components/Canvas';
import FilterPanel from './components/FilterPanel';
import SearchBar from './components/SearchBar';

function App() {
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  function handleTagClick(tag) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: 280, flex: '0 0 280px', padding: '1rem', boxSizing: 'border-box' }}>
        <SearchBar onSearch={setSearchQuery} />
        <div style={{ height: 12 }} />
        <FilterPanel onTagClick={handleTagClick} selectedTags={selectedTags} />
      </div>
      <div style={{ flex: 1 }}>
        <Canvas selectedTags={selectedTags} searchQuery={searchQuery} />
      </div>
    </div>
  );
}

export default App;
