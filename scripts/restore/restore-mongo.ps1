# Restores a MongoDB backup created by backup-mongo.ps1.
# DESTRUCTIVE: --drop replaces existing collections with the backup's contents.
#
# Usage:
#   ./scripts/restore/restore-mongo.ps1 -BackupFile ./backups/mongo/devmind-mongo-20260904-101500.archive

param(
    [Parameter(Mandatory = $true)][string]$BackupFile,
    [string]$ComposeFile = "docker-compose.lite.yml"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupFile)) {
    Write-Error "Backup file not found: $BackupFile"
    exit 1
}

Write-Host "This will OVERWRITE existing MongoDB collections using: $BackupFile"
$confirm = Read-Host "Type 'yes' to continue"
if ($confirm -ne "yes") {
    Write-Host "Aborted."
    exit 0
}

$containerPath = "/tmp/restore.archive"
docker compose -f $ComposeFile cp $BackupFile "mongodb:$containerPath"

docker compose -f $ComposeFile exec -T mongodb sh -c `
    "mongorestore --username `$MONGO_INITDB_ROOT_USERNAME --password `$MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase admin --archive=$containerPath --drop"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Restore failed (exit code $LASTEXITCODE)."
    exit 1
}

docker compose -f $ComposeFile exec -T mongodb rm -f $containerPath
Write-Host "Restore complete. Restart ai-service and notification-service to be safe."
