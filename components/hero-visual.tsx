'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';
const Scene = dynamic(() => import('./hero-scene'), { ssr: false, loading: () => <span className="scene-status">Loading 3D…</span> });
export default function HeroVisual() {
  const [active, setActive] = useState(false);
  return <div className="hero-art"><div className="bracket-art" aria-hidden="true"><span>[</span><span>]</span></div>{active && <Scene />}<div className="art-caption"><span>ROOM FOR YOUR NEXT BIG IDEA.</span><button onClick={() => setActive(!active)} aria-pressed={active}>{active ? 'Turn off 3D' : 'Explore in 3D'} ↗</button></div></div>;
}
