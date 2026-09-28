# Webinár Mágus

![Webinár Mágus](banner.png)

**Önálló AI marketing- és ügyfélszerző csapat webináriumhoz, saleshez, automatizáláshoz és kampányokhoz.**

> Státusz: **v0.1 release candidate**

A Webinár Mágus egy telepíthető, többügynökös AI rendszer az AutoWebinar ökoszisztémához. A cél, hogy egyetlen felületen lehessen kampányt tervezni, webináriumot elemezni, prezentációt és scriptet készíteni, hirdetést és emailt írni, funnelhibákat keresni, leadeket kezelni és feladatokat specialista AI ügynököknek delegálni.

## Fő funkciók

- saját **Webinár Mágus Mission Control**
- Főmágus + specialista AI ügynökök
- Kanban és feladatdelegálás
- tartós memória és háttérfeladatok
- ütemezett automatizmusok
- MCP connector katalógus
- natív AutoWebinar MCP kapcsolat
- több AI provider és modell
- macOS / Windows desktop alkalmazás
- terminálos telepítés macOS, Linux és Windows alatt
- release-alapú önfrissítés
- titkosított API-kulcs tárolás

## AI csapat

- 🪄 **Főmágus** — koordináció, tervezés, delegálás
- 🎤 **Webinár Mágus** — webinárstratégia, prezentáció, script
- 🎯 **Hirdetés Mágus** — kampányok és kreatívok
- ✉️ **Email Mágus** — meghívó, reminder, replay és sales emailek
- 📊 **Funnel Mágus** — konverzió, retention, attribution
- 💰 **Sales Mágus** — leadek, follow-up és értékesítési folyamat

## AI provider választás

Az első indításkor a felhasználó kiválaszthatja a saját szolgáltatóját és modelljét.

| Provider | Mire jó | Költség / karakter |
|---|---|---|
| DeepSeek | nagy volumenű háttérmunka, jó ár/érték | kedvező |
| Anthropic Claude | összetett agentfeladatok, precíz kódolás és elemzés | magasabb |
| OpenAI | általános munka, magyar marketing- és szövegírás | közepes–magas |
| Google Gemini | multimodális és általános feladatok | közepes |

Az API-kulcs mentés előtt live ellenőrzést kap, majd a Webinár Mágus Vaultban tárolódik.

## Telepítés

### macOS / Linux — egy parancs

```bash
curl -fsSL https://autowebinar.hu/webinar-magus/install | bash
```

A bootstrap:

1. letölti a legfrissebb runtime csomagot,
2. SHA-256-tal ellenőrzi,
3. telepíti a szükséges runtime-ot,
4. elindítja az onboardingot.

A végfelhasználónak nem kell GitHub account vagy hozzáférés a privát repositoryhoz.

### Windows — PowerShell

```powershell
irm https://autowebinar.hu/webinar-magus/install.ps1 | iex
```

A Windows verzió WSL-t használ. Ha WSL még nincs telepítve, a telepítő elindítja a szükséges Windows komponenst.

### Grafikus telepítő

- **macOS:** DMG
- **Windows:** EXE

A grafikus és a CLI telepítő ugyanazt a runtime-ot és onboardingot használja.

## Első indítás

Az onboarding során:

1. kiválasztod az AI providert,
2. kiválasztod a modellt,
3. megadod és ellenőrzöd az API-kulcsot,
4. összekapcsolod a szükséges connectorokat,
5. elindul a Főmágus és a specialista csapat.

## AutoWebinar kapcsolat

A Webinár Mágus első-party AutoWebinar connectorral érkezik:

```
https://autowebinar.hu/mcp
```

A connector a katalógusban kiemelten jelenik meg, és az AutoWebinar OAuth hitelesítési folyamatát használja.

## Connectorok

A katalógus többek között ezeket tartalmazza:

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

Egyes connectorok OAuthot, mások saját API-kulcsot igényelnek.

## Frissítés

### Dashboardból

A Webinár Mágus jelzi, ha új release érhető el. A frissítés a dashboardból indítható.

### Terminálból

```bash
cd ~/webinar-magus
bash update.sh
```

A csomagolt DMG/EXE/CLI installok a saját AutoWebinar release channelből frissülnek. A letöltött runtime SHA-256 ellenőrzést kap, a felhasználói állapot és a titkok nem íródnak felül.

Fejlesztői Git checkout esetén a meglévő Git-alapú updater működik tovább.

## Release-ek

A `v*` tagekhez a CI automatikusan készít:

- macOS DMG
- Windows EXE
- CLI runtime bundle
- SHA-256 checksumokat
- verzió metadata fájlt

A publikus desktop release csak sikeres signing/notarization után készülhet el.

### macOS

A release workflow támogatja:

- Developer ID signing
- hardened runtime
- Apple notarization
- `codesign` és Gatekeeper ellenőrzés

### Windows

A release workflow támogatja:

- Authenticode signing
- aláírás-ellenőrzés
- SmartScreen-barát terjesztést

## Biztonság

- API-kulcsok nem kerülnek plaintext provider-configba
- a provider secret a Vaultban marad
- a helyi AI bridge csak localhoston hallgat
- a CLI runtime checksum-ellenőrzött
- a privát GitHub repository nem szükséges a telepítéshez
- release upload külön bearer tokennel védett
- meglévő `.env`, `store/`, agent- és memóriaállapot frissítéskor megmarad

## Fejlesztés

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run dev
```

A stabil ág:

```
main
```

## Repository felépítés

- `src/` — runtime és dashboard backend
- `web/` — Mission Control frontend
- `scripts/` — install, update, agent és rendszer helper-ek
- `desktop/` — Electron DMG/EXE shell
- `cli/` — publikus one-command bootstrapok
- `seed-skills/` — alap skillek
- `seed-scheduled-tasks/` — alap automatizmusok
- `mcp-catalog.json` — connector katalógus

## Licenc és third-party komponensek

A projekt MIT licencű nyílt forrású komponenseket is használ. A kötelező copyright- és licencinformációk a [LICENSE](LICENSE) és [ATTRIBUTIONS.md](ATTRIBUTIONS.md) fájlokban találhatók.

---

**Webinár Mágus — AI csapatod az ügyfélszerzéshez.**
