import React, { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import { Search, X } from 'lucide-react';

const SearchBar = ({ annotations, onSearchResults }) => {
    const [query, setQuery] = useState('');

    const fuse = useMemo(() => {
        const options = {
            keys: [
                'body.value',
                'target.selector.value'
            ],
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

    const clearSearch = () => {
        setQuery('');
        onSearchResults([]);
    };

    return (
        <div className="search-bar relative">
            <div className="relative flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search annotations..."
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 pr-10 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                {query && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-3 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default SearchBar;
