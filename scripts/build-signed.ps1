# 릴리스 APK를 빌드해 실제 키로 서명한다. 데이터를 유지한 채 설치된 앱을 업데이트할 수 있다.
# 보통은 build.bat을 더블클릭하면 된다.
#
#   powershell -ExecutionPolicy Bypass -File scripts\build-signed.ps1
#   ... -Auto               폰이 연결돼 있으면 설치, 아니면 APK 폴더를 연다 (build.bat)
#   ... -Install            연결된 폰 1대에 설치 (adb install -r)
#   ... -OpenFolder         끝나면 APK가 있는 폴더를 연다
#   ... -SkipBuild          마지막 빌드 결과를 서명
#   ... -ForgetPasswords    저장된 서명 비밀번호를 지우고 끝낸다
#   ... -Keystore <경로>     기본값: $env:NOVELTIER_KEYSTORE, 그다음 ~\.keys\noveltier\keystore.jks
#
# 비밀번호는 키 옆의 signing-passwords.dat에 Windows DPAPI로 암호화해 둔다.
# 이 Windows 계정에서만 풀 수 있다. 앱 제거는 하지 않는다: 제거하면 데이터가 지워진다.

param(
  [switch]$SkipBuild,
  [switch]$Install,
  [switch]$ForgetPasswords,
  [switch]$OpenFolder,
  [switch]$Auto,
  [string]$Keystore
)

$ErrorActionPreference = 'Stop'
trap {
  Write-Host ''
  Write-Host "[멈춤] $($_.Exception.Message)" -ForegroundColor Yellow
  exit 1
}
$repo = Split-Path $PSScriptRoot -Parent
$android = Join-Path $repo 'android'
$package = 'com.star1water.noveltier'

