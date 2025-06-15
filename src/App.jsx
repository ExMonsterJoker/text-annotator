import React, { useState, useEffect, useCallback, useRef } from 'react';

// --- UTILITY HOOKS ---
const useAnnotations = (initialAnnotations = []) => {
    const [annotations, setAnnotations] = useState(initialAnnotations);

    const addAnnotation = (newAnnotation) => {
        setAnnotations(prev => [...prev, { ...newAnnotation, id: Date.now() }]);
    };

    const updateAnnotation = (id, updatedAnnotation) => {
        setAnnotations(prev =>
            prev.map(ann => (ann.id === id ? { ...ann, ...updatedAnnotation } : ann))
        );
    };

    const deleteAnnotation = (id) => {
        setAnnotations(prev => prev.filter(ann => ann.id !== id));
    };

    const clearAnnotations = () => {
        setAnnotations([]);
    };

    const setAllAnnotations = (newAnnotations) => {
        if (Array.isArray(newAnnotations)) {
            setAnnotations(newAnnotations);
        } else {
            console.error("Failed to set annotations: data is not an array.");
        }
    };

    return { annotations, addAnnotation, updateAnnotation, deleteAnnotation, clearAnnotations, setAllAnnotations };
};

const useSearch = (items) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredItems = React.useMemo(() => {
        if (!searchTerm) return items;
        return items.filter(item =>
            item.text && item.text.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [items, searchTerm]);

    return { filteredItems, setSearchTerm };
};


// --- CHILD COMPONENTS ---
const ImageUploader = ({ onImageUpload }) => {
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                onImageUpload(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="border-2 border-dashed border-gray-400 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors">
            <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-800">
                Click to select an image
            </label>
            <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            <p className="text-sm text-gray-500 mt-2">Or drag and drop a file here</p>
        </div>
    );
};

const AnnotationCanvas = ({ image, annotations, onAnnotationAdd, focusedAnnotation, onResetView }) => {
    const canvasRef = useRef(null);
    const [loadedImage, setLoadedImage] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState(null);
    const [currentRect, setCurrentRect] = useState(null);
    const [transform, setTransform] = useState({ scale: 1, panX: 0, panY: 0 });
    const [highlight, setHighlight] = useState(null);

    const resetView = useCallback(() => {
        setTransform({ scale: 1, panX: 0, panY: 0 });
        if (onResetView) onResetView();
    }, [onResetView]);

    useEffect(() => {
        if (focusedAnnotation && loadedImage && canvasRef.current) {
            const canvas = canvasRef.current;
            const { x, y, width, height } = focusedAnnotation;

            const padding = 100; // Pixels of padding around the annotation
            const maxZoom = 4; // Maximum zoom level

            const scaleX = canvas.width / (width + padding * 2);
            const scaleY = canvas.height / (height + padding * 2);
            const newScale = Math.min(scaleX, scaleY, maxZoom);

            const newPanX = canvas.width / 2 - (x + width / 2) * newScale;
            const newPanY = canvas.height / 2 - (y + height / 2) * newScale;

            setTransform({ scale: newScale, panX: newPanX, panY: newPanY });

            setHighlight(focusedAnnotation);
            const timer = setTimeout(() => {
                setHighlight(null);
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, [focusedAnnotation, loadedImage]);

    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !loadedImage) return;
        const ctx = canvas.getContext('2d');

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.translate(transform.panX, transform.panY);
        ctx.scale(transform.scale, transform.scale);

        ctx.drawImage(loadedImage, 0, 0);

        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2 / transform.scale;
        annotations.forEach(annotation => {
            ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
        });

        if (highlight) {
            ctx.strokeStyle = 'rgba(52, 152, 219, 0.9)';
            ctx.lineWidth = 4 / transform.scale;
            ctx.strokeRect(highlight.x, highlight.y, highlight.width, highlight.height);
        }

        ctx.restore();
    }, [annotations, loadedImage, transform, highlight]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !image) return;

        const img = new Image();
        img.onload = () => {
            // Set the backing image object
            setLoadedImage(img);
            // Set the canvas resolution to match the image
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            // Perform the crucial first draw immediately after resizing
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            // Reset the view state (zoom/pan)
            resetView();
        };
        img.onerror = () => console.error("Image failed to load.");
        img.src = image;
    }, [image, resetView]);

    useEffect(() => {
        redrawCanvas();
    }, [redrawCanvas]);

    const getCanvasCoordinates = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        const worldX = (canvasX - transform.panX) / transform.scale;
        const worldY = (canvasY - transform.panY) / transform.scale;
        return { x: worldX, y: worldY };
    };

    const handleMouseDown = (e) => {
        if (!loadedImage) return;
        const coords = getCanvasCoordinates(e);
        setIsDrawing(true);
        setStartPoint(coords);
        setCurrentRect({ x: coords.x, y: coords.y, width: 0, height: 0 });
    };

    const handleMouseMove = (e) => {
        if (!isDrawing || !startPoint) return;
        const currentCoords = getCanvasCoordinates(e);
        const newRect = {
            x: Math.min(startPoint.x, currentCoords.x),
            y: Math.min(startPoint.y, currentCoords.y),
            width: Math.abs(startPoint.x - currentCoords.x),
            height: Math.abs(startPoint.y - currentCoords.y)
        };
        setCurrentRect(newRect);
    };

    const handleMouseUp = () => {
        if (!isDrawing || !currentRect) return;
        setIsDrawing(false);
        if (currentRect.width > 5 && currentRect.height > 5) {
            const text = prompt('Enter annotation text:');
            if (text) {
                onAnnotationAdd({ ...currentRect, text });
            }
        }
        setStartPoint(null);
        setCurrentRect(null);
    };

    useEffect(() => {
        if(isDrawing) {
            redrawCanvas();
            const canvas = canvasRef.current;
            if (canvas && currentRect) {
                const ctx = canvas.getContext('2d');
                ctx.save();
                ctx.translate(transform.panX, transform.panY);
                ctx.scale(transform.scale, transform.scale);
                ctx.strokeStyle = 'blue';
                ctx.lineWidth = 2 / transform.scale;
                ctx.strokeRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
                ctx.restore();
            }
        }
    }, [currentRect, isDrawing, redrawCanvas, transform]);


    return (
        <>
            <button onClick={resetView} className="absolute top-2 right-2 z-10 bg-white text-gray-700 px-3 py-1 rounded-md shadow hover:bg-gray-100 text-sm">
                Reset View
            </button>
            <canvas ref={canvasRef} className="border border-gray-400 rounded-md w-full h-full" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} />
        </>
    );
};


