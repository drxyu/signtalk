#!/bin/bash

echo "🚀 Starting SignSpeak AI Development Environment"
echo "============================================="

# Function to cleanup on exit
cleanup() {
    echo -e "\n🛑 Shutting down services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup EXIT INT TERM

# Start backend
echo "📦 Starting Backend Server..."
cd backend
source venv/bin/activate 2>/dev/null || . venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 3

# Check if backend is running
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend is running at http://localhost:8000"
else
    echo "❌ Backend failed to start"
    exit 1
fi

# Start frontend
echo -e "\n📦 Starting Frontend Server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 5

echo -e "\n✨ SignSpeak AI is ready!"
echo "============================================="
echo "🔗 Frontend: http://localhost:5173"
echo "🔗 Backend API: http://localhost:8000"
echo "🔗 API Docs: http://localhost:8000/docs"
echo "============================================="
echo -e "\n📱 The app is optimized for:"
echo "   • iPhone 13 Pro Max and later"
echo "   • Modern web browsers with camera/mic access"
echo "============================================="
echo -e "\nPress Ctrl+C to stop all services"

# Keep script running
wait