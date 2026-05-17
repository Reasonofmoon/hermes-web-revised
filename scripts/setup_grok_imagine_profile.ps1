param(
    [string]$WorkspacePath = "",

    [string]$WslDistro = "Ubuntu",

    [switch]$SetActiveProfile
)

$ErrorActionPreference = "Stop"

function Write-Ok { param([string]$Message) Write-Host "[ok] $Message" -ForegroundColor Green }
function Write-Info { param([string]$Message) Write-Host "[--] $Message" -ForegroundColor Cyan }
function Write-Warn { param([string]$Message) Write-Host "[!!] $Message" -ForegroundColor Yellow }

function Backup-File {
    param([string]$Path)
    if (Test-Path -LiteralPath $Path) {
        $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $backup = "$Path.bak-$stamp"
        Copy-Item -LiteralPath $Path -Destination $backup -Force
        Write-Warn "Backed up existing file: $backup"
    }
}

function Write-Utf8 {
    param(
        [string]$Path,
        [string]$Content
    )
    $dir = Split-Path -Parent $Path
    if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $utf8NoBom = [System.Text.UTF8Encoding]::new($false)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

$homeDir = [Environment]::GetFolderPath("UserProfile")
$hermesHome = Join-Path $homeDir ".hermes"
$profilesDir = Join-Path $hermesHome "profiles"
$profileName = "grok-imagine-studio"
$profileDir = Join-Path $profilesDir $profileName
$wikiDir = Join-Path $hermesHome "webui\llm_wiki"

if (-not $WorkspacePath) {
    $WorkspacePath = Join-Path $homeDir "Documents\MoonWorkspace\projects\grok-imagine-studio"
}
$workspaceResolved = (New-Item -ItemType Directory -Force -Path $WorkspacePath).FullName
$webuiStateDir = Join-Path $profileDir "webui_state"

Write-Info "Grok Imagine workspace: $workspaceResolved"
Write-Info "Profile: $profileDir"

New-Item -ItemType Directory -Force -Path $profileDir | Out-Null
foreach ($sub in @("memories", "sessions", "skills", "skins", "logs", "plans", "workspace", "cron", "cron\output", "webui_state", "outputs", "outputs\images", "outputs\videos", "prompts")) {
    New-Item -ItemType Directory -Force -Path (Join-Path $profileDir $sub) | Out-Null
}

$configPath = Join-Path $profileDir "config.yaml"
Backup-File $configPath
$config = @"
model:
  provider: xai-oauth
  default: grok-4.3
  base_url: https://api.x.ai/v1
workspace: '$workspaceResolved'
default_workspace: '$workspaceResolved'
terminal:
  cwd: '$workspaceResolved'
profile:
  name: grok-imagine-studio
  purpose: "Generative image and video production using Grok Imagine models through xAI OAuth."
webui:
  default_model: grok-imagine-image-quality
  image_model: grok-imagine-image-quality
  video_model: grok-imagine-video
  orchestrator_model: grok-build
  wsl_distro: "$WslDistro"
media:
  delivery: local
  image_model: grok-imagine-image-quality
  video_model: grok-imagine-video
  default_image_aspect_ratio: landscape
  default_video_aspect_ratio: "16:9"
  default_video_resolution: "720p"
  default_video_duration_seconds: 8
"@
Write-Utf8 -Path $configPath -Content $config
Write-Ok "Wrote profile config: $configPath"

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$workspaces = @(
    @{
        name = "Imagine Studio"
        path = $workspaceResolved
    },
    @{
        name = "Hermes Web"
        path = $repoRoot
    }
)
$workspacesPath = Join-Path $webuiStateDir "workspaces.json"
Backup-File $workspacesPath
Write-Utf8 -Path $workspacesPath -Content (($workspaces | ConvertTo-Json -Depth 8) + "`n")
Write-Utf8 -Path (Join-Path $webuiStateDir "last_workspace.txt") -Content $workspaceResolved
Write-Ok "Registered WebUI workspaces: $workspacesPath"

$skills = @{
    "imagine-prompt-director" = @"
# Imagine Prompt Director

Use this skill to convert a rough visual idea into a production-ready Grok Imagine prompt.

Process:
1. Clarify the subject, setting, style, mood, composition, and output format.
2. Preserve the user's intent while removing vague filler.
3. Add concrete visual details only when they improve controllability.
4. Keep prompts concise enough for direct image or video generation.

Output format:
- Final prompt
- Model recommendation: grok-imagine-image-quality or grok-imagine-video
- Aspect ratio and duration recommendation
- One risk or ambiguity to check
"@
    "imagine-image-art-director" = @"
# Imagine Image Art Director

Use this skill for Grok Imagine still image generation.

Defaults:
- Model: grok-imagine-image-quality
- Aspect ratio: landscape unless the user asks for square or portrait
- Resolution: 1k by default, 2k only when explicitly useful

Quality checklist:
1. State the subject and visual hierarchy clearly.
2. Include medium/style, lighting, lens or perspective, color palette, and background.
3. Avoid text in images unless the user explicitly asks for typography.
4. Ask before generating copyrighted character lookalikes, explicit public figure likenesses, or sensitive content.
"@
    "imagine-video-storyboard" = @"
# Imagine Video Storyboard

Use this skill for Grok Imagine video generation.

Defaults:
- Model: grok-imagine-video
- Duration: 8 seconds
- Resolution: 720p
- Aspect ratio: 16:9

Process:
1. Convert the idea into one short shot, not a multi-scene film, unless the user asks otherwise.
2. Specify camera movement, subject movement, environment motion, pacing, and atmosphere.
3. Keep duration realistic for a single generated clip.
4. For image-to-video, describe how the still image should animate without changing identity.

Output format:
- Video prompt
- Duration / aspect ratio / resolution
- Motion notes
- Risks to inspect after generation
"@
    "imagine-media-qa" = @"
# Imagine Media QA

Use this skill to review generated images and videos.

Check:
1. Does the output match the prompt?
2. Are there visible artifacts, broken anatomy, unreadable text, identity drift, or temporal flicker?
3. Is the result suitable for the intended use?
4. Should the next run change prompt, aspect ratio, duration, or model?

Output format:
- Pass / revise
- What worked
- What failed
- Next prompt revision
"@
}

foreach ($name in $skills.Keys) {
    $skillDir = Join-Path (Join-Path $profileDir "skills") $name
    New-Item -ItemType Directory -Force -Path $skillDir | Out-Null
    $skillPath = Join-Path $skillDir "SKILL.md"
    Backup-File $skillPath
    Write-Utf8 -Path $skillPath -Content $skills[$name]
    Write-Ok "Wrote skill: $name"
}

$wikiPath = Join-Path $wikiDir "grok-imagine-studio.md"
Backup-File $wikiPath
$wiki = @"
# Grok Imagine Studio

Grok Imagine Studio is a Hermes profile for image and video generation through xAI OAuth.

## Profile

- Profile: grok-imagine-studio
- Workspace: $workspaceResolved
- WSL distro: $WslDistro
- Image model: grok-imagine-image-quality
- Video model: grok-imagine-video
- Chat/orchestration model: grok-build
- Credential source: xai-oauth, no XAI_API_KEY required when OAuth is logged in

## Operating Contract

Use this profile for visual production tasks: prompt design, still image generation, video prompt/storyboard generation, local output review, and iteration planning.

Generated video URLs can be ephemeral. Important outputs should be downloaded or archived by an explicit follow-up step.

## Recommended Flow

1. Draft or refine prompt with imagine-prompt-director.
2. Generate image with grok-imagine-image-quality or video with grok-imagine-video.
3. Review with imagine-media-qa.
4. Revise prompt or save output to the workspace.
"@
Write-Utf8 -Path $wikiPath -Content $wiki
Write-Ok "Wrote LLM Wiki page: $wikiPath"

if ($SetActiveProfile) {
    $activeProfilePath = Join-Path $hermesHome "active_profile"
    Backup-File $activeProfilePath
    Write-Utf8 -Path $activeProfilePath -Content $profileName
    Write-Ok "Set active profile: $profileName"
}

Write-Host ""
Write-Ok "Grok Imagine Studio profile is ready."
Write-Host "profile: $profileName"
Write-Host "profile path: $profileDir"
Write-Host "workspace: $workspaceResolved"
Write-Host "llm wiki: $wikiPath"
