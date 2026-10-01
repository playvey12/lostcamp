import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, RotateCcw, Target, Move } from 'lucide-react';

interface ImageFocalAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  initialFocalPoint?: { x: number; y: number; zoom?: number };
  onSave: (focalPoint: { x: number; y: number; zoom?: number }) => void;
  /** width / height, e.g. 4/3 for catalog product cards, 16/9 for news covers */
  aspectRatio?: number;
  aspectLabel?: string;
}

export const ImageFocalAdjustModal: React.FC<ImageFocalAdjustModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  initialFocalPoint,
  onSave,
  aspectRatio = 4 / 3,
  aspectLabel,
}) => {
  const [x, setX] = useState<number>(initialFocalPoint?.x ?? 50);
  const [y, setY] = useState<number>(initialFocalPoint?.y ?? 50);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setX(initialFocalPoint?.x ?? 50);
      setY(initialFocalPoint?.y ?? 50);
      setIsDragging(false);
    }
  }, [isOpen, initialFocalPoint]);

  // The canvas IS the real crop (object-cover, same aspect-ratio as the live card),
  // so a click position maps 1:1 onto the same objectPosition value used on the site —
  // what you see here is exactly what you get everywhere the photo is shown at this ratio.
  const handlePointerUpdate = useCallback((clientX: number, clientY: number) => {
    const targetEl = containerRef.current;
    if (!targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    let newX = ((clientX - rect.left) / rect.width) * 100;
    let newY = ((clientY - rect.top) / rect.height) * 100;

    newX = Math.max(0, Math.min(100, Math.round(newX)));
    newY = Math.max(0, Math.min(100, Math.round(newY)));

    setX(newX);
    setY(newY);
  }, []);

  // Native non-passive touchmove listener to prevent page scrolling while dragging focal crosshair
  useEffect(() => {
    if (!isOpen) return;
    const containerEl = containerRef.current;
    if (!containerEl) return;

    const handleNativeTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault(); // Prevent modal scrolling on touch drag
        const touch = e.touches[0];
        handlePointerUpdate(touch.clientX, touch.clientY);
      }
    };

    containerEl.addEventListener('touchmove', handleNativeTouchMove, { passive: false });
    return () => {
      containerEl.removeEventListener('touchmove', handleNativeTouchMove);
    };
  }, [isOpen, handlePointerUpdate]);

  // Global listeners while dragging to maintain smooth control even outside the canvas boundaries
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalUp = () => setIsDragging(false);

    const handleGlobalMouseMove = (e: MouseEvent) => {
      handlePointerUpdate(e.clientX, e.clientY);
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handlePointerUpdate(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchend', handleGlobalUp);
    window.addEventListener('touchcancel', handleGlobalUp);
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });

    return () => {
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchend', handleGlobalUp);
      window.removeEventListener('touchcancel', handleGlobalUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
    };
  }, [isDragging, handlePointerUpdate]);

  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handlePointerUpdate(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    if (e.touches.length > 0) {
      handlePointerUpdate(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleReset = () => {
    setX(50);
    setY(50);
  };

  const handleSave = () => {
    onSave({ x, y });
    onClose();
  };

  const ratioLabel =
    aspectLabel ||
    (Math.abs(aspectRatio - 4 / 3) < 0.01
      ? '4:3'
      : Math.abs(aspectRatio - 16 / 9) < 0.01
      ? '16:9'
      : aspectRatio.toFixed(2));

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-5 sm:p-7 max-w-4xl w-full shadow-2xl space-y-6 my-auto max-h-[95vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[#2e4733] text-emerald-400 rounded-lg">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-mono text-white">
                Настройка фокуса обложки
              </h3>
              <p className="text-xs text-neutral-400 font-mono">
                Перетащите фото — область ниже это точный кадр {ratioLabel}, как на сайте
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Work Area Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-mono">
          
          {/* Left: Interactive WYSIWYG Canvas (7 cols) — this IS the real crop, not a stand-in */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between text-xs text-neutral-300">
              <span className="font-bold flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-emerald-400" />
                Кликните или перетащите — это точная обрезка карточки
              </span>
              <span className="text-emerald-400 font-bold bg-neutral-950 px-2.5 py-1 rounded border border-neutral-800 text-[11px]">
                X: {x}% | Y: {y}%
              </span>
            </div>

            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              style={{ aspectRatio: `${aspectRatio}` }}
              className="relative w-full bg-neutral-950 rounded-xl border-2 border-dashed border-emerald-600/50 overflow-hidden cursor-crosshair select-none touch-none"
            >
              <img
                src={imageUrl}
                alt="Настройка фокуса"
                draggable={false}
                className="w-full h-full object-cover pointer-events-none block"
                style={{ objectPosition: `${x}% ${y}%` }}
                referrerPolicy="no-referrer"
              />

              {/* Grid overlay for guidance */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20 border border-white/20">
                <div className="border-r border-b border-white/30"></div>
                <div className="border-r border-b border-white/30"></div>
                <div className="border-b border-white/30"></div>
                <div className="border-r border-b border-white/30"></div>
                <div className="border-r border-b border-white/30"></div>
                <div className="border-b border-white/30"></div>
                <div className="border-r border-white/30"></div>
                <div className="border-r border-white/30"></div>
                <div></div>
              </div>

              {/* Focal Target Crosshair Indicator */}
              <div
                className="absolute w-8 h-8 -ml-4 -mt-4 pointer-events-none flex items-center justify-center transition-all duration-75"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                {/* Pulse circle */}
                <div className="absolute inset-0 bg-emerald-500/40 rounded-full animate-ping opacity-75"></div>
                {/* Target ring */}
                <div className="relative w-7 h-7 rounded-full border-2 border-emerald-400 bg-emerald-950/80 shadow-lg flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                </div>
                {/* Crosshair lines */}
                <div className="absolute top-1/2 -left-3 right-full h-0.5 bg-emerald-400/80"></div>
                <div className="absolute top-1/2 -right-3 left-full h-0.5 bg-emerald-400/80"></div>
                <div className="absolute left-1/2 -top-3 bottom-full w-0.5 bg-emerald-400/80"></div>
                <div className="absolute left-1/2 -bottom-3 top-full w-0.5 bg-emerald-400/80"></div>
              </div>
            </div>
            <p className="text-[11px] text-neutral-500">
              Если фото сильно вытянуто в одну сторону, ползунок другой оси может визуально
              почти не менять картинку — это нормально: значит по этой оси фото и так
              целиком помещается в кадр без обрезки.
            </p>

            {/* Quick Presets */}
            <div className="pt-1">
              <span className="text-[11px] text-neutral-400 block mb-1.5 font-bold">Быстрые точки:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Центр', px: 50, py: 50 },
                  { label: 'Верх', px: 50, py: 20 },
                  { label: 'Низ', px: 50, py: 80 },
                  { label: 'Слева', px: 20, py: 50 },
                  { label: 'Справа', px: 80, py: 50 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setX(preset.px);
                      setY(preset.py);
                    }}
                    className={`px-2.5 py-1 text-[11px] rounded border cursor-pointer transition-colors ${
                      x === preset.px && y === preset.py
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-600 font-bold'
                        : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Full reference photo & Range Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-5">

            {/* Full uncropped reference photo, just for orientation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-300">
                <span className="font-bold flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  Исходное фото целиком
                </span>
              </div>
              <div className="bg-neutral-950 rounded-xl p-3 border border-neutral-800 select-none">
                <div className="relative w-full aspect-square bg-neutral-900 rounded-lg overflow-hidden border border-neutral-800 flex items-center justify-center">
                  <img
                    src={imageUrl}
                    alt="Исходное фото"
                    className="max-w-full max-h-full object-contain opacity-80"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <p className="text-[11px] text-neutral-400 text-center mt-2">
                  Только для ориентира — редактируйте слева, там реальный кадр сайта
                </p>
              </div>
            </div>

            {/* Range Sliders */}
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-3 text-xs">
              
              {/* X slider */}
              <div>
                <div className="flex justify-between text-neutral-300 mb-1">
                  <span>Горизонтальный фокус (X):</span>
                  <span className="font-bold text-emerald-400">{x}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={x}
                  onChange={(e) => setX(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Y slider */}
              <div>
                <div className="flex justify-between text-neutral-300 mb-1">
                  <span>Вертикальный фокус (Y):</span>
                  <span className="font-bold text-emerald-400">{y}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={y}
                  onChange={(e) => setY(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

            </div>

          </div>

        </div>

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-neutral-800 font-mono text-xs">
          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Сбросить по умолчанию</span>
          </button>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-bold transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-[#2e4733] hover:bg-[#233827] text-white rounded-lg font-bold transition-colors shadow-lg flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Сохранить настройки</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
