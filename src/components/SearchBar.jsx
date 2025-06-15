// src/components/SearchBar.jsx
import React, { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import { Search } from 'lucide-react';

const SearchBar = ({ annotations, onSearchResults }) => {
    const [query, setQuery] = useState('');

    const fuse = useMemo(() => {
        const options = {
            keys: ['body.value', 'target.selector.value'],
            threshold: 0.3,
            includeScore: true
        };
        return new Fuse(annotations, options);
    }, [annotations]);

    const handleSearch = (searchQuery) => {
        setQuery(searchQuery);

        if (searchQuery.trim()) {
            const results = fuse.search(searchQuery);
            onSearchResults(results.map(result => result.item));
        } else {
            onSearchResults([]);
        }
    };

    return (
        <div className="search-bar">
            <div className="search-input">
                <Search size={20} />
                <input
                    type="text"
                    placeholder="Search annotations..."
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                />
            </div>
        </div>
    );
};

export default SearchBar;
