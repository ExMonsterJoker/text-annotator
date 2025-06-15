// src/components/FileManager.jsx
import React, { useRef } from 'react';
import { Upload, Download } from 'lucide-react';

const FileManager = ({ annotations, onLoad }) => {
    const fileInputRef = useRef();

    const handleImport = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    onLoad(data);
                } catch (error) {
                    alert('Invalid JSON file');
                }
            };
            reader.readAsText(file);
        }
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(annotations, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'annotations.json';
        link.click();

        URL.revokeObjectURL(url);
    };

    return (
        <div className="file-manager">
            <h3>File Management</h3>

            <div className="file-actions">
                <button onClick={() => fileInputRef.current?.click()}>
                    <Upload size={16} />
                    Import JSON
                </button>

                <button onClick={handleExport} disabled={annotations.length === 0}>
                    <Download size={16} />
                    Export JSON
                </button>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
            />

            <div className="stats">
                <p>Total Annotations: {annotations.length}</p>
            </div>
        </div>
    );
};

export default FileManager;
