# ADT Dependency Synchronizer
# Usage: ./scripts/setup_backend.ps1

$ErrorActionPreference = "Continue"

Write-Host "[INIT] Synchronizing Microservice Dependencies..." -ForegroundColor Cyan

$backendDirs = Get-ChildItem -Path "backend" -Directory

foreach ($dir in $backendDirs) {
    $reqFile = Join-Path $dir.FullName "requirements.txt"
    if (Test-Path $reqFile) {
        Write-Host "`n[SYNC] Installing requirements for $($dir.Name)..." -ForegroundColor Yellow
        python -m pip install -r $reqFile
    }
}

Write-Host "`n[SUCCESS] All backend dependencies are synchronized!" -ForegroundColor Green
Write-Host "You can now run: ./scripts/run_backend.ps1" -ForegroundColor Gray
