'use client';

import { useState, useRef } from 'react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  className?: string;
}

export default function BeforeAfterSlider({ beforeImage, afterImage, className 
= '' }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  return (
      <div 
        ref={containerRef}
        className={`relative w-full h-96 md:h-[500px] overflow-hidden rounded-lg 
  shadow-2xl cursor-col-resize select-none ${className}`}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => setIsDragging(false)}
      >
        {/* After Image (Background) */}
        <img
          src={afterImage}
          alt="After watermark removal"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Before Image (Clipped) */}
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img
            src={beforeImage}
            alt="Before watermark removal"
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>

{/* Slider Line */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg 
  cursor-col-resize z-10"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
        >
          {/* Slider Handle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 
  -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg border-2 
  border-primary-600 flex items-center justify-center">
            <div className="w-1 h-4 bg-primary-600 rounded"></div>
            <div className="w-1 h-4 bg-primary-600 rounded ml-1"></div>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white 
  px-3 py-1 rounded-lg text-sm font-medium">
          Before
        </div>
        <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white 
  px-3 py-1 rounded-lg text-sm font-medium">
          After
        </div>
      </div>
  );
}
