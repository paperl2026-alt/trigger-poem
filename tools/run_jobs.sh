#!/usr/bin/env bash
# usage: tools/run_jobs.sh <parallel> job1 job2 ...   -> runs art/jobs/<job>.md through Codex, N at a time; prints one line per finished job
cd "$(dirname "$0")/.."
N="$1"; shift
for j in "$@"; do
  while [ "$(jobs -rp | wc -l)" -ge "$N" ]; do sleep 3; done
  ( bash tools/codex_job.sh "art/jobs/$j.md" > /dev/null 2>&1; echo "done $j" ) &
done
wait
echo "all done"
