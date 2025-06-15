import React, { useEffect, useRef } from 'react';
import { Annotorious } from '@recogito/annotorious';
import { bboxPointsToRect } from '../utils/annotationUtils';

const AnnotationCanvas = ({ imageUrl, annotations, onAnnotationSelect, onAnnotationsChange }) => {
    const imageRef = useRef();
    const annoRef = useRef();

    useEffect(() => {
        if (imageRef.current && imageUrl) {
            // Destroy previous instance
            if (annoRef.current) {
                annoRef.current.destroy();
            }

            // Wait for image to load before initializing Annotorious
            const initAnnotorious = () => {
                annoRef.current = new Annotorious({
                    image: imageRef.current,
                    widgets: ['COMMENT', 'TAG'],
                    allowEmpty: true
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

                annoRef.current.on('deleteAnnotation', (annotation) => {
                    onAnnotationsChange(prev => prev.filter(a => a.id !== annotation.id));
                });
            };

            // If image is already loaded, initialize immediately
            if (imageRef.current.complete) {
                initAnnotorious();
            } else {
                // Wait for image to load
                imageRef.current.onload = initAnnotorious;
            }
        }

        return () => {
            if (annoRef.current) {
                annoRef.current.destroy();
            }
        };
    }, [imageUrl, annotations]);

    if (!imageUrl) {
        return (
            <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-gray-500 text-center">
                    <p className="text-lg mb-2">No image uploaded</p>
                    <p className="text-sm">Upload an image to start annotating</p>
                </div>
            </div>
        );
    }

    return (
        <div className="annotation-canvas">
            <img
                ref={imageRef}
                src={imageUrl}
                alt="Document to annotate"
                className="max-w-full h-auto"
            />
        </div>
    );
};

export default AnnotationCanvas;
