// Generates the illustrative 3D-inspired SVG artwork in assets/img/.
// These are ILLUSTRATIONS, not photographs of the college. Each file carries an "Illustration" tag.
// Run: node tools/gen-art.js
const fs = require('fs');
const path = require('path');
const out = path.join(__dirname, '..', 'assets', 'img');

const NAVY = '#0b1f4b', NAVY2 = '#16367a', GOLD = '#c9a227', GOLD2 = '#f0d36b', WHITE = '#ffffff';

const f = (n) => Math.round(n * 10) / 10;
const pts = (a) => a.map((p) => f(p[0]) + ',' + f(p[1])).join(' ');

// isometric box: (cx,cy) is the front-bottom corner; w goes right, d goes left, h is height
function box(cx, cy, w, d, h, top, left, right) {
  const L = [[cx, cy], [cx - d, cy - d / 2], [cx - d, cy - d / 2 - h], [cx, cy - h]];
  const R = [[cx, cy], [cx + w, cy - w / 2], [cx + w, cy - w / 2 - h], [cx, cy - h]];
  const T = [[cx, cy - h], [cx + w, cy - w / 2 - h], [cx + w - d, cy - w / 2 - d / 2 - h], [cx - d, cy - d / 2 - h]];
  return `<polygon points="${pts(L)}" fill="${left}"/><polygon points="${pts(R)}" fill="${right}"/><polygon points="${pts(T)}" fill="${top}"/>`;
}
const tone = (c) => ({ top: c[0], left: c[1], right: c[2] });
const PAL = {
  white: ['#ffffff', '#cfd8ec', '#e4eaf6'],
  gold: [GOLD2, '#a8861a', GOLD],
  blue: ['#5b7fd1', '#1d3f94', '#2b55b8'],
  steel: ['#dfe6f2', '#8d9bb8', '#b4bfd6'],
  dark: ['#3a4f86', '#142a63', '#1d3877'],
  red: ['#ff9d8a', '#b34733', '#d9604a'],
  green: ['#9fe0b5', '#2f8f57', '#47b373'],
};
const B = (cx, cy, w, d, h, p) => box(cx, cy, w, d, h, ...PAL[p]);

function gear(cx, cy, r, n, fill, hole) {
  const p = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, s = (Math.PI * 2) / n;
    [[0, r * 0.82], [0.2, r], [0.5, r], [0.7, r * 0.82]].forEach(([k, rad]) => {
      p.push([cx + Math.cos(a + k * s) * rad, cy + Math.sin(a + k * s) * rad]);
    });
  }
  return `<polygon points="${pts(p)}" fill="${fill}" stroke="${NAVY}" stroke-opacity=".35" stroke-width="2"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r * 0.55}" fill="none" stroke="${NAVY}" stroke-opacity=".25" stroke-width="3"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${hole}" fill="${NAVY}"/>`;
}

