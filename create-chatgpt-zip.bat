@echo off
setlocal enabledelayedexpansion

rem === Configuration ===
set "ZIP_NAME=chatgpt-upload.zip"
set "EXCLUDE_LIST=_site;node_modules;.git;.jekyll-cache;.sass-cache;.bundle;.cache;%ZIP_NAME%"

rem === Remove previous archive if it exists ===
if exist "%ZIP_NAME%" del /f /q "%ZIP_NAME%"

rem === Build PowerShell command to collect include targets ===
set "PS_EXCLUDES="
for %%E in (%EXCLUDE_LIST%) do (
    set "PS_EXCLUDES=!PS_EXCLUDES!,'%%~E'"
)
set "PS_COMMAND=$root = Get-Location;"
set "PS_COMMAND=%PS_COMMAND% $zip = Join-Path $root '%ZIP_NAME%';"
set "PS_COMMAND=%PS_COMMAND% $excludes = @(%PS_EXCLUDES:~1%);"
set "PS_COMMAND=%PS_COMMAND% $items = Get-ChildItem -Force | Where-Object { $excludes -notcontains $_.Name };"
set "PS_COMMAND=%PS_COMMAND% Compress-Archive -Path $items.FullName -DestinationPath $zip -CompressionLevel Optimal -Force;"

powershell -NoLogo -NoProfile -Command "%PS_COMMAND%"

if exist "%ZIP_NAME%" (
    echo Created %ZIP_NAME%
    exit /b 0
) else (
    echo Failed to create archive
    exit /b 1
)

endlocal
