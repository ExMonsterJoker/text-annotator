import React, { useRef } from 'react';
import { Download, Upload, FileText, AlertCircle } from 'lucide-react';

const FileManager = ({ annotations, onLoad }) => {
    const fileInputRef = useRef();

    const handleImport = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (Array.isArray(data)) {
                        onLoad(data);
                    } else {
                        alert('Invalid file format. Expected an array of annotations.');
                    }
                } catch (error) {
                    alert('Invalid JSON file. Please check the file format.');
                }
            };
            reader.readAsText(file);
        }
        // Reset input value to allow re-importing the same file
        event.target.value = '';
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(annotations, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `annotations-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        URL.revokeObjectURL(url);
    };

    return (
        <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                File Management
            </h3>

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        className="btn-secondary flex items-center justify-center flex-1"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Import JSON
                    </button>

                    <button
                        className="btn-primary flex items-center justify-center flex-1"
                        onClick={handleExport}
                        disabled={annotations.length === 0}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export JSON
                    </button>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                />

                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total Annotations:</span>
                        <span className="font-semibold text-gray-900">{annotations.length}</span>
                    </div>

                    {annotations.length === 0 && (
                        <div className="mt-3 flex items-center text-amber-600 text-sm">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            No annotations to export
                        </div>
                    )}
                </div>

                <div className="text-xs text-gray-500">
                    <p>• Import: Load annotations from a JSON file</p>
                    <p>• Export: Save current annotations as JSON</p>
                </div>
            </div>
        </div>
    );
};

export default FileManager;
