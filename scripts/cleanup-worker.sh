#!/bin/bash

# Navigate to project directory
cd "$(dirname "$0")/.."

# Run cleanup script every hour
while true; do
  echo "Running cleanup at $(date)"
  npx ts-node scripts/cleanup-spreads.ts
  sleep 3600  # Wait for 1 hour
done
