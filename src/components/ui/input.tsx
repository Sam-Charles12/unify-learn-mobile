import * as React from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<
  React.ElementRef<typeof TextInput>,
  TextInputProps & { className?: string }
>(({ className, placeholderTextColor = '#A1A1AA', ...props }, ref) => {
  return (
    <TextInput
      className={cn(
        'bg-surface rounded-2xl px-4 py-4 font-body text-[15px] text-text-primary',
        'border border-border active:border-ink',
        className
      )}
      placeholderTextColor={placeholderTextColor}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };