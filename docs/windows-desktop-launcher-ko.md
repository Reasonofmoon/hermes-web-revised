# Windows 바탕화면 Hermes Web + Grok Build 실행 아이콘 만들기

이 문서는 다른 Windows 로컬 PC에서 Hermes Web을 바로 띄우고 Grok Build CLI를 사용할 수 있도록 바탕화면 배치 파일, 바로가기, 아이콘 이미지를 만드는 절차입니다.

## 전제

- Windows PowerShell 사용
- WSL Ubuntu 또는 Ubuntu-24.04 설치
- WSL 안에서 `grok` CLI 로그인 완료
- Hermes Web 저장소 위치:

```powershell
$Repo = "$env:USERPROFILE\Documents\MoonWorkspace\projects\hermes-web-revised"
```

- Hermes 상태 폴더:

```powershell
$HermesHome = "$env:USERPROFILE\.hermes"
```

## 1. 저장소와 Grok CLI 확인

```powershell
wsl -l -v
wsl.exe -d Ubuntu -- bash -lc "command -v grok && grok --version"
Test-Path "$env:USERPROFILE\Documents\MoonWorkspace\projects\hermes-web-revised\start.ps1"
```

배포판 이름이 `Ubuntu-24.04`라면 아래 스크립트의 `Ubuntu`를 `Ubuntu-24.04`로 바꿉니다.

## 2. Hermes Web 로컬 환경 파일 만들기

한글 사용자 경로가 깨지지 않도록 `.env`에는 직접 경로 대신 `%USERPROFILE%`을 사용합니다.

```powershell
$Repo = "$env:USERPROFILE\Documents\MoonWorkspace\projects\hermes-web-revised"
@"
HERMES_HOME=%USERPROFILE%\.hermes
HERMES_BASE_HOME=%USERPROFILE%\.hermes
HERMES_GROK_WSL_DISTRO=Ubuntu
"@ | Set-Content -LiteralPath (Join-Path $Repo ".env") -Encoding UTF8
```

## 3. 아이콘 이미지 생성

이미지 생성 도구에서 아래 프롬프트로 1024x1024 PNG를 만듭니다.

```text
A polished app icon for "Hermes Web Grok Build": a friendly owl-shaped Hermes messenger symbol, subtle wing motif, luminous cyan and warm cherry blossom accents, dark charcoal background, clean macOS/Windows app icon style, centered composition, high contrast, no text, no watermark.
```

PNG를 다음 경로에 저장합니다.

```powershell
$IconDir = "$env:USERPROFILE\.hermes\icons"
New-Item -ItemType Directory -Force -Path $IconDir | Out-Null
$PngPath = Join-Path $IconDir "hermes-web-grok-build.png"
```

예: 생성한 PNG 파일을 `$PngPath` 위치로 복사합니다.

```powershell
Copy-Item "C:\path\to\generated-icon.png" $PngPath -Force
```

## 4. PNG를 ICO로 변환

PowerShell과 .NET만 사용해 ICO를 생성합니다.

```powershell
$IconDir = "$env:USERPROFILE\.hermes\icons"
$PngPath = Join-Path $IconDir "hermes-web-grok-build.png"
$IcoPath = Join-Path $IconDir "hermes-web-grok-build.ico"

Add-Type -AssemblyName System.Drawing
$bitmap = [System.Drawing.Bitmap]::FromFile($PngPath)
$resized = New-Object System.Drawing.Bitmap 256, 256
$graphics = [System.Drawing.Graphics]::FromImage($resized)
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.DrawImage($bitmap, 0, 0, 256, 256)
$iconHandle = $resized.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($iconHandle)
$stream = [System.IO.File]::Create($IcoPath)
$icon.Save($stream)
$stream.Close()
$graphics.Dispose()
$resized.Dispose()
$bitmap.Dispose()
```

## 5. 바탕화면 배치 파일 생성

```powershell
$Repo = "$env:USERPROFILE\Documents\MoonWorkspace\projects\hermes-web-revised"
$Desktop = [Environment]::GetFolderPath("Desktop")
$BatPath = Join-Path $Desktop "Hermes Web - Grok Build.bat"

$Bat = @"
@echo off
setlocal
set "REPO=%USERPROFILE%\Documents\MoonWorkspace\projects\hermes-web-revised"
set "HERMES_HOME=%USERPROFILE%\.hermes"
set "HERMES_BASE_HOME=%USERPROFILE%\.hermes"
set "HERMES_GROK_WSL_DISTRO=Ubuntu"

where wsl.exe >nul 2>nul
if errorlevel 1 (
  echo [ERROR] wsl.exe not found.
  pause
  exit /b 1
)

wsl.exe -d %HERMES_GROK_WSL_DISTRO% -- bash -lc "command -v grok >/dev/null && grok --version"
if errorlevel 1 (
  echo [ERROR] Grok CLI is not available inside WSL distro %HERMES_GROK_WSL_DISTRO%.
  echo Run Grok login/setup in WSL first.
  pause
  exit /b 1
)

cd /d "%REPO%"
start "" "http://127.0.0.1:8787"
powershell -NoProfile -ExecutionPolicy Bypass -File "%REPO%\start.ps1" 8787
endlocal
"@

[System.IO.File]::WriteAllText($BatPath, $Bat, [System.Text.Encoding]::ASCII)
```

## 6. 바탕화면 바로가기 생성

```powershell
$Desktop = [Environment]::GetFolderPath("Desktop")
$BatPath = Join-Path $Desktop "Hermes Web - Grok Build.bat"
$LnkPath = Join-Path $Desktop "Hermes Web - Grok Build.lnk"
$IcoPath = "$env:USERPROFILE\.hermes\icons\hermes-web-grok-build.ico"

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($LnkPath)
$shortcut.TargetPath = $BatPath
$shortcut.WorkingDirectory = "$env:USERPROFILE\Documents\MoonWorkspace\projects\hermes-web-revised"
$shortcut.IconLocation = $IcoPath
$shortcut.Description = "Start Hermes Web with Grok Build CLI"
$shortcut.Save()
```

## 7. 실행 확인

바탕화면의 `Hermes Web - Grok Build` 바로가기를 실행한 뒤 브라우저에서 확인합니다.

```text
http://127.0.0.1:8787
```

Hermes Web 설정에서 기본 모델이 `grok-build`로 잡히는지 확인합니다.

## 문제 해결

- 포트가 이미 사용 중이면 `start.ps1`이 기존 8787 프로세스를 종료하고 다시 띄웁니다.
- WSL 배포판 이름이 다르면 `.env`와 배치 파일의 `HERMES_GROK_WSL_DISTRO` 값을 바꿉니다.
- 아이콘이 안 보이면 `.lnk`를 삭제 후 6번 바로가기 생성을 다시 실행합니다.
- 한글 경로가 깨지면 `.env`에 `C:\Users\이름`을 직접 쓰지 말고 `%USERPROFILE%`을 사용합니다.
