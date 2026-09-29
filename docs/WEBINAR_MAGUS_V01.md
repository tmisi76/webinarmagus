# Webinár Mágus V0.1 — megvalósítási terv

## Termékcél

A Webinár Mágus önálló, telepíthető AI marketingcsapat.

A végfelhasználó nem látja és nem kezeli a mögöttes agent harness technikai részleteit. A normál élmény:

1. Webinár Mágus letöltése
2. telepítés
3. első indítás
4. AI szolgáltató beállítása
5. AutoWebinar összekapcsolása
6. használat a Mission Controlból

## Platformcél

- macOS: `WebinarMagus.dmg`
- Windows: `WebinarMagus-Setup.exe`
- fejlesztői Linux támogatás megtartható, de nem elsődleges végfelhasználói platform

## Márka

### Név

**Webinár Mágus**

### Vizuális kapcsolat

A Webinár Mágus az AutoWebinar termékcsalád része.

Design tokenek:

| Token | Érték |
| --- | --- |
| Primary | `#2563EB` |
| Background | `#F7F9FC` |
| Card | `#FFFFFF` |
| Foreground | `#0F172A` |
| Muted | `#5A6779` |
| Border | `#DDE4ED` |
| Accent | `#EAF2FE` |
| Info | `#0EA5E9` |
| Success | `#10B981` |
| Warning | `#F59E0B` |
| Destructive | `#F43F5E` |

Signature gradient:

```css
linear-gradient(135deg, #2563EB 0%, #0EA5E9 100%)
```

Tipográfia:
- headings: Poppins
- body/UI: Inter

Repo banner: `banner.png`

## Agent csapat

### 1. Főmágus

Feladat:
- user intent megértése
- üzleti cél meghatározása
- delegálás
- specialisták eredményének ellenőrzése
- végső javaslat

### 2. Webinár Mágus

Feladat:
- webinárium stratégia
- cím/ígéret/angle
- prezentáció
- előadói script
- CTA
- élő vs evergreen stratégia
- kihívás és summit

### 3. Hirdetés Mágus

Feladat:
- Meta/Google stratégia
- copy
- kreatív koncepció
- kampányhipotézis
- CPL/CTR/CPM elemzés

### 4. Email Mágus

Feladat:
- meghívók
- reminder
- replay
- sales follow-up
- nurture
- email automatizmus

### 5. Funnel Mágus

Feladat:
- regisztrációs konverzió
- attendance
- retention
- CTA
- booking
- attribution
- funnel bottleneck

### 6. Sales Mágus

Feladat:
- CRM
- lead prioritás
- follow-up
- sales call
- ajánlat
- objection handling
- next-best-action

## AutoWebinar MCP

Publikus endpoint:

```
https://autowebinar.hu/mcp
```

### Elvárt működés

A telepítés nem írja felül a felhasználó saját MCP konfigurációját.

Seed logika:

1. beolvassa a projekt `.mcp.json` fájlját, ha van;
2. ha nincs, létrehoz valid `{"mcpServers":{}}` struktúrát;
3. ha nincs `autowebinar` szerver, hozzáadja:

```json
{
  "mcpServers": {
    "autowebinar": {
      "url": "https://autowebinar.hu/mcp"
    }
  }
}
```

4. meglévő `autowebinar` beállítást nem ír felül;
5. OAuth kapcsolatot a kliens kezeli;
6. token vagy jelszó nem kerül a repositoryba.

### Biztonsági elv

A Webinár Mágus a meglévő AutoWebinar MCP jogosultsági modelljét tiszteletben tartja.

- read scope csak engedéllyel
- transcript külön engedéllyel
- üzleti írás csak proposal/jóváhagyás útvonalon
- destructive művelet nem automatizálható emberi jóváhagyás nélkül

## Desktop architektúra

### V0.1

A meglévő web dashboard stabil agent runtime marad.

Desktop shell feladata:
- lokális háttérszolgáltatás indítása/leállítása
- dashboard megjelenítése natív ablakban
- onboarding
- deep link kezelése
- app icon / product identity
- update státusz

### Később

- automatikus frissítés
- code signing
- Apple notarization
- Windows signing
- GitHub Release artifactok

## Rebranding szabály

### Felhasználó által látható

Mindenhol **Webinár Mágus**:
- app név
- dashboard
- installer
- onboarding
- README
- dokumentáció
- ikonok
- banner
- értesítések
- default agent identity

### Belső kompatibilitási réteg

A történeti belső azonosítók nem cserélendők vak keresés-cserével.

Ilyenek lehetnek:
- `/api/webinarmagus`
- `WEBINAR_MAGUS_*`
- meglévő DB/fájlnév
- régi service/migration azonosítók

Ezek csak külön migrációval változhatnak, hogy meglévő működést ne törjünk el.

### Jogi attribution

Az eredeti MIT licencek és copyright notice-ok megmaradnak a `LICENSE` / attribution fájlokban.

## V0.1 mérföldkövek

### M1 — Foundation

- [x] külön `webinar-magus` repository
- [x] Webinár Mágus package identity
- [x] Webinár Mágus dashboard default branding
- [x] AutoWebinar design tokenek
- [x] Főmágus SOUL
- [ ] új banner PNG
- [ ] látható branding sweep teljes befejezése

### M2 — AutoWebinar kapcsolat

- [ ] idempotens AutoWebinar MCP seed
- [ ] OAuth onboarding UX
- [ ] kapcsolat állapot kijelzés
- [ ] első valódi MCP smoke test
- [ ] permission/scopes UX

### M3 — AI csapat

Kanonikus persona-források: `templates/webinar-magus-agents/`.

- [x] Webinár Mágus persona
- [x] Hirdetés Mágus persona
- [x] Email Mágus persona
- [x] Funnel Mágus persona
- [x] Sales Mágus persona
- [x] Főmágus routing/delegation alapelvek
- [ ] specialisták automatikus seedelése friss telepítéskor
- [ ] specialisták idempotens frissítési/migrációs szabálya
- [ ] specialisták indítási és health-check folyamata

### M4 — Mission Control

- [ ] AutoWebinar dashboard kártyák
- [ ] agent team nézet
- [ ] aktív feladatok
- [ ] eredmények
- [ ] approval inbox
- [ ] automations
- [ ] AutoWebinar kapcsolat státusz

### M5 — Desktop

- [ ] Electron shell
- [ ] macOS dev build
- [ ] Windows dev build
- [ ] DMG
- [ ] NSIS EXE
- [ ] GitHub Actions cross-platform build

### M6 — Release hardening

- [ ] smoke tests
- [ ] app-data könyvtár migráció
- [ ] macOS signing/notarization
- [ ] Windows signing
- [ ] updater
- [ ] v0.1.0 release
