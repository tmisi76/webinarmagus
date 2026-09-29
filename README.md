# Webinár Mágus

<p align="center"><img src="banner.png" alt="Webinár Mágus"></p>

**Önálló AI marketing- és ügyfélszerző csapat az AutoWebinar ökoszisztémához.**

> Státusz: **v0.1.5 CLI release**

A Webinár Mágus egy helyben futó, többügynökös AI rendszer. A saját gépeden futó Mission Control felületből tudsz webináriumot, kampányt, emailt, hirdetést, sales folyamatot és automatizálást tervezni, valamint specialista AI ügynököknek feladatokat delegálni.

## Gyors kezdés

### macOS / Linux

Új telepítéshez ezt az egy parancsot futtasd:

```bash
curl -fsSL https://autowebinar.hu/webinar-magus/install | bash
```

A telepítő automatikusan:

1. letölti a legfrissebb Webinár Mágus runtime-ot;
2. SHA-256-tal ellenőrzi a csomagot;
3. ellenőrzi és szükség esetén telepíti a szükséges komponenseket;
4. macOS-en többek között a Homebrew / Node.js / npm / tmux / Git / Bun környezetet;
5. elindítja az első beállítást;
6. telepíti a háttérszolgáltatásokat;
7. elindítja a Mission Controlt.

A telepítési könyvtár alapértelmezetten:

```text
~/webinar-magus
```

**Fontos:** a mappa neve kötőjeles: `webinar-magus`, nem `webinarmagus`.

### Windows

PowerShellben:

```powershell
irm https://autowebinar.hu/webinar-magus/install.ps1 | iex
```

A Windows változat WSL-t használ. Ha nincs WSL, a telepítő elindítja a telepítését; Windows újraindítás után futtasd újra a fenti parancsot.

## Már létezik telepítés

A telepítő biztonsági okból nem ír felül meglévő `~/webinar-magus` könyvtárat.

Ha működő telepítésed van, indítsd:

```bash
cd ~/webinar-magus
bash scripts/start.sh
```

Frissítés:

```bash
cd ~/webinar-magus
bash update.sh
```

Ha régi, félkész vagy hibás telepítés maradt a gépen, használd a biztonságos javító telepítést:

```bash
curl -fsSL https://autowebinar.hu/webinar-magus/install | bash -s -- --repair
```

A `--repair` **nem törli** a régi könyvtárat. Átnevezi egy időbélyeges mentésre, például:

```text
~/webinar-magus.backup-20260929-110500
```

majd tiszta telepítést készít `~/webinar-magus` alá.

Windows javító telepítés:

```powershell
$env:WEBINAR_MAGUS_REPAIR="1"
irm https://autowebinar.hu/webinar-magus/install.ps1 | iex
```

## A program indítása

Normál felhasználóként **ne** az `npm run dev` vagy `npm start` parancsot használd. Ezek fejlesztői / alacsony szintű Node-parancsok, és megkerülik a teljes szolgáltatásindítást.

A helyes indítás:

```bash
cd ~/webinar-magus
bash scripts/start.sh
```

Sikeres induláskor ezt kapod:

```text
✓ Dashboard: http://localhost:3420
```

Ezután nyisd meg böngészőben:

```text
http://localhost:3420
```

macOS-en a telepítő launchd háttérszolgáltatásokat hoz létre, ezért normál esetben a Webinár Mágus a bejelentkezés után automatikusan is elindul.

## Leállítás és újraindítás

Leállítás:

```bash
cd ~/webinar-magus
bash scripts/stop.sh
```

Újraindítás:

```bash
cd ~/webinar-magus
bash scripts/stop.sh
bash scripts/start.sh
```

## Állapot ellenőrzése

```bash
cd ~/webinar-magus
npm run status
```

Részletes rendszerdiagnosztika:

```bash
cd ~/webinar-magus
bash scripts/doctor.sh
```

A dashboard log:

```bash
tail -n 100 ~/webinar-magus/store/dashboard.log
```

A csatorna/agent log:

```bash
tail -n 100 ~/webinar-magus/store/channels.log
```

## Első beállítás

Az onboarding során:

1. kiválasztod az AI szolgáltatót;
2. kiválasztod a modellt;
3. megadod az API-kulcsot;
4. a rendszer live ellenőrzést végez;
5. összekapcsolhatod az AutoWebinart és a többi connectort;
6. elindul a Főmágus és a specialista AI csapat.

Támogatott AI szolgáltatók:

| Provider | Tipikus használat | Költség |
|---|---|---|
| DeepSeek | nagy volumen, jó ár/érték | kedvező |
| Anthropic Claude | összetett agentmunka, kód és elemzés | magasabb |
| OpenAI | általános feladatok, magyar marketing és szöveg | közepes–magas |
| Google Gemini | multimodális és általános feladatok | közepes |

A Webinár Mágus belső agent runtime-ja egyes funkciókhoz Claude Code komponenseket is használhat akkor is, ha a tényleges modellprovidered DeepSeek, OpenAI vagy Gemini.

## AutoWebinar kapcsolat

A beépített AutoWebinar MCP végpont:

```text
https://autowebinar.hu/mcp
```

Az AutoWebinar connector a Webinár Mágus felületén kiemelt first-party kapcsolatként jelenik meg.

## Fő AI ügynökök

- 🪄 **Főmágus** — koordináció, tervezés és delegálás
- 🎤 **Webinár Mágus** — webinárstratégia, prezentáció és script
- 🎯 **Hirdetés Mágus** — kampányok és kreatívok
- ✉️ **Email Mágus** — meghívók, reminderek, replay és sales emailek
- 📊 **Funnel Mágus** — konverzió, retention és attribution
- 💰 **Sales Mágus** — leadek, follow-up és értékesítési folyamat

## Connectorok

A katalógus többek között:

- AutoWebinar
- Gmail
- Google Drive
- Google Calendar
- Notion
- Slack
- GitHub
- Brave Search
- Playwright
- ElevenLabs
- Fireflies.ai
- Billingo
- Wise
- Fal.ai
- Filesystem

Egyes connectorok OAuthot, mások API-kulcsot kérnek.

## Frissítés

Terminálból:

```bash
cd ~/webinar-magus
bash update.sh
```

A release-alapú telepítés a Webinár Mágus saját AutoWebinar release csatornáját használja. A runtime letöltés után SHA-256 ellenőrzés történik.

A frissítő célja, hogy megőrizze többek között:

- `.env`
- `store/`
- agent állapot
- memória
- helyi felhasználói beállítások

## Gyakori hibák

### „Már létezik Webinár Mágus telepítés”

Ez nem hiba, hanem védelem. A telepítő nem akarja felülírni a meglévő adatokat.

Indítás:

```bash
cd ~/webinar-magus
bash scripts/start.sh
```

Tiszta javító telepítés:

```bash
curl -fsSL https://autowebinar.hu/webinar-magus/install | bash -s -- --repair
```

### `cd ~/webinarmagus`: No such file or directory

A helyes mappa:

```bash
cd ~/webinar-magus
```

### `tsx: command not found`

Ez tipikusan akkor történik, ha valaki egy félkész vagy régi könyvtárban közvetlenül `npm run dev`-et indít.

Normál telepítéshez ne ezt használd. Használd a publikus installert vagy a `--repair` módot.

### `Required binary not found on PATH: tmux`

Ez akkor fordulhat elő, ha a teljes Webinár Mágus telepítő helyett csak kézzel futott az `npm install` / `npm start`.

A friss macOS telepítő automatikusan ellenőrzi és szükség esetén telepíti a tmuxot. Javítás:

```bash
curl -fsSL https://autowebinar.hu/webinar-magus/install | bash -s -- --repair
```

Ha csak manuálisan akarod pótolni macOS-en:

```bash
brew install tmux
```

majd:

```bash
cd ~/webinar-magus
bash scripts/start.sh
```

### A dashboard nem nyílik meg

Ellenőrizd:

```bash
cd ~/webinar-magus
bash scripts/start.sh
npm run status
bash scripts/doctor.sh
```

Majd:

```bash
tail -n 100 store/dashboard.log
```

A dashboard alapértelmezett címe:

```text
http://localhost:3420
```

### A 3420-as port foglalt

A telepítő és a runtime támogat másik dashboard portot is. Fejlesztői/haladó telepítésnél a `WEB_PORT` környezeti változó vagy az installer `--port` kapcsoló használható.

## Amit normál felhasználóként ne használj

Ezek fejlesztői parancsok:

```bash
npm run dev
npm start
```

A publikus telepítéshez és mindennapi használathoz ezek helyett:

```bash
bash scripts/start.sh
bash scripts/stop.sh
bash update.sh
npm run status
```

## Biztonság

- a runtime SHA-256 ellenőrzést kap;
- a publikus telepítéshez nem kell GitHub-hozzáférés;
- a release upload rövid életű GitHub OIDC hitelesítéssel védett;
- az API-kulcsokat a Webinár Mágus Vault kezeli;
- a helyi AI bridge csak localhoston hallgat;
- javító telepítésnél a régi mappa mentésként megmarad.

## Fejlesztőknek

A GitHub repository:

```text
tmisi76/webinarmagus
```

Fejlesztői telepítés:

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run dev
```

A fejlesztői `npm run dev` nem azonos a végfelhasználói szolgáltatásindítással.

## Repository felépítés

- `src/` — runtime és dashboard backend
- `web/` — Mission Control frontend
- `scripts/` — install, update, agent és rendszer helper-ek
- `cli/` — publikus one-command installer
- `seed-skills/` — alap skillek
- `seed-scheduled-tasks/` — alap automatizmusok
- `mcp-catalog.json` — connector katalógus
- `desktop/` — desktop shell; a publikus DMG/EXE terjesztés jelenleg szünetel

## Licenc

A projekt MIT licencű nyílt forrású komponenseket is használ. A kötelező licenc- és copyright-információk a `LICENSE` és `ATTRIBUTIONS.md` fájlokban találhatók.

---

**Webinár Mágus — AI csapatod az ügyfélszerzéshez.**
