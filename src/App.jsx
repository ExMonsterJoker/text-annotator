// src/App.jsx
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

    return (
        <div className="app">
            <header className="app-header">
                <h1>Text Annotation Tool</h1>
                <SearchBar
                    annotations={annotations}
                    onSearchResults={setSearchResults}
                />
            </header>

            <main className="app-main">
                <div className="canvas-section">
                    <AnnotationCanvas
                        annotations={annotations}
                        onAnnotationSelect={setSelectedAnnotation}
                        onAnnotationsChange={setAnnotations}
                    />
                </div>

                <div className="editor-section">
                    <TextEditor
                        annotation={selectedAnnotation}
                        onAnnotationUpdate={setAnnotations}
                    />
                    <FileManager
                        annotations={annotations}
                        onLoad={setAnnotations}
                    />
                </div>
            </main>
        </div>
    );
}

export default App;
