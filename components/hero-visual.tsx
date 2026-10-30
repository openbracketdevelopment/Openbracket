'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import { terminalPhrases, initialTypingState, advanceTyping, typingDelay } from '../lib/typewriter';

export default function HeroVisual() {
 const host = useRef<HTMLDivElement>(null);
 const [running, setRunning] = useState(false);
 const [paused, setPaused] = useState(false);
 const [reduced, setReduced] = useState(false);
 const [typing, setTyping] = useState(initialTypingState);
 useEffect(() => {
  const element = host.current;
  if (!element) return;
  let visible = false;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sync = () => { setReduced(preference.matches); setRunning(visible && !document.hidden && !preference.matches); };
  const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: .15 });
  observer.observe(element); document.addEventListener('visibilitychange', sync); preference.addEventListener('change', sync);
  return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); preference.removeEventListener('change', sync); };
 }, []);
 useEffect(() => {
  if (!running || paused) return;
  const timer = window.setTimeout(() => setTyping(advanceTyping), typingDelay(typing));
  return () => window.clearTimeout(timer);
 }, [running, paused, typing]);
 const text = reduced ? terminalPhrases[0] : terminalPhrases[typing.phrase].slice(0, typing.length);
 const blink = !reduced && running && !paused && (typing.phase === 'holding' || typing.phase === 'waiting');
 return <div className="crt-composition" ref={host} data-running={running && !paused} onPointerMove={event => {
  if (event.pointerType !== 'mouse' || !running || paused) return;
  const bounds = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--tilt', `${((event.clientX - bounds.left) / bounds.width - .5) * 3 - 26}deg`);
 }} onPointerLeave={event => event.currentTarget.style.setProperty('--tilt', '-26deg')}>
  <span className="sr-only">OpenBracket: Have a project in mind? We build thoughtful websites and useful applications. Let’s make something useful.</span>
  <div className="diagram-grid" aria-hidden="true" />
  <span className="art-coordinate mono">OB / PERSONAL POSSIBILITY COMPUTER</span>
  <div className="monitor-assembly" aria-hidden="true">
   <div className="crt"><div className="crt-rear" /><div className="crt-top-plane" /><div className="crt-side-plane"><div className="monitor-side-vents">{Array.from({ length: 18 }, (_, i) => <i key={i} />)}</div></div>
    <div className="crt-bezel"><div className="crt-screen">
     <div className="terminal"><div className="terminal-header"><span>OPENBRACKET / HUMAN INTERFACE</span><span>01</span></div>
      <div className="terminal-boot"><span>OB/DOS v.01</span><span>connection: human ↔ human</span></div>
      <div className="terminal-command"><span>›</span> run good-things.exe</div>
      <noscript><style>{`.terminal-typed{display:none}.terminal-static{display:inline!important}`}</style></noscript><div className="terminal-conversation"><div className="terminal-line"><span className="terminal-prompt">↳</span><span><span className="terminal-typed">{text}<span className="terminal-caret" data-blink={blink}>▋</span></span><span className="terminal-static">{terminalPhrases[0]}<span className="terminal-caret">▋</span></span></span></div><span className="terminal-invitation">YOUR NEXT CHAPTER STARTS HERE.</span></div>
      <div className="terminal-bottom"><span><i /> OPEN TO POSSIBILITIES</span><span>[ OB ]</span></div>
     </div>
    </div></div>
    <div className="crt-chin"><div className="monitor-badge"><Image className="monitor-logo" src="/brand/openbracket-icon.svg" alt="" width={24} height={24} /><span>openbracket<small>PERSONAL COMPUTER</small></span></div><div className="monitor-controls"><span className="monitor-power-button" /><div className="power-switch"><span className="power-led" /><span>POWER</span></div></div></div>
   </div><div className="crt-stand" /><div className="crt-base" /><div className="monitor-shadow" />
  </div>
  <div className="art-controls"><span className="mono">OLD-SCHOOL CHARM. NEW POSSIBILITIES.</span><button onClick={() => setPaused(!paused)} aria-pressed={paused} disabled={reduced}>{reduced ? 'Motion reduced' : paused ? 'Resume terminal ▷' : 'Pause terminal Ⅱ'}</button></div>
 </div>;
}
