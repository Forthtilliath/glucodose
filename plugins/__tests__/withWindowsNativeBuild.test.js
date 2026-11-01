const { applyWindowsNativeBuild } = require("../withWindowsNativeBuild");

// Fin du android/build.gradle généré par `expo prebuild` (SDK 58).
const EXPO_ROOT_BUILD_GRADLE = `
allprojects {
  repositories {
    google()
  }
}

apply plugin: "expo-root-project"
apply plugin: "com.facebook.react.rootproject"
`;

describe("applyWindowsNativeBuild", () => {
  it("déplace les builds CMake dans un dossier propre à l'app, avant les plugins racine, qui configurent :app en premier", () => {
    const result = applyWindowsNativeBuild(EXPO_ROOT_BUILD_GRADLE, "monapp");

    expect(result).toContain('buildStagingDirectory = "C:/rncxx/monapp/${sub.name}"');
    expect(result.indexOf("C:/rncxx")).toBeLessThan(result.indexOf('apply plugin: "expo-root-project"'));
  });

  it("fait compiler l'app avec la version de CMake demandée (4.1.2 par défaut)", () => {
    expect(applyWindowsNativeBuild(EXPO_ROOT_BUILD_GRADLE, "monapp")).toContain('cmake.version = "4.1.2"');
    expect(applyWindowsNativeBuild(EXPO_ROOT_BUILD_GRADLE, "monapp", "4.2.0")).toContain('cmake.version = "4.2.0"');
  });

  it("ne s'applique qu'une fois", () => {
    const once = applyWindowsNativeBuild(EXPO_ROOT_BUILD_GRADLE, "monapp");
    expect(applyWindowsNativeBuild(once, "monapp")).toBe(once);
  });

  it("refuse un modèle Gradle sans le point d'ancrage attendu", () => {
    expect(() => applyWindowsNativeBuild("allprojects {}", "monapp")).toThrow(/expo-root-project/);
  });
});
