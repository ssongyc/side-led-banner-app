const fs = require("node:fs");
const path = require("node:path");
const { withAppBuildGradle, withDangerousMod, withGradleProperties, withSettingsGradle } = require("expo/config-plugins");

// Expected bundled optimizer in AGP 9.2.1; verified from its builder JAR.
const R8_VERSION = "9.2.14";

module.exports = function withAndroidRelease(config) {
  config = withDangerousMod(config, ["android", (mod) => {
    const rulesPath = path.join(mod.modRequest.platformProjectRoot, "app", "proguard-rules.pro");
    const rules = fs.readFileSync(rulesPath, "utf8");
    const marker = "# LED POP WorkManager reflective constructor";
    if (!rules.includes(marker)) {
      // Room 2.2.5's class-only consumer rule does not retain this constructor
      // under R8 full mode. WorkManager creates it reflectively at app startup.
      fs.appendFileSync(rulesPath, `\n${marker}\n-keep class androidx.work.impl.WorkDatabase_Impl { public <init>(); }\n`);
    }
    return mod;
  }]);
  config = withGradleProperties(config, (mod) => {
    // Keep shrinking explicit; AGP 9 also enables optimized shrinking by default.
    for (const key of ["android.enableMinifyInReleaseBuilds", "android.enableShrinkResourcesInReleaseBuilds", "android.r8.optimizedResourceShrinking"]) {
      const entry = mod.modResults.find((item) => item.type === "property" && item.key === key);
      if (entry) entry.value = "true";
      else mod.modResults.push({ type: "property", key, value: "true" });
    }
    return mod;
  });
  config = withSettingsGradle(config, (mod) => {
    if (mod.modResults.language !== "groovy") throw new Error("Expected Expo Groovy settings template");
    const marker = /\n  \/\/ LED POP R8 begin[\s\S]*?\/\/ LED POP R8 end\n/g;
    // Remove the SDK 57 override: use AGP's bundled optimizer, not an older R8.
    mod.modResults.contents = mod.modResults.contents.replace(marker, "");
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
