import type { ReactNode } from 'react';
import { GeoShape } from './GeoShape';
import type { ShapeColor } from './GeoShape';

type CornerShape = 'circle' | 'square' | 'triangle';

interface CardProps {
  children: ReactNode;
  className?: string;
  cornerShape?: CornerShape;
  cornerColor?: ShapeColor;
  hover?: boolean;
}

export function Card({
  children,
  className = '',
  cornerShape,
  cornerColor = 'red',
  hover = true,
}: CardProps) {
  return (
    <div
      className={`
        relative bg-white border-2 md:border-4 border-black shadow-hard-4 md:shadow-hard-8
        transition-all duration-200 ease-out
        ${hover ? 'hover:-translate-y-1' : ''}
        ${className}
      `}
    >
      {cornerShape && (
        <div className="absolute -top-2 -right-2 z-10">
          <GeoShape shape={cornerShape} color={cornerColor} size="sm" />
        </div>
      )}
      {children}
    </div>
  );
}
