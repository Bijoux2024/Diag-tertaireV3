$ErrorActionPreference = "Stop"

Write-Host "Vercel PREVIEW deploy (safe): this will NOT touch production unless you pass --prod." -ForegroundColor Cyan
Write-Host "If this is your first time, Vercel may prompt for login/project selection." -ForegroundColor DarkGray

# Preview deployment (default)
npx vercel

