import React, { useState, useEffect } from 'react';
import AnnotationCanvas from './components/AnnotationCanvas';
import TextEditor from './components/TextEditor';
import SearchBar from './components/SearchBar';
import FileManager from './components/FileManager';
import ImageUploader from './components/ImageUploader';
import { FileText, Image as ImageIcon } from 'lucide-react';
import './App.css';

function App() {
    const [annotations, setAnnotations] = useState([]);
    const [selectedAnnotation, setSelectedAnnotation] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [filteredAnnotations, setFilteredAnnotations] = useState([]);
    const [currentImage, setCurrentImage] = useState(null);

    useEffect(() => {
        if (searchResults.length > 0) {
            setFilteredAnnotations(searchResults);
        } else {
            setFilteredAnnotations(annotations);
        }
    }, [annotations, searchResults]);

    const handleImageUpload = (imageUrl) => {
        setCurrentImage(imageUrl);
        setAnnotations([]); // Clear annotations when new image is uploaded
        setSelectedAnnotation(null);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Text Annotator</h1>
                                <p className="text-sm text-gray-500">Annotate and analyze documents</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <SearchBar
                                annotations={annotations}
                                onSearchResults={setSearchResults}
                            />
                            <div className="text-sm text-gray-500">
                                {annotations.length} annotations
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Canvas Area */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <ImageIcon className="w-5 h-5 mr-2" />
                                    Document Canvas
                                </h2>
                                <ImageUploader onImageUpload={handleImageUpload} />
                            </div>

                            <AnnotationCanvas
                                imageUrl={currentImage}
                                annotations={filteredAnnotations}
                                onAnnotationSelect={setSelectedAnnotation}
                                onAnnotationsChange={setAnnotations}
                            />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <TextEditor
                            annotation={selectedAnnotation}
                            onAnnotationUpdate={setAnnotations}
                        />
                        <FileManager
                            annotations={annotations}
                            onLoad={setAnnotations}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;
