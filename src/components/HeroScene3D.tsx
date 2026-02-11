import { Suspense, lazy, useState, useEffect } from 'react';

const Scene = lazy(() => import('./HeroScene3DCanvas'));

export default function HeroScene3D() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    setShow(mql.matches);
    const handler = (e: MediaQueryListEvent) => setShow(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  if (!show) return null;

  return (
    <div className="absolute left-0 top-0 w-[45%] h-full pointer-events-none z-0">
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </div>
  );
}
