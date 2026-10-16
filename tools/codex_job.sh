#!/usr/bin/env bash
# usage: tools/codex_job.sh art/jobs/X.md  -> runs Codex non-interactively, log next to the job file
# Codex updates itself into a new hashed folder: use the newest codex.exe
CX="$(ls -t /c/Users/Administrator/AppData/Local/OpenAI/Codex/bin/*/codex.exe 2>/dev/null | head -1)"
JOB="$1"
LOG="${JOB%.md}.log"
cd "$(dirname "$0")/.."
"$CX" exec --skip-git-repo-check -s workspace-write -c model_reasoning_effort="low" -C "$(pwd -W 2>/dev/null || pwd)" - < "$JOB" > "$LOG" 2>&1
echo "exit=$? log=$LOG"
tail -15 "$LOG"