function frame(inner, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" role="img" aria-label="${label}">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${NAVY2}"/><stop offset="1" stop-color="${NAVY}"/></linearGradient>
<radialGradient id="glow" cx=".72" cy=".25" r=".7"><stop offset="0" stop-color="${GOLD2}" stop-opacity=".35"/><stop offset="1" stop-color="${GOLD2}" stop-opacity="0"/></radialGradient>
<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#fff" stroke-opacity=".06"/></pattern>
<filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="14" stdDeviation="12" flood-color="#000" flood-opacity=".35"/></filter>
</defs>
<rect width="800" height="500" fill="url(#bg)"/><rect width="800" height="500" fill="url(#grid)"/><rect width="800" height="500" fill="url(#glow)"/>
<g filter="url(#sh)">${inner}</g>
<rect x="18" y="458" width="132" height="26" rx="13" fill="${WHITE}" fill-opacity=".14"/>
<text x="84" y="476" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" fill="${WHITE}" letter-spacing=".5">Illustration</text>
</svg>`;
}

const art = {};

// CIVIL: architectural model + surveying instrument
art.civil = () => {
  let s = B(400, 420, 330, 330, 14, 'steel'); // base plate
  s += B(330, 380, 80, 80, 90, 'white') + B(430, 360, 70, 70, 150, 'white') + B(500, 340, 60, 60, 60, 'steel');
  s += B(300, 330, 60, 60, 40, 'gold');
  s += B(380, 300, 40, 40, 110, 'blue');
  for (let i = 0; i < 4; i++) s += `<rect x="${352 + i * 0}" y="${300 - i * 22}" width="16" height="8" fill="${GOLD2}" opacity=".9" transform="skewY(-26)"/>`;
  // theodolite on tripod
  s += `<g stroke="${GOLD2}" stroke-width="6" stroke-linecap="round"><path d="M610 250 L560 410 M610 250 L650 410 M610 250 L610 415"/></g>`;
  s += B(630, 256, 40, 40, 34, 'steel') + `<circle cx="618" cy="222" r="14" fill="${GOLD}"/><rect x="590" y="206" width="60" height="10" rx="4" fill="${WHITE}" opacity=".9"/>`;
  s += `<path d="M646 212 L760 160" stroke="${GOLD2}" stroke-width="2" stroke-dasharray="6 6"/>`;
  return s;
};

// MECHANICAL: gears + CNC machine
art.mechanical = () => {
  let s = gear(230, 280, 120, 14, GOLD, 22) + gear(400, 190, 70, 10, '#e4eaf6', 14) + gear(150, 140, 48, 8, GOLD2, 10);
  s += B(520, 430, 240, 190, 24, 'dark');
  s += B(600, 406, 190, 120, 50, 'steel');            // machine bed
  s += B(520, 330, 24, 24, 150, 'blue');              // column
  s += B(600, 290, 150, 30, 24, 'blue');              // gantry
  s += `<rect x="636" y="238" width="16" height="64" fill="${WHITE}"/><polygon points="636,302 652,302 644,330" fill="${GOLD2}"/>`;
  s += B(640, 370, 60, 50, 22, 'gold');               // workpiece
  return s;
};

// ELECTRICAL & ELECTRONICS: motor + circuit + panel
art.eee = () => {
  let s = `<g stroke="${GOLD2}" stroke-width="3" fill="none" opacity=".85"><path d="M40 420 H220 V360 H330 M330 360 V300 H520 M520 300 V230 H640 M60 460 H300 V420 H460"/></g>`;
  [[220, 420], [330, 360], [520, 300], [640, 230], [460, 420]].forEach(([x, y]) => (s += `<circle cx="${x}" cy="${y}" r="7" fill="${GOLD}"/>`));
  // motor: cylinder
  s += `<rect x="150" y="200" width="210" height="120" fill="#8d9bb8"/>`;
  for (let i = 0; i < 9; i++) s += `<rect x="${162 + i * 22}" y="200" width="8" height="120" fill="#b4bfd6"/>`;
  s += `<ellipse cx="150" cy="260" rx="34" ry="60" fill="#dfe6f2"/><ellipse cx="360" cy="260" rx="34" ry="60" fill="#5b7fd1"/>`;
  s += `<rect x="360" y="248" width="70" height="24" fill="${GOLD}"/><ellipse cx="430" cy="260" rx="8" ry="12" fill="${GOLD2}"/>`;
  s += B(160, 345, 100, 40, 14, 'dark');
  // panel
  s += B(560, 430, 150, 70, 190, 'dark');
  [[480, 330], [520, 330], [560, 330]].forEach(([x, y], i) => (s += `<circle cx="${x + 36}" cy="${y - 10 + i * 6}" r="9" fill="${i === 1 ? '#47b373' : i === 2 ? '#d9604a' : GOLD2}"/>`));
  s += `<rect x="580" y="262" width="80" height="50" fill="${NAVY}" opacity=".7" transform="skewY(-26.5) translate(0 268)"/>`;
  return s;
};

// COMPUTER ENGINEERING: coding workstations
art.computer = () => {
  const mon = (x, y, w, h) => {
    let m = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#e4eaf6"/><rect x="${x + 8}" y="${y + 8}" width="${w - 16}" height="${h - 16}" rx="5" fill="#0a1736"/>`;
    const colors = [GOLD2, '#7aa2ff', '#9fe0b5', WHITE, '#ff9d8a'];
    for (let i = 0; i < 9; i++) {
      const indent = (i % 3) * 18;
      m += `<rect x="${x + 22 + indent}" y="${y + 22 + i * 17}" width="${40 + ((i * 37) % 90)}" height="7" rx="3" fill="${colors[i % 5]}" opacity=".9"/>`;
    }
    m += `<rect x="${x + w / 2 - 10}" y="${y + h}" width="20" height="40" fill="#8d9bb8"/><rect x="${x + w / 2 - 50}" y="${y + h + 38}" width="100" height="10" rx="5" fill="#b4bfd6"/>`;
    return m;
  };
  let s = mon(110, 110, 300, 190) + mon(450, 150, 240, 160);
  s += B(430, 440, 260, 130, 14, 'steel');
  for (let r = 0; r < 3; r++) for (let c = 0; c < 9; c++) s += `<rect x="${215 + c * 17 + r * 0}" y="${406 + r * 7 - c * 8.5}" width="11" height="5" fill="#8d9bb8" transform="skewY(0)"/>`;
  s += `<text x="580" y="420" font-family="monospace" font-size="64" fill="${GOLD2}" font-weight="bold">{ }</text>`;
  return s;
};

