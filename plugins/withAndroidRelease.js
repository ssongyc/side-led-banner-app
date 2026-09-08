const { withAppBuildGradle, withGradleProperties, withSettingsGradle } = require("expo/config-plugins");

const R8_VERSION = "8.13.23";

module.exports = function withAndroidRelease(config) {
  config = withGradleProperties(config, (mod) => {
    for (const key of ["android.enableMinifyInReleaseBuilds", "android.enableShrinkResourcesInReleaseBuilds"]) {
      const entry = mod.modResults.find((item) => item.type === "property" && item.key === key);
      if (entry) entry.value = "true";
      else mod.modResults.push({ type: "property", key, value: "true" });
    }
    return mod;
  });
  config = withSettingsGradle(config, (mod) => {
    if (mod.modResults.language !== "groovy") throw new Error("Expected Expo Groovy settings template");
    const marker = /\n  \/\/ LED POP R8 begin[\s\S]*?\/\/ LED POP R8 end\n/g;
    const contents = mod.modResults.contents.replace(marker, "");
    if ((contents.match(/pluginManagement\s*\{/g) ?? []).length !== 1) throw new Error("Expected one pluginManagement block");
    const block = '\n  // LED POP R8 begin\n  buildscript {\n    repositories { google(); mavenCentral() }\n    dependencies { classpath("com.android.tools:r8:' + R8_VERSION + '") }\n  }\n  // LED POP R8 end\n';
    mod.modResults.contents = contents.replace(/pluginManagement\s*\{/, (match) => match + block);
    return mod;
  });
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== "groovy") throw new Error("Expected Expo Groovy release template");
    const pattern = /getDefaultProguardFile\(["']proguard-android(?:-optimize)?\.txt["']\)/g;
    if (mod.modResults.contents.match(pattern)?.length !== 1) throw new Error("Expected one default release ProGuard configuration");
    mod.modResults.contents = mod.modResults.contents.replace(pattern, 'getDefaultProguardFile("proguard-android-optimize.txt")');
    return mod;
  });
};

module.exports.R8_VERSION = R8_VERSION;
