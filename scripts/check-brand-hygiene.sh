#!/usr/bin/env bash
set -euo pipefail

# Legacy-brand hygiene gate.
# The protected MIT LICENSE keeps its legally required copyright notice.
legacy_product='mar''veen'
legacy_author='Szo''tasz'

status=0
for pattern in "$legacy_product" "$legacy_author"; do
  if grep -RniI --exclude='LICENSE' --exclude-dir='.git' --exclude-dir='node_modules' --exclude-dir='dist' -- "$pattern" .; then
    echo
    echo "Forbidden legacy reference found: $pattern" >&2
    status=1
  fi
done

# Paths are checked separately so stale filenames cannot survive even if content is clean.
if find . -path './.git' -prune -o -path './node_modules' -prune -o -iname "*${legacy_product}*" -print | grep -q .; then
  find . -path './.git' -prune -o -path './node_modules' -prune -o -iname "*${legacy_product}*" -print
  echo "Forbidden legacy filename found." >&2
  status=1
fi

exit "$status"
