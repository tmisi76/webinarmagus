# Webinár Mágus

![Webinár Mágus](banner.png)

**Önálló AI marketingcsapat webináriumhoz, ügyfélszerzéshez, értékesítéshez és automatizáláshoz.**

> Státusz: korai fejlesztési verzió (v0.1)

A Webinár Mágus egy saját márkás, telepíthető AI agent rendszer, amely az AutoWebinar ökoszisztémához készül. A cél, hogy a felhasználó egyetlen alkalmazásból tudjon AI ügynökökkel kampányt tervezni, webináriumot elemezni, hirdetést és emailt készíteni, funnel hibákat keresni és értékesítési feladatokat delegálni.

## V0.1 cél

- saját **Webinár Mágus Mission Control**
- AutoWebinar design system
- több specializált AI ügynök
- tartós memória
- Kanban és feladatdelegálás
- ütemezett és háttérfeladatok
- MCP integrációk
- natív AutoWebinar MCP kapcsolat
- macOS és Windows desktop csomagolás
- később automatikus frissítés

## Első AI csapat

- 🪄 **Főmágus** — koordináció és delegálás
- 🎤 **Webinár Mágus** — webinar stratégia, prezentáció, script
- 🎯 **Hirdetés Mágus** — Meta/Google kampányok és kreatívok
- ✉️ **Email Mágus** — meghívó, reminder, replay és sales emailek
- 📊 **Funnel Mágus** — konverzió, retention, attribution
- 💰 **Sales Mágus** — leadek, follow-up és értékesítési folyamat

## AutoWebinar vizuális rendszer

A Webinár Mágus ugyanabba a termékcsaládba tartozik, mint az AutoWebinar.

- Primary: `#2563EB`
- Background: `#F7F9FC`
- Card: `#FFFFFF`
- Text: `#0F172A`
- Accent: `#EAF2FE`
- Info: `#0EA5E9`
- Success: `#10B981`
- Warning: `#F59E0B`
- Error: `#F43F5E`
- Gradient: `#2563EB → #0EA5E9`
- Headings: Poppins
- UI/body: Inter

## Telepítés

A Webinár Mágus háromféleképpen telepíthető:

### Terminálból – macOS / Linux

```bash
curl -fsSL https://autowebinar.hu/webinar-magus/install | bash
```

A bootstrap egy verziózott runtime csomagot tölt le az AutoWebinar letöltési végpontjáról, SHA-256-tal ellenőrzi, majd elindítja az interaktív Webinár Mágus onboardingot. A végfelhasználónak nem kell GitHub account vagy hozzáférés a privát repositoryhoz.

### Terminálból – Windows

PowerShellben:

```powershell
irm https://autowebinar.hu/webinar-magus/install.ps1 | iex
```

A Windows telepítés WSL-t használ. Ha WSL még nincs telepítve, a bootstrap elindítja a telepítését, majd újraindítás után folytatható.

### Grafikus telepítő

- macOS: DMG
- Windows: EXE

A grafikus és CLI telepítő ugyanazt a Webinár Mágus runtime-ot és onboardingot használja.

> A két publikus URL az AutoWebinar oldali publikálás után válik élessé. A repository már tartalmazza a `cli/install.sh`, `cli/install.ps1` és a release runtime bundle builder fájlokat.

## Desktop cél

- macOS: `WebinarMagus.dmg`
- Windows: `WebinarMagus-Setup.exe`

A telepítés után a felhasználó a Webinár Mágus alkalmazást indítja, majd az onboardingból összekapcsolja az AutoWebinar fiókját.

## AutoWebinar MCP

Tervezett alapkapcsolat:

```
https://autowebinar.hu/mcp
```

Az összekapcsolás OAuth-alapú lesz; a cél, hogy a végfelhasználónak ne kelljen MCP URL-eket vagy AutoWebinar API-kulcsokat kézzel konfigurálnia.

## Fejlesztés

A stabil ág: `main`

Az első Webinár Mágus átalakítás jelenleg:

```
webinar-magus-foundation
```

## Licenc és third-party komponensek

A projekt MIT licencű nyílt forrású komponenseket is felhasznál. A vonatkozó eredeti copyright- és licencszövegek a `LICENSE` és az attribution/third-party dokumentumokban megmaradnak.

---

**Webinár Mágus — AI csapatod az ügyfélszerzéshez.**
