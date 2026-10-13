import { z } from "zod";

import { BackupValidationError } from "./backupValidation";

// Photos incluses dans une sauvegarde : une entrée par récipient ou aliment
// ayant une photo, l'image elle-même encodée en base64. Comme le reste d'un
// import, chaque entrée est vérifiée et la moindre anomalie rejette le
// fichier entier : rien n'est écrit sur le téléphone.

export const PHOTO_TABLES = ["containers", "foods"] as const;
export type PhotoTable = (typeof PHOTO_TABLES)[number];

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type ImageType = (typeof IMAGE_TYPES)[number];

// Les photos de l'app font 800 px de côté (~100 Ko) : 3 Mo de base64 (~2,2 Mo
// d'image) laissent une marge large sans accepter n'importe quelle taille.
export const MAX_PHOTO_BASE64_LENGTH = 3 * 1024 * 1024;
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

// Type réel d'une image d'après ses premiers octets (signature), pour ne
// jamais écrire comme photo un fichier qui n'en est pas une.
export function detectImageType(base64: string): ImageType | null {
  let head: string;
  try {
    head = atob(base64.slice(0, 16));
  } catch {
    return null;
  }
  const bytes = Array.from(head, (char) => char.charCodeAt(0));
  const startsWith = (signature: number[], offset = 0) =>
    signature.every((byte, index) => bytes[offset + index] === byte);
  if (startsWith([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (head.startsWith("RIFF") && head.slice(8, 12) === "WEBP") return "image/webp";
  return null;
}

const backupPhotoSchema = z
  .object({
    table: z.enum(PHOTO_TABLES),
    id: z.number().int().positive(),
    mimeType: z.enum(IMAGE_TYPES),
    data: z.string().min(16).max(MAX_PHOTO_BASE64_LENGTH).regex(BASE64, "base64 invalide"),
  })
  .refine((photo) => detectImageType(photo.data) === photo.mimeType, {
    message: "ce n'est pas une image du type annoncé",
    path: ["data"],
  });

export type BackupPhoto = z.infer<typeof backupPhotoSchema>;

type RowsWithPhotos = Record<PhotoTable, { id?: number }[]>;

// Valide la liste `photos` d'une sauvegarde déjà validée par ailleurs (les
// lignes de récipients et d'aliments). Absente des anciennes sauvegardes :
// liste vide. Chaque photo doit correspondre à une ligne du fichier, une
// seule fois.
export function validateBackupPhotos(value: unknown, rows: RowsWithPhotos): BackupPhoto[] {
  if (value === undefined) return [];
  const maxPhotos = rows.containers.length + rows.foods.length;
  const result = z.array(backupPhotoSchema).max(maxPhotos, "trop de photos").safeParse(value);
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue.path.map((key) => (typeof key === "number" ? `[${key}]` : `.${String(key)}`)).join("");
    throw new BackupValidationError(`photos${where} : ${issue.message}.`);
  }

  const seen = new Set<string>();
  result.data.forEach((photo, index) => {
    const key = `${photo.table}:${photo.id}`;
    if (seen.has(key)) throw new BackupValidationError(`photos[${index}] : photo en double.`);
    seen.add(key);
    if (!rows[photo.table].some((row) => row.id === photo.id)) {
      throw new BackupValidationError(`photos[${index}] : ${photo.table} introuvable.`);
    }
  });
  return result.data;
}
