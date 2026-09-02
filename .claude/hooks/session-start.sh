#!/bin/bash
# Claude Code on the web oturumu başlarken linter ve testlerin çalışabilmesi
# için bağımlılıkları kurar. Yalnızca uzak ortamda çalışır; yerel makinede
# kimsenin node_modules'ünü habersiz değiştirmemesi için erken çıkar.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

if ! command -v npm >/dev/null 2>&1; then
  echo "session-start: npm bulunamadı, bağımlılık kurulumu atlandı." >&2
  exit 0
fi

# npm install (npm ci değil): kurulum sonrası kap durumu önbelleğe alındığı
# için tekrar çalıştırıldığında mevcut node_modules'ü koruyup hızlı bitiyor.
npm install --no-audit --no-fund --loglevel=error

echo "session-start: bağımlılıklar hazır (npm run lint, npm test)."
