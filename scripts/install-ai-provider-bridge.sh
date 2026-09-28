#!/usr/bin/env bash
# Install the local Webinár Mágus AI provider bridge dependency.
# OpenAI and Google Gemini are exposed to Claude Code through LiteLLM's
# Anthropic Messages-compatible proxy. Anthropic and DeepSeek do not require
# this bridge, but installing it up-front keeps onboarding choice frictionless.
set -u

LITELLM_VERSION="1.102.1"
export PATH="$HOME/.local/bin:$PATH"

if command -v litellm >/dev/null 2>&1; then
  echo "  ✓ AI Provider Bridge már elérhető: $(command -v litellm)"
  exit 0
fi

if ! command -v pipx >/dev/null 2>&1; then
  if [ "$(uname -s 2>/dev/null)" = "Darwin" ] && command -v brew >/dev/null 2>&1; then
    echo "  pipx telepítése a provider bridge-hez..."
    brew install pipx || exit 1
    pipx ensurepath >/dev/null 2>&1 || true
    export PATH="$HOME/.local/bin:$PATH"
  else
    echo "  ! pipx nem található; az AI Provider Bridge nem telepíthető automatikusan." >&2
    exit 1
  fi
fi

echo "  LiteLLM AI Provider Bridge telepítése (${LITELLM_VERSION})..."
if pipx install "litellm[proxy]==${LITELLM_VERSION}"; then
  export PATH="$HOME/.local/bin:$PATH"
  if command -v litellm >/dev/null 2>&1; then
    echo "  ✓ AI Provider Bridge telepítve"
    exit 0
  fi
fi

echo "  ! LiteLLM telepítése sikertelen. DeepSeek és Claude továbbra is használható; OpenAI/Gemini bridge nem indul." >&2
exit 1
