import { detectImageType, MAX_PHOTO_BASE64_LENGTH, validateBackupPhotos } from "./backupPhotoValidation";
import { BackupValidationError } from "./backupValidation";

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).toString("base64");
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4, 5, 6, 7, 8]).toString("base64");
const TEXT = Buffer.from("ceci n'est pas une image").toString("base64");

const rows = { containers: [{ id: 1 }], foods: [{ id: 7 }] };
const photo = (overrides: Record<string, unknown> = {}) => ({
  table: "containers",
  id: 1,
  mimeType: "image/jpeg",
  data: JPEG,
  ...overrides,
});

function expectRejected(value: unknown, message: RegExp) {
  expect(() => validateBackupPhotos(value, rows)).toThrow(BackupValidationError);
  expect(() => validateBackupPhotos(value, rows)).toThrow(message);
}

describe("detectImageType", () => {
  it("reconnaît une image d'après ses premiers octets", () => {
    expect(detectImageType(JPEG)).toBe("image/jpeg");
    expect(detectImageType(PNG)).toBe("image/png");
    expect(detectImageType(TEXT)).toBeNull();
    expect(detectImageType("%%%")).toBeNull();
  });
});

describe("validateBackupPhotos", () => {
  it("accepte une sauvegarde sans photos (antérieure à la 1.16)", () => {
    expect(validateBackupPhotos(undefined, rows)).toEqual([]);
  });

  it("garde les photos valides et retire les clés inconnues", () => {
    const result = validateBackupPhotos(
      [photo({ extra: "ignoré" }), photo({ table: "foods", id: 7, mimeType: "image/png", data: PNG })],
      rows
    );
    expect(result).toEqual([photo(), photo({ table: "foods", id: 7, mimeType: "image/png", data: PNG })]);
  });

  it("rejette un contenu qui n'est pas une image du type annoncé", () => {
    expectRejected([photo({ data: TEXT })], /photos\[0\]\.data/);
    expectRejected([photo({ mimeType: "image/png" })], /photos\[0\]\.data/);
  });

  it("rejette un base64 invalide ou trop long", () => {
    expectRejected([photo({ data: `${JPEG}!` })], /base64 invalide/);
    expectRejected([photo({ data: "A".repeat(MAX_PHOTO_BASE64_LENGTH + 4) })], /photos\[0\]\.data/);
  });

  it("rejette une table, un identifiant ou un type d'image inconnus", () => {
    expectRejected([photo({ table: "settings" })], /photos\[0\]\.table/);
    expectRejected([photo({ id: -1 })], /photos\[0\]\.id/);
    expectRejected([photo({ mimeType: "image/svg+xml" })], /photos\[0\]\.mimeType/);
  });

  it("rejette une photo sans ligne correspondante ou en double", () => {
    expectRejected([photo({ id: 2 })], /containers introuvable/);
    expectRejected([photo(), photo()], /en double/);
  });

  it("rejette plus de photos que de lignes, ou autre chose qu'une liste", () => {
    expectRejected([photo(), photo(), photo()], /trop de photos/);
    expectRejected({ photo: photo() }, /photos :/);
  });
});
