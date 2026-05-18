param(
    [string]$WslDistro = "Ubuntu-24.04",
    [string]$ProfileName = "discord-handoff",
    [string]$DiscordHomeChannel = "1505503780832022691",
    [string]$DiscordHomeChannelName = "#hermes-handoff",
    [string]$DiscordAllowedUsers = "1072310500504915968",
    [string]$DiscordAllowedChannels = "",
    [switch]$SetActiveProfile,
    [switch]$SkipWslSync,
    [switch]$NoTokenPrompt
)

$ErrorActionPreference = "Stop"

function Write-Info { param([string]$Message) Write-Host "[--] $Message" -ForegroundColor Cyan }
function Write-Ok { param([string]$Message) Write-Host "[ok] $Message" -ForegroundColor Green }
function Write-Warn { param([string]$Message) Write-Host "[!!] $Message" -ForegroundColor Yellow }

function ConvertTo-PlainText {
    param([Security.SecureString]$Secure)
    if (-not $Secure) { return "" }
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }
}

function Escape-SingleQuotedBash {
    param([string]$Value)
    return $Value -replace "'", "'\''"
}

function Invoke-Wsl {
    param([string]$Command)
    wsl.exe -d $WslDistro -- bash -lc $Command
    if ($LASTEXITCODE -ne 0) {
        throw "WSL command failed with exit code $LASTEXITCODE"
    }
}

function ConvertTo-WslMountPath {
    param([string]$WindowsPath)
    $full = [IO.Path]::GetFullPath($WindowsPath)
    if ($full -notmatch '^([A-Za-z]):\\(.*)$') {
        throw "Only local drive paths are supported for WSL sync: $WindowsPath"
    }
    $drive = $Matches[1].ToLowerInvariant()
    $tail = $Matches[2] -replace '\\', '/'
    return "/mnt/$drive/$tail"
}

$RepoRoot = Split-Path -Parent $PSScriptRoot
$HermesBase = Join-Path $env:USERPROFILE ".hermes"
$ProfileRoot = Join-Path $HermesBase "profiles"
$ProfileDir = Join-Path $ProfileRoot $ProfileName
$SkillsDir = Join-Path $ProfileDir "skills"
$LogsDir = Join-Path $ProfileDir "logs"
$Workspace = Join-Path $env:USERPROFILE "Documents\MoonWorkspace\projects\hermes-discord-handoff"
$OutputDirName = "Hermes-Imagine"
$ImagineDir = Join-Path $Workspace $OutputDirName

if (-not $DiscordAllowedChannels) {
    $DiscordAllowedChannels = $DiscordHomeChannel
}

Write-Info "Repo: $RepoRoot"
Write-Info "Windows profile: $ProfileDir"
Write-Info "Workspace: $Workspace"

New-Item -ItemType Directory -Force -Path $ProfileDir, $SkillsDir, $LogsDir, $Workspace, $ImagineDir | Out-Null

$token = ""
if (-not $NoTokenPrompt) {
    $secureToken = Read-Host "Discord Bot Token 입력 (화면에 표시되지 않음)" -AsSecureString
    $token = ConvertTo-PlainText $secureToken
    if (-not $token.Trim()) {
        throw "Discord Bot Token is required. Re-run with a token or use -NoTokenPrompt only for dry setup."
    }
} else {
    $existingEnv = Join-Path $ProfileDir ".env"
    if (Test-Path $existingEnv) {
        $existingTokenLine = Get-Content -LiteralPath $existingEnv | Where-Object { $_ -match '^DISCORD_BOT_TOKEN=' } | Select-Object -First 1
        if ($existingTokenLine) {
            $token = $existingTokenLine -replace '^DISCORD_BOT_TOKEN=', ''
        }
    }
}

$configYaml = @"
model:
  provider: xai-oauth
  default: grok-4.3
  base_url: https://api.x.ai/v1
workspace: "$($Workspace -replace '\\','/')"
default_workspace: "$($Workspace -replace '\\','/')"
terminal:
  backend: local
  cwd: "$($Workspace -replace '\\','/')"
  timeout: 180
