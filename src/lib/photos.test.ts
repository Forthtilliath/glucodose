import { fakeFiles, File, resetFakeFileSystem } from "@/lib/testing/fakeFileSystem";

import { deletePhoto, isAppPhotoUri } from "./photos";

jest.mock("expo-file-system", () => jest.requireActual("@/lib/testing/fakeFileSystem"));
jest.mock("expo-image-manipulator", () => ({ ImageManipulator: {}, SaveFormat: { JPEG: "jpeg" } }));

const DOC = "file:///data/app/files/";

beforeEach(() => {
  resetFakeFileSystem();
});

describe("isAppPhotoUri", () => {
  it("accepte une photo des dossiers photos de l'app", () => {
    expect(isAppPhotoUri(`${DOC}containers/container-1700000000000.jpg`)).toBe(true);
    expect(isAppPhotoUri(`${DOC}foods/restored-foods-3-1700000000000.png`)).toBe(true);
  });

  it("refuse tout autre chemin", () => {
    expect(isAppPhotoUri(`${DOC}SQLite/glucodose.db`)).toBe(false);
    expect(isAppPhotoUri(`${DOC}containers/../SQLite/glucodose.db`)).toBe(false);
    expect(isAppPhotoUri(`${DOC}containers/sous-dossier/photo.jpg`)).toBe(false);
    expect(isAppPhotoUri(`${DOC}containers/photo.db`)).toBe(false);
    expect(isAppPhotoUri("file:///sdcard/DCIM/photo.jpg")).toBe(false);
  });
});

describe("deletePhoto", () => {
  it("supprime une photo de l'app", () => {
    const photo = new File(`${DOC}foods/food-1.jpg`);
    photo.write("x");
    deletePhoto(photo.uri);
    expect(photo.exists).toBe(false);
  });

  it("ne supprime jamais un fichier hors des dossiers photos", () => {
    const database = new File(`${DOC}SQLite/glucodose.db`);
    database.write("base");
    deletePhoto(database.uri);
    expect(fakeFiles.has(database.uri)).toBe(true);
  });
});
