#!/bin/zsh
# Wrapper for the Mac test helpers. Always checks the guard first.
#   lv.sh state|mark|remark|check|control|diag|status|config N|go LABEL|restore LABEL|navaway KIND|close KIND|front KIND
#   lv.sh key 1-4     send Option+Shift+N to Chrome (only if Chrome is frontmost)
DIR=${0:A:h}
"$DIR/guard.sh" || exit 1
export LV_MARKS="${LV_MARKS:-$HOME/Code/lvchrome-throwaway-marks.json}"

if [[ $1 == key ]]; then
  case $2 in 1) kc=18;; 2) kc=19;; 3) kc=20;; 4) kc=21;; *) echo "usage: lv.sh key 1-4"; exit 2;; esac
  osascript -e 'tell application "Google Chrome" to activate'
  sleep 0.5
  front=$(osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true')
  [[ $front == "Google Chrome" ]] || { echo "Refusing: frontmost app is '$front', not Chrome."; exit 1; }
  osascript -e "tell application \"System Events\" to key code $kc using {option down, shift down}"
  sleep 1.5
  exec osascript -l JavaScript "$DIR/lv.js" state
fi
exec osascript -l JavaScript "$DIR/lv.js" "$@" 2>&1
