const { AndroidConfig, withAndroidManifest } = require("expo/config-plugins");

const AD_ACTIVITY = "com.google.android.gms.ads.AdActivity";

module.exports = function withAndroidAdFullscreen(config) {
  return withAndroidManifest(config, (mod) => {
    const { manifest } = mod.modResults;
    manifest.$["xmlns:tools"] ??= "http://schemas.android.com/tools";
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(mod.modResults);
    const activities = (app.activity ??= []);
    let activity = activities.find((item) => item.$["android:name"] === AD_ACTIVITY);
    if (!activity) {
      activity = { $: { "android:name": AD_ACTIVITY } };
      activities.push(activity);
    }

    // Retain the SDK's translucent window and merge its other Activity attributes.
    activity.$["android:theme"] = "@android:style/Theme.Translucent.NoTitleBar.Fullscreen";
    const replace = (activity.$["tools:replace"] ?? "").split(",").map((item) => item.trim()).filter(Boolean);
    if (!replace.includes("android:theme")) {
      activity.$["tools:replace"] = [...replace, "android:theme"].join(",");
    }
    return mod;
  });
};
