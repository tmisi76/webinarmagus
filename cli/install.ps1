$ErrorActionPreference = "Stop"
$BaseUrl = if ($env:WEBINAR_MAGUS_DOWNLOAD_BASE) { $env:WEBINAR_MAGUS_DOWNLOAD_BASE } else { "https://autowebinar.hu/downloads/webinar-magus" }
$Channel = if ($env:WEBINAR_MAGUS_CHANNEL) { $env:WEBINAR_MAGUS_CHANNEL } else { "latest" }
$ArchiveUrl = "$BaseUrl/$Channel/webinar-magus-runtime.tar.gz"
$ChecksumUrl = "$ArchiveUrl.sha256"
$Repair = if ($env:WEBINAR_MAGUS_REPAIR -eq "1") { "1" } else { "0" }

Write-Host ""
Write-Host "  🪄 Webinár Mágus" -ForegroundColor Cyan
Write-Host "  Terminálos Windows telepítés (WSL)" -ForegroundColor DarkGray
Write-Host ""

try {
  $status = (& wsl.exe --status 2>&1 | Out-String) -replace [char]0, ""
} catch { $status = "" }

if ($LASTEXITCODE -ne 0 -and $status -notmatch "Default Distribution") {
  Write-Host "WSL nincs telepítve. Indítom a telepítést…" -ForegroundColor Yellow
  Start-Process wsl.exe -Verb RunAs -ArgumentList "--install"
  Write-Host "Újraindítás után futtasd újra a Webinár Mágus telepítőt." -ForegroundColor Yellow
  exit 30
}

$cmd = @"
set -euo pipefail
INSTALL_DIR=\"\${WEBINAR_MAGUS_INSTALL_DIR:-\$HOME/webinar-magus}\"
TMP_DIR=\"\$(mktemp -d /tmp/webinar-magus-cli.XXXXXX)\"
trap 'rm -rf \"\$TMP_DIR\"' EXIT
if [ -e \"\$INSTALL_DIR\" ]; then
  if [ '$Repair' = '1' ]; then
    BACKUP_DIR=\"\${INSTALL_DIR}.backup-\$(date +%Y%m%d-%H%M%S)\"
    echo \"Meglévő telepítés biztonsági mentése: \$BACKUP_DIR\"
    mv \"\$INSTALL_DIR\" \"\$BACKUP_DIR\"
  else
    echo \"Már létezik Webinár Mágus telepítés itt: \$INSTALL_DIR\"
    echo \"Indítás: cd \$INSTALL_DIR && bash scripts/start.sh\"
    echo \"Frissítés: cd \$INSTALL_DIR && bash update.sh\"
    echo \"Tiszta javító telepítés PowerShellből: set WEBINAR_MAGUS_REPAIR=1, majd futtasd újra a telepítőt.\"
    exit 3
  fi
fi
curl -fL --retry 3 '$ArchiveUrl' -o \"\$TMP_DIR/runtime.tar.gz\"
curl -fL --retry 3 '$ChecksumUrl' -o \"\$TMP_DIR/runtime.tar.gz.sha256\"
EXPECTED=\"\$(awk '{print \$1}' \"\$TMP_DIR/runtime.tar.gz.sha256\")\"
ACTUAL=\"\$(sha256sum \"\$TMP_DIR/runtime.tar.gz\" | awk '{print \$1}')\"
[ \"\$EXPECTED\" = \"\$ACTUAL\" ] || { echo 'Hibás SHA-256 ellenőrzőösszeg.'; exit 5; }
mkdir -p \"\$INSTALL_DIR\"
tar -xzf \"\$TMP_DIR/runtime.tar.gz\" -C \"\$INSTALL_DIR\"
chmod +x \"\$INSTALL_DIR/install-linux.sh\"
cd \"\$INSTALL_DIR\"
export WEBINAR_MAGUS_CLI_BOOTSTRAP=1
exec bash ./install-linux.sh
"@

& wsl.exe bash -lc $cmd
if ($LASTEXITCODE -ne 0) { throw "Webinár Mágus telepítés sikertelen (exit $LASTEXITCODE)." }
