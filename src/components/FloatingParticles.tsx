import { cn } from '@/lib/utils';

const particles = [
  { size: 6, x: '10%', y: '20%', dur: '6s', del: '0s' },
  { size: 4, x: '25%', y: '70%', dur: '8s', del: '1s' },
  { size: 8, x: '70%', y: '15%', dur: '7s', del: '2s' },
  { size: 5, x: '85%', y: '60%', dur: '9s', del: '0.5s' },
  { size: 3, x: '50%', y: '80%', dur: '6.5s', del: '1.5s' },
  { size: 7, x: '15%', y: '50%', dur: '8.5s', del: '3s' },
  { size: 4, x: '60%', y: '40%', dur: '7.5s', del: '2.5s' },
  { size: 5, x: '90%', y: '30%', dur: '6s', del: '1s' },
];

export default function FloatingParticles({ className }: { className?: string }) {
  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-primary/10 animate-float"
          style={{
            width: p.size,
            height: p.size,
            left: p.x,
            top: p.y,
            animationDuration: p.dur,
            animationDelay: p.del,
          }}
        />
      ))}
    </div>
  );
}
