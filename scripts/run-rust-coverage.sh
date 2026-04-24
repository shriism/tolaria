#!/bin/sh
set -e

# Exclude transport-layer Tauri command adapters and desktop shell entrypoints.
# These wrappers mostly validate/forward inputs into core modules that already
# carry the meaningful unit-test coverage.
IGNORE_REGEX='(^|/)(lib|main|menu)\.rs$|(^|/)commands/(ai|delete|folders|git|git_connect|system)\.rs$|(^|/)commands/vault/(file_cmds|frontmatter_cmds|lifecycle_cmds|rename_cmds|scan_cmds|view_cmds)\.rs$'

cargo llvm-cov \
  --manifest-path src-tauri/Cargo.toml \
  --ignore-filename-regex "$IGNORE_REGEX" \
  "$@"
