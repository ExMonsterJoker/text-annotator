import React, { useEffect, useRef } from 'react';
import { Annotorious } from '@recogito/annotorious';
import { bboxPointsToRect } from '../utils/annotationUtils';

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

            // Convert bbox points array to rect format for Annotorious before loading
            const convertedAnnotations = annotations.map(annotation => {
                if (annotation.target?.selector?.value && Array.isArray(annotation.target.selector.value)) {
                    return {
                        ...annotation,
                        target: {
                            ...annotation.target,
                            selector: {
                                ...annotation.target.selector,
                                value: bboxPointsToRect(annotation.target.selector.value)
                            }
                        }
                    };
                }
                return annotation;
            });

            annoRef.current.loadAnnotations(convertedAnnotations);

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
    }, [annotations]);

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
