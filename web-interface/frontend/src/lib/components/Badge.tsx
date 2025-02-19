import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-content hover:bg-primary/80',
        secondary: 'bg-secondary text-secondary-content hover:bg-secondary/80',
        destructive: 'bg-error text-error-content hover:bg-error/80',
        outline:
          'text-base-content border border-base-content/20 hover:bg-base-content/10',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
