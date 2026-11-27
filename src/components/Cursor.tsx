import { useEffect, useRef } from 'react';

export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return;
    let x = -100, y = -100, rx = -100, ry = -100;
    let raf = 0;
    const move = (e: MouseEvent) => { x = e.clientX; y = e.clientY; };
    const loop = () => {
      rx += (x - rx) * 0.16; ry += (y - ry) * 0.16;
      if (dot.current) dot.current.style.transform = `translate(${x - 3}px, ${y - 3}px)`;
      if (ring.current) ring.current.style.transform = `translate(${rx - 17}px, ${ry - 17}px)`;
      raf = requestAnimationFrame(loop);
    };
    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      ring.current?.classList.toggle('is-active', !!t.closest('a, button, [data-cursor]'));
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseover', over);
    raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseover', over); cancelAnimationFrame(raf); };
  }, []);

  return (<>
    <div ref={dot} className="cursor-dot" aria-hidden />
    <div ref={ring} className="cursor-ring" aria-hidden />
  </>);
}
