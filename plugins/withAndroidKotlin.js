const { withGradleProperties } = require("expo/config-plugins");

const KOTLIN_VERSION = "2.3.20";

// SDK 58 reads this property for both the compiler classpath and Expo modules.
module.exports = function withAndroidKotlin(config) {
  return withGradleProperties(config, (mod) => {
    const entry = mod.modResults.find((item) => item.type === "property" && item.key === "android.kotlinVersion");
    if (entry) entry.value = KOTLIN_VERSION;
    else mod.modResults.push({ type: "property", key: "android.kotlinVersion", value: KOTLIN_VERSION });
    return mod;
  });
};
