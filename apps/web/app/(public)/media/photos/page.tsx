import type { Metadata } from 'next';
import { Image as ImageIcon } from 'lucide-react';
import { getPhotos } from '../../../../lib/media';
import { PhotoGallery } from '../../../../components/public/PhotoGallery';

/** گالری عکس — `/media/photos` (بخش ۹.۱۰.۳). SSG/ISR. */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'گالری عکس',
  description: 'تصاویر کارخانه سیمان خاکستری نی‌ریز.',
};

export default function PhotosPage(): React.ReactElement {
  const photos = getPhotos();

  return (
    <div className="mx-auto max-w-content px-4 py-12">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800 mb-8">
        <ImageIcon className="w-7 h-7 text-primary-700" />
        گالری عکس
      </h1>
      <PhotoGallery photos={photos} />
    </div>
  );
}
