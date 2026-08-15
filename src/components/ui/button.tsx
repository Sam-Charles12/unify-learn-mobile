import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'flex items-center justify-center rounded-pill disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary active:bg-primary-dark',
        green: 'bg-primary-light active:opacity-90',
        destructive: 'bg-error active:opacity-90',
        outline: 'border border-border bg-card active:bg-background',
        secondary: 'bg-cream active:opacity-80',
        ghost: 'active:bg-background',
        link: 'underline-offset-4',
      },
      size: {
        default: 'h-12 px-6 py-3',
        sm: 'h-9 px-4 py-2',
        lg: 'h-14 px-8 py-4',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva('font-body-bold', {
  variants: {
    variant: {
      default: 'text-white',
      green: 'text-primary-dark',
      destructive: 'text-white',
      outline: 'text-text-primary',
      secondary: 'text-text-primary',
      ghost: 'text-text-primary',
      link: 'text-primary-dark underline',
    },
    size: {
      default: 'text-base',
      sm: 'text-sm',
      lg: 'text-base',
      icon: 'text-sm',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

type ButtonProps = React.ComponentPropsWithoutRef<typeof Pressable> &
  VariantProps<typeof buttonVariants> & {
    labelClassName?: string;
    loading?: boolean;
    children: React.ReactNode;
  };

const Button = React.forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  ({ className, variant, size, loading, labelClassName, disabled, children, ...props }, ref) => (
    <Pressable
      className={cn(
        buttonVariants({ variant, size }),
        className,
        disabled && 'opacity-50'
      )}
      ref={ref}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'default' ? '#ffffff' : '#111111'} />
      ) : (
        <Text className={cn(buttonTextVariants({ variant, size }), labelClassName)}>
          {children}
        </Text>
      )}
    </Pressable>
  )
);
Button.displayName = 'Button';

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };