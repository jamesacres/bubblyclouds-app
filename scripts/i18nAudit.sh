#!/bin/bash
set -u
cd "$(dirname "$0")/.."
exec python3 scripts/i18n_audit.py \
  packages/ui packages/auth packages/template packages/games \
  packages/sudoku packages/unblockrace apps/sudoku apps/unblockrace