// WEB DESIGNING: laptop + phone + code brackets
art.web = () => {
  let s = `<path d="M170 380 L130 420 H690 L650 380 Z" fill="#b4bfd6"/><rect x="170" y="130" width="480" height="250" rx="14" fill="#e4eaf6"/><rect x="184" y="144" width="452" height="222" rx="6" fill="#0a1736"/>`;
  s += `<rect x="184" y="144" width="452" height="26" fill="#1d3877"/>` + [0, 1, 2].map((i) => `<circle cx="${202 + i * 18}" cy="157" r="5" fill="${[GOLD2, '#9fe0b5', '#ff9d8a'][i]}"/>`).join('');
  s += `<rect x="206" y="190" width="240" height="22" rx="4" fill="${GOLD}"/><rect x="206" y="226" width="180" height="10" rx="4" fill="#fff" opacity=".8"/><rect x="206" y="246" width="210" height="10" rx="4" fill="#fff" opacity=".5"/>`;
  s += `<rect x="206" y="284" width="96" height="62" rx="6" fill="#2b55b8"/><rect x="314" y="284" width="96" height="62" rx="6" fill="#2b55b8"/><rect x="422" y="284" width="96" height="62" rx="6" fill="#2b55b8"/><rect x="530" y="190" width="86" height="156" rx="6" fill="#16367a"/>`;
  s += `<rect x="590" y="215" width="130" height="240" rx="18" fill="#e4eaf6"/><rect x="598" y="233" width="114" height="204" rx="8" fill="#0a1736"/><rect x="608" y="248" width="94" height="18" rx="4" fill="${GOLD}"/><rect x="608" y="278" width="94" height="52" rx="5" fill="#2b55b8"/><rect x="608" y="340" width="94" height="10" rx="4" fill="#fff" opacity=".7"/><rect x="608" y="358" width="70" height="10" rx="4" fill="#fff" opacity=".4"/>`;
  s += `<text x="60" y="110" font-family="monospace" font-size="42" fill="${GOLD2}" font-weight="bold">&lt;html&gt;</text><text x="610" y="110" font-family="monospace" font-size="42" fill="${WHITE}" opacity=".85" font-weight="bold">{css}</text><text x="190" y="470" font-family="monospace" font-size="34" fill="#9fe0b5" font-weight="bold">JS( )</text>`;
  return s;
};

// PLASTIC TECHNOLOGY: moulding
art.plastic = () => {
  let s = B(400, 440, 260, 200, 70, 'dark');               // base press
  s += B(400, 330, 230, 170, 60, 'steel');                  // lower mould half
  s += B(400, 235, 230, 170, 60, 'blue');                   // upper mould half (open)
  s += `<rect x="388" y="236" width="24" height="76" fill="${GOLD}" opacity=".9"/>`;
  s += `<rect x="360" y="90" width="80" height="20" fill="#8d9bb8"/><rect x="392" y="108" width="16" height="64" fill="#b4bfd6"/>`;
  // bottles
  const bottle = (x, y, c) => `<path d="M${x} ${y} h26 v-20 h8 v-26 h-42 v26 h8 z" fill="${c}" opacity=".95"/><rect x="${x - 2}" y="${y - 78}" width="${46}" height="10" fill="#fff" opacity=".8"/>`;
  s += bottle(100, 430, '#9fe0b5').replace('h26', 'h44').replace('v-20', 'v-90') + `<rect x="95" y="372" width="50" height="62" rx="12" fill="#5b7fd1"/><rect x="108" y="350" width="24" height="26" fill="#fff" opacity=".8"/>`;
  s += `<rect x="640" y="380" width="70" height="54" rx="8" fill="${GOLD}"/><rect x="655" y="360" width="40" height="24" rx="4" fill="${GOLD2}"/>`;
  for (let i = 0; i < 22; i++) s += `<circle cx="${150 + ((i * 53) % 90)}" cy="${455 - ((i * 29) % 26)}" r="4" fill="${i % 2 ? GOLD2 : WHITE}" opacity=".85"/>`;
  return s;
};

