/* Webinár Mágus — first-run AI provider picker.
 * Deliberately isolated from app.js: the dashboard runtime only calls html()
 * and init(), so provider UX can evolve without touching the 10k+ line shell.
 */
;(() => {
  let catalog = null
  let selectedProvider = null
  let callbacks = null

  const esc = (v) => String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  function priceText(model) {
    const input = model.inputUsdPerM == null ? '—' : '$' + model.inputUsdPerM
    const output = model.outputUsdPerM == null ? '—' : '$' + model.outputUsdPerM
    return input + ' input / ' + output + ' output · 1M token'
  }

  function tierLabel(tier) {
    if (tier === 'budget') return 'LEGOLCSÓBB'
    if (tier === 'premium') return 'PRÉMIUM'
    return 'AJÁNLOTT'
  }

  function html(status) {
    const legacy = status?.claudeAuthPresent && !status?.aiProviderConfigured
      ? '<div class="onb-ai-legacy">Ezen a gépen már van meglévő Anthropic/Claude hitelesítés. Használhatod, de nem kötelező: bármelyik támogatott API szolgáltatót választhatod.</div>'
      : ''
    return `
      <div class="onb-ai-intro">
        <h3>Válaszd ki, melyik AI dolgozzon a Webinár Mágusban</h3>
        <p>Te döntöd el, melyik szolgáltatóval dolgozol. Nincs kötelező Claude-előfizetés: DeepSeek, Anthropic, OpenAI vagy Gemini API közül szabadon választhatsz, és később bármikor válthatsz. Ügynökönként külön modell is beállítható.</p>
      </div>
      ${legacy}
      <div id="onbAiProviderPicker" class="onb-ai-provider-grid">
        <div class="onb-ai-loading">AI szolgáltatók betöltése...</div>
      </div>
      <div id="onbAiModelPanel" class="onb-ai-model-panel" hidden></div>
      ${status?.aiProviderConfigured && !status?.agentsRunning
        ? '<button class="btn-primary btn-compact" id="onbAiLaunchExisting">AI csapat indítása</button>'
        : ''}
      <div id="onbMsg" class="onb-msg"></div>
    `
  }

  function providerCard(provider, active) {
    return `
      <button type="button" class="onb-ai-provider-card${active ? ' selected' : ''}" data-ai-provider="${esc(provider.id)}">
        <div class="onb-ai-provider-head">
          <strong>${esc(provider.name)}</strong>
          <span class="onb-ai-rec">${esc(provider.decisionLabel || provider.recommendation || 'VÁLASZTHATÓ')}</span>
        </div>
        <div class="onb-ai-badges">
          <span>${esc(provider.priceLabel)}</span>
          <span>${esc(provider.precisionLabel)}</span>
          <span>${esc(provider.hungarianLabel)}</span>
        </div>
        <p>${esc((provider.recommendedFor || []).join(' · '))}</p>
        ${provider.configured ? '<div class="onb-ai-saved">API kulcs már mentve</div>' : ''}
      </button>
    `
  }

  function renderCards(data) {
    catalog = data
    const box = document.getElementById('onbAiProviderPicker')
    if (!box) return
    const current = data.selected?.provider || ''
    box.innerHTML = data.providers.map((p) => providerCard(p, p.id === current)).join('')
    box.querySelectorAll('[data-ai-provider]').forEach((el) => {
      el.addEventListener('click', () => selectProvider(el.dataset.aiProvider))
    })
    if (current) selectProvider(current)
  }

  function selectProvider(id) {
    if (!catalog) return
    const provider = catalog.providers.find((p) => p.id === id)
    if (!provider) return
    selectedProvider = provider
    document.querySelectorAll('.onb-ai-provider-card').forEach((el) => {
      el.classList.toggle('selected', el.dataset.aiProvider === id)
    })

    const panel = document.getElementById('onbAiModelPanel')
    if (!panel) return
    const currentModel = catalog.selected?.provider === id ? catalog.selected.model : null
    const selectedModel = currentModel || provider.recommendedModel || provider.models[0]?.id
    const hasSavedKey = provider.configured === true

    panel.hidden = false
    panel.innerHTML = `
      <div class="onb-ai-panel-head">
        <div>
          <h3>${esc(provider.name)}</h3>
          <p>${esc(provider.recommendation || '')}</p>
        </div>
        <span class="onb-ai-hu-badge">${esc(provider.hungarianLabel)}</span>
      </div>

      <div class="onb-ai-model-list">
        ${provider.models.map((m) => `
          <label class="onb-ai-model-option${m.id === selectedModel ? ' selected' : ''}">
            <input type="radio" name="onbAiModel" value="${esc(m.id)}" ${m.id === selectedModel ? 'checked' : ''}>
            <div>
              <div class="onb-ai-model-title">
                <strong>${esc(m.name)}</strong>
                <span>${tierLabel(m.tier)}</span>
              </div>
              <div class="onb-ai-price">${esc(priceText(m))}</div>
              <div class="onb-ai-bestfor">${esc((m.bestFor || []).join(' · '))}</div>
              ${m.priceNote ? '<div class="onb-ai-note">' + esc(m.priceNote) + '</div>' : ''}
            </div>
          </label>
        `).join('')}
      </div>

      ${provider.caveat ? '<div class="onb-ai-caveat">' + esc(provider.caveat) + '</div>' : ''}

      <label class="form-label-sm">${esc(provider.name)} API kulcs</label>
      <input id="onbAiApiKey" type="password" class="onb-input"
        placeholder="${hasSavedKey ? 'Már van mentett kulcs — üresen hagyhatod' : esc(provider.apiKeyPlaceholder || 'API key')}"
        autocomplete="off">
      <div class="onb-hint">A kulcs a titkosított Webinár Mágus Vaultba kerül. Nem mentjük plaintext konfigurációs fájlba.</div>

      <button class="btn-primary btn-compact" id="onbAiSaveBtn">
        ${hasSavedKey ? 'Modell mentése és indítás' : 'API kulcs mentése és indítás'}
      </button>
      <div class="onb-ai-quality-note">${esc(catalog.qualityNote || '')}</div>
    `

    panel.querySelectorAll('input[name="onbAiModel"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        panel.querySelectorAll('.onb-ai-model-option').forEach((el) => el.classList.remove('selected'))
        radio.closest('.onb-ai-model-option')?.classList.add('selected')
      })
    })
    document.getElementById('onbAiSaveBtn')?.addEventListener('click', saveProvider)
  }

  async function launch(button) {
    if (button) button.disabled = true
    callbacks?.onbMsg('AI csapat indítása...')
    try {
      const res = await fetch('/api/onboarding/launch', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Az AI csapat nem indult el.')

      callbacks?.onbMsg('AI csapat indul. Az első indítás 1–2 percig is tarthat.')
      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 3000))
        const status = await callbacks.fetchOnboardingStatus()
        if (status?.agentsRunning) {
          await callbacks.refreshOnboarding()
          return
        }
      }
      throw new Error('Az AI csapat még indul. Várj egy kicsit, majd próbáld újra.')
    } catch (err) {
      if (button) button.disabled = false
      callbacks?.onbMsg(err?.message || 'Hiba az AI csapat indításakor.', true)
    }
  }

  async function saveProvider() {
    const model = document.querySelector('input[name="onbAiModel"]:checked')?.value || ''
    const apiKey = (document.getElementById('onbAiApiKey')?.value || '').trim()
    const button = document.getElementById('onbAiSaveBtn')
    if (!selectedProvider || !model) {
      callbacks?.onbMsg('Válassz AI szolgáltatót és modellt.', true)
      return
    }
    if (!apiKey && !selectedProvider.configured) {
      callbacks?.onbMsg('Add meg az API kulcsot.', true)
      return
    }

    if (button) button.disabled = true
    callbacks?.onbMsg('AI szolgáltató mentése...')
    try {
      const res = await fetch('/api/onboarding/ai-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: selectedProvider.id, model, apiKey }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Nem sikerült elmenteni az AI szolgáltatót.')
      callbacks?.onbMsg('AI szolgáltató beállítva.')
      await launch(button)
    } catch (err) {
      if (button) button.disabled = false
      callbacks?.onbMsg(err?.message || 'Hiba az AI szolgáltató mentésekor.', true)
    }
  }

  async function init(nextCallbacks) {
    callbacks = nextCallbacks
    document.getElementById('onbAiLaunchExisting')?.addEventListener('click', (e) => launch(e.currentTarget))
    try {
      const res = await fetch('/api/onboarding/ai-providers')
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'AI szolgáltatók nem tölthetők be.')
      renderCards(data)
    } catch (err) {
      const box = document.getElementById('onbAiProviderPicker')
      if (box) box.innerHTML = '<div class="onb-ai-error">' + esc(err?.message || 'Hiba az AI szolgáltatók betöltésekor.') + '</div>'
    }
  }

  window.WebinarMagusAI = { html, init }
})()
