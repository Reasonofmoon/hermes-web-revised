# ============================================================
# Hermes Web UI -- Windows native bootstrap
# Usage: .\start.ps1 [port]
#
# Mirror of start.sh for native Windows / PowerShell.
# Discovers your Hermes install, sets up a local virtualenv if
# needed, installs dependencies, then launches the server.
#
# Override any step with environment variables:
#   HERMES_WEBUI_AGENT_DIR   path to hermes-agent checkout
#   HERMES_WEBUI_PYTHON      python.exe to use
#   HERMES_WEBUI_PORT        port to listen on (default: 8787)
#   HERMES_WEBUI_HOST        bind address (default: 127.0.0.1)
#   HERMES_HOME              override hermes base dir (default: %LOCALAPPDATA%\hermes)
#   HERMES_WEBUI_STATE_DIR   override state directory
# ============================================================

param([int]$Port = 0)

$ErrorActionPreference = 'Stop'

function Write-Ok    { param($m) Write-Host "[ok] $m"   -ForegroundColor Green }
function Write-Warn  { param($m) Write-Host "[!!] $m"   -ForegroundColor Yellow }
function Write-Info  { param($m) Write-Host "[--] $m"   -ForegroundColor Cyan }
function Write-Die   { param($m) Write-Host "[XX] $m"   -ForegroundColor Red; exit 1 }
function Write-Hdr   { param($m) Write-Host ""; Write-Host $m -ForegroundColor White }

$RepoRoot = $PSScriptRoot
Write-Info "Repo root: $RepoRoot"

# ── Load .env if present ─────────────────────────────────────────────────────
$EnvFile = Join-Path $RepoRoot ".env"
if (Test-Path $EnvFile) {
    Get-Content $EnvFile | Where-Object { $_ -match '^\s*[^#].*=' } | ForEach-Object {
        $k, $v = $_ -split '=', 2
        $k = $k.Trim()
        $v = $v.Trim().Trim('"').Trim("'")
        if ($k) { [Environment]::SetEnvironmentVariable($k, $v, 'Process') }
    }
}

# ── Port ─────────────────────────────────────────────────────────────────────
if ($Port -le 0) {
    if ($env:HERMES_WEBUI_PORT) { $Port = [int]$env:HERMES_WEBUI_PORT } else { $Port = 8787 }
}
$env:HERMES_WEBUI_PORT = "$Port"

# ── Hermes home & agent discovery ────────────────────────────────────────────
Write-Hdr "Discovering Hermes agent..."

if (-not $env:HERMES_HOME) {
    $env:HERMES_HOME = Join-Path $env:LOCALAPPDATA "hermes"
}

if (-not $env:HERMES_WEBUI_AGENT_DIR) {
    $candidates = @(
        (Join-Path $env:HERMES_HOME "hermes-agent"),
        (Join-Path (Split-Path $RepoRoot -Parent) "hermes-agent"),
        (Join-Path $env:USERPROFILE "hermes-agent"),
        (Join-Path $env:USERPROFILE ".hermes\hermes-agent")
    )
    foreach ($c in $candidates) {
        if ($c -and (Test-Path (Join-Path $c "run_agent.py"))) {
            $env:HERMES_WEBUI_AGENT_DIR = $c
            break
        }
    }
}

if ($env:HERMES_WEBUI_AGENT_DIR) {
    Write-Ok "Hermes agent: $env:HERMES_WEBUI_AGENT_DIR"
} else {
    Write-Warn "Hermes agent not found. Agent features will not work."
    Write-Warn 'Fix with: $env:HERMES_WEBUI_AGENT_DIR = "C:\path\to\hermes-agent"'
}

# ── Python discovery ─────────────────────────────────────────────────────────
Write-Hdr "Discovering Python..."

