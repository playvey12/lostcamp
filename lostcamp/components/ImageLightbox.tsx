import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ImageLightboxProps {
  images: string[];
  activeIndex: number;
  onIndexChange: (index: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  images,
  activeIndex,
  onIndexChange,
  isOpen,
  onClose,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const pinchDistRef = useRef<number | null>(null);
  const initialPinchScaleRef = useRef(1);
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });

  // Reset zoom & pan when image changes or when modal opens/closes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [activeIndex, isOpen]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handlePrev = useCallback(() => {
    if (images.length === 0) return;
    onIndexChange(activeIndex === 0 ? images.length - 1 : activeIndex - 1);
  }, [activeIndex, images.length, onIndexChange]);

  const handleNext = useCallback(() => {
    if (images.length === 0) return;
    onIndexChange(activeIndex === images.length - 1 ? 0 : activeIndex + 1);
  }, [activeIndex, images.length, onIndexChange]);

  // Keyboard navigation & Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handlePrev, handleNext, onClose]);

  // Scroll wheel zoom handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isOpen) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      setScale((prevScale) => {
        const newScale = Math.min(Math.max(prevScale * zoomFactor, 1), 4);
        if (newScale === 1) {
          setPosition({ x: 0, y: 0 });
        }
        return newScale;
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [isOpen]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[activeIndex] || images[0];

  // Double click to zoom toggle
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2.5);
    }
  };

  // Drag / Pan logic
  const handlePointerDown = (e: React.PointerEvent) => {
    if (scale > 1) {
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: position.x,
        posY: position.y,
      };
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging && scale > 1) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPosition({
        x: dragStartRef.current.posX + dx,
        y: dragStartRef.current.posY + dy,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch (_) {}
    }
  };

  // Touch handlers for Pinch and Swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      pinchDistRef.current = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      initialPinchScaleRef.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchDistRef.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const zoomRatio = currentDist / pinchDistRef.current;
      const newScale = Math.min(Math.max(initialPinchScaleRef.current * zoomRatio, 1), 4);
      setScale(newScale);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (pinchDistRef.current !== null && e.touches.length < 2) {
      pinchDistRef.current = null;
    }

    if (scale === 1 && touchStartRef.current.time > 0 && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const dt = Date.now() - touchStartRef.current.time;

      touchStartRef.current.time = 0;

      if (dt < 400 && Math.abs(dx) > 40 && Math.abs(dy) < 80) {
        if (dx < 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }
  };

  // Click on background backdrop outside photo
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev * 1.3, 4));
  };

  const zoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev / 1.3, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/92 backdrop-blur-md flex flex-col justify-between select-none overflow-hidden"
      onClick={handleBackdropClick}
    >
      {/* Top Controls Bar */}
      <div className="w-full flex items-center justify-between p-4 text-white/90 z-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-auto">
        <div className="text-sm font-mono tracking-wider bg-white/10 px-3 py-1 rounded-full border border-white/10">
          {activeIndex + 1} / {images.length}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={zoomIn}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            title="Увеличить"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={zoomOut}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            title="Уменьшить"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          {scale > 1 && (
            <button
              onClick={resetZoom}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              title="Сбросить зум"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/15 hover:bg-red-600/80 text-white transition-all cursor-pointer ml-2"
            title="Закрыть (Esc)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Image Area */}
      <div
        ref={containerRef}
        className="flex-1 relative flex items-center justify-center overflow-hidden touch-none"
        onClick={handleBackdropClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Arrow Left */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer z-30"
            title="Предыдущее фото (←)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Navigation Arrow Right */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer z-30"
            title="Следующее фото (→)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Image wrapper */}
        <div
          className="max-w-full max-h-full flex items-center justify-center p-4 transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
          }}
          onDoubleClick={handleDoubleClick}
        >
          <img
            src={currentImage}
            alt={`Full size view ${activeIndex + 1}`}
            className="max-w-[90vw] max-h-[80vh] object-contain select-none drop-shadow-2xl rounded-md"
            draggable={false}
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=800&q=80';
            }}
          />
        </div>
      </div>

      {/* Bottom Thumbnail Strip */}
      {images.length > 1 && (
        <div className="w-full flex items-center justify-center gap-2 p-4 overflow-x-auto bg-gradient-to-t from-black/80 to-transparent z-20">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange(idx);
              }}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                activeIndex === idx
                  ? 'border-white scale-110 shadow-lg'
                  : 'border-transparent opacity-50 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
