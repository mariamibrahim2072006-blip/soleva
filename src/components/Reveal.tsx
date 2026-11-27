import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Fade/slide reveal tied to scroll position.
export default function Reveal({ children, className = '', delay = 0, y = 48 }: { children: React.ReactNode; className?: string; delay?: number; y?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const tween = gsap.fromTo(el, { opacity: 0, y }, {
      opacity: 1, y: 0, duration: 1.1, delay, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
    return () => { tween.scrollTrigger?.kill(); tween.kill(); };
  }, [delay, y]);
  return <div ref={ref} className={className}>{children}</div>;
}

// Split headline into words that reveal on scroll.
export function SplitWords({ text, className = '' }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const words = el.querySelectorAll('.sw-word');
    const tween = gsap.fromTo(words, { yPercent: 110 }, {
      yPercent: 0, duration: 0.9, stagger: 0.06, ease: 'power4.out',
      scrollTrigger: { trigger: el, start: 'top 90%' },
    });
    return () => { tween.scrollTrigger?.kill(); tween.kill(); };
  }, [text]);
  return (
    <span ref={ref} className={className} aria-label={text}>
      {text.split(' ').map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em]" aria-hidden>
          <span className="sw-word inline-block will-change-transform">{w}&nbsp;</span>
        </span>
      ))}
    </span>
  );
}

// Image that reveals through a mask as it scrolls in.
export function MaskImage({ src, alt = '', className = '', imgClassName = '' }: { src: string; alt?: string; className?: string; imgClassName?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const img = el.querySelector('img');
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%' } });
    tl.fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.2, ease: 'power4.inOut' });
    if (img) tl.fromTo(img, { scale: 1.25 }, { scale: 1, duration: 1.6, ease: 'power3.out' }, 0);
    return () => { tl.scrollTrigger?.kill(); tl.kill(); };
  }, [src]);
  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <img src={src} alt={alt} className={`w-full h-full object-cover ${imgClassName}`} loading="lazy" />
    </div>
  );
}

export { gsap, ScrollTrigger };
