'use client';

import { motion } from 'framer-motion';
import { STAGGER_SECONDS } from '../../lib/design-tokens';

/**
 * کارت پایه با افکت Glassmorphism (بخش ۱۰.۳/۱۰.۷). کلاس‌های `.glass-card` از
 * globals.css می‌آیند (Design Token واحد). انیمیشن ورود Fade+Slide-up با Stagger.
 *
 * @param index ترتیب کارت در گرید — برای تاخیر پلکانی ورود (Framer Stagger، بخش ۱۰.۳).
 * @param hover اگر true، افکت بالا آمدن هنگام Hover فعال می‌شود (کارت‌های تعاملی داشبورد).
 */
export function GlassCard({
  children,
  className = '',
  index = 0,
  hover = false,
  as = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  index?: number;
  hover?: boolean;
  as?: 'div' | 'section' | 'article';
}): React.ReactElement {
  const MotionTag = motion[as];
  return (
    <MotionTag
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: index * STAGGER_SECONDS }}
      className={`glass-card ${hover ? 'glass-card-hover' : ''} p-4 sm:p-5 ${className}`}
    >
      {children}
    </MotionTag>
  );
}
