#!/bin/bash

# ocrs project stop script
# stops all running services

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$PROJECT_DIR/logs"

echo "🛑 Stopping OCRS Services..."

if [ -f "$LOG_DIR/pids.txt" ]; then
    PIDS=$(cat "$LOG_DIR/pids.txt")
    for PID in $PIDS; do
        if ps -p $PID > /dev/null 2>&1; then
            kill $PID 2>/dev/null
            echo "   Stopped PID: $PID"
        fi
    done
    rm "$LOG_DIR/pids.txt"
fi

# also kill by port as fallback
for PORT in 5000 3000 8081 8080 5173; do
    lsof -ti:$PORT | xargs kill -9 2>/dev/null
done

echo "✅ All services stopped"
