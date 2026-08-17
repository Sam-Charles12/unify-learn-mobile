import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'flex items-center justify-center rounded-xl disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary active:bg-primary-dark shadow-soft',
        dark: 'bg-ink active:bg-ink-light shadow-soft',
        secondary: 'bg-soft active:bg-border text-text-primary',
        outline: 'border border-border bg-surface active:bg-soft',
        destructive: 'bg-error active:opacity-90',
        ghost: 'active:bg-soft',
        link: 'underline-offset-4',
      },
      size: {
        default: 'h-12 px-6 py-3',
        sm: 'h-10 px-4 py-2',
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

const buttonTextVariants = cva('font-body-bold text-center', {
  variants: {
    variant: {
      default: 'text-white',
      dark: 'text-white',
      secondary: 'text-text-primary',
      outline: 'text-text-primary',
      destructive: 'text-white',
      ghost: 'text-text-primary',
      link: 'text-primary underline',
    },
    size: {
      default: 'text-[15px]',
      sm: 'text-[13px]',
      lg: 'text-[16px]',
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
  ({ className, variant = 'default', size = 'default', loading, labelClassName, disabled, children, ...props }, ref) => {
    const isLightText = variant === 'default' || variant === 'dark' || variant === 'destructive';

    return (
      <Pressable
        className={cn(buttonVariants({ variant, size }), className, disabled && 'opacity-50')}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color={isLightText ? '#FFFFFF' : '#0F172A'} />
        ) : (
          <Text className={cn(buttonTextVariants({ variant, size }), labelClassName)}>
            {children}
          </Text>
        )}
      </Pressable>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };