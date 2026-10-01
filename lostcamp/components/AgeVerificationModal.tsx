import React, { useState } from 'react';
import { LostCampLogo } from './LostCampLogo';

interface AgeVerificationModalProps {
  onConfirm: () => void;
}

export const AgeVerificationModal: React.FC<AgeVerificationModalProps> = ({ onConfirm }) => {
  const [underageDenied, setUnderageDenied] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 select-none">
      
      {/* Outer Tactical Frame Box */}
      <div className="relative w-full max-w-xl bg-black border border-[#1b2b1e] rounded-sm p-8 sm:p-12 shadow-2xl text-center space-y-8">
        
        {/* Tactical Corner Brackets (Green Frame Accents) */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#2f4a35]" />
        <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#2f4a35]" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#2f4a35]" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#2f4a35]" />

        {underageDenied ? (
          /* Underage denied notice view */
          <div className="py-8 space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-red-500 uppercase tracking-wide">
              Доступ ограничен
            </h2>
            <p className="text-sm text-neutral-300 max-w-md mx-auto leading-relaxed">
              Согласно законодательству РФ и правилам сайта, использование сервиса разрешено только лицам, достигшим 18 лет.
            </p>
            <button
              onClick={() => setUnderageDenied(false)}
              className="mt-4 px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold uppercase tracking-wider rounded-xs cursor-pointer transition-colors"
            >
              ← Вернуться к выбору
            </button>
          </div>
        ) : (
          /* Main 18+ Verification View */
          <>
            {/* White LOST CAMP Logo */}
            <div className="flex justify-center pt-2">
              <LostCampLogo variant="white" className="h-16 sm:h-20 w-auto" />
            </div>

            {/* Tactical Striped Line Accent */}
            <div className="w-full flex items-center justify-center gap-2 overflow-hidden py-2">
              <div className="w-full h-[2px] bg-repeating-linear-gradient-stripe border-t border-dashed border-[#2f4a35]" />
            </div>

            {/* Prompt Text */}
            <div className="space-y-1">
              <p className="text-sm sm:text-base text-neutral-300 font-normal tracking-wide lowercase">
                для доступа к сайту подтвердите, что вам
              </p>
              <p className="text-sm sm:text-base text-neutral-300 font-normal tracking-wide lowercase">
                исполнилось 18 лет
              </p>
            </div>

            {/* Action Buttons Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <button
                onClick={onConfirm}
                className="w-full py-4 bg-[#2f4a35] hover:bg-[#253b2a] text-white text-xs sm:text-sm font-semibold tracking-wide transition-colors cursor-pointer rounded-xs"
              >
                да, мне есть 18+
              </button>

              <button
                onClick={() => setUnderageDenied(true)}
                className="w-full py-4 bg-[#1f1f1f] hover:bg-[#282828] text-neutral-300 text-xs sm:text-sm font-semibold tracking-wide transition-colors cursor-pointer rounded-xs"
              >
                нет, выйти
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
