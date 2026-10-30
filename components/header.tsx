'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import ThemeToggle from './theme-toggle';
import { navigation } from '../data/site';
export default function Header() {
 const [open, setOpen] = useState(false);
 const trigger = useRef<HTMLButtonElement>(null);
 const dialog = useRef<HTMLDialogElement>(null);
 const pathname = usePathname();
 function close() { setOpen(false); dialog.current?.close(); trigger.current?.focus(); }
 useEffect(() => {
  const panel = dialog.current;
  if (open) { panel?.showModal(); const old = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = old; }; }
 }, [open]);
 useEffect(() => { const media = window.matchMedia('(min-width: 761px)'); const change = () => { if (media.matches) { setOpen(false); dialog.current?.close(); } }; media.addEventListener('change', change); return () => media.removeEventListener('change', change); }, []);
 return <header className="site-header"><div className="wrap header-inner"><a href="/" className="brand" aria-label="OpenBracket home"><Image src="/brand/openbracket-icon.svg" alt="OpenBracket Development" width={224} height={200} priority /></a><span className="header-tag mono">INDEPENDENT DEVELOPMENT STUDIO</span><nav className="desktop-nav" aria-label="Main navigation">{navigation.slice(1).map(link => <a key={link.href} href={link.href} aria-current={pathname === link.href ? 'page' : undefined}>{link.label}</a>)}</nav><a className="button header-cta" href="/contact">Let’s talk <span>↗</span></a><ThemeToggle /><button className="menu-trigger" ref={trigger} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(true)}>Menu <span>＋</span></button><dialog id="mobile-menu" ref={dialog} onCancel={event => { event.preventDefault(); close(); }} onClose={() => { setOpen(false); trigger.current?.focus(); }} aria-labelledby="menu-title"><div className="window-bar"><span id="menu-title">OPENBRACKET / NAVIGATION</span><button onClick={close} autoFocus aria-label="Close navigation">Close ×</button></div><nav aria-label="Mobile navigation">{navigation.map((link, i) => <a key={link.href} href={link.href} onClick={close} aria-current={pathname === link.href ? 'page' : undefined}><span className="mono">0{i + 1}</span>{link.label}<span>↗</span></a>)}</nav><p className="mono">SMALL STUDIO. OPEN POSSIBILITIES.</p></dialog><noscript><style>{`.menu-trigger,.theme-toggle{display:none!important}`}</style><nav className="no-script-nav" aria-label="Navigation without JavaScript">{navigation.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}</nav></noscript></div></header>;
}
