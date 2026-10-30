'use client';
import { useEffect, useRef, useState } from 'react';
export default function HeroVisual() {
 const host = useRef<HTMLDivElement>(null);
 const [running, setRunning] = useState(false);
 const [paused, setPaused] = useState(false);
 useEffect(() => {
  const element = host.current;
  if (!element) return;
  let visible = false;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sync = () => setRunning(visible && !document.hidden && !reduced.matches);
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); });
  observer.observe(element); document.addEventListener('visibilitychange', sync); reduced.addEventListener('change', sync);
  return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); reduced.removeEventListener('change', sync); };
 }, []);
 return <div className="crt-composition" ref={host} data-running={running && !paused} onPointerMove={event => {
  if (event.pointerType !== 'mouse' || !running || paused) return;
  const bounds = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--tilt', `${((event.clientX - bounds.left) / bounds.width - .5) * 5}deg`);
 }} onPointerLeave={event => event.currentTarget.style.setProperty('--tilt', '-3deg')}><div className="diagram-grid" aria-hidden="true" /><span className="art-coordinate mono">OB—01 / IDEA → INTERFACE</span><div className="crt" aria-hidden="true"><div className="crt-bezel"><div className="crt-screen"><div className="screen-grid" /><div className="retro-window"><div className="retro-title"><span>● ● ●</span> your-next-idea.exe</div><div className="screen-layout"><div className="screen-bracket">[<span>●</span>]</div><div className="screen-lines"><i /><i /><i /></div><div className="screen-blocks"><i /><i /><i /></div></div><div className="screen-footer">IDEA FOUND. POSSIBILITIES OPEN.</div></div><span className="screen-cursor">_</span></div></div><div className="crt-chin"><span>OPENBRACKET</span><div className="vent">▥▥▥▥</div><span className="power-led" /></div></div><div className="crt-stand" aria-hidden="true" /><div className="crt-base" aria-hidden="true" /><span className="floating-symbol" aria-hidden="true">＋</span><div className="art-controls"><span className="mono">A LITTLE NOSTALGIA. A LOT OF POSSIBILITY.</span><button onClick={() => setPaused(!paused)} aria-pressed={paused}>{paused ? 'Play motion' : 'Pause motion'} {paused ? '▷' : 'Ⅱ'}</button></div></div>;
}
