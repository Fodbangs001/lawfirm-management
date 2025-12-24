param(
  [int]$Port = 5055
)

$ErrorActionPreference = 'Stop'

Write-Host "== Hostinger smoke test ==" -ForegroundColor Cyan
Write-Host "1) npm install" -ForegroundColor Cyan
npm install

Write-Host "2) npm run build" -ForegroundColor Cyan
npm run build

Write-Host "3) Start server (PORT=$Port)" -ForegroundColor Cyan
$env:PORT = $Port
$proc = Start-Process -FilePath "node" -ArgumentList "server.cjs" -PassThru -WindowStyle Hidden

try {
  Start-Sleep -Seconds 2

  Write-Host "4) Check UI is served" -ForegroundColor Cyan
  $html = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:$Port/" -TimeoutSec 10
  if ($html.StatusCode -ne 200) { throw "UI returned status $($html.StatusCode)" }
  if ($html.Content -notmatch 'id="root"') { throw "UI index.html missing root div" }

  Write-Host "5) Check login API" -ForegroundColor Cyan
  $body = @{ email = 'admin@lawfirm.com'; password = 'admin123' } | ConvertTo-Json
  $resp = Invoke-RestMethod -Method Post -Uri "http://localhost:$Port/api/auth/login" -ContentType 'application/json' -Body $body -TimeoutSec 10
  if (-not $resp.token) { throw "No token returned" }

  Write-Host "PASS: UI + API look good." -ForegroundColor Green
}
finally {
  if ($proc -and !$proc.HasExited) {
    Stop-Process -Id $proc.Id -Force
  }
}

