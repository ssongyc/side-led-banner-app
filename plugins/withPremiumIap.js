const { withAndroidManifest, withGradleProperties, withXcodeProject } = require("expo/config-plugins");

module.exports = function withPremiumIap(config) {
  config = withAndroidManifest(config, (mod) => {
    const app = mod.modResults.manifest.application?.[0];
    const activity = app?.activity?.find((item) => item.$["android:name"] === ".MainActivity");
    if (!activity) throw new Error("IAP: Android MainActivity was not found.");
    // Preserve payment flows that switch to a banking app and return.
    activity.$["android:launchMode"] = "singleTop";
    return mod;
  });
  config = withGradleProperties(config, (mod) => {
    for (const key of ["android.targetSdkVersion", "android.compileSdkVersion"]) {
      const entry = mod.modResults.find((item) => item.type === "property" && item.key === key);
      if (entry) {
        const value = Number(entry.value);
        if (!Number.isInteger(value)) throw new Error("IAP: invalid " + key);
        entry.value = String(Math.max(36, value));
      } else {
        mod.modResults.push({ type: "property", key, value: "36" });
      }
    }
    const target = mod.modResults.find((item) => item.type === "property" && item.key === "android.targetSdkVersion");
    const compile = mod.modResults.find((item) => item.type === "property" && item.key === "android.compileSdkVersion");
    compile.value = String(Math.max(Number(compile.value), Number(target.value)));
    return mod;
  });
  return withXcodeProject(config, (mod) => {
    const project = mod.modResults;
    const target = project.getFirstTarget().uuid;
    const attributes = project.getFirstProject().firstProject.attributes;
    attributes.TargetAttributes ??= {};
    attributes.TargetAttributes[target] ??= {};
    attributes.TargetAttributes[target].SystemCapabilities ??= {};
    attributes.TargetAttributes[target].SystemCapabilities["com.apple.InAppPurchase"] = { enabled: 1 };
    return mod;
  });
};
