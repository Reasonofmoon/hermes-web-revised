param(
    [Parameter(Mandatory = $true)]
    [string]$WorldMonitorPath,

    [string]$WslDistro = "Ubuntu",

    [switch]$SetActiveProfile,

    [switch]$CreateCronJobs,

    [string]$BaseUrl = "http://127.0.0.1:8787"
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

function Invoke-HermesApi {
    param(
        [string]$Path,
        [hashtable]$Body
    )
    $json = $Body | ConvertTo-Json -Depth 12
    Invoke-RestMethod -Method Post -Uri "$BaseUrl$Path" -ContentType "application/json; charset=utf-8" -Body $json
}

$worldMonitorResolved = (Resolve-Path -LiteralPath $WorldMonitorPath).Path
$homeDir = [Environment]::GetFolderPath("UserProfile")
$hermesHome = Join-Path $homeDir ".hermes"
$profilesDir = Join-Path $hermesHome "profiles"
$profileName = "worldmonitor-intel"
$profileDir = Join-Path $profilesDir $profileName
$wikiDir = Join-Path $hermesHome "webui\llm_wiki"
$webuiStateDir = Join-Path $profileDir "webui_state"

Write-Info "World Monitor: $worldMonitorResolved"
Write-Info "Profile: $profileDir"

New-Item -ItemType Directory -Force -Path $profileDir | Out-Null
foreach ($sub in @("memories", "sessions", "skills", "skins", "logs", "plans", "workspace", "cron", "cron\output", "webui_state")) {
    New-Item -ItemType Directory -Force -Path (Join-Path $profileDir $sub) | Out-Null
}

$configPath = Join-Path $profileDir "config.yaml"
Backup-File $configPath
$config = @"
model:
  provider: xai-oauth
  default: grok-4.3
  base_url: https://api.x.ai/v1
workspace: "$worldMonitorResolved"
default_workspace: "$worldMonitorResolved"
terminal:
  cwd: "$worldMonitorResolved"
profile:
  name: worldmonitor-intel
  purpose: "World Monitor intelligence, situation briefs, risk analysis, and operations guardrails."
webui:
  default_model: grok-build
  orchestrator_model: grok-build
  wsl_distro: "$WslDistro"
"@
Write-Utf8 -Path $configPath -Content $config
Write-Ok "Wrote profile config: $configPath"

$workspaces = @(
    @{
        name = "World Monitor"
        path = $worldMonitorResolved
    },
    @{
        name = "Hermes Web"
        path = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
    }
)
$workspacesPath = Join-Path $webuiStateDir "workspaces.json"
Backup-File $workspacesPath
Write-Utf8 -Path $workspacesPath -Content (($workspaces | ConvertTo-Json -Depth 8) + "`n")
Write-Utf8 -Path (Join-Path $webuiStateDir "last_workspace.txt") -Content $worldMonitorResolved
Write-Ok "Registered WebUI workspaces: $workspacesPath"

$skills = @{
    "worldmonitor-situation-brief" = @"
# World Monitor Situation Brief

Use this skill to turn current World Monitor project data into a concise intelligence brief.

Process:
1. Inspect the relevant data/source files in the World Monitor workspace.
2. Separate confirmed observations from inference.
3. Summarize the situation, key changes, affected countries or regions, likely next moves, and confidence.
4. End with concrete follow-up checks for the next monitoring cycle.

Output format:
- Executive brief
- Signals and evidence
- Risk movement
- Watch items
- Recommended next actions
"@
    "worldmonitor-country-risk-analyst" = @"
# World Monitor Country Risk Analyst

Use this skill when analyzing a country, region, or geopolitical event for operational risk.

Process:
1. Identify the country/region, time window, and decision context.
2. Review World Monitor data plus any user-provided sources.
3. Score risk qualitatively across security, political, economic, infrastructure, and information reliability dimensions.
4. Explain drivers, uncertainty, and what would change the assessment.

Output format:
- Risk level
- Main drivers
- Indicators to monitor
- Data gaps
- Practical implications
"@
    "worldmonitor-ops-guard" = @"
# World Monitor Operations Guard

Use this skill for recurring monitoring, cron jobs, and agent orchestration around World Monitor.

Rules:
1. Keep cron delivery local unless the user explicitly approves external channels.
2. Do not publish, message, or alert outside the local Hermes environment without confirmation.
3. Preserve raw observations separately from summaries.
4. Name files, commands, and assumptions in the final response.
5. If data quality is weak, say so before making recommendations.

Default verification:
- Confirm the workspace path.
- Confirm profile is worldmonitor-intel.
- Confirm output is saved or visible in Hermes Web.
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

$wikiPath = Join-Path $wikiDir "worldmonitor.md"
Backup-File $wikiPath
$wiki = @"
# World Monitor

World Monitor is registered as a Hermes workspace for intelligence monitoring, country risk analysis, situation briefs, and recurring local review jobs.

## Profile

- Active profile: worldmonitor-intel
- Workspace: $worldMonitorResolved
- WSL distro: $WslDistro
- Preferred local model in Hermes Web: grok-build
- Hermes Agent provider target: xai-oauth
- Hermes Agent default target: grok-4.3

## Operating Contract

Codex acts as the orchestrator. Hermes/Grok Build can be delegated bounded work such as data inspection, summarization, app work, cleanup, or recurring monitor drafts. OAuth login and any external delivery channel must remain user-approved.

## Default Local Cron Ideas

- Morning situation brief: summarize notable changes and watch items.
- Country risk scan: review specified countries and produce risk deltas.
- Ops guard review: check whether monitor jobs produced useful local output and whether sources are stale.
"@
Write-Utf8 -Path $wikiPath -Content $wiki
Write-Ok "Wrote LLM Wiki page: $wikiPath"

$cronTemplates = @(
    @{
        name = "World Monitor Morning Situation Brief"
        schedule = "0 8 * * *"
        model = "grok-build"
        deliver = "local"
        skills = @("worldmonitor-situation-brief", "worldmonitor-ops-guard")
        prompt = "Create a local World Monitor morning situation brief from the workspace. Separate evidence from inference, list key changes, risk movement, watch items, and next checks. Do not send external notifications."
    },
    @{
        name = "World Monitor Country Risk Scan"
        schedule = "0 18 * * 1-5"
        model = "grok-build"
        deliver = "local"
        skills = @("worldmonitor-country-risk-analyst", "worldmonitor-ops-guard")
        prompt = "Review the World Monitor workspace for country or regional risk changes. Produce risk levels, drivers, data gaps, and practical implications. Keep output local."
    },
    @{
        name = "World Monitor Ops Guard"
        schedule = "30 9 * * 1"
        model = "grok-build"
        deliver = "local"
        skills = @("worldmonitor-ops-guard")
        prompt = "Run a short local-only World Monitor ops guard check. Do not inspect files deeply unless the user asks. Reply in concise bullets with profile, workspace, delivery mode, one monitoring risk to watch, and the next verification step. Mention when this is a manual cron validation run."
    }
)

$cronTemplatesPath = Join-Path (Join-Path $profileDir "cron") "worldmonitor-cron-templates.json"
Backup-File $cronTemplatesPath
Write-Utf8 -Path $cronTemplatesPath -Content (($cronTemplates | ConvertTo-Json -Depth 12) + "`n")
Write-Ok "Wrote cron templates: $cronTemplatesPath"

if ($SetActiveProfile) {
    $activeProfilePath = Join-Path $hermesHome "active_profile"
    Backup-File $activeProfilePath
    Write-Utf8 -Path $activeProfilePath -Content $profileName
    Write-Ok "Set active profile: $profileName"
}

if ($CreateCronJobs) {
    Write-Info "Creating local cron jobs through Hermes Web API: $BaseUrl"
    try {
        foreach ($job in $cronTemplates) {
            $body = @{
                name = $job.name
                schedule = $job.schedule
                prompt = "Profile context: worldmonitor-intel`nWorkspace: $worldMonitorResolved`n`n$($job.prompt)"
                model = $job.model
                skills = $job.skills
                deliver = $job.deliver
            }
            $result = Invoke-HermesApi -Path "/api/crons/create" -Body $body
            Write-Ok "Created cron job: $($job.name) ($($result.job.id))"
        }
    }
    catch {
        Write-Warn "Could not create cron jobs. Is Hermes Web running at $BaseUrl?"
        throw
    }
}

Write-Host ""
Write-Ok "World Monitor integration is ready."
Write-Host "active profile: $profileName"
Write-Host "profile path: $profileDir"
Write-Host "workspace: $worldMonitorResolved"
Write-Host "llm wiki: $wikiPath"
Write-Host "cron templates: $cronTemplatesPath"
