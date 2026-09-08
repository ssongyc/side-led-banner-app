const { withAppBuildGradle, withGradleProperties } = require("expo/config-plugins");

module.exports = function withAndroidRelease(config) {
  config = withGradleProperties(config, (mod) => {
    for (const key of ["android.enableMinifyInReleaseBuilds", "android.enableShrinkResourcesInReleaseBuilds"]) {
      const entry = mod.modResults.find((item) => item.type === "property" && item.key === key);
      if (entry) entry.value = "true";
      else mod.modResults.push({ type: "property", key, value: "true" });
    }
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
