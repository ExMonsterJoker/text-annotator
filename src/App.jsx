import React, { useState, useEffect } from 'react';
import AnnotationCanvas from './components/AnnotationCanvas';
import TextEditor from './components/TextEditor';
import SearchBar from './components/SearchBar';
import FileManager from './components/FileManager';
import './App.css';

function App() {
    const [annotations, setAnnotations] = useState([]);
    const [selectedAnnotation, setSelectedAnnotation] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [filteredAnnotations, setFilteredAnnotations] = useState([]);

    useEffect(() => {
        if (searchResults.length > 0) {
            setFilteredAnnotations(searchResults);
        } else {
            setFilteredAnnotations(annotations);
        }
    }, [annotations, searchResults]);

    return (
        <div className="app min-h-screen bg-white text-black font-sans">
            <header className="app-header bg-black text-white p-4 flex flex-col md:flex-row items-center justify-between">
                <h1 className="text-2xl font-bold mb-2 md:mb-0">Text Annotation Tool</h1>
                <SearchBar
                    annotations={annotations}
                    onSearchResults={setSearchResults}
                />
            </header>

            <main className="app-main flex flex-col md:flex-row p-4 gap-6">
                <section className="canvas-section flex-1 border border-gray-300 rounded-md p-2">
                    <AnnotationCanvas
                        annotations={filteredAnnotations}
                        onAnnotationSelect={setSelectedAnnotation}
                        onAnnotationsChange={setAnnotations}
                    />
                </section>

                <section className="editor-section w-full md:w-96 flex flex-col gap-6">
                    <TextEditor
                        annotation={selectedAnnotation}
                        onAnnotationUpdate={setAnnotations}
                    />
                    <FileManager
                        annotations={annotations}
                        onLoad={setAnnotations}
                    />
                </section>
            </main>
        </div>
    );
}

export default App;
