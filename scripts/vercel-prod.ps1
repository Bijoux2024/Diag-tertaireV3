$ErrorActionPreference = "Stop"

Write-Host "WARNING: You are about to deploy to PRODUCTION." -ForegroundColor Yellow
Write-Host "This should be run only from the stable branch (usually main)." -ForegroundColor Yellow
Write-Host "" 
$resp = Read-Host "Type 'DEPLOY' to confirm production deploy"
if ($resp -ne "DEPLOY") {
  Write-Host "Cancelled." -ForegroundColor DarkGray
  exit 0
}

npx vercel --prod

