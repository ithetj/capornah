import { cn } from '@/lib/utils';

export function Chip({
  className,
  active,
  children,
}: {
  className?: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition',
        active
          ? 'border-pink-500/50 bg-pink-500/10 text-pink-300'
          : 'border-white/10 bg-white/5 text-white/60',
        className
      )}
    >
      {children}
    </div>
  );
}