import { useState, useEffect, useCallback, useRef } from 'react';
import {
    createAnnotation,
    updateAnnotationText,
    updateAnnotationBbox,
    validateAnnotation,
    getAnnotationStats
} from '../utils/annotationUtils';
import { searchAnnotations } from '../utils/searchUtils';

/**
 * Custom hook for managing annotation state and operations
 */
export const useAnnotations = (initialAnnotations = []) => {
    const [annotations, setAnnotations] = useState(initialAnnotations);
    const [selectedAnnotation, setSelectedAnnotation] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const maxHistorySize = 50;
    const saveTimeoutRef = useRef(null);

    // Initialize search results
    useEffect(() => {
        if (searchQuery) {
            const results = searchAnnotations(annotations, searchQuery);
            setSearchResults(results.map(result => result.item));
        } else {
            setSearchResults(annotations);
        }
    }, [annotations, searchQuery]);

    // Save to history
    const saveToHistory = useCallback((newAnnotations) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push([...newAnnotations]);

            if (newHistory.length > maxHistorySize) {
                newHistory.shift();
            }

            return newHistory;
        });
        setHistoryIndex(prev => Math.min(prev + 1, maxHistorySize - 1));
    }, [historyIndex]);

    // Add new annotation
    const addAnnotation = useCallback((text, bbox, metadata = {}) => {
        try {
            const newAnnotation = createAnnotation(text, bbox, metadata);
            const validation = validateAnnotation(newAnnotation);

            if (!validation.isValid) {
                setError(`Invalid annotation: ${validation.errors.join(', ')}`);
                return null;
            }

            setAnnotations(prev => {
                const updated = [...prev, newAnnotation];
                saveToHistory(updated);
                return updated;
            });

            setError(null);
            return newAnnotation;
        } catch (err) {
            setError(`Failed to add annotation: ${err.message}`);
            return null;
        }
    }, [saveToHistory]);

    // Update annotation text
    const updateText = useCallback((annotationId, newText) => {
        try {
            setAnnotations(prev => {
                const updated = prev.map(annotation =>
                    annotation.id === annotationId
                        ? updateAnnotationText(annotation, newText)
                        : annotation
                );
                saveToHistory(updated);
                return updated;
            });

            // Update selected annotation if it's the one being edited
            if (selectedAnnotation?.id === annotationId) {
                setSelectedAnnotation(prev => updateAnnotationText(prev, newText));
            }

            setError(null);
        } catch (err) {
            setError(`Failed to update text: ${err.message}`);
        }
    }, [selectedAnnotation, saveToHistory]);

    // Update annotation bounding box
    const updateBbox = useCallback((annotationId, newBbox) => {
        try {
            setAnnotations(prev => {
                const updated = prev.map(annotation =>
                    annotation.id === annotationId
                        ? updateAnnotationBbox(annotation, newBbox)
                        : annotation
                );
                saveToHistory(updated);
                return updated;
            });

            // Update selected annotation if it's the one being edited
            if (selectedAnnotation?.id === annotationId) {
                setSelectedAnnotation(prev => updateAnnotationBbox(prev, newBbox));
            }

            setError(null);
        } catch (err) {
            setError(`Failed to update bounding box: ${err.message}`);
        }
    }, [selectedAnnotation, saveToHistory]);

    // Delete annotation
    const deleteAnnotation = useCallback((annotationId) => {
        try {
            setAnnotations(prev => {
                const updated = prev.filter(annotation => annotation.id !== annotationId);
                saveToHistory(updated);
                return updated;
            });

            // Clear selection if deleted annotation was selected
            if (selectedAnnotation?.id === annotationId) {
                setSelectedAnnotation(null);
            }

            setError(null);
        } catch (err) {
            setError(`Failed to delete annotation: ${err.message}`);
        }
    }, [selectedAnnotation, saveToHistory]);

    // Bulk operations
    const deleteMultipleAnnotations = useCallback((annotationIds) => {
        try {
            setAnnotations(prev => {
                const updated = prev.filter(annotation => !annotationIds.includes(annotation.id));
                saveToHistory(updated);
                return updated;
            });

            // Clear selection if selected annotation was deleted
            if (selectedAnnotation && annotationIds.includes(selectedAnnotation.id)) {
                setSelectedAnnotation(null);
            }

            setError(null);
        } catch (err) {
            setError(`Failed to delete annotations: ${err.message}`);
        }
    }, [selectedAnnotation, saveToHistory]);

    // Load annotations from file/API
    const loadAnnotations = useCallback(async (source) => {
        setIsLoading(true);
        setError(null);

        try {
            let newAnnotations = [];

            if (typeof source === 'string') {
                // Load from URL
                const response = await fetch(source);
                if (!response.ok) {
                    throw new Error(`Failed to load annotations: ${response.statusText}`);
                }
                newAnnotations = await response.json();
            } else if (source instanceof File) {
                // Load from file
                const text = await source.text();
                newAnnotations = JSON.parse(text);
            } else if (Array.isArray(source)) {
                // Direct array input
                newAnnotations = source;
            } else {
                throw new Error('Invalid source type');
            }

            // Validate all annotations
            const validAnnotations = [];
            const invalidAnnotations = [];

            newAnnotations.forEach(annotation => {
                const validation = validateAnnotation(annotation);
                if (validation.isValid) {
                    validAnnotations.push(annotation);
                } else {
                    invalidAnnotations.push({ annotation, errors: validation.errors });
                }
            });

            setAnnotations(validAnnotations);
            saveToHistory(validAnnotations);

            if (invalidAnnotations.length > 0) {
                console.warn('Some annotations were invalid:', invalidAnnotations);
                setError(`${invalidAnnotations.length} annotations were invalid and skipped`);
            }

        } catch (err) {
            setError(`Failed to load annotations: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [saveToHistory]);

    // Save annotations to file
    const saveAnnotations = useCallback((format = 'json') => {
        try {
            const { exportAnnotations } = require('../utils/annotationUtils');
            const data = exportAnnotations(annotations, format);

            const blob = new Blob([data], {
                type: format === 'json' ? 'application/json' : 'text/csv'
            });

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `annotations.${format}`;
            link.click();

            URL.revokeObjectURL(url);
            setError(null);
        } catch (err) {
            setError(`Failed to save annotations: ${err.message}`);
        }
    }, [annotations]);

    // Undo/Redo functionality
    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setAnnotations(history[newIndex]);
            setHistoryIndex(newIndex);
        }
    }, [history, historyIndex]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setAnnotations(history[newIndex]);
            setHistoryIndex(newIndex);
        }
    }, [history, historyIndex]);

    // Search functionality
    const search = useCallback((query) => {
        setSearchQuery(query);
    }, []);

    const clearSearch = useCallback(() => {
        setSearchQuery('');
    }, []);

    // Selection management
    const selectAnnotation = useCallback((annotation) => {
        setSelectedAnnotation(annotation);
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedAnnotation(null);
    }, []);

    // Get statistics
    const stats = useMemo(() => {
        return getAnnotationStats(annotations);
    }, [annotations]);

    // Auto-save functionality (debounced)
    const enableAutoSave = useCallback((callback, delay = 5000) => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            saveTimeoutRef.current = setTimeout(() => {
                callback(annotations);
            }, delay);
        };
    }, [annotations]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    return {
        // State
        annotations,
        selectedAnnotation,
        searchQuery,
        searchResults,
        isLoading,
        error,
        stats,

        // History
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,

        // Actions
        addAnnotation,
        updateText,
        updateBbox,
        deleteAnnotation,
        deleteMultipleAnnotations,
        loadAnnotations,
        saveAnnotations,

        // History actions
        undo,
        redo,

        // Search actions
        search,
        clearSearch,

        // Selection actions
        selectAnnotation,
        clearSelection,

        // Utilities
        enableAutoSave,
        setError: (error) => setError(error),
        clearError: () => setError(null)
    };
};

export default useAnnotations;