if (-not $env:HERMES_WEBUI_PYTHON) {
    # 1. Agent venv (preferred — has all hermes deps)
    if ($env:HERMES_WEBUI_AGENT_DIR) {
        $agentPy = Join-Path $env:HERMES_WEBUI_AGENT_DIR "venv\Scripts\python.exe"
        if (Test-Path $agentPy) { $env:HERMES_WEBUI_PYTHON = $agentPy }
    }
}
if (-not $env:HERMES_WEBUI_PYTHON) {
    # 2. Local .venv in repo
    $localPy = Join-Path $RepoRoot ".venv\Scripts\python.exe"
    if (Test-Path $localPy) { $env:HERMES_WEBUI_PYTHON = $localPy }
}
if (-not $env:HERMES_WEBUI_PYTHON) {
    # 3. System python
    $cmd = Get-Command python -ErrorAction SilentlyContinue
    if (-not $cmd) { $cmd = Get-Command py -ErrorAction SilentlyContinue }
    if ($cmd) { $env:HERMES_WEBUI_PYTHON = $cmd.Source }
}

if (-not $env:HERMES_WEBUI_PYTHON) {
    Write-Die "Python not found. Install Python 3.8+ or set HERMES_WEBUI_PYTHON."
}

$pyVerOut = & $env:HERMES_WEBUI_PYTHON --version 2>&1
Write-Ok "Python: $env:HERMES_WEBUI_PYTHON  ($pyVerOut)"

# Python version check (>= 3.8)
$pyOk = & $env:HERMES_WEBUI_PYTHON -c "import sys; print(1 if sys.version_info >= (3, 8) else 0)" 2>&1
if ($pyOk -ne "1") { Write-Die "Python 3.8+ required. Found: $pyVerOut" }

# ── Dependency check / local venv setup ──────────────────────────────────────
Write-Hdr "Checking dependencies..."

$null = & $env:HERMES_WEBUI_PYTHON -c "import yaml" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Info "PyYAML not found. Creating local .venv..."
    $venvPath = Join-Path $RepoRoot ".venv"
    if (-not (Test-Path $venvPath)) {
        & $env:HERMES_WEBUI_PYTHON -m venv $venvPath
        if ($LASTEXITCODE -ne 0) { Write-Die "Failed to create virtualenv at $venvPath" }
    }
    $env:HERMES_WEBUI_PYTHON = Join-Path $venvPath "Scripts\python.exe"
    & $env:HERMES_WEBUI_PYTHON -m pip install --quiet --upgrade pip
    $req = Join-Path $RepoRoot "requirements.txt"
    if (Test-Path $req) {
        Write-Info "Installing from requirements.txt..."
        & $env:HERMES_WEBUI_PYTHON -m pip install --quiet -r $req
    } else {
        Write-Info "Installing minimal deps (pyyaml)..."
        & $env:HERMES_WEBUI_PYTHON -m pip install --quiet pyyaml
    }
    Write-Ok "Local venv ready: $venvPath"
} else {
    Write-Ok "Dependencies satisfied."
}

# ── Kill any stale instance on the same port ─────────────────────────────────
Write-Hdr "Checking for existing instances..."
$existing = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
foreach ($e in $existing) {
    Write-Warn "Killing existing process on port $Port (PID $($e.OwningProcess))"
    Stop-Process -Id $e.OwningProcess -Force -ErrorAction SilentlyContinue
}
if ($existing) { Start-Sleep -Milliseconds 500 }

# ── Launch ───────────────────────────────────────────────────────────────────
Write-Hdr "Starting Hermes Web UI..."

if (-not $env:HERMES_WEBUI_HOST) { $env:HERMES_WEBUI_HOST = "127.0.0.1" }
if (-not $env:HERMES_WEBUI_STATE_DIR) {
    $env:HERMES_WEBUI_STATE_DIR = Join-Path $env:HERMES_HOME "webui"
}

Set-Location $RepoRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor White
Write-Host "  Hermes Web UI is starting"             -ForegroundColor Green
Write-Host "========================================" -ForegroundColor White
Write-Host "  Open: http://localhost:$Port" -ForegroundColor White
Write-Host ""

& $env:HERMES_WEBUI_PYTHON (Join-Path $RepoRoot "server.py")
