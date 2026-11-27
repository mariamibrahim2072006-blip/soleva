import { useEffect, useRef, useState } from 'react';

export default function Preloader() {
  const [done, setDone] = useState(false);
  const [pct, setPct] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionStorage.getItem('soleva-loaded') || new URLSearchParams(window.location.search).has('snap')) { setDone(true); return; }
    document.body.style.overflow = 'hidden';
    const start = performance.now();
    const DURATION = 1600;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(100, Math.round(((now - start) / DURATION) * 100));
      setPct(p);
      if (p < 100) raf = requestAnimationFrame(tick);
      else {
        window.setTimeout(() => {
          sessionStorage.setItem('soleva-loaded', '1');
          document.body.style.overflow = '';
          setDone(true);
        }, 450);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); document.body.style.overflow = ''; };
  }, []);

  if (done) return null;
  return (
    <div ref={wrap} className={`fixed inset-0 z-[10000] bg-ink flex flex-col items-center justify-center transition-transform duration-700 ${pct >= 100 ? '-translate-y-full' : ''}`} style={{ transitionTimingFunction: 'cubic-bezier(.76,0,.24,1)' }} aria-hidden>
      <svg width="220" height="60" viewBox="0 0 220 60" fill="none" className="mb-6">
        {['S', 'O', 'L', 'E', 'V', 'A'].map((ch, i) => (
          <text key={i} x={18 + i * 34} y={42} className="preloader-letter" fontFamily="Archivo" fontWeight="800" fontSize="44" fill="none" stroke="#0864E8" strokeWidth="1"
            style={{ strokeDasharray: 400, strokeDashoffset: Math.max(0, 400 - (pct / 100) * 400 * 1.6 + i * 40), opacity: pct > i * 14 ? 1 : 0.25, transition: 'opacity .3s' }}>
            {ch}
          </text>
        ))}
      </svg>
      <div className="w-[220px] h-px bg-ink-3 relative overflow-hidden">
        <div className="preloader-line absolute inset-0 bg-ivory" style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
      <div className="mt-4 text-concrete text-xs tracking-[0.3em] font-display tabular-nums">{pct}%</div>
    </div>
  );
}
