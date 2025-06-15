import React, { useState, useEffect } from 'react';
import { rectToBboxPoints, bboxPointsToRect } from '../utils/annotationUtils';

const TextEditor = ({ annotation, onAnnotationUpdate }) => {
    const [text, setText] = useState('');
    const [bboxPoints, setBboxPoints] = useState([[0, 0], [0, 0], [0, 0], [0, 0]]);

    useEffect(() => {
        if (annotation) {
            setText(annotation.body?.[0]?.value || '');
            // Convert internal bbox rect to points array for editing
            const rect = annotation.target?.selector?.value || { x: 0, y: 0, width: 0, height: 0 };
            setBboxPoints(rectToBboxPoints(rect));
        }
    }, [annotation]);

    const handlePointChange = (index, coordIndex, value) => {
        const newPoints = bboxPoints.map((point, i) => {
            if (i === index) {
                const newPoint = [...point];
                newPoint[coordIndex] = Number(value);
                return newPoint;
            }
            return point;
        });
        setBboxPoints(newPoints);
    };

    const handleSave = () => {
        if (annotation) {
            // Convert points array back to rect bbox
            const bbox = bboxPointsToRect(bboxPoints);

            const updatedAnnotation = {
                ...annotation,
                body: [{ type: 'TextualBody', value: text }],
                target: {
                    ...annotation.target,
                    selector: { type: 'FragmentSelector', value: bbox }
                }
            };

            onAnnotationUpdate(prev =>
                prev.map(a => a.id === annotation.id ? updatedAnnotation : a)
            );
        }
    };

    return (
        <div className="text-editor p-4 border border-gray-300 rounded-md bg-white text-black max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4">Edit Annotation</h3>

            <div className="form-group mb-4">
                <label className="block mb-1 font-medium">Text Content:</label>
                <textarea
                    className="w-full p-2 border border-gray-300 rounded resize-none"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={4}
                    placeholder="Enter annotation text..."
                />
            </div>

            <div className="bbox-editor mb-4">
                <h4 className="font-semibold mb-2">Bounding Box Coordinates (Points)</h4>
                <div className="bbox-inputs grid grid-cols-2 gap-2">
                    {bboxPoints.map((point, index) => (
                        <div key={index} className="flex space-x-2 items-center">
                            <label className="w-6">P{index + 1}:</label>
                            <input
                                type="number"
                                className="w-20 p-1 border border-gray-300 rounded"
                                placeholder="X"
                                value={point[0]}
                                onChange={(e) => handlePointChange(index, 0, e.target.value)}
                            />
                            <input
                                type="number"
                                className="w-20 p-1 border border-gray-300 rounded"
                                placeholder="Y"
                                value={point[1]}
                                onChange={(e) => handlePointChange(index, 1, e.target.value)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <button
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition"
                onClick={handleSave}
                disabled={!annotation}
            >
                Save Changes
            </button>
        </div>
    );
};

export default TextEditor;
