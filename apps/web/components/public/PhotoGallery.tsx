'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

/** یک عکس گالری (هماهنگ با photos.json). */
export interface Photo {
  src: string;
  title: string;
  description?: string;
}

/**
 * گالری عکس با Lightbox (بخش ۹.۱۰.۳) — Client Component.
 * کلیک روی هر عکس → نمایش بزرگ در Overlay.
 */
export function PhotoGallery({ photos }: { photos: Photo[] }): React.ReactElement {
  const [active, setActive] = useState<Photo | null>(null);

  if (photos.length === 0) {
    return <p className="py-16 text-center text-slate-400">فعلاً عکسی بارگذاری نشده است.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo) => (
          <button
            key={photo.src}
            type="button"
            onClick={() => setActive(photo)}
            className="group relative overflow-hidden rounded-lg shadow-card focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.src}
              alt={photo.title}
              className="h-48 w-full object-cover transition group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-right">
              <span className="text-sm font-medium text-white">{photo.title}</span>
            </div>
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-modal flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setActive(null)}
            className="absolute top-4 left-4 text-white/80 hover:text-white"
            aria-label="بستن"
          >
            <X className="w-8 h-8" />
          </button>
          <div className="max-w-4xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.src}
              alt={active.title}
              className="max-h-[80vh] w-auto rounded-lg object-contain"
            />
            <div className="mt-3 text-center text-white">
              <div className="font-bold">{active.title}</div>
              {active.description && (
                <p className="text-sm text-slate-300 mt-1">{active.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
