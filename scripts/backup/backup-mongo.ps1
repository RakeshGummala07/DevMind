# Backs up MongoDB (ai-service's conversations/messages/generated_documents,
# notification-service's notifications/notification_preferences).
#
# Usage:
#   ./scripts/backup/backup-mongo.ps1
#   ./scripts/backup/backup-mongo.ps1 -ComposeFile docker-compose.lite.yml -OutDir ./backups

param(
    [string]$ComposeFile = "docker-compose.lite.yml",
    [string]$OutDir = "./backups/mongo"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$archiveName = "devmind-mongo-$timestamp.archive"
$containerPath = "/tmp/$archiveName"
$outFile = Join-Path $OutDir $archiveName

Write-Host "Backing up MongoDB (compose file: $ComposeFile) -> $outFile"

# mongodump --archive writes a single portable file inside the container; we then copy
# it out via `docker compose cp` rather than streaming binary through stdout, which is
# unreliable across PowerShell's text-mode pipes.
docker compose -f $ComposeFile exec -T mongodb sh -c `
    "mongodump --username `$MONGO_INITDB_ROOT_USERNAME --password `$MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase admin --archive=$containerPath"

if ($LASTEXITCODE -ne 0) {
    Write-Error "mongodump failed (exit code $LASTEXITCODE) — check that the mongodb service is running and healthy."
    exit 1
}

docker compose -f $ComposeFile cp "mongodb:$containerPath" $outFile
docker compose -f $ComposeFile exec -T mongodb rm -f $containerPath

$size = (Get-Item $outFile).Length
Write-Host "Backup complete: $outFile ($([math]::Round($size / 1KB, 1)) KB)"
