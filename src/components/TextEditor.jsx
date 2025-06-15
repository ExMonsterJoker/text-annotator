import React, { useState, useEffect } from 'react';
import { rectToBboxPoints, bboxPointsToRect } from '../utils/annotationUtils';
import { Edit3, Save, Trash2, X } from 'lucide-react';

const TextEditor = ({ annotation, onAnnotationUpdate }) => {
    const [text, setText] = useState('');
    const [bboxPoints, setBboxPoints] = useState([[0, 0], [0, 0], [0, 0], [0, 0]]);
    const [tags, setTags] = useState([]);
    const [newTag, setNewTag] = useState('');

    useEffect(() => {
        if (annotation) {
            setText(annotation.body?.[0]?.value || '');
            const rect = annotation.target?.selector?.value || { x: 0, y: 0, width: 0, height: 0 };
            setBboxPoints(rectToBboxPoints(rect));

            // Extract tags from annotation body
            const annotationTags = annotation.body?.filter(b => b.purpose === 'tagging').map(b => b.value) || [];
            setTags(annotationTags);
        } else {
            setText('');
            setBboxPoints([[0, 0], [0, 0], [0, 0], [0, 0]]);
            setTags([]);
        }
    }, [annotation]);

    const handlePointChange = (index, coordIndex, value) => {
        const newPoints = bboxPoints.map((point, i) => {
            if (i === index) {
                const newPoint = [...point];
                newPoint[coordIndex] = Number(value) || 0;
                return newPoint;
            }
            return point;
        });
        setBboxPoints(newPoints);
    };

    const handleAddTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags([...tags, newTag.trim()]);
            setNewTag('');
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleSave = () => {
        if (annotation) {
            const bbox = bboxPointsToRect(bboxPoints);

            // Create body array with text and tags
            const body = [
                { type: 'TextualBody', value: text, purpose: 'commenting' },
                ...tags.map(tag => ({ type: 'TextualBody', value: tag, purpose: 'tagging' }))
            ];

            const updatedAnnotation = {
                ...annotation,
                body,
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

    const handleDelete = () => {
        if (annotation && window.confirm('Are you sure you want to delete this annotation?')) {
            onAnnotationUpdate(prev => prev.filter(a => a.id !== annotation.id));
        }
    };

    if (!annotation) {
        return (
            <div className="card p-6">
                <div className="text-center text-gray-500">
                    <Edit3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">No Annotation Selected</h3>
                    <p className="text-sm">Select an annotation on the canvas to edit it</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Edit3 className="w-5 h-5 mr-2" />
                    Edit Annotation
                </h3>
                <button
                    onClick={handleDelete}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete annotation"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-6">
                {/* Text Content */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Text Content
                    </label>
                    <textarea
                        className="input-field resize-none"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={4}
                        placeholder="Enter annotation text..."
                    />
                </div>

                {/* Tags */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {tags.map((tag, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                            >
                                {tag}
                                <button
                                    onClick={() => handleRemoveTag(tag)}
                                    className="ml-2 text-primary-600 hover:text-primary-800"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="input-field flex-1"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                            placeholder="Add a tag..."
                        />
                        <button
                            onClick={handleAddTag}
                            className="btn-secondary"
                            disabled={!newTag.trim()}
                        >
                            Add
                        </button>
                    </div>
                </div>

                {/* Bounding Box Coordinates */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Bounding Box Coordinates
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {bboxPoints.map((point, index) => (
                            <div key={index} className="space-y-2">
                                <label className="text-xs font-medium text-gray-600">
                                    Point {index + 1}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        className="input-field text-sm"
                                        placeholder="X"
                                        value={point[0]}
                                        onChange={(e) => handlePointChange(index, 0, e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        className="input-field text-sm"
                                        placeholder="Y"
                                        value={point[1]}
                                        onChange={(e) => handlePointChange(index, 1, e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    className="btn-primary w-full flex items-center justify-center"
                >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                </button>
            </div>
        </div>
    );
};

export default TextEditor;
