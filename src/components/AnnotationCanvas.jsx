// src/components/AnnotationCanvas.jsx
import React, { useEffect, useRef } from 'react';
import { Annotorious } from '@recogito/annotorious';

const AnnotationCanvas = ({ annotations, onAnnotationSelect, onAnnotationsChange }) => {
    const imageRef = useRef();
    const annoRef = useRef();

    useEffect(() => {
        if (imageRef.current) {
            // Initialize Annotorious
            annoRef.current = new Annotorious({
                image: imageRef.current,
                widgets: ['COMMENT', 'TAG']
            });

            // Handle annotation events
            annoRef.current.on('createAnnotation', (annotation) => {
                onAnnotationsChange(prev => [...prev, annotation]);
            });

            annoRef.current.on('selectAnnotation', (annotation) => {
                onAnnotationSelect(annotation);
            });

            annoRef.current.on('updateAnnotation', (annotation, previous) => {
                onAnnotationsChange(prev =>
                    prev.map(a => a.id === annotation.id ? annotation : a)
                );
            });
        }

        return () => {
            if (annoRef.current) {
                annoRef.current.destroy();
            }
        };
    }, []);

    return (
        <div className="annotation-canvas">
            <img
                ref={imageRef}
                src="/api/placeholder/800/600"
                alt="Document to annotate"
                style={{ maxWidth: '100%', height: 'auto' }}
            />
        </div>
    );
};

export default AnnotationCanvas;
