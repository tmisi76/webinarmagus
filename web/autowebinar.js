// Webinár Mágus first-party AutoWebinar integration status card.
(() => {
  const ENDPOINT = 'https://autowebinar.hu/mcp'

  async function refreshAutoWebinarCard() {
    const card = document.getElementById('autowebinarIntegrationCard')
    if (!card) return

    const badge = document.getElementById('autowebinarStatusBadge')
    const detail = document.getElementById('autowebinarStatusDetail')
    const refresh = document.getElementById('autowebinarStatusRefresh')

    if (refresh) refresh.disabled = true
    if (badge) {
      badge.className = 'aw-status-badge aw-status-checking'
      badge.textContent = 'Ellenőrzés...'
    }

    try {
      const response = await fetch('/api/connectors')
      if (!response.ok) throw new Error('connector status unavailable')
      const connectors = await response.json()
      const found = Array.isArray(connectors) && connectors.some((item) => {
        const name = String(item?.name || '').toLowerCase()
        const endpoint = String(item?.endpoint || '').replace(/\/$/, '')
        return name === 'autowebinar' || endpoint === ENDPOINT
      })

      if (found) {
        badge.className = 'aw-status-badge aw-status-ready'
        badge.textContent = 'MCP beállítva'
        detail.textContent = 'A Webinár Mágus látja az AutoWebinar kapcsolatot. Az első valódi adatlekéréskor az AutoWebinar OAuth bejelentkezést kérhet.'
      } else {
        badge.className = 'aw-status-badge aw-status-missing'
        badge.textContent = 'Nincs bekötve'
        detail.textContent = 'Az AutoWebinar MCP nincs a konfigurációban. Friss telepítésnél ezt a Webinár Mágus automatikusan hozzáadja.'
      }
    } catch {
      badge.className = 'aw-status-badge aw-status-error'
      badge.textContent = 'Nem ellenőrizhető'
      detail.textContent = 'A kapcsolat állapotát most nem sikerült lekérni. Ez nem jelenti azt, hogy az AutoWebinar kapcsolat hibás.'
    } finally {
      if (refresh) refresh.disabled = false
    }
  }

  function init() {
    const refresh = document.getElementById('autowebinarStatusRefresh')
    if (refresh) refresh.addEventListener('click', refreshAutoWebinarCard)

    // The connectors page is hidden initially; status can still be fetched safely
    // on boot and will be ready when the user opens Integrációk.
    refreshAutoWebinarCard()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