gateway:
  platforms:
    - discord
imagine:
  image_model: grok-imagine-image-quality
  video_model: grok-imagine-video
  output_dir: "$OutputDirName"
  default_image:
    aspect_ratio: "1:1"
    resolution: "1k"
    count: 1
  default_video:
    aspect_ratio: "16:9"
    resolution: "720p"
    duration: 5
image_gen:
  provider: xai
  model: grok-imagine-image
video_gen:
  provider: xai
  model: grok-imagine-video
platform_toolsets:
  cli:
    - terminal
    - file
    - web
    - memory
    - skills
    - todo
    - session_search
    - image_gen
    - video_gen
    - x_search
  discord:
    - terminal
    - file
    - web
    - memory
    - skills
    - image_gen
    - video_gen
    - x_search
agent:
  max_turns: 60
  reasoning_effort: medium
  system_prompt: |-
    You are Hermes Agent in Discord handoff mode for the #hermes-handoff channel.
    xAI OAuth is the active provider and grok-4.3 is the default text model.
    For generation tools, image_gen.provider and video_gen.provider must be xai, not xai-oauth.
    Grok Imagine image and video generation are available through local Python helpers.
    When a user explicitly asks for Hermes tool generation, use image_generate for images and video_generate for videos.
    For image requests, use api.imagine.generate_image and save outputs under $OutputDirName.
    For video requests, use api.imagine.generate_video and save outputs under $OutputDirName.
    Do not answer with ASCII art when the user asks for image or video generation.
    Do not say Grok Imagine is unavailable unless the helper call fails and you include the exact error.
    For Discord attachment pickup, print the generated absolute jpg/png/mp4 path as the final line by itself.
display:
  compact: false
  streaming: true
  skin: default
"@
[IO.File]::WriteAllText((Join-Path $ProfileDir "config.yaml"), $configYaml, [Text.Encoding]::UTF8)

$envLines = @(
    "DISCORD_ALLOWED_USERS=$DiscordAllowedUsers",
    "DISCORD_ALLOWED_CHANNELS=$DiscordAllowedChannels",
    "DISCORD_HOME_CHANNEL=$DiscordHomeChannel",
    "DISCORD_HOME_CHANNEL_NAME=$DiscordHomeChannelName",
    "DISCORD_REQUIRE_MENTION=true",
    "DISCORD_FREE_RESPONSE_CHANNELS=$DiscordHomeChannel",
    "DISCORD_COMMAND_SYNC_POLICY=off"
)
if ($token) {
    $envLines = @("DISCORD_BOT_TOKEN=$token") + $envLines
}
[IO.File]::WriteAllText((Join-Path $ProfileDir ".env"), (($envLines -join [Environment]::NewLine) + [Environment]::NewLine), [Text.Encoding]::UTF8)

$readme = @"
# Discord Handoff Profile

Profile: `$ProfileName`

Discord:

- Channel: `$DiscordHomeChannelName`
- Channel ID: `$DiscordHomeChannel`
- Allowed user ID: `$DiscordAllowedUsers`

Model:

- Provider: `xai-oauth`
- Default model: `grok-4.3`
- Image helper model: `grok-imagine-image-quality`
- Image tool backend: `image_gen.provider=xai`, `model=grok-imagine-image`
- Video model: `grok-imagine-video`
- Video tool backend: `video_gen.provider=xai`, `model=grok-imagine-video`
- Media output folder: `$OutputDirName`

Manual steps per local PC:

1. Run xAI OAuth login with `HERMES_HOME` set to this profile.
2. Start `hermes gateway run --replace` under this profile.
3. Test in Discord channel.
"@
[IO.File]::WriteAllText((Join-Path $Workspace "README.md"), $readme, [Text.Encoding]::UTF8)

$soul = @"
# Discord Handoff Soul

This profile can use Grok Imagine through Hermes Web local helpers.

