#!/bin/bash
cd "$(dirname "$0")" || exit

echo "🚀 Starting both Backend and Frontend..."

# Start Backend in the background
./bc.sh &
BACKEND_PID=$!

# Start Frontend in the background
./fe.sh &
FRONTEND_PID=$!

echo "✅ Both processes are running."
echo "Press Ctrl+C to stop both servers."

# Trap SIGINT (Ctrl+C) and SIGTERM so we can gracefully shut down both servers
trap "echo '🛑 Stopping all servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM

# Wait indefinitely for background processes
wait $BACKEND_PID $FRONTEND_PID
