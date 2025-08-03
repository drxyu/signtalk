#!/bin/bash

echo "🛑 Stopping SignSpeak AI Servers"
echo "================================"

# Kill backend server (uvicorn)
echo -n "Stopping backend server... "
pkill -f "uvicorn app.main:app" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Stopped"
else
    echo "⚠️  No backend process found"
fi

# Kill frontend server (vite)
echo -n "Stopping frontend server... "
pkill -f "vite" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Stopped"
else
    echo "⚠️  No frontend process found"
fi

# Kill any node processes on port 5173
lsof -ti:5173 | xargs kill -9 2>/dev/null
# Kill any python processes on port 8000
lsof -ti:8000 | xargs kill -9 2>/dev/null

echo ""
echo "✅ All servers stopped!"