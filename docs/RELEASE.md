# Webinár Mágus v0.1 release

Ez a dokumentum a nyilvános, aláírt v0.1 release egyetlen külső előfeltételét írja le.

A kódoldali release pipeline kész. A `release/v0.1.0` branch létrejött, de a
`release-kickoff` workflow szándékosan nem hozta létre a `v0.1.0` taget,
mert a kötelező signing/publish secretek még nincsenek beállítva.

## Kötelező GitHub Actions secretek

A repositoryban: **Settings → Secrets and variables → Actions**.

### macOS signing és notarization

- `MAC_CSC_LINK`
  - a Developer ID Application tanúsítvány exportált `.p12` fájlja
    electron-builder által elfogadott formában (például base64/data URL vagy
    biztonságosan elérhető fájl-URL)
- `MAC_CSC_KEY_PASSWORD`
  - a `.p12` export jelszava
- `APPLE_ID`
  - az Apple Developer fiók Apple ID-ja
- `APPLE_APP_SPECIFIC_PASSWORD`
  - az Apple ID-hoz létrehozott app-specifikus jelszó
- `APPLE_TEAM_ID`
  - az Apple Developer Team ID

A tagelt build csak akkor mehet tovább, ha a DMG aláírása és notarizationje
sikeres, majd a CI `codesign --verify` és `spctl --assess` ellenőrzése is
zöld.

## Windows Authenticode

- `WIN_CSC_LINK`
  - a Windows code-signing tanúsítvány `.pfx/.p12` csomagja
    electron-builder által elfogadott formában
- `WIN_CSC_KEY_PASSWORD`
  - a tanúsítvány export jelszava

A release EXE build után a CI `Get-AuthenticodeSignature`-rel ellenőrzi az
aláírást. Nem `Valid` állapot esetén a release leáll.

## Runtime publish token

- `WEBINAR_MAGUS_RELEASE_TOKEN`

Ez egy külön, hosszú véletlen bearer token. Példa generálás:

```bash
openssl rand -hex 32
```

Ugyanazt az értéket kell beállítani:

1. a `tmisi76/webinar-magus` GitHub repository
   `WEBINAR_MAGUS_RELEASE_TOKEN` Actions secretjeként;
2. az AutoWebinar/Lovable Cloud backend
   `WEBINAR_MAGUS_RELEASE_TOKEN` környezeti secretjeként.

A token **nem kerülhet commitba, README-be, logba vagy kliensoldali env-be**.

## A release indítása

A release branch már létezik:

```
release/v0.1.0
```

Miután mind a nyolc secret be van állítva, a korábbi sikertelen
`release-kickoff` futás **Re-run failed jobs** művelete elegendő.

Sikeres preflight esetén a workflow:

1. ellenőrzi, hogy a branch verziója `v0.1.0`;
2. ellenőrzi, hogy a `package.json` verziója `0.1.0`;
3. ellenőrzi mind a nyolc release secret jelenlétét;
4. ellenőrzi, hogy a `v0.1.0` tag még nem létezik;
5. létrehozza és pusholja a `v0.1.0` taget.

A tag automatikusan elindítja:

- `desktop-build`
  - macOS DMG build + signing + notarization
  - Windows EXE build + Authenticode signing
  - GitHub Release létrehozás
  - `SHA256SUMS.txt`
- `runtime-bundle`
  - CLI runtime bundle
  - SHA-256 fájl
  - `version.json`
  - verziózott és `latest` runtime publikálás az AutoWebinar release storage-ba

## Publikus telepítési utak

macOS / Linux:

```bash
curl -fsSL https://autowebinar.hu/webinar-magus/install | bash
```

Windows PowerShell:

```powershell
irm https://autowebinar.hu/webinar-magus/install.ps1 | iex
```

A runtime innen érkezik:

```
https://autowebinar.hu/downloads/webinar-magus/latest/
```

A telepítő és az updater SHA-256 ellenőrzést végez.

## Release utáni smoke test

A `v0.1.0` release csak akkor tekinthető késznek, ha:

- a GitHub Release tartalmazza a macOS DMG-t;
- a GitHub Release tartalmazza a Windows EXE-t;
- a `SHA256SUMS.txt` létrejött;
- a macOS app Gatekeeper ellenőrzése sikeres;
- a Windows EXE Authenticode státusza `Valid`;
- a `latest/version.json` `0.1.0` verziót ad;
- a CLI installer friss gépen végigfut GitHub repo-hozzáférés nélkül;
- a desktop első indítás feltelepíti a bundled runtime-ot;
- a provider onboardingból legalább egy API provider live probe-ja sikeres;
- az AutoWebinar MCP connector megjelenik és OAuth kapcsolható;
- egy újabb runtime bundle-lel az önfrissítés megőrzi a `.env`, `store/`,
  agent- és memóriaállapotot.

## Biztonsági szabály

A signing és runtime publish secretek nélkül **nem készítünk publikus v0.1.0
taget**. Ez szándékos: így nem kerül ki unsigned, Gatekeeper/SmartScreen által
blokkolt vagy frissíthetetlen ügyfélbuild.
