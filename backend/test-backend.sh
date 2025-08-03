#!/bin/bash
# Backend testing script

source venv/bin/activate

echo "🧪 Running backend tests..."

# Check if server starts
echo "Testing server startup..."
timeout 10s uvicorn app.main:app --host 0.0.0.0 --port 8001 &
SERVER_PID=$!
sleep 5

# Test health endpoint
echo "Testing health endpoint..."
curl -s http://localhost:8001/health | grep -q "healthy" && echo "✅ Health check passed" || echo "❌ Health check failed"

# Kill test server
kill $SERVER_PID 2>/dev/null

# Run Python tests if they exist
if [ -d "tests" ] && [ -n "$(find tests -name '*.py' 2>/dev/null)" ]; then
    echo "Running Python tests..."
    python -m pytest tests/
fi

echo "✅ Backend tests complete"
