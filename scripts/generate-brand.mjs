import { writeFileSync } from 'node:fs';
const glyphs = {
 O:'M6 0H18L24 6V26L18 32H6L0 26V6Z',
 P:'M0 32V0H17L24 7V13L17 20H0',
 E:'M24 0H0V32H24M0 16H19',
 N:'M0 32V0L24 32V0',
 B:'M0 16H17L24 9V6L18 0H0V32H18L24 26V23L17 16',
 R:'M0 32V0H17L24 7V13L17 20H0M14 20L25 32',
 A:'M0 32V9L9 0H15L24 9V32M0 20H24',
 C:'M24 4L20 0H6L0 6V26L6 32H20L24 28',
 K:'M0 0V32M24 0L8 16L24 32M0 16H8',
 T:'M0 0H26M13 0V32',
 D:'M0 0H16L24 8V24L16 32H0Z',
 V:'M0 0L12 32L24 0',
 L:'M0 0V32H24',
 M:'M0 32V0L12 15L24 0V32',
 U:'M0 0V26L6 32H18L24 26V0',
 S:'M24 0H6L0 6V10L6 16H18L24 22V26L18 32H0',
 I:'M0 0H24M12 0V32M0 32H24',
};
function letters(text, x, y, scale, color, weight = 4.6, spacing = 34) {
 let cursor = 0;
 return `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="${color}" stroke-width="${weight}" stroke-linejoin="bevel" stroke-linecap="square">${[...text].map(char => { const pos = cursor; cursor += char === ' ' ? 20 : spacing; return char === ' ' ? '' : `<path transform="translate(${pos})" d="${glyphs[char]}"/>`; }).join('')}</g>`;
}
const left = [[20,32],[78,32],[78,58],[48,58],[48,142],[78,142],[78,168],[20,168]];
const right = left.map(([x,y]) => [200-x,y]).reverse();
function polygon(points, fill) { return `<polygon points="${points.map(p=>p.join(',')).join(' ')}" fill="${fill}"/>`; }
function mark(x,y,scale, mono) {
 const dx=14,dy=-14;
 return `<g transform="translate(${x} ${y}) scale(${scale})">${[left,right].map(points => {
 if(mono) return polygon(points,mono);
 const back=points.map(([a,b])=>[a+dx,b+dy]);
 // Cull faces pointing away from the extrusion direction: hidden faces must not cover the solid top.
 return polygon(back,'#822020') + points.map((p,i)=>{const q=points[(i+1)%points.length]; if ((q[0]-p[0]) * -dy + (q[1]-p[1]) * dx <= 0) return ''; return polygon([p,q,[q[0]+dx,q[1]+dy],[p[0]+dx,p[1]+dy]],p[1]===q[1] ? (q[0]>p[0]?'#f17b70':'#922522') : '#a12726');}).join('') + polygon(points,'#de3736');
 }).join('')}</g>`;
}
function svg(width,height,label,content) { return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title"><title id="title">OpenBracket — ${label}</title>${content}</svg>\n`; }
for (const [variant, ink, mono] of [['dark','#ffffff',null],['light','#171815',null],['mono-black','#000000','#000000'],['mono-white','#ffffff','#ffffff']]) {
 writeFileSync(`public/brand/openbracket-horizontal-${variant}.svg`,svg(700,150,'horizontal logo',mark(2,-3,.78,mono)+letters('OPENBRACKET',187,48,1.32,ink)+letters('DEVELOPMENT STUDIO',189,116,.32,ink,3.7,37)));
 writeFileSync(`public/brand/openbracket-stacked-${variant}.svg`,svg(460,330,'stacked logo',mark(116,-1,1.06,mono)+letters('OPENBRACKET',29,230,1.1,ink)+letters('DEVELOPMENT STUDIO',126,300,.32,ink,3.7,37)));
}
writeFileSync('public/brand/openbracket-icon.svg',svg(224,200,'dimensional bracket icon',mark(5,6,1,null)));
for (const [name,color] of [['black','#000000'],['white','#ffffff']]) writeFileSync(`public/brand/openbracket-icon-mono-${name}.svg`,svg(224,200,'bracket icon',mark(12,0,1,color)));
// An SVG contact sheet is also an editable, standalone preview artifact.
let sheet = `<rect width="1400" height="1030" fill="#111210"/><rect x="700" width="700" height="1030" fill="#eeeee5"/>`;
for(const [x,color,label] of [[0,'#ffffff','ON DARK'],[700,'#171815','ON LIGHT']]) {
 sheet += `<text x="${x+45}" y="50" font-family="monospace" font-size="13" fill="${color}" letter-spacing="2">OPENBRACKET / ${label}</text>`;
 sheet += mark(x+45,85,.65,null)+letters('OPENBRACKET',x+190,124,1.23,color)+letters('DEVELOPMENT STUDIO',x+192,183,.28,color,3.7,37);
 sheet += mark(x+225,265,1.1,null)+letters('OPENBRACKET',x+112,514,1.3,color)+letters('DEVELOPMENT STUDIO',x+240,583,.3,color,3.7,37);
 sheet += mark(x+95,690,1.1,null)+mark(x+420,710,.52,null)+mark(x+520,725,.25,null);
 sheet += `<text x="${x+45}" y="970" font-family="monospace" font-size="12" fill="${color}" opacity=".6">01 HORIZONTAL   /   02 STACKED   /   03 ICON + SCALE</text>`;
}
writeFileSync('public/brand/logo-preview.svg',svg(1400,1030,'logo family preview',sheet));
