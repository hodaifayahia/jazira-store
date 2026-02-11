import { ReactNode } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

interface Props {
  children: ReactNode;
  className?: string;
  direction?: 'up' | 'left' | 'right';
  delay?: number;
}

export default function AnimatedSection({ children, className, direction = 'up', delay = 0 }: Props) {
  const { ref, isVisible } = useScrollAnimation(0.08);

  const directionClass = {
    up: 'translate-y-8',
    left: 'translate-x-8',
    right: '-translate-x-8',
  }[direction];

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        isVisible ? 'opacity-100 translate-y-0 translate-x-0' : `opacity-0 ${directionClass}`,
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