- Text provider: xai-oauth
- Default text model: grok-4.3
- Image helper: api.imagine.generate_image
- Video helper: api.imagine.generate_video
- Image generation tool backend: image_gen.provider=xai, model=grok-imagine-image
- Video generation tool backend: video_gen.provider=xai, model=grok-imagine-video
- Output folder: $OutputDirName

When a Discord user asks for image or video generation, call the helper, save the result, and put the generated absolute file path on the final line by itself so the Discord gateway can attach it.

If a user explicitly asks for the Hermes image_generate or video_generate tool, use those tools. The backend provider is xai, while the chat model provider remains xai-oauth.

Do not claim that Grok Imagine is unavailable unless the helper returns an actual error. Do not substitute ASCII art for media generation.
"@
[IO.File]::WriteAllText((Join-Path $ProfileDir "SOUL.md"), $soul, [Text.Encoding]::UTF8)

$skillRoot = Join-Path $SkillsDir "discord-handoff-operator"
New-Item -ItemType Directory -Force -Path $skillRoot | Out-Null
$skill = @"
---
name: discord-handoff-operator
description: Use for Discord handoff operations, short channel-safe replies, and local gateway troubleshooting.
---

# Discord Handoff Operator

Keep Discord replies concise and channel-safe.

When troubleshooting:

- Check `hermes auth status xai-oauth`.
- Check `hermes gateway status`.
- Read the profile gateway log.
- Do not print Discord bot tokens.
"@
[IO.File]::WriteAllText((Join-Path $skillRoot "SKILL.md"), $skill, [Text.Encoding]::UTF8)

$imagineSkillRoot = Join-Path $SkillsDir "grok-imagine-discord"
New-Item -ItemType Directory -Force -Path $imagineSkillRoot | Out-Null
$imagineSkill = @'
---
name: grok-imagine-discord
description: Use when Discord users ask Hermes to create images or short videos with Grok Imagine.
---

# Grok Imagine Discord

Use this skill for Discord requests that ask for image generation, video generation, visual assets, posters, thumbnails, product shots, mockups, or short clips.

Operational rules:

- Use `api.imagine.generate_image` for images.
- Use `api.imagine.generate_video` for videos.
- If the user explicitly asks for the Hermes image_generate tool, use `image_generate`.
- If the user explicitly asks for the Hermes video_generate tool, use `video_generate`.
- The tool backends must be configured as `image_gen.provider=xai` and `video_gen.provider=xai`.
- Save outputs under `{{OutputDirName}}`.
- The generated media path must be an absolute local path.
- The final line of the Discord reply must contain only that absolute jpg, png, webp, or mp4 path.
- Do not use a folder name with spaces. Use `{{OutputDirName}}`.
- Do not answer with ASCII art.
- Do not say Grok Imagine is unavailable unless the helper call fails; include the exact error if it fails.

Image example:

    from api.imagine import generate_image
    result = generate_image("tiny test icon, one blue circle", ".", aspect_ratio="1:1", resolution="1k", n=1)
    print(result["images"][0]["path"])

Video example:

    from api.imagine import generate_video
    result = generate_video("a cat walking under sunlight, 5 second cinematic clip", ".", duration=5, aspect_ratio="16:9", resolution="720p")
    print(result["videos"][0]["path"])
'@
$imagineSkill = $imagineSkill.Replace('{{OutputDirName}}', $OutputDirName)
[IO.File]::WriteAllText((Join-Path $imagineSkillRoot "SKILL.md"), $imagineSkill, [Text.Encoding]::UTF8)

if ($SetActiveProfile) {
    [IO.File]::WriteAllText((Join-Path $HermesBase "active_profile"), $ProfileName, [Text.Encoding]::UTF8)
    Write-Ok "Active profile set: $ProfileName"
}

