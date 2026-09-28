#!/bin/zsh
# Exits non-zero unless exactly one Chrome is running and it is the throwaway
# profile. Every Mac test script calls this first, so no script can ever act on
# the live Chrome profile.
PROFILE="$HOME/Code/lvchrome-throwaway-profile"
lines=$(ps -axo command= | grep -E '^/Applications/Google Chrome\.app/Contents/MacOS/Google Chrome( |$)')
count=$(printf '%s\n' "$lines" | grep -c .)
if [[ $count -ne 1 || $lines != *"--user-data-dir=$PROFILE"* ]]; then
  echo "GUARD: the throwaway Chrome is not the only Chrome running ($count Chrome found). Stopping."
  exit 1
fi
