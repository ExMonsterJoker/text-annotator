// Annotation utilities for handling annotation data and transformations

/**
 * Generate a unique ID for annotations
 */
export const generateAnnotationId = () => {
    return `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create a new annotation object
 */
export const createAnnotation = (text, bbox, metadata = {}) => {
    return {
        id: generateAnnotationId(),
        type: 'Annotation',
        body: [
            {
                type: 'TextualBody',
                value: text,
                purpose: 'commenting'
            }
        ],
        target: {
            source: metadata.imageUrl || '',
            selector: {
                type: 'FragmentSelector',
                conformsTo: 'http://www.w3.org/TR/media-frags/',
                value: bbox
            }
        },
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        creator: metadata.creator || 'anonymous',
        ...metadata
    };
};

/**
 * Update annotation text
 */
export const updateAnnotationText = (annotation, newText) => {
    return {
        ...annotation,
        body: [
            {
                ...annotation.body[0],
                value: newText
            }
        ],
        modified: new Date().toISOString()
    };
};

/**
 * Update annotation bounding box
 */
export const updateAnnotationBbox = (annotation, newBbox) => {
    return {
        ...annotation,
        target: {
            ...annotation.target,
            selector: {
                ...annotation.target.selector,
                value: newBbox
            }
        },
        modified: new Date().toISOString()
    };
};

/**
 * Convert annotation to training data format
 */
export const annotationToTrainingData = (annotation) => {
    const bbox = annotation.target?.selector?.value || {};
    const text = annotation.body?.[0]?.value || '';

    return {
        id: annotation.id,
        text: text,
        bbox: {
            x: bbox.x || 0,
            y: bbox.y || 0,
            width: bbox.width || 0,
            height: bbox.height || 0
        },
        label: annotation.label || 'text',
        confidence: annotation.confidence || 1.0,
        created: annotation.created,
        modified: annotation.modified
    };
};

/**
 * Validate annotation data
 */
export const validateAnnotation = (annotation) => {
    const errors = [];

    if (!annotation.id) {
        errors.push('Annotation must have an ID');
    }

    if (!annotation.body || !annotation.body[0]?.value) {
        errors.push('Annotation must have text content');
    }

    if (!annotation.target?.selector?.value) {
        errors.push('Annotation must have bounding box coordinates');
    }

    const bbox = annotation.target?.selector?.value;
    if (bbox) {
        if (typeof bbox.x !== 'number' || typeof bbox.y !== 'number') {
            errors.push('Bounding box must have valid x,y coordinates');
        }
        if (typeof bbox.width !== 'number' || typeof bbox.height !== 'number') {
            errors.push('Bounding box must have valid width,height');
        }
        if (bbox.width <= 0 || bbox.height <= 0) {
            errors.push('Bounding box must have positive width and height');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Filter annotations by text content
 */
export const filterAnnotationsByText = (annotations, searchTerm) => {
    if (!searchTerm) return annotations;

    const term = searchTerm.toLowerCase();
    return annotations.filter(annotation => {
        const text = annotation.body?.[0]?.value?.toLowerCase() || '';
        return text.includes(term);
    });
};

/**
 * Sort annotations by creation date
 */
export const sortAnnotationsByDate = (annotations, ascending = true) => {
    return [...annotations].sort((a, b) => {
        const dateA = new Date(a.created);
        const dateB = new Date(b.created);
        return ascending ? dateA - dateB : dateB - dateA;
    });
};

/**
 * Get annotation statistics
 */
export const getAnnotationStats = (annotations) => {
    return {
        total: annotations.length,
        withText: annotations.filter(a => a.body?.[0]?.value?.trim()).length,
        withBbox: annotations.filter(a => a.target?.selector?.value).length,
        avgTextLength: annotations.reduce((sum, a) => {
            return sum + (a.body?.[0]?.value?.length || 0);
        }, 0) / annotations.length || 0,
        createdToday: annotations.filter(a => {
            const created = new Date(a.created);
            const today = new Date();
            return created.toDateString() === today.toDateString();
        }).length
    };
};

/**
 * Export annotations to different formats
 */
export const exportAnnotations = (annotations, format = 'json') => {
    switch (format) {
        case 'json':
            return JSON.stringify(annotations, null, 2);

        case 'csv':
            const headers = ['id', 'text', 'x', 'y', 'width', 'height', 'created'];
            const rows = annotations.map(annotation => {
                const bbox = annotation.target?.selector?.value || {};
                return [
                    annotation.id,
                    `"${annotation.body?.[0]?.value || ''}"`,
                    bbox.x || 0,
                    bbox.y || 0,
                    bbox.width || 0,
                    bbox.height || 0,
                    annotation.created
                ].join(',');
            });
            return [headers.join(','), ...rows].join('\n');

        case 'training':
            return JSON.stringify(
                annotations.map(annotationToTrainingData),
                null,
                2
            );

        default:
            throw new Error(`Unsupported export format: ${format}`);
    }
};