if (-not $SkipWslSync) {
    Write-Info "Syncing profile to WSL distro: $WslDistro"
    $wslHome = (& wsl.exe -d $WslDistro -- printenv HOME).Trim()
    if ($LASTEXITCODE -ne 0 -or -not $wslHome) {
        throw "Could not resolve WSL HOME for distro $WslDistro"
    }
    $wslProfile = "$wslHome/.hermes/profiles/$ProfileName"
    $wslWorkspace = "$wslHome/hermes-discord-handoff"
    $winProfileWsl = ConvertTo-WslMountPath $ProfileDir
    $winWorkspaceWsl = ConvertTo-WslMountPath $Workspace
    $wslConfigYaml = $configYaml.Replace(($Workspace -replace '\\','/'), $wslWorkspace)
    [IO.File]::WriteAllText((Join-Path $ProfileDir "config.wsl.yaml"), $wslConfigYaml, [Text.Encoding]::UTF8)
    Invoke-Wsl "mkdir -p '$wslProfile/skills/discord-handoff-operator' '$wslProfile/skills/grok-imagine-discord' '$wslProfile/logs' '$wslWorkspace/$OutputDirName'"
    Invoke-Wsl "cp -f '$winProfileWsl/config.wsl.yaml' '$wslProfile/config.yaml'"
    Invoke-Wsl "cp -f '$winProfileWsl/.env' '$wslProfile/.env'"
    Invoke-Wsl "cp -f '$winProfileWsl/SOUL.md' '$wslProfile/SOUL.md'"
    Invoke-Wsl "cp -f '$winWorkspaceWsl/README.md' '$wslWorkspace/README.md'"
    Invoke-Wsl "cp -f '$winProfileWsl/skills/discord-handoff-operator/SKILL.md' '$wslProfile/skills/discord-handoff-operator/SKILL.md'"
    Invoke-Wsl "cp -f '$winProfileWsl/skills/grok-imagine-discord/SKILL.md' '$wslProfile/skills/grok-imagine-discord/SKILL.md'"
    Invoke-Wsl "export PATH='$wslHome/.local/bin:/usr/local/bin:/usr/bin:/bin'; hermes -p '$ProfileName' tools enable image_gen video_gen x_search >/dev/null"
    Invoke-Wsl "export PATH='$wslHome/.local/bin:/usr/local/bin:/usr/bin:/bin'; hermes -p '$ProfileName' plugins enable image_gen/xai >/dev/null"
    Invoke-Wsl "export PATH='$wslHome/.local/bin:/usr/local/bin:/usr/bin:/bin'; hermes -p '$ProfileName' plugins enable video_gen/xai >/dev/null"
    if ($SetActiveProfile) {
        Invoke-Wsl "mkdir -p '$wslHome/.hermes' && printf '%s\n' '$ProfileName' > '$wslHome/.hermes/active_profile'"
    }
    Write-Ok "WSL profile synced: $wslProfile"
}

Write-Ok "Discord handoff profile ready."
Write-Host ""
Write-Host "Next xAI OAuth command:" -ForegroundColor White
Write-Host "wsl.exe --% -d $WslDistro -- bash -lc `"export PATH=`$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin; export HERMES_BASE_HOME=`$HOME/.hermes; env PYTHONUNBUFFERED=1 hermes -p $ProfileName auth add xai-oauth --type oauth --no-browser --timeout 120`""
Write-Host ""
Write-Host "Start gateway after OAuth:" -ForegroundColor White
Write-Host "wsl.exe -d $WslDistro -- env HERMES_BASE_HOME=<WSL_HOME>/.hermes PATH=<WSL_HOME>/.local/bin:/usr/local/bin:/usr/bin:/bin bash -lc 'mkdir -p <WSL_HOME>/.hermes/profiles/$ProfileName/logs; nohup hermes -p $ProfileName gateway run --replace > <WSL_HOME>/.hermes/profiles/$ProfileName/logs/gateway.log 2>&1 & sleep 10; hermes -p $ProfileName gateway status; grep -a -n `"Active profile\|Registered /skill\|Connected as\|Gateway running`" <WSL_HOME>/.hermes/profiles/$ProfileName/logs/gateway.log | tail -20'"
