import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

const ImageUploader = ({ onImageUpload }) => {
    const fileInputRef = useRef();

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                onImageUpload(e.target.result);
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please select a valid image file');
        }
    };

    return (
        <div className="image-uploader">
            <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
                <Upload className="w-4 h-4" />
                <span>Upload Image</span>
            </button>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />
        </div>
    );
};

export default ImageUploader;
