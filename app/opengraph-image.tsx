import { ImageResponse } from 'next/og';
export const alt = 'OpenBracket — Websites and applications built around your business.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function Image() { return new ImageResponse(<div style={{ background: '#111210', color: '#fff', display: 'flex', width: '100%', height: '100%', padding: '70px', flexDirection: 'column', justifyContent: 'space-between' }}><div style={{ display: 'flex', color: '#ef7773', fontSize: 28 }}> [ OPENBRACKET ]</div><div style={{ display: 'flex', flexDirection: 'column', fontSize: 75, letterSpacing: -3 }}>Websites & applications.<br />Built around you.</div><div style={{ fontSize: 24 }}>INDEPENDENT DEVELOPMENT STUDIO / DALLAS–FORT WORTH</div></div>, size); }