if (-not $Keystore) { $Keystore = $env:NOVELTIER_KEYSTORE }
if (-not $Keystore) { $Keystore = Join-Path $env:USERPROFILE '.keys\noveltier\keystore.jks' }
if (-not (Test-Path $Keystore)) {
  throw "서명 키를 찾지 못했어요: $Keystore`n내려받기: npx.cmd eas-cli credentials -p android"
}
$Keystore = (Resolve-Path $Keystore).Path
if ($Keystore.StartsWith("$repo\", [StringComparison]::OrdinalIgnoreCase)) {
  throw "서명 키는 저장소 밖에 있어야 해요: $Keystore"
}

$passwordFile = Join-Path (Split-Path $Keystore -Parent) 'signing-passwords.dat'
if ($ForgetPasswords) {
  if (Test-Path $passwordFile) { Remove-Item -LiteralPath $passwordFile -Force -Confirm:$false }
  Write-Host '저장된 서명 비밀번호를 지웠어요.'
  return
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
  if ($badging -notmatch "versionCode='(\d+)'") { throw "APK의 versionCode를 읽지 못했어요: $apk" }
  return [long]$Matches[1]
}

function ConvertTo-PlainText([securestring]$secure) {
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}

function Get-SigningPasswords {
  if (Test-Path $passwordFile) {
    try {
      $saved = Get-Content -LiteralPath $passwordFile -Raw | ConvertFrom-Json
      return @{
        Keystore = ConvertTo-SecureString $saved.keystore
        Key = ConvertTo-SecureString $saved.key
        IsNew = $false
      }
    } catch {
      Write-Host '저장된 비밀번호를 읽지 못해 다시 물어볼게요.'
    }
  }
  Write-Host ''
  Write-Host '처음 한 번만 서명 비밀번호를 입력해 주세요. 입력해도 화면에 보이지 않아요.'
  Write-Host '복사해 두셨다면 창에서 마우스 오른쪽 클릭으로 붙여넣고 Enter를 누르세요.'
  return @{
    Keystore = Read-Host 'Keystore password' -AsSecureString
    Key = Read-Host 'Key password' -AsSecureString
    IsNew = $true
  }
}

Write-Host ''
Write-Host '=== Novel Tier 빌드 ==='
Write-Host "브랜치: $(git -C $repo rev-parse --abbrev-ref HEAD) ($(git -C $repo rev-parse --short HEAD))"

$lines = @(& $adb devices | Select-Object -Skip 1 | Where-Object { $_.Trim() })
$ready = @($lines | Where-Object { $_ -match '\tdevice$' })
$unauthorized = @($lines | Where-Object { $_ -match '\tunauthorized$' })

if ($Auto) {
  if ($ready.Count -eq 1 -and $unauthorized.Count -eq 0) {
    $Install = $true
    Write-Host '폰이 연결돼 있어요. 빌드 후 바로 설치할게요.'
  } else {
    $OpenFolder = $true
    if ($unauthorized.Count -gt 0) {
      Write-Host '폰에서 USB 디버깅이 아직 허용되지 않았어요. APK 파일만 만들게요.'
    } elseif ($ready.Count -gt 1) {
      Write-Host "기기가 $($ready.Count)대 연결돼 있어요. 설치하지 않고 APK 파일만 만들게요."
    } else {
      Write-Host '폰이 연결돼 있지 않아요. APK 파일을 만들고 폴더를 열어 드릴게요.'
    }
  }
}
if ($Install) { Write-Host '업데이트 전에 앱에서 파일 백업과 사진 백업을 받아 두면 안전해요.' }

# 긴 빌드를 기다린 뒤에 실패하지 않도록 폰 연결과 비밀번호를 먼저 확인한다.
if ($Install) {
  if ($unauthorized.Count -gt 0) {
    throw '폰 화면의 USB 디버깅 허용 창에서 [허용]을 눌러 주세요.'
  }
  if ($ready.Count -eq 0) { throw '폰이 연결되어 있지 않아요. USB 케이블과 USB 디버깅을 확인해 주세요.' }
  if ($ready.Count -gt 1) { throw "기기가 $($ready.Count)대 연결되어 있어요. 폰 1대만 연결하고, 에뮬레이터는 꺼 주세요." }
}
$passwords = Get-SigningPasswords

if (-not $SkipBuild) {
  Set-Location $repo
  if (-not (Test-Path $android)) {
    # prebuild는 package.json을 고치므로 깨끗하게 되돌릴 수 있을 때만 실행한다.
    if (git -C $repo status --short -- package.json) { throw 'package.json에 변경 사항이 있어요. 먼저 커밋해 주세요.' }
    cmd /c "npx expo prebuild --platform android --no-install"
    if ($LASTEXITCODE -ne 0) { throw 'expo prebuild에 실패했어요.' }
    git -C $repo restore package.json
  }
  Write-Host ''
  Write-Host '빌드 중이에요. 처음에는 몇 분 걸릴 수 있어요...'
  # 메모리를 늘려 릴리스 lint의 Metaspace 부족을 막는다.
  cmd /c "`"$android\gradlew.bat`" -p `"$android`" `"-Dorg.gradle.jvmargs=-Xmx6g -XX:MaxMetaspaceSize=1536m -Dfile.encoding=UTF-8`" :app:assembleRelease --console=plain -q"
  if ($LASTEXITCODE -ne 0) { throw '빌드에 실패했어요. 위쪽의 오류 내용을 확인해 주세요.' }
}

$built = Join-Path $android 'app\build\outputs\apk\release\app-release.apk'
if (-not (Test-Path $built)) { throw "APK를 찾지 못했어요: $built" }

$commit = git -C $repo rev-parse --short HEAD
$dirty = if (git -C $repo status --short) { '-dirty' } else { '' }
$outDir = Join-Path $repo 'dist'
New-Item -ItemType Directory -Force $outDir | Out-Null
$appVersion = (Select-String -LiteralPath (Join-Path $repo 'App.jsx') -Pattern '^const APP_VERSION = "([^"]+)"' | Select-Object -First 1).Matches[0].Groups[1].Value
$signed = Join-Path $outDir "noveltier-v$appVersion-$commit$dirty.apk"

Write-Host '서명 중이에요...'
# 비밀번호는 이 프로세스의 환경변수로만 넘기고 곧바로 지운다. 명령줄과 파일에 평문을 남기지 않는다.
$env:NOVELTIER_KS_PASS = ConvertTo-PlainText $passwords.Keystore
$env:NOVELTIER_KEY_PASS = ConvertTo-PlainText $passwords.Key
try {
  $signOutput = cmd /c "`"$apksigner`" sign --ks `"$Keystore`" --ks-pass env:NOVELTIER_KS_PASS --key-pass env:NOVELTIER_KEY_PASS --v4-signing-enabled false --out `"$signed`" `"$built`" 2>&1"
  $signExit = $LASTEXITCODE
} finally {
  Remove-Item Env:NOVELTIER_KS_PASS, Env:NOVELTIER_KEY_PASS -ErrorAction SilentlyContinue
}
if ($signExit -ne 0) {
  if ("$signOutput" -match '(?i)wrong password|cannot recover key|keystore password was incorrect|tampered|Failed to load signer') {
    if (Test-Path $passwordFile) { Remove-Item -LiteralPath $passwordFile -Force -Confirm:$false }
    throw '서명 비밀번호가 맞지 않아요. 다시 실행하면 비밀번호를 다시 물어볼게요. 폰과 데이터는 그대로예요.'
  }
  $signOutput | ForEach-Object { Write-Host "$_" }
  throw '서명에 실패했어요. 폰과 데이터는 그대로예요.'
}

$certs = & $apksigner verify --print-certs $signed
if ($LASTEXITCODE -ne 0) { throw '서명 검증에 실패했어요.' }
$certs | Where-Object { $_ -match 'certificate SHA-256' } | Select-Object -Unique
Write-Host "APK: $signed"

# 맞는 비밀번호만 저장한다.
if ($passwords.IsNew) {
  @{
    keystore = ConvertFrom-SecureString $passwords.Keystore
    key = ConvertFrom-SecureString $passwords.Key
  } | ConvertTo-Json | Set-Content -LiteralPath $passwordFile -Encoding ASCII
  Write-Host '비밀번호를 암호화해 저장했어요. 다음부터는 묻지 않아요.'
}

if ($OpenFolder) {
  Write-Host ''
  Write-Host '완료! 열린 폴더의 APK를 드라이브나 메일로 폰에 보내 설치하세요.'
  Start-Process explorer.exe -ArgumentList "/select,`"$signed`""
}
if (-not $Install) { return }

$dump = (& $adb shell dumpsys package $package) -join "`n"
if ($dump -match 'versionCode=(\d+)') {
  $installed = [long]$Matches[1]
  $new = Get-ApkVersionCode $signed
  if ($installed -gt $new) {
    throw "폰의 앱(versionCode $installed)이 이 APK($new)보다 새 버전이에요. 앱을 지우지 마세요: 데이터가 삭제돼요. versionCode를 올려 다시 빌드해야 해요."
  }
}

Write-Host '폰에 설치 중이에요...'
$installOutput = cmd /c "`"$adb`" install -r `"$signed`" 2>&1"
if ($LASTEXITCODE -ne 0) {
  $installOutput | ForEach-Object { Write-Host "$_" }
  throw '설치가 거부됐어요. 기존 앱과 데이터는 그대로예요. 앱을 지우지 마세요: 데이터가 삭제돼요. 서명 오류라면 설치된 앱과 다른 키예요.'
}
Write-Host ''
Write-Host '설치 완료! 폰에서 앱을 열어 확인해 주세요.'
