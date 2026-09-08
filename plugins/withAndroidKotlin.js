const { withGradleProperties, withProjectBuildGradle } = require("expo/config-plugins");

const KOTLIN_VERSION = "2.3.20";

// SDK 57 propagates the property to Expo modules but leaves the compiler
// classpath unversioned. Keep both aligned for Google Mobile Ads 25.4.0.
module.exports = function withAndroidKotlin(config) {
  config = withGradleProperties(config, (mod) => {
    const entry = mod.modResults.find((item) => item.type === "property" && item.key === "android.kotlinVersion");
    if (entry) entry.value = KOTLIN_VERSION;
    else mod.modResults.push({ type: "property", key: "android.kotlinVersion", value: KOTLIN_VERSION });
    return mod;
  });
  return withProjectBuildGradle(config, (mod) => {
    if (mod.modResults.language !== "groovy") throw new Error("Kotlin compiler configuration requires the Expo Groovy template.");
    const pattern = /classpath\(['"]org\.jetbrains\.kotlin:kotlin-gradle-plugin(?::[^'"]+)?['"]\)/g;
    const matches = mod.modResults.contents.match(pattern);
    if (matches?.length !== 1) throw new Error("Expected exactly one Kotlin compiler classpath in the Expo template.");
    mod.modResults.contents = mod.modResults.contents.replace(pattern, 'classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:' + KOTLIN_VERSION + '")');
    return mod;
  });
};
