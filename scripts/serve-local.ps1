$ErrorActionPreference = "Stop"

Write-Host "Serving current folder locally (no deploy)..." -ForegroundColor Cyan
Write-Host "Tip: stop with Ctrl+C" -ForegroundColor DarkGray

# Use a stable port to avoid surprises between sessions.
npx serve . -l 4173

