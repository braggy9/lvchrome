#!/bin/zsh
# Waits for the normal Chrome to quit, then starts Chrome on a throwaway profile
# (its own folder, so the live profile is never opened). No debug or
# extension-loading switches: the extension is loaded by hand (Load unpacked).
PROFILE="$HOME/Code/lvchrome-throwaway-profile"
chrome_lines() { ps -axo command= | grep -E '^/Applications/Google Chrome\.app/Contents/MacOS/Google Chrome( |$)'; }

if chrome_lines | grep -q -- "--user-data-dir=$PROFILE"; then
  echo "Throwaway Chrome already running."
  exit 0
fi
if [[ -n $(chrome_lines) ]]; then
  echo "Waiting for the normal Chrome to quit (Cmd+Q)..."
  for i in {1..450}; do [[ -z $(chrome_lines) ]] && break; sleep 2; done
  [[ -n $(chrome_lines) ]] && { echo "Normal Chrome still running after 15 minutes. Not launching."; exit 1; }
fi

# First run only: Developer mode on, and "Allow JavaScript from Apple Events" on,
# in the throwaway profile. Chrome may ignore these; the scripts check.
if [[ ! -d $PROFILE/Default ]]; then
  mkdir -p "$PROFILE/Default"
  cat > "$PROFILE/Default/Preferences" <<'JSON'
{"browser":{"allow_javascript_apple_events":true},"extensions":{"ui":{"developer_mode":true}}}
JSON
fi

open -na "Google Chrome" --args --user-data-dir="$PROFILE" --no-first-run --no-default-browser-check
for i in {1..30}; do chrome_lines | grep -q -- "--user-data-dir=$PROFILE" && { echo "Throwaway Chrome started."; exit 0; }; sleep 1; done
echo "Throwaway Chrome did not start."
exit 1
