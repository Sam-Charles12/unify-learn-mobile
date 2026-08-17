import * as React from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<
  React.ElementRef<typeof TextInput>,
  TextInputProps & { className?: string }
>(({ className, placeholderTextColor = '#94A3B8', ...props }, ref) => {
  return (
    <TextInput
      className={cn(
        'bg-surface rounded-xl px-4 py-3.5 font-body text-[15px] text-text-primary',
        'border border-border active:border-primary',
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