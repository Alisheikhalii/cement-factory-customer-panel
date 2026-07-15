import type { AsyncState } from '../../lib/use-api-data';
import { EmptyState } from './EmptyState';
import { ErrorState, ForbiddenState } from './ErrorState';
import { SkeletonTable } from './Skeleton';

/**
 * پوشش‌دهنده‌ی حالت‌های Async (بخش ۱۰.۹). بر اساس state، یکی از حالت‌های
 * Loading/Error/Forbidden/Empty/Success را نمایش می‌دهد. Empty وقتی است که
 * state=success ولی isEmpty=true. (Unauthorized/Offline سراسری‌اند.)
 */
export function DataStateView({
  state,
  isEmpty,
  onRetry,
  emptyMessage,
  skeletonCols,
  children,
}: {
  state: AsyncState;
  isEmpty: boolean;
  onRetry?: () => void;
  emptyMessage?: string;
  skeletonCols?: number;
  children: React.ReactNode;
}): React.ReactElement {
  if (state === 'loading') {
    return <SkeletonTable cols={skeletonCols} />;
  }
  if (state === 'forbidden') {
    return <ForbiddenState />;
  }
  if (state === 'error') {
    return <ErrorState onRetry={onRetry} />;
  }
  if (isEmpty) {
    return <EmptyState message={emptyMessage} />;
  }
  return <>{children}</>;
}
