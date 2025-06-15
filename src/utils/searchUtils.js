import Fuse from 'fuse.js';

/**
 * Search configuration for Fuse.js
 */
const defaultSearchOptions = {
    keys: [
        {
            name: 'body.0.value',
            weight: 0.7
        },
        {
            name: 'id',
            weight: 0.2
        },
        {
            name: 'creator',
            weight: 0.1
        }
    ],
    threshold: 0.3,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
    shouldSort: true,
    findAllMatches: true
};

/**
 * Create a search index for annotations
 */
export const createSearchIndex = (annotations, options = {}) => {
    const searchOptions = { ...defaultSearchOptions, ...options };
    return new Fuse(annotations, searchOptions);
};

/**
 * Perform fuzzy search on annotations
 */
export const searchAnnotations = (annotations, query, options = {}) => {
    if (!query || !query.trim()) {
        return annotations.map(item => ({ item, score: 0 }));
    }

    const fuse = createSearchIndex(annotations, options);
    return fuse.search(query.trim());
};

/**
 * Advanced search with multiple criteria
 */
export const advancedSearch = (annotations, criteria) => {
    let results = [...annotations];

    // Text search
    if (criteria.text) {
        const searchResults = searchAnnotations(results, criteria.text);
        results = searchResults.map(result => result.item);
    }

    // Date range filter
    if (criteria.dateFrom || criteria.dateTo) {
        results = results.filter(annotation => {
            const created = new Date(annotation.created);
            const from = criteria.dateFrom ? new Date(criteria.dateFrom) : new Date(0);
            const to = criteria.dateTo ? new Date(criteria.dateTo) : new Date();
            return created >= from && created <= to;
        });
    }

    // Creator filter
    if (criteria.creator) {
        results = results.filter(annotation =>
            annotation.creator?.toLowerCase().includes(criteria.creator.toLowerCase())
        );
    }

    // Bounding box area filter
    if (criteria.minArea || criteria.maxArea) {
        results = results.filter(annotation => {
            const bbox = annotation.target?.selector?.value;
            if (!bbox) return false;

            const area = bbox.width * bbox.height;
            const minArea = criteria.minArea || 0;
            const maxArea = criteria.maxArea || Infinity;

            return area >= minArea && area <= maxArea;
        });
    }

    // Text length filter
    if (criteria.minTextLength || criteria.maxTextLength) {
        results = results.filter(annotation => {
            const textLength = annotation.body?.[0]?.value?.length || 0;
            const minLength = criteria.minTextLength || 0;
            const maxLength = criteria.maxTextLength || Infinity;

            return textLength >= minLength && textLength <= maxLength;
        });
    }

    return results;
};

/**
 * Get search suggestions based on existing annotations
 */
export const getSearchSuggestions = (annotations, query, limit = 5) => {
    if (!query || query.length < 2) return [];

    const suggestions = new Set();

    annotations.forEach(annotation => {
        const text = annotation.body?.[0]?.value || '';
        const words = text.toLowerCase().split(/\s+/);

        words.forEach(word => {
            if (word.includes(query.toLowerCase()) && word.length > 2) {
                suggestions.add(word);
            }
        });
    });

    return Array.from(suggestions).slice(0, limit);
};

/**
 * Highlight search matches in text
 */
export const highlightMatches = (text, query) => {
    if (!query || !text) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
};

/**
 * Search within specific annotation fields
 */
export const searchByField = (annotations, field, query) => {
    if (!query) return annotations;

    const searchQuery = query.toLowerCase();

    return annotations.filter(annotation => {
        switch (field) {
            case 'text':
                return annotation.body?.[0]?.value?.toLowerCase().includes(searchQuery);

            case 'id':
                return annotation.id?.toLowerCase().includes(searchQuery);

            case 'creator':
                return annotation.creator?.toLowerCase().includes(searchQuery);

            case 'date':
                return annotation.created?.includes(searchQuery);

            default:
                return false;
        }
    });
};

/**
 * Group search results by criteria
 */
export const groupSearchResults = (results, groupBy) => {
    const groups = {};

    results.forEach(result => {
        const annotation = result.item || result;
        let key;

        switch (groupBy) {
            case 'creator':
                key = annotation.creator || 'Unknown';
                break;

            case 'date':
                key = new Date(annotation.created).toDateString();
                break;

            case 'textLength':
                const length = annotation.body?.[0]?.value?.length || 0;
                key = length < 50 ? 'Short' : length < 200 ? 'Medium' : 'Long';
                break;

            default:
                key = 'All';
        }

        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(annotation);
    });

    return groups;
};
