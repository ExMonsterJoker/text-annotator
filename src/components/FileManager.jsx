import React, { useRef } from 'react';

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
        <div className="file-manager p-4 border border-gray-300 rounded-md bg-white text-black max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4">File Management</h3>

            <div className="file-actions flex space-x-4 mb-4">
                <button
                    className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition"
                    onClick={() => fileInputRef.current?.click()}
                >
                    Import JSON
                </button>

                <button
                    className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition disabled:opacity-50"
                    onClick={handleExport}
                    disabled={annotations.length === 0}
                >
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

            <div className="stats text-sm text-gray-700">
                <p>Total Annotations: {annotations.length}</p>
            </div>
        </div>
    );
};

export default FileManager;
