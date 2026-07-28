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
function bowlSvg({ size = 1024, background = null, bowlColor = "#ffffff", scale = 1, offsetY = 0 }) {
  const cx = size / 2;
  const r = size * 0.34 * scale;
  const rimRy = r * 0.19;
  // Centre verticalement l'ensemble rebord+corps (et non le seul point de
  // jonction) : sans ça, le bol paraît décalé vers le bas dans le cadre.
  const rimY = size / 2 - (r - rimRy) / 2 + offsetY;
  const holeRx = r * 0.83;
  const holeRy = rimRy * 0.75;
  const bodyPath = `M ${cx - r},${rimY} A ${r},${r} 0 0 0 ${cx + r},${rimY} Z`;

  const backgroundRect = background ? `<rect x="0" y="0" width="${size}" height="${size}" fill="${background}"/>` : "";

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <mask id="bowlMask">
        <rect x="0" y="0" width="${size}" height="${size}" fill="black"/>
        <path d="${bodyPath}" fill="white"/>
        <ellipse cx="${cx}" cy="${rimY}" rx="${r}" ry="${rimRy}" fill="white"/>
        <ellipse cx="${cx}" cy="${rimY - size * 0.006}" rx="${holeRx}" ry="${holeRy}" fill="black"/>
      </mask>
    </defs>
    ${backgroundRect}
    <g mask="url(#bowlMask)">
      <rect x="0" y="0" width="${size}" height="${size}" fill="${bowlColor}"/>
    </g>
  </svg>`;
}

async function render(svg, size, outPath) {
  await sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toFile(outPath);
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

  // Splash : bol seul sur fond transparent (le fond bleu est déjà géré par
  // expo-splash-screen).
  await render(
    bowlSvg({ size: 512, background: null, bowlColor: "#ffffff", scale: 0.75, offsetY: -10 }),
    228,
    `${OUT_DIR}/splash-icon.png`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
