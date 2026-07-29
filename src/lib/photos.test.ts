import { getFileExtension } from "./photos";

describe("getFileExtension", () => {
  it("extrait l'extension d'une uri simple", () => {
    expect(getFileExtension("file:///cache/photo.jpg")).toBe("jpg");
  });

  it("ignore les paramètres de requête après le '?'", () => {
    expect(getFileExtension("file:///cache/photo.png?width=200")).toBe("png");
  });

  it("retombe sur jpg si aucune extension n'est trouvée", () => {
    expect(getFileExtension("file:///cache/photo-sans-extension")).toBe("jpg");
  });

  it("gère les extensions en majuscules", () => {
    expect(getFileExtension("file:///cache/photo.JPEG")).toBe("JPEG");
  });
});
