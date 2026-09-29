# Köszönet

A Webinár Mágus több nyílt forrású projektre és publikusan megosztott koncepcióra épít. Ez a dokumentum azokat a forrásokat kreditálja, amelyek beépültek a kódbázisba vagy érdemi hatással voltak a tervezésre.

A projekt licence és a kötelező szerzői jogi notice-ok a [LICENSE](./LICENSE) fájlban találhatók.

## Becsomagolt vagy adaptált kód

### Bumblebee (ellátási-lánc biztonsági scanner)
- **Forrás**: https://github.com/perplexityai/bumblebee
- **Szerző**: Perplexity AI
- **Licenc**: Apache 2.0
- **Hol használjuk**: `seed-scheduled-tasks/bumblebee-hygiene-scan/`
- **Szerepe**: read-only leltár a telepített csomagokról, MCP konfigurációkról és kiterjesztésekről, a beépített ellátási-lánc fenyegetés-katalógusokkal összevetve.

### Zhutov skill csomag (handoff / retrospective / skill-management)
- **Forrás**: https://artemxtech.substack.com/p/3-claude-code-skills-that-make-claude
- **Szerző**: Artem Zhutov
- **Hol használjuk**: `seed-skills/handoff/`, `seed-skills/retrospective/`, `seed-skills/skill-management/`
- **Szerepe**: az 5-szekciós handoff struktúra, a sub-agent retrospective minta és a skill-életciklus-kezelés koncepciója alapján adaptált skill-rendszer. A Webinár Mágus megvalósítása TypeScriptben, a saját checkpoint, memória és inter-agent rétegekkel integrálva készült.

### printing-press (agent-CLI generátor)
- **Forrás**: https://github.com/mvanhorn/cli-printing-press
- **Szerző**: Mike Van Horn
- **Szerepe**: generátor eszközként használható külső API-kat csomagoló CLI-k és a hozzájuk tartozó Claude Code skillek létrehozásához.

## Koncepcionális hatások

### Mark Kashef — Claude Code-alapú AI-asszisztens architektúra
- **Forrás**: https://youtube.com/@mark_kashef
- **Hatás**: hosszú életű Claude Code session, csatornás kommunikáció, tmux-alapú headless működés és ütemezett feladatok mint architekturális minta.

### Karpathy CLAUDE.md alapelvek
- **Forrás**: Andrej Karpathy nyilvánosan megosztott CLAUDE.md útmutatásai
- **Hatás**: a gyökér `CLAUDE.md` felépítésének és szabály-stílusának egyik mintareferenciája. Kódátvétel nem történt.

### Matt Pocock — handoff workflow
- **Forrás**: https://youtu.be/dtAJ2dOd3ko
- **Hatás**: a cél/purpose megadása a handoffnál és a cross-agent, hordozható HANDOFF.md szemlélet.

---

Ha hiányzó attribúciót észlelsz vagy korrekciót szeretnél, nyiss issue-t vagy PR-t a Webinár Mágus repóban: https://github.com/tmisi76/webinarmagus.
