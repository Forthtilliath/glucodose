import { File, resetFakeFileSystem } from "@/lib/testing/fakeFileSystem";

import { collectBackupPhotos, pruneUnusedPhotos, writeBackupPhotos } from "./backupPhotos";

jest.mock("expo-file-system", () => jest.requireActual("@/lib/testing/fakeFileSystem"));

// Réduction d'image simulée : produit un petit JPEG à la place de l'original.
const mockSaveAsync = jest.fn();
jest.mock("expo-image-manipulator", () => ({
  SaveFormat: { JPEG: "jpeg" },
  ImageManipulator: {
    manipulate: () => ({
      resize: jest.fn(),
      renderAsync: async () => ({ width: 3000, height: 3000, saveAsync: mockSaveAsync }),
    }),
  },
}));

const DOC = "file:///data/app/files/";
const jpeg = (size: number) => new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...new Array<number>(size).fill(1)]);
const base64Of = (bytes: Uint8Array) => Buffer.from(bytes).toString("base64");

function putFile(uri: string, bytes: Uint8Array) {
  const file = new File(uri);
  file.write(bytes);
  return file;
}

beforeEach(() => {
  resetFakeFileSystem();
  mockSaveAsync.mockReset();
});

describe("collectBackupPhotos", () => {
  it("inclut les photos présentes et ignore les absentes ou étrangères", async () => {
    putFile(`${DOC}containers/container-1.jpg`, jpeg(20));
    putFile(`${DOC}SQLite/glucodose.db`, jpeg(20));

    const photos = await collectBackupPhotos({
      containers: [
        { id: 1, photoUri: `${DOC}containers/container-1.jpg` },
        { id: 2, photoUri: `${DOC}containers/absente.jpg` },
        { id: 3, photoUri: null },
      ],
      foods: [{ id: 4, photoUri: `${DOC}SQLite/glucodose.db` }],
    });

    expect(photos).toEqual([
      { table: "containers", id: 1, mimeType: "image/jpeg", data: base64Of(jpeg(20)) },
    ]);
  });

  it("réduit une photo enregistrée avant la réduction automatique", async () => {
    const uri = `${DOC}foods/food-1.jpg`;
    putFile(uri, jpeg(500 * 1024));
    mockSaveAsync.mockImplementation(async () => putFile("file:///cache/reduite.jpg", jpeg(10)));

    const photos = await collectBackupPhotos({ containers: [], foods: [{ id: 1, photoUri: uri }] });

    expect(photos[0].data).toBe(base64Of(jpeg(10)));
    expect(new File(uri).size).toBe(jpeg(10).length);
    expect(new File("file:///cache/reduite.jpg").exists).toBe(false);
  });
});

describe("writeBackupPhotos", () => {
  it("écrit les photos de la sauvegarde et met à jour les adresses", async () => {
    const result = writeBackupPhotos(
      { containers: [{ id: 1, name: "Bol", photoUri: "file:///ancien/telephone.jpg" }], foods: [] },
      [{ table: "containers", id: 1, mimeType: "image/jpeg", data: base64Of(jpeg(20)) }]
    );

    const uri = result.rows.containers[0].photoUri as string;
    expect(uri).toMatch(/^file:\/\/\/data\/app\/files\/containers\/restored-containers-1-\d+\.jpg$/);
    expect(result.rows.containers[0].name).toBe("Bol");
    expect(await new File(uri).base64()).toBe(base64Of(jpeg(20)));
    expect(result.writtenUris).toEqual([uri]);
  });

  it("ne garde une adresse sans photo que si c'est une photo de l'app encore présente", () => {
    putFile(`${DOC}foods/food-1.jpg`, jpeg(20));
    putFile(`${DOC}SQLite/glucodose.db`, jpeg(20));

    const { rows } = writeBackupPhotos(
      {
        containers: [],
        foods: [
          { id: 1, photoUri: `${DOC}foods/food-1.jpg` },
          { id: 2, photoUri: `${DOC}foods/disparue.jpg` },
          { id: 3, photoUri: `${DOC}SQLite/glucodose.db` },
        ],
      },
      []
    );

    expect(rows.foods.map((row) => row.photoUri)).toEqual([`${DOC}foods/food-1.jpg`, null, null]);
  });
});

describe("pruneUnusedPhotos", () => {
  it("supprime les photos que plus aucune ligne n'utilise", () => {
    const kept = putFile(`${DOC}containers/container-1.jpg`, jpeg(1));
    const unused = putFile(`${DOC}containers/container-2.jpg`, jpeg(1));
    const other = putFile(`${DOC}SQLite/glucodose.db`, jpeg(1));

    pruneUnusedPhotos({ containers: [{ id: 1, photoUri: kept.uri }], foods: [] });

    expect(kept.exists).toBe(true);
    expect(unused.exists).toBe(false);
    expect(other.exists).toBe(true);
  });
});
