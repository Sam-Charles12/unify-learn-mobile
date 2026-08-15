import * as React from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<
  React.ElementRef<typeof TextInput>,
  TextInputProps & { className?: string }
>(({ className, placeholderTextColor = '#8A817C', ...props }, ref) => {
  return (
    <TextInput
      className={cn(
        'bg-soft rounded-pill px-5 py-4 font-body text-[16px] text-text-primary',
        'web:flex web:w-full web:bg-transparent',
        'web:py-2 web:text-sm web:ring-offset-background web:focus-visible:outline-none',
        'web:focus-visible:ring-2 web:focus-visible:ring-primary web:focus-visible:ring-offset-2',
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