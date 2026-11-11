#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
BUILD="$ROOT/build/apk"
ANDROID_JAR="${ANDROID_JAR:-/usr/lib/android-sdk/platforms/android-23/android.jar}"
PACKAGE="com.sirravenznest.delvers"

for tool in aapt apksigner smali zip zipalign; do
    command -v "$tool" >/dev/null 2>&1 || { echo "Missing required tool: $tool" >&2; exit 1; }
done
test -f "$ANDROID_JAR" || { echo "Android platform jar not found: $ANDROID_JAR" >&2; exit 1; }

mkdir -p "$BUILD"
sed 's/<manifest /<manifest package="com.sirravenznest.delvers" /' \
    "$ROOT/app/src/main/AndroidManifest.xml" > "$BUILD/AndroidManifest.xml"
aapt package -f \
    --min-sdk-version 23 \
    --target-sdk-version 28 \
    --version-code 38 \
    --version-name 2.2.24 \
    --rename-manifest-package "$PACKAGE" \
    -M "$BUILD/AndroidManifest.xml" \
    -I "$ANDROID_JAR" \
    -S "$ROOT/app/src/main/res" \
    -A "$ROOT/app/src/main/assets" \
    -F "$BUILD/unsigned.apk"
smali assemble --api 23 "$ROOT/apk-fallback/MainActivity.smali" -o "$BUILD/classes.dex"
zip -q -j "$BUILD/unsigned.apk" "$BUILD/classes.dex"
zipalign -f -p 4 "$BUILD/unsigned.apk" "$BUILD/aligned.apk"

KEYSTORE="${ANDROID_SIGNING_KEYSTORE:-}"
test -n "$KEYSTORE" && test -f "$KEYSTORE" || { echo "Set ANDROID_SIGNING_KEYSTORE to your protected release keystore." >&2; exit 1; }
: "${ANDROID_SIGNING_STORE_PASSWORD:?Set ANDROID_SIGNING_STORE_PASSWORD}"
: "${ANDROID_SIGNING_KEY_ALIAS:?Set ANDROID_SIGNING_KEY_ALIAS}"
: "${ANDROID_SIGNING_KEY_PASSWORD:?Set ANDROID_SIGNING_KEY_PASSWORD}"

APK="$ROOT/app/build/outputs/apk/debug/app-debug.apk"
mkdir -p "$(dirname "$APK")"
apksigner sign \
    --ks "$KEYSTORE" \
    --ks-pass env:ANDROID_SIGNING_STORE_PASSWORD \
    --key-pass env:ANDROID_SIGNING_KEY_PASSWORD \
    --ks-key-alias "$ANDROID_SIGNING_KEY_ALIAS" \
    --out "$APK" \
    "$BUILD/aligned.apk"
apksigner verify --verbose "$APK"
echo "Built $APK"
