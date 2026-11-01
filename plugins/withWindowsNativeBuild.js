const { withProjectBuildGradle } = require("expo/config-plugins");

/**
 * Compilation native sous Windows malgré la limite de 260 caractères des chemins (SDK 58 :
 * Reanimated 4.7 et Gesture Handler 3 ont des sources C++ plus profondes) :
 * - le dossier de build CMake (`.cxx`) de chaque module est sorti de `node_modules`, vers
 *   `C:/rncxx/<app>/<module>` (un dossier par app : aucun cache CMake partagé entre projets) ;
 * - l'app, qui compile le code généré de toutes les bibliothèques sous des chemins absolus de plus
 *   de 200 caractères, passe à CMake 4.1.2 (à installer via le SDK Manager), dont le ninja 1.12
 *   gère les chemins longs. `CMAKE_POLICY_VERSION_MINIMUM` accepte les `cmake_minimum_required`
 *   anciens des bibliothèques, refusés tels quels par CMake 4.
 *
 * Sans effet hors de Windows. Le bloc doit précéder `expo-root-project` et
 * `com.facebook.react.rootproject`, qui configurent `:app` avant le reste (sinon « too late to set
 * buildStagingDirectory »).
 */
const ANCHOR = 'apply plugin: "expo-root-project"';
const MARKER = "C:/rncxx";

function nativeBuildBlock(appName, cmakeVersion) {
  return `// Windows : chemins des builds C++ raccourcis (limite de 260 caractères), voir
// plugins/withWindowsNativeBuild.js.
subprojects { sub ->
  ["com.android.library", "com.android.application"].each { id ->
    sub.plugins.withId(id) {
      sub.android.externalNativeBuild.cmake.buildStagingDirectory = "${MARKER}/${appName}/\${sub.name}"
      if (id == "com.android.application") {
        sub.android.externalNativeBuild.cmake.version = "${cmakeVersion}"
        sub.android.defaultConfig.externalNativeBuild.cmake.arguments "-DCMAKE_POLICY_VERSION_MINIMUM=3.5"
      }
    }
  }
}

`;
}

function applyWindowsNativeBuild(contents, appName, cmakeVersion = "4.1.2") {
  if (contents.includes(MARKER)) return contents;
  if (!contents.includes(ANCHOR)) {
    throw new Error(
      "withWindowsNativeBuild : `apply plugin: \"expo-root-project\"` introuvable dans android/build.gradle",
    );
  }
  return contents.replace(ANCHOR, nativeBuildBlock(appName, cmakeVersion) + ANCHOR);
}

module.exports = function withWindowsNativeBuild(config, { cmakeVersion } = {}) {
  if (process.platform !== "win32") return config;
  return withProjectBuildGradle(config, (mod) => {
    mod.modResults.contents = applyWindowsNativeBuild(mod.modResults.contents, config.slug, cmakeVersion);
    return mod;
  });
};

module.exports.applyWindowsNativeBuild = applyWindowsNativeBuild;
