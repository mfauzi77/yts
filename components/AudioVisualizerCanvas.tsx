import React, { useRef, useEffect } from 'react';

interface AudioVisualizerCanvasProps {
    isPlaying: boolean;
}

export const AudioVisualizerCanvas: React.FC<AudioVisualizerCanvasProps> = ({ isPlaying }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // Fix: Provide an initial value to useRef as it is required when a generic type is specified.
    const animationFrameId = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let parent = canvas.parentElement;
        if (!parent) return;

        let width = parent.offsetWidth;
        let height = parent.offsetHeight;
        canvas.width = width;
        canvas.height = height;

        const numBars = 32;
        const barWidth = width / numBars;
        let time = 0;

        const draw = () => {
            time += 0.02;
            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < numBars; i++) {
                const sinValue = Math.sin(time + i * 0.2) + Math.sin(time * 0.5 + i * 0.1);
                const barHeight = (sinValue / 2) * height * 0.4 + height * 0.5;
                const dynamicHeight = isPlaying ? barHeight : 2;

                const gradient = ctx.createLinearGradient(0, height, 0, 0);
                gradient.addColorStop(0, '#FF0000'); // brand-red
                gradient.addColorStop(0.5, '#ff4d4d');
                gradient.addColorStop(1, '#ff8080');

                ctx.fillStyle = gradient;
                ctx.fillRect(i * barWidth, height - dynamicHeight, barWidth - 2, dynamicHeight);
            }

            animationFrameId.current = requestAnimationFrame(draw);
        };

        draw();

        const handleResize = () => {
             if (!parent) return;
             width = parent.offsetWidth;
             height = parent.offsetHeight;
             canvas.width = width;
             canvas.height = height;
        };

        window.addEventListener('resize', handleResize);

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            window.removeEventListener('resize', handleResize);
        };
    }, [isPlaying]);

    return <canvas ref={canvasRef} className="w-full h-full" />;
};
