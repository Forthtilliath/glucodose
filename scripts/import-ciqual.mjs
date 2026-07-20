// Convertit la table Ciqual (Anses, licence ouverte Etalab) téléchargée
// manuellement en assets/data/ciqual.json : juste {name, carbsPer100g},
// utilisé comme aide à la saisie dans le formulaire d'ajout d'ingrédient.
// À relancer si Ciqual publie une nouvelle version (nouveau fichier XLS dans
// scripts/ciqual-source/).
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import XLSX from "xlsx";

const SOURCE_DIR = "scripts/ciqual-source";
const OUTPUT_PATH = "assets/data/ciqual.json";

function normalizeHeader(header) {
  return String(header)
    .replace(/\s+/g, " ")
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function findSourceFile() {
  const explicitPath = process.argv[2];
  if (explicitPath) return explicitPath;

  if (!existsSync(SOURCE_DIR)) {
    throw new Error(
      `Dossier ${SOURCE_DIR} introuvable. Télécharge le fichier Ciqual (XLS/XLSX) depuis ` +
        "https://www.data.gouv.fr/datasets/table-de-composition-nutritionnelle-des-aliments-ciqual/ " +
        `et place-le dans ${SOURCE_DIR}/.`
    );
  }
  const candidate = readdirSync(SOURCE_DIR).find((f) => /\.xlsx?$/i.test(f));
  if (!candidate) {
    throw new Error(`Aucun fichier .xls/.xlsx trouvé dans ${SOURCE_DIR}/.`);
  }
  return join(SOURCE_DIR, candidate);
}

function findColumnIndexes(headerRow) {
  const normalized = headerRow.map(normalizeHeader);
  const nameIndex = normalized.findIndex((h) => h === "alim_nom_fr");
  const carbsIndex = normalized.findIndex((h) => h.includes("glucide") && !h.includes("sucre"));

  if (nameIndex === -1 || carbsIndex === -1) {
    throw new Error(
      "Colonnes attendues introuvables dans l'en-tête. " +
        `Nom trouvé: ${nameIndex}, Glucides trouvé: ${carbsIndex}. En-têtes bruts: ${JSON.stringify(headerRow)}`
    );
  }
  console.log(`Colonne nom: "${headerRow[nameIndex]}" (index ${nameIndex})`);
  console.log(`Colonne glucides: "${headerRow[carbsIndex]}" (index ${carbsIndex})`);
  return { nameIndex, carbsIndex };
}

function parseCarbs(raw) {
  const cleaned = String(raw).replace(/\s+/g, " ").trim().toLowerCase();
  if (cleaned === "" || cleaned === "-" || cleaned === "traces") return null;
  if (!/^\d+([.,]\d+)?$/.test(cleaned)) return null; // exclut "< 0,2", "traces", etc.
  const value = parseFloat(cleaned.replace(",", "."));
  if (Number.isNaN(value) || value < 0 || value > 100) return null;
  return Math.round(value * 100) / 100;
}

function main() {
  const sourcePath = findSourceFile();
  console.log(`Lecture de ${sourcePath}...`);
  const workbook = XLSX.readFile(sourcePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  const [headerRow, ...dataRows] = rows;
  const { nameIndex, carbsIndex } = findColumnIndexes(headerRow);

  const seen = new Set();
  const entries = [];
  let excluded = 0;
  let duplicates = 0;

  for (const row of dataRows) {
    const name = String(row[nameIndex] ?? "").replace(/\s+/g, " ").trim();
    const carbsPer100g = parseCarbs(row[carbsIndex]);
    if (!name || carbsPer100g === null) {
      excluded++;
      continue;
    }
    const key = `${name}||${carbsPer100g}`;
    if (seen.has(key)) {
      duplicates++;
      continue;
    }
    seen.add(key);
    entries.push({ name, carbsPer100g });
  }

  entries.sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));

  mkdirSync("assets/data", { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(entries));

  console.log(`Lignes lues: ${dataRows.length}`);
  console.log(`Exclues (glucides manquant/invalide): ${excluded}`);
  console.log(`Doublons ignorés: ${duplicates}`);
  console.log(`Entrées finales: ${entries.length}`);
  console.log(`Écrit dans ${OUTPUT_PATH}`);
}

main();
