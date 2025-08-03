#!/bin/bash

echo "🧪 Testing SignSpeak AI Servers"
echo "==============================="

# Test Backend
echo -n "Backend (http://localhost:8000): "
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Running"
else
    echo "❌ Not accessible"
fi

# Test Frontend
echo -n "Frontend (http://localhost:5173): "
# For Vite dev server, we need to check differently
if nc -z localhost 5173 2>/dev/null; then
    echo "✅ Port is open (Vite running)"
    echo ""
    echo "📱 Please open your browser and navigate to:"
    echo "   http://localhost:5173"
else
    echo "❌ Not accessible"
fi

echo ""
echo "💡 If the frontend shows as running but you can't access it:"
echo "   1. Make sure you're accessing from a browser, not curl"
echo "   2. Try http://127.0.0.1:5173 instead of localhost"
echo "   3. Check for any firewall/security software blocking the connection"