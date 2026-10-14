import { Circle, Square, Triangle } from 'lucide-react';

type ShapeColor = 'red' | 'blue' | 'yellow';

const colorMap: Record<ShapeColor, string> = {
  red: '#D02020',
  blue: '#1040C0',
  yellow: '#F0C020',
};

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

type ShapeSize = keyof typeof sizeMap;

interface GeoShapeProps {
  shape: 'circle' | 'square' | 'triangle';
  color: ShapeColor;
  size?: ShapeSize;
  className?: string;
}

export function GeoShape({ shape, color, size = 'md', className = '' }: GeoShapeProps) {
  const fill = colorMap[color];
  const sizeClass = sizeMap[size];

  const common = `${sizeClass} ${className}`;

  if (shape === 'circle') {
    return <Circle className={common} fill={fill} stroke={fill} strokeWidth={1} />;
  }
  if (shape === 'square') {
    return <Square className={common} fill={fill} stroke={fill} strokeWidth={1} />;
  }
  return <Triangle className={common} fill={fill} stroke={fill} strokeWidth={1} />;
}

export { colorMap };
export type { ShapeColor };
