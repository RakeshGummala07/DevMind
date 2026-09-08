param(
    [Parameter(Mandatory = $true)][string]$BackupFile,
    [string]$ComposeFile = "docker-compose.lite.yml"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupFile)) {
    Write-Error "Backup file not found: $BackupFile"
    exit 1
}

Write-Host "This will OVERWRITE the current devmind MySQL database using: $BackupFile"
$confirm = Read-Host "Type 'yes' to continue"
if ($confirm -ne "yes") {
    Write-Host "Aborted."
    exit 0
}

Get-Content $BackupFile | docker compose -f $ComposeFile exec -T mysql sh -c `
    'mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'

if ($LASTEXITCODE -ne 0) {
    Write-Error "Restore failed (exit code $LASTEXITCODE)."
    exit 1
}

Write-Host "Restore complete. Every service sharing this database (auth-service, repository-service, analysis-service) should be restarted to clear any stale connections/caches."
