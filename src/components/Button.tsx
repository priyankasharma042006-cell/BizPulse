import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'red' | 'blue' | 'yellow' | 'outline' | 'ghost';
type Shape = 'square' | 'pill';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  shape?: Shape;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  red: 'bg-primary-red text-white border-2 border-black hover:bg-primary-red/90',
  blue: 'bg-primary-blue text-white border-2 border-black hover:bg-primary-blue/90',
  yellow: 'bg-primary-yellow text-black border-2 border-black hover:bg-primary-yellow/90',
  outline: 'bg-white text-black border-2 border-black hover:bg-gray-100',
  ghost: 'border-none text-black hover:bg-gray-200',
};

const shapeClasses: Record<Shape, string> = {
  square: 'rounded-none',
  pill: 'rounded-full',
};

export function Button({
  variant = 'red',
  shape = 'square',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const isGhost = variant === 'ghost';

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 px-6 py-3
        font-bold uppercase tracking-wider text-sm
        transition-all duration-200 ease-out
        ${variantClasses[variant]}
        ${shapeClasses[shape]}
        ${!isGhost ? 'shadow-hard-4 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
