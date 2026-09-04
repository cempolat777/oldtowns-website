$ErrorActionPreference = "Stop"

$projectRoot = (Get-Location).Path
$bundleRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$payloadRoot = Join-Path $bundleRoot "payload"
$packagePath = Join-Path $projectRoot "package.json"

if (-not (Test-Path -LiteralPath $packagePath)) {
  throw "Run this installer from the oldtowns-website project root."
}

$package = Get-Content -LiteralPath $packagePath -Raw | ConvertFrom-Json

if ($package.name -ne "oldtowns-website") {
  throw "The current directory is not the oldtowns-website project root."
}

$files = @(
  "audit-video-integrity.mjs",
  "audit-video-seo.mjs",
  "enrich-video-evidence.mjs",
  "enrich-video-overture.mjs",
  "package.json",
  "repair-video-integrity.mjs",
  "src\lib\nearbyHotels.ts",
  "src\lib\videoSeo.ts",
  "src\pages\[lang]\walks\[id].astro"
)

foreach ($relativePath in $files) {
  $sourcePath = Join-Path $payloadRoot $relativePath

  if (-not (Test-Path -LiteralPath $sourcePath)) {
    throw "Payload file is missing: $relativePath"
  }
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $projectRoot "system-integrity-source-backup-$timestamp"

New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

foreach ($relativePath in $files) {
  $sourcePath = Join-Path $payloadRoot $relativePath
  $targetPath = Join-Path $projectRoot $relativePath
  $backupPath = Join-Path $backupRoot $relativePath
  $targetDirectory = Split-Path -Parent $targetPath
  $backupDirectory = Split-Path -Parent $backupPath

  if (Test-Path -LiteralPath $targetPath) {
    New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null
    Copy-Item -LiteralPath $targetPath -Destination $backupPath -Force
  }

  New-Item -ItemType Directory -Path $targetDirectory -Force | Out-Null
  Copy-Item -LiteralPath $sourcePath -Destination $targetPath -Force
}

Write-Host "System integrity fix installed."
Write-Host "Source backup: $backupRoot"
Write-Host "Next command: npm run repair:integrity -- --release 2026-08-19.0"
