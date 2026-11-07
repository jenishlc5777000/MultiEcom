// Generates stylised demo "product photos" (SVG) into public/demo/.
// Placeholders only: replace with real photography uploaded to Cloudinary.
import { mkdirSync, writeFileSync } from "node:fs";

const out = "public/demo";
mkdirSync(out, { recursive: true });

const W = 800, H = 1000;
const frame = (bg, floor, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
  <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient>
  <radialGradient id="light" cx="0.3" cy="0.2" r="0.9"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <radialGradient id="shadow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#wall)"/>
<rect y="${H * 0.68}" width="${W}" height="${H * 0.32}" fill="${floor}"/>
<rect width="${W}" height="${H}" fill="url(#light)"/>
${body}
</svg>`;

const speckles = (cx, cy, rx, ry, color, n = 70, seed = 1) => {
  let s = seed, dots = "";
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd());
    dots += `<circle cx="${(cx + Math.cos(a) * rx * r).toFixed(1)}" cy="${(cy + Math.sin(a) * ry * r).toFixed(1)}" r="${(1 + rnd() * 2.2).toFixed(1)}" fill="${color}" opacity=".55"/>`;
  }
  return dots;
};

const mug = (glaze, rim, { handle = true, speck = false } = {}) => `
<ellipse cx="400" cy="745" rx="210" ry="26" fill="url(#shadow)"/>
${handle ? `<path d="M545 470 C660 470 660 650 540 650" fill="none" stroke="${glaze}" stroke-width="38" stroke-linecap="round"/>` : ""}
<path d="M250 410 L550 410 L540 700 Q535 740 495 742 L305 742 Q265 740 260 700 Z" fill="${glaze}"/>
<path d="M250 410 L550 410 L540 700 Q535 740 495 742 L305 742 Q265 740 260 700 Z" fill="url(#shade)"/>
<path d="M262 650 L538 650 L540 700 Q535 740 495 742 L305 742 Q265 740 260 700 Z" fill="#b99c7c"/>
${speck ? speckles(400, 540, 130, 120, "#5a4a3a", 90, 7) : ""}
<ellipse cx="400" cy="410" rx="150" ry="22" fill="${rim}"/>
<ellipse cx="400" cy="413" rx="132" ry="15" fill="#000" opacity=".25"/>`;

const bowl = (glaze, inner, { lines = false } = {}) => `
<ellipse cx="400" cy="740" rx="270" ry="28" fill="url(#shadow)"/>
<path d="M120 520 Q140 740 400 742 Q660 740 680 520 Z" fill="${glaze}"/>
<path d="M120 520 Q140 740 400 742 Q660 740 680 520 Z" fill="url(#shade)"/>
${lines ? [0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${200 + i * 62} 535 q6 70 -2 150" stroke="#e8eef2" stroke-width="5" fill="none" opacity=".7" stroke-linecap="round"/>`).join("") : ""}
<ellipse cx="400" cy="520" rx="280" ry="48" fill="${inner}"/>
<ellipse cx="400" cy="528" rx="250" ry="36" fill="#000" opacity=".12"/>`;

const planter = (glaze) => `
<ellipse cx="400" cy="745" rx="200" ry="24" fill="url(#shadow)"/>
<path d="M330 300 C300 200 360 150 400 120 C410 190 380 250 360 300 Z" fill="#55724f"/>
<path d="M420 300 C460 180 540 170 580 150 C540 230 480 270 440 305 Z" fill="#6b8a62"/>
<path d="M380 300 C340 230 250 230 220 210 C260 280 320 300 370 310 Z" fill="#4c6846"/>
<path d="M260 330 L540 330 L515 700 Q510 742 470 742 L330 742 Q290 742 285 700 Z" fill="${glaze}"/>
<path d="M260 330 L540 330 L515 700 Q510 742 470 742 L330 742 Q290 742 285 700 Z" fill="url(#shade)"/>
<rect x="245" y="320" width="310" height="36" rx="8" fill="${glaze}"/>
<rect x="245" y="320" width="310" height="36" rx="8" fill="#000" opacity=".08"/>`;

const kit = () => `
<ellipse cx="400" cy="755" rx="300" ry="26" fill="url(#shadow)"/>
<rect x="140" y="430" width="520" height="320" rx="10" fill="#c9b79c"/>
<rect x="140" y="430" width="520" height="60" fill="#b8a487"/>
<rect x="190" y="520" width="200" height="60" rx="6" fill="#f3efe7"/>
<text x="290" y="558" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="#1A1917">CLAY KIT</text>
<circle cx="520" cy="350" r="85" fill="#a7826a"/>
<circle cx="520" cy="350" r="85" fill="url(#shade)"/>
<rect x="300" y="250" width="22" height="200" rx="10" fill="#8a5a12" transform="rotate(-18 311 350)"/>
<rect x="360" y="280" width="14" height="170" rx="6" fill="#64605A" transform="rotate(12 367 365)"/>`;

const plate = (glaze, rim) => `
<ellipse cx="400" cy="735" rx="300" ry="30" fill="url(#shadow)"/>
<ellipse cx="400" cy="690" rx="300" ry="62" fill="${glaze}"/>
<ellipse cx="400" cy="690" rx="300" ry="62" fill="url(#shade)"/>
<ellipse cx="400" cy="682" rx="250" ry="44" fill="${rim}"/>
<ellipse cx="400" cy="686" rx="170" ry="26" fill="#000" opacity=".07"/>`;

const vase = (glaze, { speck = false } = {}) => `
<ellipse cx="400" cy="748" rx="170" ry="22" fill="url(#shadow)"/>
<path d="M360 250 L440 250 L436 320 C560 380 560 620 470 742 L330 742 C240 620 240 380 364 320 Z" fill="${glaze}"/>
<path d="M360 250 L440 250 L436 320 C560 380 560 620 470 742 L330 742 C240 620 240 380 364 320 Z" fill="url(#shade)"/>
${speck ? speckles(400, 520, 120, 170, "#5a4a3a", 80, 11) : ""}
<ellipse cx="400" cy="250" rx="42" ry="10" fill="#000" opacity=".25"/>
<path d="M398 250 C390 170 420 120 440 90" stroke="#55724f" stroke-width="6" fill="none"/>
<circle cx="442" cy="88" r="16" fill="#E7A07F"/>`;

const tools = () => `
<ellipse cx="400" cy="750" rx="300" ry="24" fill="url(#shadow)"/>
<rect x="150" y="600" width="500" height="140" rx="14" fill="#8a6a4a"/>
<rect x="150" y="600" width="500" height="26" rx="10" fill="#7a5c3e"/>
<rect x="230" y="300" width="28" height="330" rx="12" fill="#c9a77c" transform="rotate(-10 244 465)"/>
<path d="M220 300 q24 -60 48 0 z" fill="#64605A" transform="rotate(-10 244 300)"/>
<rect x="330" y="260" width="24" height="370" rx="10" fill="#b88f62"/>
<circle cx="342" cy="250" r="26" fill="none" stroke="#64605A" stroke-width="8"/>
<rect x="430" y="320" width="26" height="310" rx="10" fill="#c9a77c" transform="rotate(8 443 475)"/>
<path d="M425 320 l36 0 l-8 -70 l-20 0 z" fill="#8f8a82" transform="rotate(8 443 320)"/>
<ellipse cx="560" cy="560" rx="60" ry="44" fill="#E6D9C2"/>`;

const paints = () => `
<ellipse cx="400" cy="752" rx="310" ry="24" fill="url(#shadow)"/>
${[["#C0704C", 210], ["#9DBFA9", 330], ["#2F4F6F", 450], ["#E6B655", 570]].map(([c, x]) => `
<rect x="${x - 50}" y="520" width="100" height="220" rx="16" fill="#f3efe7"/>
<rect x="${x - 50}" y="600" width="100" height="140" rx="0" fill="${c}"/>
<rect x="${x - 56}" y="500" width="112" height="40" rx="10" fill="#3a3733"/>`).join("")}
<rect x="380" y="250" width="16" height="280" rx="8" fill="#b88f62" transform="rotate(20 388 390)"/>
<path d="M372 240 q16 -50 32 0 z" fill="#1A1917" transform="rotate(20 388 240)"/>`;

const wallArt = () => `
<rect x="170" y="170" width="460" height="460" rx="6" fill="#f3efe7"/>
<rect x="170" y="170" width="460" height="460" rx="6" fill="none" stroke="#8a6a4a" stroke-width="18"/>
${[0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => `<rect x="${205 + c * 135}" y="${205 + r * 135}" width="120" height="120" rx="8" fill="${["#9DBFA9", "#2F4F6F", "#C0704C", "#E6D9C2"][(r + c) % 4]}"/><circle cx="${265 + c * 135}" cy="${265 + r * 135}" r="30" fill="#fff" opacity=".35"/>`)).join("")}
<ellipse cx="400" cy="760" rx="220" ry="18" fill="url(#shadow)"/>`;

const ceramicsGroup = () => `
<g transform="translate(-150 40) scale(.8)">${vase("#2F4F6F")}</g>
<g transform="translate(260 120) scale(.7)">${mug("#C0704C", "#D08865")}</g>
<g transform="translate(120 330) scale(.7)">${bowl("#E6D9C2", "#F1E8D8")}</g>`;

const stone = ["#ECE8E1", "#DED7CB"], stoneFloor = "#D3CABB";
const sage = ["#DCE3DC", "#CBD5CC"], sageFloor = "#BCC8BE";
const clay = ["#EBDDD2", "#DCC8B8"], clayFloor = "#CDB6A3";
const ink = ["#3a3733", "#2a2825"], inkFloor = "#211f1c";
const blue = ["#E1E5EA", "#CFD6DE"], blueFloor = "#BFC8D2";

const files = {
  "mug-celadon.svg": frame(sage, sageFloor, mug("#9DBFA9", "#B5D2BF")),
  "mug-celadon-side.svg": frame(stone, stoneFloor, mug("#9DBFA9", "#B5D2BF", { handle: false })),
  "mug-celadon-large.svg": frame(clay, clayFloor, mug("#8FB59D", "#A9CBB5")),
  "mug-oat.svg": frame(stone, stoneFloor, mug("#E6D9C2", "#F1E8D8", { speck: true })),
  "bowl-monsoon.svg": frame(blue, blueFloor, bowl("#2F4F6F", "#3E6386", { lines: true })),
  "bowl-monsoon-top.svg": frame(stone, stoneFloor, bowl("#34587B", "#4A709A", { lines: true })),
  "cat-mugs.svg": frame(clay, clayFloor, mug("#C0704C", "#D08865")),
  "cat-bowls.svg": frame(sage, sageFloor, bowl("#E6D9C2", "#F1E8D8")),
  "cat-planters.svg": frame(stone, stoneFloor, planter("#B4532A")),
  "cat-kits.svg": frame(clay, clayFloor, kit()),
  "hero.svg": frame(ink, inkFloor, mug("#E6D9C2", "#F1E8D8", { speck: true })),
  // Category tree: Ceramics / Art & Craft and the new subcategories
  "cat-ceramics.svg": frame(stone, stoneFloor, ceramicsGroup()),
  "cat-art-craft.svg": frame(clay, clayFloor, paints()),
  "cat-plates.svg": frame(blue, blueFloor, plate("#E6D9C2", "#F1E8D8")),
  "plate-celadon.svg": frame(sage, sageFloor, plate("#9DBFA9", "#B5D2BF")),
  "cat-vases.svg": frame(clay, clayFloor, vase("#2F4F6F")),
  "vase-oat.svg": frame(stone, stoneFloor, vase("#E6D9C2", { speck: true })),
  "cat-tools.svg": frame(stone, stoneFloor, tools()),
  "cat-paints.svg": frame(sage, sageFloor, paints()),
  "cat-wall-art.svg": frame(stone, stoneFloor, wallArt()),
};

for (const [name, svg] of Object.entries(files)) writeFileSync(`${out}/${name}`, svg);
console.log(`Wrote ${Object.keys(files).length} demo images to ${out}/`);
