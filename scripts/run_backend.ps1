# ADT Backend Orchestrator - Non-Docker Launcher
# Usage: ./scripts/run_backend.ps1

$ErrorActionPreference = "Stop"

$rootDir = Split-Path $PSScriptRoot -Parent   # always project root, regardless of where script is called from
$envFile = Join-Path $rootDir ".env"

# 1. Load Environment Variables from .env into a hashtable so they can be passed into Start-Job
#    (Start-Job spawns a new PS process and does NOT inherit dynamically-set env vars from the parent)
$envVars = @{}
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^(?<key>[^#=\s][^=]*)=(?<value>.*)$") {
            $key   = $Matches["key"].Trim()
            $value = $Matches["value"].Trim().Trim('"').Trim("'")
            $envVars[$key] = $value
        }
    }
    Write-Host "[INIT] Environment Variables Loaded from .env ($($envVars.Count) keys)" -ForegroundColor Cyan
} else {
    Write-Host "[WARN] No .env file found at $envFile — using defaults" -ForegroundColor Yellow
}

# 2. Port Mapping Configuration
$services = @(
    @{ name = "auth-service";       path = "backend/auth";       port = 8001 },
    @{ name = "telemetry-service";  path = "backend/telemetry";  port = 8002 },
    @{ name = "task-service";       path = "backend/task";        port = 8003 },
    @{ name = "analytics-service";  path = "backend/analytics";  port = 8004 },
    @{ name = "fusion-service";     path = "backend/fusion";      port = 8005 },
    @{ name = "monitoring-service"; path = "backend/monitoring";  port = 8007 },
    @{ name = "thg-service";        path = "backend/thg";         port = 8008 },
    @{ name = "allocation-engine";  path = "backend/allocation";  port = 8009 },
    @{ name = "gateway-service";    path = "backend/gateway";     port = 8000 }  # Gateway last
)

Write-Host "[INIT] Starting 9 Microservices in Parallel Mode..." -ForegroundColor Green

# 3. Launch Services
$jobs = @()
foreach ($s in $services) {
    $absPath = Join-Path $rootDir $s.path
    Write-Host "[START] $($s.name) on port $($s.port)..." -ForegroundColor Yellow

    $jobs += Start-Job -Name $s.name -ScriptBlock {
        param($absPath, $port, $rootDir, $envVars)

        # Apply all .env vars into this child process's environment
        foreach ($kv in $envVars.GetEnumerator()) {
            [System.Environment]::SetEnvironmentVariable($kv.Key, $kv.Value)
        }

        Set-Location $absPath
        $env:PYTHONPATH = "$rootDir;$absPath"

        python -m uvicorn app.main:app --host 0.0.0.0 --port $port --reload 2>&1
    } -ArgumentList $absPath, $s.port, $rootDir, $envVars
}

Write-Host "`n[SUCCESS] All services are booting. Streaming logs below...`n" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop all services.`n" -ForegroundColor Gray

# 4. Tail Logs
try {
    while ($true) {
        foreach ($job in $jobs) {
            $data = Receive-Job -Job $job -ErrorAction SilentlyContinue
            if ($data) {
                $timestamp = Get-Date -Format "HH:mm:ss"
                Write-Host "[$timestamp] [$($job.Name)] " -NoNewline -ForegroundColor Cyan
                Write-Host $data
            }
        }
        Start-Sleep -Milliseconds 200

        $failedJobs = $jobs | Where-Object { $_.State -eq "Failed" }
        if ($failedJobs) {
            foreach ($fj in $failedJobs) {
                Write-Host "[ERROR] $($fj.Name) has crashed!" -ForegroundColor Red
            }
            break
        }
    }
}
finally {
    Write-Host "`n[STOP] Terminating all backend services..." -ForegroundColor Red
    $jobs | Stop-Job -ErrorAction SilentlyContinue
    $jobs | Remove-Job -ErrorAction SilentlyContinue
}