// POLYMER TECHNOLOGY: materials + testing
art.polymer = () => {
  let s = '';
  // molecular chain
  const chain = [[90, 120], [150, 90], [215, 125], [280, 92], [345, 128], [410, 95]];
  s += `<polyline points="${pts(chain)}" fill="none" stroke="${GOLD2}" stroke-width="6"/>` + chain.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 14 : 18}" fill="${i % 2 ? WHITE : GOLD}"/>`).join('');
  // flask
  s += `<path d="M230 220 h60 v90 l70 120 q10 24 -18 24 h-164 q-28 0 -18 -24 l70 -120 z" fill="#dfe6f2" opacity=".92"/><path d="M200 400 l30 -50 h60 l30 50 q10 30 -20 30 h-80 q-30 0 -20 -30z" fill="#5b7fd1"/><rect x="224" y="204" width="72" height="18" rx="6" fill="#b4bfd6"/>`;
  s += `<circle cx="250" cy="395" r="8" fill="#fff" opacity=".7"/><circle cx="280" cy="380" r="6" fill="#fff" opacity=".7"/>`;
  // tensile test specimen in grips
  s += B(560, 440, 170, 90, 18, 'dark');
  s += `<rect x="520" y="165" width="20" height="40" fill="#8d9bb8"/><rect x="590" y="165" width="20" height="40" fill="#8d9bb8"/>`;
  s += `<path d="M512 205 h106 v30 h-18 v90 h18 v30 h-106 v-30 h18 v-90 h-18 z" fill="${GOLD}"/>`;
  s += `<rect x="520" y="355" width="90" height="26" fill="#8d9bb8"/><path d="M700 200 v-60 m-14 14 l14 -14 l14 14 M700 340 v60 m-14 -14 l14 14 l14 -14" stroke="${GOLD2}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  return s;
};

// LOGISTIC TECHNOLOGY: warehouse + truck
art.logistic = () => {
  let s = `<rect x="0" y="430" width="800" height="70" fill="#0a1736" opacity=".7"/>`;
  // shelves
  for (let i = 0; i < 2; i++) {
    const x = 120 + i * 190;
    s += `<rect x="${x}" y="150" width="8" height="280" fill="${GOLD2}"/><rect x="${x + 150}" y="150" width="8" height="280" fill="${GOLD2}"/>`;
    [200, 290, 380].forEach((y, j) => {
      s += `<rect x="${x}" y="${y + 40}" width="158" height="8" fill="${GOLD}"/>`;
      s += `<rect x="${x + 14}" y="${y - 12}" width="52" height="52" fill="${['#d9a05b', '#c28a45', '#e0b070'][(i + j) % 3]}"/><rect x="${x + 74}" y="${y + 6}" width="66" height="34" fill="${['#c28a45', '#e0b070', '#d9a05b'][(i + j) % 3]}"/>`;
      s += `<rect x="${x + 14}" y="${y + 6}" width="52" height="6" fill="#fff" opacity=".35"/>`;
    });
  }
  // truck
  s += `<rect x="470" y="270" width="230" height="130" rx="6" fill="#e4eaf6"/><rect x="470" y="270" width="230" height="22" fill="${GOLD}"/><path d="M700 310 h60 l36 50 v40 h-96 z" fill="#5b7fd1"/><path d="M712 322 h42 l24 32 h-66 z" fill="#0a1736"/>`;
  s += `<circle cx="530" cy="404" r="26" fill="#0a1736"/><circle cx="530" cy="404" r="11" fill="#b4bfd6"/><circle cx="740" cy="404" r="26" fill="#0a1736"/><circle cx="740" cy="404" r="11" fill="#b4bfd6"/>`;
  // route markers
  s += `<path d="M120 90 C260 40 420 140 620 70" stroke="${GOLD2}" stroke-width="3" stroke-dasharray="8 8" fill="none"/><circle cx="120" cy="90" r="10" fill="${GOLD}"/><circle cx="620" cy="70" r="10" fill="${WHITE}"/>`;
  return s;
};

// BASIC ENGINEERING: technical drawing, science, workshop
art.basic = () => {
  let s = `<rect x="90" y="90" width="420" height="300" rx="6" fill="#f5f8ff"/><rect x="90" y="90" width="420" height="300" rx="6" fill="none" stroke="${GOLD}" stroke-width="3"/>`;
  s += `<g fill="none" stroke="${NAVY2}" stroke-width="3"><rect x="140" y="150" width="110" height="80"/><path d="M140 150 l40 -34 h110 l-40 34 M290 116 v80 l-40 34"/><circle cx="380" cy="190" r="48"/><path d="M380 130 v120 M320 190 h120" stroke-dasharray="8 5"/></g>`;
  s += `<g fill="none" stroke="${GOLD}" stroke-width="2"><path d="M140 262 h110 M140 256 v12 M250 256 v12"/><path d="M140 300 h300" stroke-dasharray="3 6"/></g><text x="190" y="284" font-family="Arial" font-size="13" fill="${NAVY2}">110</text>`;
  // T-square & set-square
  s += `<rect x="70" y="360" width="470" height="18" rx="3" fill="${GOLD}"/><rect x="70" y="330" width="22" height="80" rx="3" fill="#a8861a"/>`;
  s += `<polygon points="560,400 700,400 560,270" fill="#dfe6f2" opacity=".92"/><polygon points="582,386 664,386 582,314" fill="${NAVY}" opacity=".35"/>`;
  // compass
  s += `<g stroke="#e4eaf6" stroke-width="7" stroke-linecap="round"><path d="M640 120 L600 230 M640 120 L690 230"/></g><circle cx="640" cy="112" r="14" fill="${GOLD}"/><path d="M600 230 l-3 14 l6 -2z" fill="#fff"/>`;
  // atom
  s += `<g fill="none" stroke="${GOLD2}" stroke-width="2.5"><ellipse cx="690" cy="330" rx="46" ry="16"/><ellipse cx="690" cy="330" rx="46" ry="16" transform="rotate(60 690 330)"/><ellipse cx="690" cy="330" rx="46" ry="16" transform="rotate(-60 690 330)"/></g><circle cx="690" cy="330" r="9" fill="${GOLD}"/>`;
  // small gear
  s += gear(580, 170, 36, 9, GOLD2, 8);
  return s;
};

// HERO: campus scene (illustrative fallback for the home page)
art.campus = () => {
  let s = `<circle cx="640" cy="120" r="70" fill="${GOLD2}" opacity=".28"/><circle cx="640" cy="120" r="38" fill="${GOLD2}" opacity=".7"/>`;
  s += `<rect x="0" y="400" width="800" height="100" fill="#0a1736" opacity=".75"/>`;
  s += B(400, 420, 300, 120, 120, 'white') + B(400, 300, 300, 120, 20, 'gold');
  s += B(300, 430, 100, 90, 60, 'steel') + B(560, 420, 90, 80, 90, 'steel');
  s += `<rect x="330" y="248" width="56" height="48" fill="${NAVY2}"/><polygon points="330,248 358,214 386,248" fill="${GOLD}"/>`;
  for (let i = 0; i < 8; i++) s += `<rect x="${200 + i * 50}" y="${340 - i * 0}" width="18" height="24" fill="${NAVY2}" opacity=".55" transform="skewY(${i < 4 ? 0 : 0})"/>`;
  s += `<path d="M395 420 L395 470" stroke="${GOLD2}" stroke-width="3"/>`;
  return s;
};

fs.mkdirSync(out, { recursive: true });
const labels = {
  civil: 'Illustration of an architectural model and surveying instrument',
  mechanical: 'Illustration of a CNC machine and gears',
  eee: 'Illustration of a motor, circuit traces and control panel',
  computer: 'Illustration of coding workstations',
  web: 'Illustration of a responsive website on laptop and phone',
  plastic: 'Illustration of plastic moulding equipment',
  polymer: 'Illustration of polymer materials and testing',
  logistic: 'Illustration of warehouse shelving and a delivery truck',
  basic: 'Illustration of technical drawing instruments and science symbols',
  campus: 'Illustration of a college building',
};
Object.keys(art).forEach((k) => {
  fs.writeFileSync(path.join(out, `art-${k}.svg`), frame(art[k](), labels[k]));
  console.log('wrote art-' + k + '.svg');
});
