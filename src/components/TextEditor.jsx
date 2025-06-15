// src/components/TextEditor.jsx
import React, { useState, useEffect } from 'react';

const TextEditor = ({ annotation, onAnnotationUpdate }) => {
    const [text, setText] = useState('');
    const [bbox, setBbox] = useState({ x: 0, y: 0, width: 0, height: 0 });

    useEffect(() => {
        if (annotation) {
            setText(annotation.body?.[0]?.value || '');
            setBbox(annotation.target?.selector?.value || { x: 0, y: 0, width: 0, height: 0 });
        }
    }, [annotation]);

    const handleSave = () => {
        if (annotation) {
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
        <div className="text-editor">
            <h3>Edit Annotation</h3>

            <div className="form-group">
                <label>Text Content:</label>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={4}
                    placeholder="Enter annotation text..."
                />
            </div>

            <div className="bbox-editor">
                <h4>Bounding Box Coordinates</h4>
                <div className="bbox-inputs">
                    <input
                        type="number"
                        placeholder="X"
                        value={bbox.x}
                        onChange={(e) => setBbox(prev => ({ ...prev, x: Number(e.target.value) }))}
                    />
                    <input
                        type="number"
                        placeholder="Y"
                        value={bbox.y}
                        onChange={(e) => setBbox(prev => ({ ...prev, y: Number(e.target.value) }))}
                    />
                    <input
                        type="number"
                        placeholder="Width"
                        value={bbox.width}
                        onChange={(e) => setBbox(prev => ({ ...prev, width: Number(e.target.value) }))}
                    />
                    <input
                        type="number"
                        placeholder="Height"
                        value={bbox.height}
                        onChange={(e) => setBbox(prev => ({ ...prev, height: Number(e.target.value) }))}
                    />
                </div>
            </div>

            <button onClick={handleSave} disabled={!annotation}>
                Save Changes
            </button>
        </div>
    );
};

export default TextEditor;
