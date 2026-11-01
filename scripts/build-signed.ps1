# Builds the release APK and signs it with the app's real key, so it can update
# the installed app without losing data. The key stays outside this repository
# and the password is only typed at the prompt.
#
#   powershell -ExecutionPolicy Bypass -File scripts\build-signed.ps1
#   ... -SkipBuild    sign the APK from the last build
#   ... -Install      also install on the single connected device (adb install -r)
#   ... -Keystore <path>    default: $env:NOVELTIER_KEYSTORE, then ~\.keys\noveltier\keystore.jks
#
# This script never uninstalls the app: uninstalling deletes its data.

param(
  [switch]$SkipBuild,
  [switch]$Install,
  [string]$Keystore
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$android = Join-Path $repo 'android'

if (-not $Keystore) { $Keystore = $env:NOVELTIER_KEYSTORE }
if (-not $Keystore) { $Keystore = Join-Path $env:USERPROFILE '.keys\noveltier\keystore.jks' }
if (-not (Test-Path $Keystore)) {
  throw "Keystore not found: $Keystore`nDownload it with: npx eas-cli credentials -p android"
}
$Keystore = (Resolve-Path $Keystore).Path
if ($Keystore.StartsWith("$repo\", [StringComparison]::OrdinalIgnoreCase)) {
  throw "Keystore must be outside the repository: $Keystore"
}

if (-not $env:JAVA_HOME) { $env:JAVA_HOME = "$env:ProgramFiles\Android\Android Studio\jbr" }
if (-not $env:ANDROID_HOME) { $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk" }
$env:Path = "$env:ProgramFiles\nodejs;$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"

$buildTools = Get-ChildItem "$env:ANDROID_HOME\build-tools" -Directory |
  Sort-Object { [version]($_.Name -replace '-.*$', '') } |
  Select-Object -Last 1
$apksigner = Join-Path $buildTools.FullName 'apksigner.bat'
$aapt2 = Join-Path $buildTools.FullName 'aapt2.exe'
$adb = Join-Path $env:ANDROID_HOME 'platform-tools\adb.exe'

function Get-ApkVersionCode([string]$apk) {
  $badging = (& $aapt2 dump badging $apk) -join "`n"
  if ($badging -notmatch "versionCode='(\d+)'") { throw "Could not read versionCode from $apk" }
  return [long]$Matches[1]
}

if (-not $SkipBuild) {
  Set-Location $repo
  if (-not (Test-Path $android)) {
    # Prebuild rewrites package.json, so only run it when the file can be restored safely.
    if (git -C $repo status --short -- package.json) { throw 'package.json has local changes. Commit them before prebuild.' }
    cmd /c "npx expo prebuild --platform android --no-install"
    if ($LASTEXITCODE -ne 0) { throw 'expo prebuild failed' }
    git -C $repo restore package.json
  }
  # Larger limits avoid the Metaspace out-of-memory failure in release lint.
  cmd /c "`"$android\gradlew.bat`" -p `"$android`" `"-Dorg.gradle.jvmargs=-Xmx6g -XX:MaxMetaspaceSize=1536m -Dfile.encoding=UTF-8`" :app:assembleRelease --console=plain"
  if ($LASTEXITCODE -ne 0) { throw 'Gradle build failed' }
}

$built = Join-Path $android 'app\build\outputs\apk\release\app-release.apk'
if (-not (Test-Path $built)) { throw "APK not found: $built" }

$commit = git -C $repo rev-parse --short HEAD
$dirty = if (git -C $repo status --short) { '-dirty' } else { '' }
$outDir = Join-Path $repo 'dist'
New-Item -ItemType Directory -Force $outDir | Out-Null
$signed = Join-Path $outDir "noveltier-$commit$dirty.apk"

Write-Host "Signing with $Keystore"
& $apksigner sign --ks $Keystore --v4-signing-enabled false --out $signed $built
if ($LASTEXITCODE -ne 0) { throw 'Signing failed' }

# Capture everything first: cutting the pipeline short makes the tool exit non-zero.
$certs = & $apksigner verify --print-certs $signed
if ($LASTEXITCODE -ne 0) { throw 'Signature verification failed' }
$certs | Where-Object { $_ -match 'certificate (DN|SHA-256)' } | Select-Object -Unique
Write-Host "Signed APK: $signed"

if (-not $Install) { return }

$devices = @(& $adb devices | Select-Object -Skip 1 | Where-Object { $_ -match '\tdevice$' })
if ($devices.Count -ne 1) { throw "Connect exactly one device (found $($devices.Count))." }

$package = 'com.star1water.noveltier'
$dump = (& $adb shell dumpsys package $package) -join "`n"
if ($dump -match 'versionCode=(\d+)') {
  $installed = [long]$Matches[1]
  $new = Get-ApkVersionCode $signed
  if ($installed -gt $new) {
    throw "Installed versionCode $installed is newer than this APK ($new). Do NOT uninstall the app: that deletes its data. Raise the versionCode and rebuild."
  }
}

& $adb install -r $signed
if ($LASTEXITCODE -ne 0) {
  throw 'Install was rejected and the installed app was not changed. Do NOT uninstall it: that deletes its data. A signature error means this is not the key the installed app uses.'
}
Write-Host 'Installed.'
