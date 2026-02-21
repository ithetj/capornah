import { cn } from '@/lib/utils';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function Button({ className, variant = 'secondary', ...props }: Props) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 font-black transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';
  const variants = {
    primary:
      'bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40',
    secondary:
      'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20',
    ghost: 'bg-transparent text-white/70 hover:text-white hover:bg-white/5',
  };
  return <button className={cn(base, variants[variant], className)} {...props} />;
}