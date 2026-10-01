import React from 'react';

export function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#f7f7f4] text-[#243126] flex items-center justify-center px-6">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2e4733] text-white shadow-lg">
          <span className="text-2xl font-semibold">LC</span>
        </div>

        <p className="mb-3 text-xs font-bold tracking-[0.28em] text-[#2e4733]/60 uppercase">
          LOST CAMP
        </p>

        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
          Сайт в разработке
        </h1>

        <p className="mx-auto mt-5 max-w-md text-sm md:text-base leading-7 text-neutral-500">
          Мы сейчас обновляем сайт и готовим его к запуску.
          Пожалуйста, зайдите немного позже.
        </p>

        <div className="mx-auto mt-8 h-px w-20 bg-[#2e4733]/20" />

        <p className="mt-6 text-xs text-neutral-400">
          LOST CAMP
        </p>
      </div>
    </div>
  );
}
