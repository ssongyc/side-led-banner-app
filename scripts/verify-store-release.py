"""One-pass local store artifact checks. Never builds, installs, signs or uploads."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import struct
import subprocess
import time
import uuid
import xml.etree.ElementTree as ET
import zipfile


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def sha(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def verify(args, out, report):
    record = args.record.resolve()
    root = args.build_root.resolve()
    result = read_json(record / "build-result.json")
    inventory = read_json(record / "source-inputs.json")
    apk_path, aab_path = Path(result["apk"]), Path(result["aab"])
    checks = report["checks"]
    def check(name, ok):
        checks[name] = bool(ok)
        if not ok:
            raise RuntimeError("Failed check: " + name)

    check("production", result["adProfile"] == "production")
    check("sameAabApkWorkflow", result["apkSource"] == "bundletool-universal")
    check("sourceRevision", inventory["revision"] == result["revision"]
          and inventory["dirty"] == result["dirty"])
    check("sourceInventory", bool(inventory["files"]) and all(
        (root / name).is_relative_to(root) and ".." not in Path(name).parts
        and sha(root / name) == digest.lower()
        for name, digest in inventory["files"].items()))
    check("activeSnapshot", read_json(root / "source-inputs.json") == inventory)
    for label, path in [("apk", apk_path), ("aab", aab_path)]:
        digest = sha(path)
        report[label + "Sha256"] = digest
        check(label + "Hash", digest == result[label + "Sha256"].lower())
    check("bundletoolIdentity", sha(args.bundletool) ==
          "a099cfa1543f55593bc2ed16a70a7c67fe54b1747bb7301f37fdfd6d91028e29")
    mapping_bytes = (record / "mapping.txt").read_bytes()
    mapping_hash = hashlib.sha256(mapping_bytes).hexdigest()
    mapping = mapping_bytes.decode("utf-8-sig")
    check("mappingHash", bool(mapping_bytes) and mapping_hash == result["mappingSha256"].lower())
    check("r8Version", re.search(r"^# compiler_version: " + re.escape(args.r8) + r"$", mapping, re.M))
    check("obfuscated", any(m[1] != m[2] for m in re.finditer(
        r"^([^ #\s][^ ]+) -> ([^ :]+):$", mapping, re.M)))
    report["mappingSha256"] = mapping_hash
    env = dict(os.environ, JAVA_HOME=str(args.java_home))
    bt = args.sdk / "build-tools" / "36.1.0"
    java = args.java_home / "bin"
    def run(name, command):
        started = time.monotonic()
        proc = subprocess.run([str(x) for x in command], env=env,
                              stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        text = proc.stdout.decode("utf-8", errors="replace")
        (out / name).write_text(text, encoding="utf-8")
        report["toolSeconds"][name] = time.monotonic() - started
        check(name, proc.returncode == 0)
        return text
    cert = "730173560958735bf237ca84ba4f35bbe76a6734986929eb65f6ced63d3fd893"
    sig = run("apk-signature.txt", [bt / "apksigner.bat", "verify", "--verbose", "--print-certs", apk_path])
    signers = re.findall(r"Signer #\d+ certificate SHA-256 digest: ([0-9a-f]+)", sig.lower(), re.I)
    check("apkSigner", signers == [cert])
    badging = run("apk-badging.txt", [bt / "aapt.exe", "dump", "badging", apk_path])
    manifest = run("apk-manifest.txt", [bt / "aapt.exe", "dump", "xmltree", apk_path, "AndroidManifest.xml"])
    run("apk-alignment.txt", [bt / "zipalign.exe", "-c", "-P", "16", "4", apk_path])
    jar_signature = run("aab-signature.txt", [java / "jarsigner.exe", "-J-Duser.language=en",
                        "-J-Duser.country=US", "-verify", "-verbose", "-certs", aab_path])
    check("aabSignedEntries", "jar verified." in jar_signature
          and "unsigned entries" not in jar_signature.lower())
    certificate = run("aab-certificate.txt", [java / "keytool.exe", "-printcert", "-jarfile", aab_path])
    check("aabSigner", cert in certificate.replace(":", "").lower())
    run("bundletool-validate.txt", [java / "java.exe", "-jar", args.bundletool, "validate", "--bundle=" + str(aab_path)])
    xml = run("aab-manifest.xml", [java / "java.exe", "-jar", args.bundletool, "dump", "manifest",
                                 "--bundle=" + str(aab_path), "--module=base"])
    config_text = run("aab-config.json", [java / "java.exe", "-jar", args.bundletool, "dump", "config",
                                        "--bundle=" + str(aab_path)])
    check("bundle16K", "PAGE_ALIGNMENT_16K" in config_text)
    a = "{http://schemas.android.com/apk/res/android}"
    tree = ET.fromstring(xml)
    version, code = str(result["versionName"]), str(result["versionCode"])
    package = "com.minkyokim.sideledbannerapp"
    check("aabVersion", tree.get("package") == package and tree.get(a+"versionName") == version
          and tree.get(a+"versionCode") == code)
    check("apkVersion", all(s in badging for s in [
        "name='" + package + "'", "versionCode='" + code + "'", "versionName='" + version + "'"]))
    sdk = tree.find("uses-sdk")
    target = int(sdk.get(a+"targetSdkVersion"))
    compile_sdk = int(tree.get(a+"compileSdkVersion", tree.get("platformBuildVersionCode", "0")))
    check("aabSdk", sdk.get(a+"minSdkVersion") == "24" and target >= 36 and compile_sdk >= target)
    check("apkSdk", "targetSdkVersion:'" + str(target) + "'" in badging
          and "sdkVersion:'24'" in badging
          and re.search(r"compileSdkVersion[^\n]*=\(type 0x10\)0x" + format(compile_sdk, "x") + r"\b", manifest))
    app = tree.find("application")
    check("notDebuggable", app.get(a+"debuggable", "false") == "false"
          and "application-debuggable" not in badging
          and not re.search(r"android:debuggable[^\n]*0xffffffff", manifest))
    permissions = {x.get(a+"name") for x in tree.findall("uses-permission")}
    forbidden = {"android.permission.CAMERA", "android.permission.RECORD_AUDIO"}
    check("permissions", not permissions & forbidden and not any(x in manifest for x in forbidden))
    md = {x.get(a+"name"): x.get(a+"value") for x in app.findall("meta-data")}
    profile = read_json(root / "advertising.config.json")["production"]
    check("productionManifest", md.get("com.google.android.gms.ads.APPLICATION_ID") == profile["android"]["appId"]
          and profile["android"]["appId"] in manifest)
    check("billingManifest", md.get("com.google.android.play.billingclient.version") == "9.1.0"
          and "com.google.android.play.billingclient.version" in manifest and "9.1.0" in manifest)

    sm_path = root / "android/app/build/intermediates/sourcemaps/react/release/index.android.bundle.packager.map"
    sm = read_json(sm_path)
    names = [n.replace("\\", "/") for n in sm["sources"]]
    required = ["app/index.tsx", "constants/styles.tsx", "utils/skiaBubbleTextLayout.ts", "utils/SystemChrome.ts",
                "hooks/useHeartBackgroundScroll.ts", "components/previewPanel.tsx", "components/ledBannerFullScreen.tsx",
                "components/animation/PixelBackgroundCanvas.tsx", "ads/AdClient.tsx", "ads/rewardedState.ts",
                "ads/bannerState.ts", "ads/initializeMobileAds.ts", "ads/adConfiguration.ts", "hooks/useRewardedAd.ts",
                "components/admob/bannerAd.tsx", "contexts/settings/presetModel.ts",
                "contexts/settings/useSettingsLocalization.ts", "components/RootLayout.tsx",
                "hooks/usePlaybackActive.ts", "hooks/useMarqueeAnimation.ts", "hooks/useBlinkOpacityStyle.ts",
                "hooks/useBackgroundAnimation.ts", "utils/skiaLineLayout.ts", "components/slider.tsx"]
    source_checks = {}
    for name in required:
        hits = [i for i, n in enumerate(names) if "/node_modules/" not in n and (n == name or n.endswith("/"+name))]
        source_checks[name] = len(hits) == 1 and sm["sourcesContent"][hits[0]].replace("\r\n", "\n") == (
            root / name).read_text(encoding="utf-8").replace("\r\n", "\n")
    report["sourceChecks"] = source_checks
    check("bundledSourceMatches", all(source_checks.values()))
    check("webDiagnosticsExcluded", not any(
        n.endswith(("ads/AdClient.web.ts", "ads/AdDiagnostics.web.tsx", "utils/webAdDiagnostics.web.ts"))
        or ("/ads/" in "/"+n and ".web." in n) for n in names))
    check("premiumExcluded", not any(n.endswith(("app/premium.tsx", "PremiumScreen.tsx")) for n in names))

    # Open each archive once; reuse native/DEX/Hermes bytes for all related checks.
    with zipfile.ZipFile(apk_path) as apk, zipfile.ZipFile(aab_path) as aab, aab_path.open("rb") as raw_aab:
        for label, z in [("apk", apk), ("aab", aab)]:
            check(label+"UniqueEntries", len(z.namelist()) == len(set(z.namelist())))
        for item in aab.infolist():
            raw_aab.seek(item.header_offset)
            header = raw_aab.read(30)
            check("aabLocalHeaders", header[:4] == b"PK\x03\x04")
            name = raw_aab.read(struct.unpack_from("<H", header, 26)[0]).decode(
                "utf-8" if item.flag_bits & 0x800 else "cp437")
            check("aabLocalNames", name == item.filename)
        check("embeddedMapping", aab.read("BUNDLE-METADATA/com.android.tools.build.obfuscation/proguard.map") == mapping_bytes)
        config_bytes = apk.read("assets/app.config")
        check("sameConfig", config_bytes == aab.read("base/assets/app.config"))
        config = json.loads(config_bytes)
        check("embeddedAds", config["extra"]["advertising"] == dict(profile="production", **profile))
        check("embeddedVersion", config["version"] == version and str(config["android"]["versionCode"]) == code)
        check("billingProperties", "9.1.0" in apk.read("billing.properties").decode())
        hermes = apk.read("assets/index.android.bundle")
        check("sameHermes", hermes == aab.read("base/assets/index.android.bundle"))
        check("generatedHermes", hermes == (root / "android/app/build/generated/assets/react/release/index.android.bundle").read_bytes())
        libs = sorted(n for n in apk.namelist() if n.startswith("lib/") and n.endswith(".so"))
        abis = sorted({n.split("/")[1] for n in libs})
        check("fourAbis", abis == ["arm64-v8a", "armeabi-v7a", "x86", "x86_64"])
        check("sameLibrarySet", set(libs) == {n[5:] for n in aab.namelist() if n.startswith("base/lib/") and n.endswith(".so")})
        report["libraries"] = []
        for name in libs:
            data = apk.read(name)
            check("sameNative:"+name, data == aab.read("base/"+name))
            check("elf:"+name, data[:4] == b"\x7fELF" and data[4] in (1, 2) and data[5] in (1, 2))
            bits, endian = data[4], "<" if data[5] == 1 else ">"
            phoff = struct.unpack_from(endian+("Q" if bits == 2 else "I"), data, 32 if bits == 2 else 28)[0]
            size, count = struct.unpack_from(endian+"HH", data, 54 if bits == 2 else 42)
            aligns = []
            for i in range(count):
                pos = phoff + i*size
                if struct.unpack_from(endian+"I", data, pos)[0] != 1:
                    continue
                offset, vaddr = struct.unpack_from(endian+("QQ" if bits == 2 else "II"), data, pos+(8 if bits == 2 else 4))
                align = struct.unpack_from(endian+("Q" if bits == 2 else "I"), data, pos+(48 if bits == 2 else 28))[0]
                aligns.append(align)
                if bits == 2:
                    check("elf16K:"+name, align >= 16384 and (vaddr-offset) % 16384 == 0)
            check("loadSegments:"+name, bool(aligns))
            report["libraries"].append(dict(name=name, loadAlignments=aligns, sha256=hashlib.sha256(data).hexdigest()))
        dex_names = sorted(n for n in apk.namelist() if re.fullmatch(r"classes\d*\.dex", n))
        check("sameDexSet", bool(dex_names) and set(dex_names) == {
            n[9:] for n in aab.namelist() if re.fullmatch(r"base/dex/classes\d*\.dex", n)})
        dex_parts = []
        for name in dex_names:
            data = apk.read(name)
            check("sameDex:"+name, data == aab.read("base/dex/"+name))
            dex_parts.append(data)
        dex = b"".join(dex_parts)
        for cls in ["expo.modules.ledpopads.LedPopAdImmersiveModule",
                    "io.invertase.googlemobileads.ReactNativeGoogleMobileAdsRewardedModule",
                    "io.invertase.googlemobileads.ReactNativeGoogleMobileAdsBannerAdViewManager"]:
            match = re.search(r"^"+re.escape(cls)+r" -> ([^:]+):$", mapping, re.M)
            check("adClass:"+cls, match and ("L"+match[1].replace(".", "/")+";").encode() in dex)
        icon_hashes = {hashlib.sha256(apk.read(n)).hexdigest() for n in apk.namelist() if n.lower().endswith(".webp")}
        icons = list((root / "assets/images/Sunny's_Icon").glob("*.webp"))
        check("sunnyIcons", len(icons) == 13 and all(sha(f) in icon_hashes for f in icons))
    report["retained"] = {}
    for relative in [
        "android/app/build/intermediates/sourcemaps/react/release/index.android.bundle.packager.map",
        "android/app/build/generated/sourcemaps/react/release/index.android.bundle.map",
        "android/app/build/outputs/native-debug-symbols/release/native-debug-symbols.zip",
        "android/app/build/outputs/mapping/release/configuration.txt",
        "android/app/build/outputs/mapping/release/usage.txt",
        "android/app/build/outputs/mapping/release/resources.txt",
        "android/app/build/outputs/mapping/release/seeds.txt",
    ]:
        source = root / relative
        if source.exists():
            shutil.copy2(source, out / source.name)
            report["retained"][source.name] = sha(out / source.name)
        elif relative.endswith((".map", ".zip")):
            raise RuntimeError("Missing same-build symbols: " + relative)
    lines = (record / "gradle-release.log").read_text(encoding="utf-8-sig", errors="replace").splitlines()
    report["logFindings"] = [dict(line=i+1, text=line) for i, line in enumerate(lines)
                             if re.search(r"warning|\berror\b|failed|deprecated|^w:|^e:", line, re.I)]
    check("gradleSuccess", any(line.startswith("BUILD SUCCESSFUL") for line in lines))
    check("noKotlinMetadataFailure", not any("An error occurred when parsing kotlin metadata" in line for line in lines))
    r8_task = ":app:minifyReleaseWithR8"
    reason = next((i for i, line in enumerate(lines)
                   if r8_task in line and "not up-to-date because" in line), None)
    report["r8InputReason"] = {
        "status": "recorded" if reason is not None else "not recorded",
        "lines": lines[reason:reason+25] if reason is not None else [],
        "taskLines": [line for line in lines if r8_task in line],
    }
    report["logReview"] = "findings collected; human review required"
    report["status"] = "static-checks-passed"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ["record", "build-root", "bundletool", "sdk", "java-home"]:
        parser.add_argument("--"+name, required=True, type=Path)
    parser.add_argument("--r8", required=True)
    args = parser.parse_args()
    out = args.record.resolve() / "release-verification" / uuid.uuid4().hex
    out.mkdir(parents=True, exist_ok=False)
    report = dict(status="failed", checks={}, toolSeconds={}, runtimeQA="not performed", playUpload="not performed")
    started = time.monotonic()
    try:
        verify(args, out, report)
    except Exception as error:
        report["error"] = str(error)
        raise
    finally:
        report["elapsedSeconds"] = time.monotonic() - started
        (out / "verification.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
        print(str(out / "verification.json"))
