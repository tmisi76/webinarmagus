# Webinár Mágus v0.1 CLI release

A jelenlegi publikus kiadás **CLI-only**. A macOS DMG és Windows EXE terjesztés ideiglenesen ki van kapcsolva; ezekhez később kapcsoljuk vissza a signing/notarization folyamatot.

## Release hitelesítés

A CLI runtime publikálása **nem igényel kézzel beállított release secretet**.

A `runtime-bundle` GitHub Actions workflow rövid életű GitHub OIDC tokent kér, az AutoWebinar release backend pedig csak akkor fogadja el a feltöltést, ha a token:

- a GitHub hivatalos OIDC issuerétől származik,
- audience: `autowebinar-webinar-magus-release`,
- repository: `tmisi76/webinar-magus`,
- `vX.Y.Z` tagről fut,
- a `.github/workflows/runtime-bundle.yml` workflow-ból érkezik.

Nincs hosszú életű feltöltési token, amit a felhasználónak vagy a repositorynak kézzel kellene kezelnie.

## Release indítása

A release branch:

```
release/v0.1.1
```

A branch push után a `release-kickoff` workflow ellenőrzi:

1. a branch verzióját;
2. a `package.json` verzióját;
3. hogy a `v0.1.1` tag még nem létezik.

A runtime feltöltés hitelesítését a külön `runtime-bundle` workflow GitHub OIDC tokenje végzi; kézzel kezelt release secret nem szükséges.

Siker esetén létrehozza a `v0.1.1` taget.

A `release-kickoff` a tag létrehozása után explicit `workflow_dispatch` eseménnyel elindítja a `runtime-bundle` workflow-t a tagen. Ez azért szükséges, mert a GitHub nem indít új workflow-t egy `GITHUB_TOKEN`-nel létrehozott tag push eseményéből. A runtime workflow elkészíti és publikálja:

- `webinar-magus-runtime.tar.gz`
- `webinar-magus-runtime.tar.gz.sha256`
- `version.json`

Publikáció:

- verziózott: `/downloads/webinar-magus/v0.1.1/`
- aktuális: `/downloads/webinar-magus/latest/`

## Telepítés

macOS / Linux:

```bash
curl -fsSL https://autowebinar.hu/webinar-magus/install | bash
```

Windows PowerShell:

```powershell
irm https://autowebinar.hu/webinar-magus/install.ps1 | iex
```

A Windows CLI WSL-ben telepíti és futtatja a runtime-ot.

## Telepítő biztonság

A bootstrap:

1. letölti a `latest` runtime csomagot;
2. letölti a SHA-256 fájlt;
3. ellenőrzi a csomag hashét;
4. csak egyező checksum esetén bontja ki és indítja a telepítőt.

A végfelhasználónak nem kell hozzáférés a privát GitHub repositoryhoz.

## Smoke test

A CLI release csak akkor tekinthető késznek, ha:

- a `latest/version.json` a kiadott verziót adja;
- a macOS/Linux bootstrap repo-hozzáférés nélkül végigfut;
- a Windows PowerShell bootstrap WSL-ben végigfut;
- legalább egy AI provider live probe-ja sikeres;
- az AutoWebinar connector megjelenik és OAuth kapcsolható;
- `bash update.sh` checksum-ellenőrzött runtime-ból frissít;
- frissítéskor a `.env`, `store/`, agent- és memóriaállapot megmarad.

## Desktop később

A DMG/EXE build és signing kód megmarad, de a `v*` tag jelenleg nem indít desktop release buildet. Amikor rendelkezésre áll az Apple Developer és Windows code-signing credential, külön release-lépésben visszakapcsolható.
