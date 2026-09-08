# Backs up the shared `devmind` MySQL database (used by auth-service, repository-service,
# and analysis-service — see the multi-service Flyway convention in docs/architecture.md).
#
# Usage (from repo root, either compose profile):
#   ./scripts/backup/backup-mysql.ps1
#   ./scripts/backup/backup-mysql.ps1 -ComposeFile docker-compose.lite.yml -OutDir ./backups

param(
    [string]$ComposeFile = "docker-compose.lite.yml",
    [string]$OutDir = "./backups/mysql"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outFile = Join-Path $OutDir "devmind-mysql-$timestamp.sql"

Write-Host "Backing up MySQL (compose file: $ComposeFile) -> $outFile"

# mysqldump runs INSIDE the mysql container using its own env vars (MYSQL_ROOT_PASSWORD,
# MYSQL_DATABASE) — nothing needs to be parsed out of .env here, avoiding a second source
# of truth for those values.
docker compose -f $ComposeFile exec -T mysql sh -c `
    'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --triggers "$MYSQL_DATABASE"' `
    | Out-File -Encoding utf8 $outFile

if ($LASTEXITCODE -ne 0) {
    Write-Error "mysqldump failed (exit code $LASTEXITCODE) — check that the mysql service is running and healthy."
    exit 1
}

$size = (Get-Item $outFile).Length
if ($size -lt 100) {
    Write-Warning "Backup file is suspiciously small ($size bytes) — this usually means mysqldump failed silently. Check $outFile before trusting this backup."
} else {
    Write-Host "Backup complete: $outFile ($([math]::Round($size / 1KB, 1)) KB)"
}
