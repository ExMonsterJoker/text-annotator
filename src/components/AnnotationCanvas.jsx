import React, { useRef, useEffect, useState } from 'react';

const AnnotationCanvas = ({ image, annotations, onAnnotationAdd }) => {
    const canvasRef = useRef(null);
    const [loadedImage, setLoadedImage] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState(null);
    const [currentRect, setCurrentRect] = useState(null);

    /**
     * Helper function to redraw the entire canvas from scratch.
     * It draws the background image and all saved annotations.
     */
    const redrawCanvas = () => {
        const canvas = canvasRef.current;
        // We need to check for loadedImage state here because this function can be called
        // by the annotation effect before the image is set.
        if (!canvas || !loadedImage) return;

        const ctx = canvas.getContext('2d');

        // Clear the canvas and redraw the background image from the stored image object.
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(loadedImage, 0, 0);

        // Draw all the existing annotations.
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        annotations.forEach(annotation => {
            ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
        });
    };

    /**
     * Effect to handle loading a new image.
     * This is now more robust, as it sizes the canvas and performs the initial draw
     * synchronously within the `onload` callback.
     */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // If the image prop is removed or falsy, clear the canvas and state.
        if (!image) {
            setLoadedImage(null);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        const img = new Image();
        img.onload = () => {
            // Once the image is loaded, store the Image object in state for future redraws.
            setLoadedImage(img);

            // Set the canvas's internal resolution to match the image's natural dimensions.
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            // Perform the crucial initial draw of the image onto the canvas.
            ctx.drawImage(img, 0, 0);
        };
        img.onerror = () => {
            // If the image fails to load, clear the state and canvas.
            console.error("Image failed to load from data URL.");
            setLoadedImage(null);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        };

        // Set the src to start loading the image.
        img.src = image;

    }, [image]); // This effect should ONLY run when the `image` prop changes.

    /**
     * Effect to redraw annotations when the list changes.
     * This is now separate from the image loading logic for clarity and efficiency.
     */
    useEffect(() => {
        // This effect handles redrawing annotations when the `annotations` array is updated.
        // It relies on `loadedImage` to ensure it doesn't run before the image is ready.
        redrawCanvas();
    }, [annotations, loadedImage]);

    /**
     * Helper function to get the correct mouse coordinates relative to the canvas,
     * accounting for any CSS scaling of the canvas element.
     */
    const getCanvasCoordinates = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    // --- Mouse Event Handlers for Drawing ---

    const handleMouseDown = (e) => {
        // Start drawing only if an image is loaded.
        if (!loadedImage) return;
        e.preventDefault();
        const coords = getCanvasCoordinates(e);
        setIsDrawing(true);
        setStartPoint(coords);
        setCurrentRect({ x: coords.x, y: coords.y, width: 0, height: 0 });
    };

    const handleMouseMove = (e) => {
        if (!isDrawing || !startPoint) return;
        e.preventDefault();
        const currentCoords = getCanvasCoordinates(e);

        const newRect = {
            x: Math.min(startPoint.x, currentCoords.x),
            y: Math.min(startPoint.y, currentCoords.y),
            width: Math.abs(startPoint.x - currentCoords.x),
            height: Math.abs(startPoint.y - currentCoords.y)
        };
        setCurrentRect(newRect);

        // Efficiently redraw the canvas and the temporary rectangle being drawn.
        redrawCanvas();
        const ctx = canvasRef.current.getContext('2d');
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.strokeRect(newRect.x, newRect.y, newRect.width, newRect.height);
    };

    const handleMouseUp = (e) => {
        if (!isDrawing || !currentRect) return;
        e.preventDefault();
        setIsDrawing(false);

        // Only add the annotation if it has a meaningful size.
        if (currentRect.width > 5 && currentRect.height > 5) {
            const text = prompt('Enter annotation text:');
            if (text !== null && text.trim() !== '') {
                onAnnotationAdd({ ...currentRect, text });
            }
        }

        // Reset drawing state. The useEffect for annotations will handle the final redraw.
        setStartPoint(null);
        setCurrentRect(null);
    };

    const handleMouseLeave = (e) => {
        // If the mouse leaves the canvas while drawing, stop the drawing process.
        if (isDrawing) {
            handleMouseUp(e);
        }
    };

    return (
        <canvas
            ref={canvasRef}
            // Removed h-auto. A canvas with `width`/`height` attributes and CSS `width: 100%`
            // should have its height scaled automatically by the browser to maintain aspect ratio.
            className="border border-gray-400 rounded-md w-full"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
        />
    );
};

export default AnnotationCanvas;
