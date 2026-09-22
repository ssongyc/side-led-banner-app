#!/usr/bin/env python3
"""Check the two React dynamic frameworks implicated in LED POP's launch crash.

Read-only, macOS/Xcode only. Not a complete IPA/signing/runtime validator.
"""
import argparse
import plistlib
from pathlib import Path
import subprocess
import sys

FRAMEWORKS = {
    "@rpath/React.framework/React": "React.framework/React",
    "@rpath/ReactNativeDependencies.framework/ReactNativeDependencies":
        "ReactNativeDependencies.framework/ReactNativeDependencies",
}
MACH_O = {
    b"\xfe\xed\xfa\xce", b"\xce\xfa\xed\xfe",
    b"\xfe\xed\xfa\xcf", b"\xcf\xfa\xed\xfe",
    b"\xca\xfe\xba\xbe", b"\xbe\xba\xfe\xca",
    b"\xca\xfe\xba\xbf", b"\xbf\xba\xfe\xca",
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("artifact", type=Path, help="Path to .xcarchive or extracted .app")
    parser.add_argument("--expected-bundle-id", required=True,
                        help="Actual App Store Connect bundle ID; never inferred from source")
    args = parser.parse_args()
    if sys.platform != "darwin":
        raise ValueError("Run on the Mac with Xcode installed; no artifact was verified.")
    artifact = args.artifact.resolve(strict=True)
    if artifact.suffix == ".xcarchive":
        apps = list((artifact / "Products/Applications").glob("*.app"))
        if len(apps) != 1:
            raise ValueError("Expected exactly one application in the archive.")
        app = apps[0]
    elif artifact.suffix == ".app":
        app = artifact
    else:
        raise ValueError("Provide an .xcarchive or an extracted .app directory.")
    with (app / "Info.plist").open("rb") as stream:
        info = plistlib.load(stream)
    if info.get("CFBundleIdentifier") != args.expected_bundle_id:
        raise ValueError("Bundle ID mismatch: artifact=" + str(info.get("CFBundleIdentifier")))
    executable = app / info["CFBundleExecutable"]
    if not executable.is_file():
        raise ValueError("Application executable is missing.")
    frameworks = app / "Frameworks"
    candidates = [executable]
    if frameworks.exists():
        candidates.extend(path for path in frameworks.rglob("*") if path.is_file())
    binaries = 0
    references = set()
    missing = []
    for binary in candidates:
        with binary.open("rb") as stream:
            if stream.read(4) not in MACH_O:
                continue
        binaries += 1
        output = subprocess.run(["xcrun", "otool", "-L", str(binary)],
                                check=True, capture_output=True, text=True).stdout
        for line in output.splitlines():
            dependency = line.strip().split(" (compatibility version", 1)[0]
            if dependency not in FRAMEWORKS:
                continue
            references.add(dependency)
            target = frameworks / FRAMEWORKS[dependency]
            if not target.is_file():
                missing.append(f"{binary.relative_to(app)} -> {dependency}")
    if not binaries:
        raise ValueError("No Mach-O binaries inspected; no verification result.")
    if missing:
        raise ValueError("Missing dynamically referenced React frameworks:\n" + "\n".join(missing)
                         + "\nRepair CocoaPods linkage/embedding on the build Mac before upload.")
    print(f"Bundle: {info['CFBundleIdentifier']} "
          f"{info.get('CFBundleShortVersionString')} ({info.get('CFBundleVersion')})")
    print(f"Inspected {binaries} Mach-O binaries; {len(references)} targeted dynamic dependencies.")
    print("Targeted React framework presence check passed. "
          "Architecture, signatures, other dependencies and device startup remain unverified.")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError, plistlib.InvalidFileException,
            subprocess.CalledProcessError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        sys.exit(1)
