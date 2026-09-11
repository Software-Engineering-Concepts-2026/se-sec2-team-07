$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
if (-not (Test-Path -LiteralPath '.env')) {
    throw 'Configure .env first. See docs/development.md or run npm run db:local.'
}
if (-not (Test-Path -LiteralPath 'dist/index.html')) {
    & node node_modules/vite/bin/vite.js build
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
& node --env-file=.env src/backend/server.js
