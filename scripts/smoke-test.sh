#!/bin/bash
set -euo pipefail

echo "╔══════════════════════════════════════════════╗"
echo "║   SCRF Hub — Smoke Test Suite                ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Running 15 critical-path smoke tests..."
echo ""

npx vitest run src/test/smoke/ --reporter=verbose

if [ $? -ne 0 ]; then
  echo ""
  echo "❌  SMOKE TESTS FAILED — deployment blocked"
  exit 1
fi

echo ""
echo "✅  All smoke tests passed — deployment approved"
exit 0
