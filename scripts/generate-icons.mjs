// Génère les icônes de l'app (bol stylisé) à partir de formes SVG simples,
// plutôt que de dépendre d'un fichier source externe : à relancer après
// `npm i -D sharp` si le design doit être retouché (couleur, proportions...).
import { mkdirSync } from "node:fs";
import sharp from "sharp";

const BRAND_BLUE = "#208AEF";
const OUT_DIR = "assets/images";
mkdirSync(OUT_DIR, { recursive: true });

// Bol stylisé : demi-cercle (corps) + ellipse (rebord, vue légèrement en
// plongée), avec un creux ellipse réellement transparent (via un mask SVG,
// pas juste une couleur qui imiterait un trou). Formes pleines et simples
// pour rester lisible même à 48px (favicon).
// Fragment de <mask> réutilisable, exprimé autour d'un centre (cx, cy)
// arbitraire — utilisé aussi bien pour l'icône carrée que pour le splash
// (bol + texte empilés dans un canevas plus haut que large).
function bowlMaskFragment({ cx, cy, r }) {
  const rimRy = r * 0.19;
  const rimY = cy - (r - rimRy) / 2;
  const holeRx = r * 0.83;
  const holeRy = rimRy * 0.75;
  const bodyPath = `M ${cx - r},${rimY} A ${r},${r} 0 0 0 ${cx + r},${rimY} Z`;
  return `
    <path d="${bodyPath}" fill="white"/>
    <ellipse cx="${cx}" cy="${rimY}" rx="${r}" ry="${rimRy}" fill="white"/>
    <ellipse cx="${cx}" cy="${rimY - r * 0.02}" rx="${holeRx}" ry="${holeRy}" fill="black"/>`;
}

function bowlSvg({ size = 1024, background = null, bowlColor = "#ffffff", scale = 1, offsetY = 0 }) {
  const cx = size / 2;
  const r = size * 0.34 * scale;
  // Centre verticalement l'ensemble rebord+corps (et non le seul point de
  // jonction) : sans ça, le bol paraît décalé vers le bas dans le cadre.
  const cy = size / 2 + offsetY;
  const backgroundRect = background ? `<rect x="0" y="0" width="${size}" height="${size}" fill="${background}"/>` : "";

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <mask id="bowlMask">
        <rect x="0" y="0" width="${size}" height="${size}" fill="black"/>
        ${bowlMaskFragment({ cx, cy, r })}
      </mask>
    </defs>
    ${backgroundRect}
    <g mask="url(#bowlMask)">
      <rect x="0" y="0" width="${size}" height="${size}" fill="${bowlColor}"/>
    </g>
  </svg>`;
}

// Splash : bol + nom de l'app empilés dans un même visuel (le plugin
// expo-splash-screen ne centre qu'une seule image, pas de texte séparé
// possible nativement). Généré à haute résolution pour rester net une fois
// mis à l'échelle par le plugin (imageWidth), plutôt que d'agrandir une
// petite image et perdre en netteté.
function splashSvg({ width = 640, height = 860, bowlColor = "#ffffff", label = "GlucoDose" }) {
  const r = width * 0.34;
  const cx = width / 2;
  const cy = height * 0.36;
  const fontSize = width * 0.135;
  const textY = height * 0.82;

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <mask id="bowlMask">
        <rect x="0" y="0" width="${width}" height="${height}" fill="black"/>
        ${bowlMaskFragment({ cx, cy, r })}
      </mask>
    </defs>
    <g mask="url(#bowlMask)">
      <rect x="0" y="0" width="${width}" height="${height}" fill="${bowlColor}"/>
    </g>
    <text
      x="${cx}"
      y="${textY}"
      font-family="Arial, Helvetica, sans-serif"
      font-weight="700"
      font-size="${fontSize}"
      fill="${bowlColor}"
      text-anchor="middle"
    >${label}</text>
  </svg>`;
}

async function render(svg, size, outPath) {
  await sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toFile(outPath);
  console.log("✓", outPath);
}

// Rendu sans forcer un carré, pour le splash (bol + texte) dont le canevas
// est plus haut que large.
async function renderSized(svg, width, height, outPath) {
  await sharp(Buffer.from(svg), { density: 300 }).resize(width, height).png().toFile(outPath);
  console.log("✓", outPath);
}

async function main() {
  // Icône générique / favicon : fond bleu + bol blanc, creux qui laisse voir le fond bleu.
  await render(bowlSvg({ size: 1024, background: BRAND_BLUE, bowlColor: "#ffffff" }), 1024, `${OUT_DIR}/icon.png`);
  await render(bowlSvg({ size: 512, background: BRAND_BLUE, bowlColor: "#ffffff" }), 48, `${OUT_DIR}/favicon.png`);

  // Android adaptive icon : foreground transparent (bol un peu plus petit,
  // marge de sécurité), background uni, monochrome (silhouette seule, creux
  // réellement transparent pour le rendu système).
  await render(
    bowlSvg({ size: 512, background: null, bowlColor: "#ffffff", scale: 0.8 }),
    512,
    `${OUT_DIR}/android-icon-foreground.png`
  );
  await render(
    `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" fill="${BRAND_BLUE}"/></svg>`,
    512,
    `${OUT_DIR}/android-icon-background.png`
  );
  await render(
    bowlSvg({ size: 432, background: null, bowlColor: "#ffffff", scale: 0.8 }),
    432,
    `${OUT_DIR}/android-icon-monochrome.png`
  );

  // Splash : bol + nom de l'app, sur fond transparent (le fond bleu est déjà
  // géré par expo-splash-screen). Haute résolution pour rester net une fois
  // mis à l'échelle par le plugin (imageWidth dans app.json).
  const SPLASH_WIDTH = 640;
  const SPLASH_HEIGHT = 860;
  await renderSized(
    splashSvg({ width: SPLASH_WIDTH, height: SPLASH_HEIGHT, bowlColor: "#ffffff", label: "GlucoDose" }),
    SPLASH_WIDTH,
    SPLASH_HEIGHT,
    `${OUT_DIR}/splash-icon.png`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
