@echo off
setlocal

cd /d "%~dp0"

set "GA4_PROPERTY_ID=492231658"
echo Using GA4_PROPERTY_ID=%GA4_PROPERTY_ID%

set "KEY_FILE=%~1"
if not defined KEY_FILE if defined GA4_SERVICE_ACCOUNT_KEY_FILE set "KEY_FILE=%GA4_SERVICE_ACCOUNT_KEY_FILE%"
if not defined KEY_FILE (
  for %%F in (github-io-*.json) do (
    if not defined KEY_FILE set "KEY_FILE=%%~fF"
  )
)

if defined KEY_FILE (
  if exist "%KEY_FILE%" (
    echo Using service account key file: "%KEY_FILE%"
    set "GA4_KEY_FILE=%KEY_FILE%"
    for /f "usebackq delims=" %%A in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$json = Get-Content -LiteralPath $env:GA4_KEY_FILE -Raw | ConvertFrom-Json; $json.client_email"`) do set "GA4_SERVICE_ACCOUNT_EMAIL=%%A"
    for /f "usebackq delims=" %%A in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$json = Get-Content -LiteralPath $env:GA4_KEY_FILE -Raw | ConvertFrom-Json; $json.private_key -replace \"`r?`n\", \"\n\""`) do set "GA4_PRIVATE_KEY=%%A"
    set "GA4_KEY_FILE="
    ) else (
    echo Key file not found: "%KEY_FILE%"
    exit /b 1
  )
)

if not defined GA4_SERVICE_ACCOUNT_EMAIL (
  echo GA4_SERVICE_ACCOUNT_EMAIL is required.
  echo Set it as an environment variable or pass a service account JSON file path.
  exit /b 1
)

if not defined GA4_PRIVATE_KEY (
  echo GA4_PRIVATE_KEY is required.
  echo Set it as an environment variable or pass a service account JSON file path.
  exit /b 1
)

call npm run update:ga-counter
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
  echo Failed to update _data\ga_counter.json.
  exit /b %EXIT_CODE%
)

echo Updated _data\ga_counter.json.
exit /b 0
