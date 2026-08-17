import * as React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<React.ElementRef<typeof View>, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        'rounded-2xl bg-surface p-6 border border-border/80 shadow-soft',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<React.ElementRef<typeof View>, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn('flex flex-col space-y-2 pb-3', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<React.ElementRef<typeof View>, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View
      ref={ref}
      className={cn('font-headline text-xl leading-7 text-text-primary tracking-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<React.ElementRef<typeof View>, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn('font-body text-sm text-text-secondary leading-5', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<React.ElementRef<typeof View>, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn('pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<React.ElementRef<typeof View>, ViewProps & { className?: string }>(
  ({ className, ...props }, ref) => (
    <View ref={ref} className={cn('flex flex-row items-center pt-3', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };