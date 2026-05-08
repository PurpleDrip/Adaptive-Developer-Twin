# ADT Backend Orchestrator - Non-Docker Launcher
# Usage: ./scripts/run_backend.ps1

$ErrorActionPreference = "Stop"

# 1. Load Environment Variables from .env
if (Test-Path ".env") {
    Get-Content .env | ForEach-Object {
        if ($_ -match "^(?<key>[^#=]+)=(?<value>.*)$") {
            $key = $Matches["key"].Trim()
            $value = $Matches["value"].Trim().Replace('"', '').Replace("'", "")
            [System.Environment]::SetEnvironmentVariable($key, $value)
        }
    }
    Write-Host "[INIT] Environment Variables Loaded from .env" -ForegroundColor Cyan
}

# 2. Port Mapping Configuration
$services = @(
    @{ name = "auth-service"; path = "backend/auth"; port = 8001 },
    @{ name = "telemetry-service"; path = "backend/telemetry"; port = 8002 },
    @{ name = "task-service"; path = "backend/task"; port = 8003 },
    @{ name = "analytics-service"; path = "backend/analytics"; port = 8004 },
    @{ name = "fusion-service"; path = "backend/fusion"; port = 8005 },
    @{ name = "monitoring-service"; path = "backend/monitoring"; port = 8007 },
    @{ name = "thg-service"; path = "backend/thg"; port = 8008 },
    @{ name = "allocation-engine"; path = "backend/allocation"; port = 8009 },
    @{ name = "gateway-service"; path = "backend/gateway"; port = 8000 } # Gateway last
)

Write-Host "[INIT] Starting 9 Microservices in Parallel Mode..." -ForegroundColor Green

# 3. Launch Services
$jobs = @()
$rootDir = Get-Location
foreach ($s in $services) {
    $absPath = Join-Path $rootDir $s.path
    Write-Host "[START] $($s.name) on port $($s.port)..." -ForegroundColor Yellow
    
    # Use absolute paths to ensure Start-Job finds the code
    $jobs += Start-Job -Name $s.name -ScriptBlock {
        param($absPath, $port, $rootDir)
        Set-Location $absPath
        $env:PYTHONPATH = "$rootDir;$absPath"
        # Redirect stderr to stdout (2>&1) to prevent NativeCommandError breaks
        python -m uvicorn app.main:app --host 0.0.0.0 --port $port --reload 2>&1
    } -ArgumentList $absPath, $s.port, $rootDir
}

Write-Host "`n[SUCCESS] All services are booting. Streaming logs below...`n" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop all services.`n" -ForegroundColor Gray

# 4. Tail Logs
try {
    while ($true) {
        foreach ($job in $jobs) {
            # Capture both standard and error output to prevent NativeCommandError breaks
            $data = Receive-Job -Job $job -ErrorAction SilentlyContinue
            if ($data) {
                $timestamp = Get-Date -Format "HH:mm:ss"
                Write-Host "[$timestamp] [$($job.Name)] " -NoNewline -ForegroundColor Cyan
                Write-Host $data
            }
        }
        Start-Sleep -Milliseconds 200
        
        # Check if any job died
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
