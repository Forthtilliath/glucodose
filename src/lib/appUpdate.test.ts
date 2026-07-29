import { compareVersions } from "./appUpdate";

describe("compareVersions", () => {
  it("détecte une version plus récente", () => {
    expect(compareVersions("1.1.0", "1.0.0")).toBe(1);
  });

  it("détecte une version plus ancienne", () => {
    expect(compareVersions("1.0.0", "1.1.0")).toBe(-1);
  });

  it("détecte des versions égales", () => {
    expect(compareVersions("1.2.3", "1.2.3")).toBe(0);
  });

  it("compare correctement des segments de longueurs différentes", () => {
    expect(compareVersions("1.2", "1.2.1")).toBe(-1);
    expect(compareVersions("2.0.0", "1.9.9")).toBe(1);
  });
});
