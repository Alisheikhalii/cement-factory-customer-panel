import type { Metadata } from 'next';
import { Video as VideoIcon } from 'lucide-react';
import { getVideos } from '../../../../lib/media';

/** گالری فیلم — `/media/videos` (بخش ۹.۱۰.۳). Embed آپارات/یوتیوب. SSG/ISR. */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'گالری فیلم',
  description: 'ویدیوهای معرفی و فرآیند تولید کارخانه سیمان خاکستری نی‌ریز.',
};

export default function VideosPage(): React.ReactElement {
  const videos = getVideos();

  return (
    <div className="mx-auto max-w-content px-4 py-12">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800 mb-8">
        <VideoIcon className="w-7 h-7 text-primary-700" />
        گالری فیلم
      </h1>

      {videos.length === 0 ? (
        <p className="py-16 text-center text-slate-400">فعلاً ویدیویی بارگذاری نشده است.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {videos.map((video) => (
            <div
              key={video.embedUrl}
              className="rounded-lg bg-white shadow-card border border-slate-100 overflow-hidden"
            >
              <div className="relative aspect-video bg-slate-900">
                <iframe
                  src={video.embedUrl}
                  title={video.title}
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <h2 className="font-bold text-slate-800">{video.title}</h2>
                {video.description && (
                  <p className="text-sm text-slate-500 mt-1 leading-7">{video.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
