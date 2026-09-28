# Webinár Mágus release kézikönyv

Ez a dokumentum a publikus Webinár Mágus release kiadásának minimális, reprodukálható folyamatát írja le.

## Release modell

Egy stabil release három csatornán jelenik meg:

1. **macOS DMG** — Developer ID aláírással és Apple notarizationnel.
2. **Windows EXE** — Authenticode aláírással.
3. **CLI runtime bundle** — verziózott `tar.gz`, SHA-256 checksum és `version.json`.

A release indítása szándékosan fail-closed. A `.github/workflows/release-kickoff.yml` csak akkor hoz létre `vX.Y.Z` taget, ha minden kötelező release credential be van állítva.

## Kötelező GitHub Actions secrets

Repository:

`tmisi76/webinar-magus → Settings → Secrets and variables → Actions`

### macOS

- `MAC_CSC_LINK`
  - a Developer ID Application tanúsítvány exportált `.p12` fájlja vagy electron-builder által elfogadott base64/data URL formátuma.
- `MAC_CSC_KEY_PASSWORD`
  - a `.p12` export jelszava.
- `APPLE_ID`
  - az Apple Developer fiók Apple ID-ja.
- `APPLE_APP_SPECIFIC_PASSWORD`
  - az Apple ID-hoz létrehozott app-specific password.
- `APPLE_TEAM_ID`
  - az Apple Developer Team ID.

### Windows

- `WIN_CSC_LINK`
  - az Authenticode code-signing tanúsítvány electron-builder által elfogadott formában.
- `WIN_CSC_KEY_PASSWORD`
  - a code-signing certificate jelszava.

### Runtime publikálás

- `WEBINAR_MAGUS_RELEASE_TOKEN`
  - ugyanaz a bearer token, amelyet az AutoWebinar `webinar-magus-release` backend a `WEBINAR_MAGUS_RELEASE_TOKEN` környezeti változóból ellenőriz.
  - ezt a tokent a GitHub workflow használja a runtime, checksum és `version.json` feltöltésére.
  - a tokent soha ne commitold repository fájlba.

## v0.1.0 kiadása

A package verzió jelenleg:

`0.1.0`

A release branch:

`release/v0.1.0`

Ha minden secret be van állítva, a release kickoff futást indítsd újra úgy, hogy a release branchre új commit/push kerüljön, vagy a branchet igazítsd a friss `main` commitra.

A kickoff ellenőrzi:

- branch név: `release/vX.Y.Z`
- `package.json` verzió egyezés
- mind a 8 release secret megléte
- tagütközés hiánya

Ezután létrehozza a `v0.1.0` taget.

## Mi történik a tag után?

A `v*` tag automatikusan két release workflow-t indít.

### desktop-build

- macOS arm64 + x64 DMG
- Developer ID signing
- Apple notarization
- `codesign --verify`
- Gatekeeper `spctl --assess`
- Windows x64 NSIS EXE
- Authenticode signing
- `Get-AuthenticodeSignature` ellenőrzés
- GitHub Release
- `SHA256SUMS.txt`

### runtime-bundle

Elkészíti és publikálja:

- `webinar-magus-runtime.tar.gz`
- `webinar-magus-runtime.tar.gz.sha256`
- `version.json`

Publikáció:

- verziózott csatorna: `/downloads/webinar-magus/v0.1.0/`
- latest csatorna: `/downloads/webinar-magus/latest/`

## CLI install

macOS / Linux:

```bash
curl -fsSL https://autowebinar.hu/webinar-magus/install | bash
```

Windows PowerShell:

```powershell
irm https://autowebinar.hu/webinar-magus/install.ps1 | iex
```

A CLI installer SHA-256 ellenőrzés nélkül nem telepít runtime-ot.

## Frissítés

Csomagolt DMG/EXE/CLI install esetén:

```bash
cd ~/webinar-magus
bash update.sh
```

A rendszer a `latest/version.json` alapján ellenőrzi az új release-t és checksum-ellenőrzött runtime bundle-ből frissít.

Fejlesztői Git checkoutnál a Git-alapú updater marad aktív.

## Release előtti ellenőrzőlista

- `main` test workflow: zöld
- `main` secret-gate: zöld
- AutoWebinar `main` CI: zöld
- package verzió helyes
- mind a 8 release secret beállítva
- nincs meglévő azonos `vX.Y.Z` tag
- macOS signing + notarization sikeres
- Windows Authenticode státusz `Valid`
- runtime bundle upload sikeres
- GitHub Release tartalmazza a DMG/EXE fájlokat és `SHA256SUMS.txt`-t
- `latest/version.json` a kiadott verziót mutatja

## Fontos

A release guardot ne kerüld meg unsigned publikus kiadással. Teszt DMG/EXE készülhet aláírás nélkül, de ügyfélnek szánt stabil release csak a signing/notarization ellenőrzések sikerével tekinthető késznek.