// --- MAIN APP COMPONENT ---
function App() {
    const [image, setImage] = useState(null);
    const { annotations, addAnnotation, clearAnnotations, setAllAnnotations } = useAnnotations([]);
    const { filteredItems, setSearchTerm } = useSearch(annotations);
    const [focusedAnnotationId, setFocusedAnnotationId] = useState(null);

    const handleImageUpload = (imageData) => {
        setImage(imageData);
        clearAnnotations();
        setFocusedAnnotationId(null);
    };

    const handleAnnotationsLoad = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'application/json') {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const loadedAnnotations = JSON.parse(e.target.result);
                    setAllAnnotations(loadedAnnotations);
                } catch (error) {
                    console.error("Error parsing JSON file:", error);
                    alert("Failed to read or parse the JSON file. Please check that it is a valid JSON array.");
                }
            };
            reader.readAsText(file);
        }
    };

    const handleAnnotationsDownload = () => {
        if (annotations.length === 0) {
            alert("There are no annotations to download.");
            return;
        }
        const jsonString = JSON.stringify(annotations, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'annotations.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleSearch = (term) => {
        setSearchTerm(term);
    };

    const focusedAnnotation = React.useMemo(() => {
        return annotations.find(ann => ann.id === focusedAnnotationId);
    }, [focusedAnnotationId, annotations]);

    return (
        <div className="flex flex-col h-screen bg-gray-100 font-sans">
            <header className="bg-white shadow-md p-4 z-10">
                <h1 className="text-2xl font-bold text-gray-800">Image Annotator</h1>
            </header>
            <div className="flex flex-grow overflow-hidden">
                <aside className="w-1/3 md:w-1/4 bg-white p-4 overflow-y-auto shadow-lg space-y-6">
                    <ImageUploader onImageUpload={handleImageUpload} />

                    <div>
                        <h3 className="font-semibold text-gray-700 border-b pb-2 mb-3">Manage Annotations</h3>
                        <div className="space-y-2">
                            <label htmlFor="json-upload" className="cursor-pointer text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded-md transition-colors w-full block text-center">
                                Load Annotations (JSON)
                            </label>
                            <input id="json-upload" type="file" className="hidden" accept=".json,application/json" onChange={handleAnnotationsLoad} />

                            <button onClick={handleAnnotationsDownload} className="text-sm font-medium text-white bg-green-600 hover:bg-green-700 py-2 px-4 rounded-md transition-colors w-full block text-center">
                                Download Annotations (JSON)
                            </button>
                        </div>
                    </div>

                    {image && (
                        <div>
                            <h3 className="font-semibold text-gray-700 border-b pb-2 mb-2">Image Preview</h3>
                            <img src={image} alt="Upload Preview" className="w-full h-auto mt-2 rounded-md border-2 border-gray-200" />
                        </div>
                    )}

                    <div>
                        <h3 className="font-semibold text-gray-700 border-b pb-2 mb-2">Annotations List</h3>
                        {filteredItems.length === 0 ? <p className="text-sm text-gray-500">No annotations found.</p> :
                            <ul className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                                {filteredItems.map(ann => (
                                    <li
                                        key={ann.id}
                                        className={`text-sm p-2 rounded break-words cursor-pointer hover:bg-blue-100 ${focusedAnnotationId === ann.id ? 'bg-blue-200' : 'bg-gray-50'}`}
                                        onClick={() => setFocusedAnnotationId(ann.id)}
                                    >
                                        {ann.text}
                                    </li>
                                ))}
                            </ul>
                        }
                    </div>
                </aside>

                <main className="w-2/3 md:w-3/4 flex flex-col p-4">
                    <div className="w-full mb-4">
                        <input type="text" placeholder="Search annotations..." onChange={(e) => handleSearch(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg"/>
                    </div>
                    <div className={`flex-grow relative bg-gray-200 rounded-lg border ${!image ? 'flex items-center justify-center' : ''}`}>
                        {!image ? (
                            <p className="text-lg text-gray-500">Please upload an image to begin annotating.</p>
                        ) : (
                            <AnnotationCanvas
                                image={image}
                                annotations={annotations}
                                onAnnotationAdd={addAnnotation}
                                focusedAnnotation={focusedAnnotation}
                                onResetView={() => setFocusedAnnotationId(null)}
                            />
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default App;
