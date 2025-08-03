#!/bin/bash
# Backend Setup Script for SignSpeak AI

set -e

echo "📦 Setting up SignSpeak AI Backend..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
else
    echo "Virtual environment already exists"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install core requirements
echo "Installing core dependencies..."
pip install -r requirements.txt

# Install additional audio dependencies based on OS
echo "Installing audio dependencies..."
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    pip install pyaudio || {
        echo -e "${YELLOW}Note: pyaudio installation failed. You may need to install portaudio:${NC}"
        echo "sudo apt-get install portaudio19-dev python3-pyaudio"
    }
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    pip install pyaudio || {
        echo -e "${YELLOW}Note: pyaudio installation failed. You may need to install portaudio:${NC}"
        echo "brew install portaudio"
        echo "pip install pyaudio"
    }
fi

# Install speech recognition and TTS libraries
echo "Installing speech and TTS libraries..."
cat >> requirements-audio.txt << EOL
SpeechRecognition==3.10.0
pyttsx3==2.90
gTTS==2.3.2
pydub==0.25.1
soundfile==0.12.1
librosa==0.10.1
webrtcvad==2.0.10
EOL

pip install -r requirements-audio.txt

# Install Cerebras SDK
echo "Installing Cerebras SDK..."
pip install cerebras-cloud-sdk

# Create app directory structure
echo "Creating backend directory structure..."
mkdir -p app/{api,services,models,utils,config}
mkdir -p static/{models,mock_data}
mkdir -p tests

# Create __init__.py files
touch app/__init__.py
touch app/api/__init__.py
touch app/services/__init__.py
touch app/models/__init__.py
touch app/utils/__init__.py
touch app/config/__init__.py

# Update main.py to use app structure
if [ ! -f "app/main.py" ]; then
    echo "Moving main.py to app directory..."
    mv main.py app/main.py 2>/dev/null || echo "main.py will be created in app/"
fi

# Create configuration file
cat > app/config/settings.py << EOL
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # API Keys
    CEREBRAS_API_KEY = os.getenv("CEREBRAS_API_KEY", "")
    
    # Server Configuration
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 8000))
    RELOAD = os.getenv("RELOAD", "true").lower() == "true"
    
    # CORS Settings
    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8000"
    ]
    
    # WebSocket Settings
    WS_HEARTBEAT_INTERVAL = int(os.getenv("WS_HEARTBEAT_INTERVAL", 30))
    WS_MAX_CONNECTIONS = int(os.getenv("WS_MAX_CONNECTIONS", 100))
    
    # Audio Settings
    AUDIO_SAMPLE_RATE = int(os.getenv("AUDIO_SAMPLE_RATE", 16000))
    AUDIO_CHANNELS = int(os.getenv("AUDIO_CHANNELS", 1))
    
    # Video Settings
    VIDEO_WIDTH = int(os.getenv("VIDEO_WIDTH", 640))
    VIDEO_HEIGHT = int(os.getenv("VIDEO_HEIGHT", 480))
    VIDEO_FPS = int(os.getenv("VIDEO_FPS", 30))
    
    # Feature Flags
    ENABLE_MOCK_MODE = os.getenv("ENABLE_MOCK_MODE", "false").lower() == "true"
    ENABLE_PERFORMANCE_LOGGING = os.getenv("ENABLE_PERFORMANCE_LOGGING", "true").lower() == "true"

settings = Settings()
EOL

# Create development utilities
cat > app/utils/logger.py << EOL
import logging
import sys
from datetime import datetime

def setup_logger(name: str) -> logging.Logger:
    """Set up a logger with consistent formatting"""
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    # Console handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.INFO)
    
    # Formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler.setFormatter(formatter)
    
    logger.addHandler(handler)
    return logger
EOL

# Create mock data for testing
cat > static/mock_data/demo_responses.json << EOL
{
  "gestures": {
    "hello": {
      "translation": "Hello! Nice to meet you!",
      "confidence": 0.95,
      "emoji": "👋",
      "animation": "wave"
    },
    "thank_you": {
      "translation": "Thank you very much!",
      "confidence": 0.92,
      "emoji": "🙏",
      "animation": "thank-you"
    },
    "yes": {
      "translation": "Yes, I agree",
      "confidence": 0.98,
      "emoji": "✅",
      "animation": "nod"
    },
    "no": {
      "translation": "No, I don't think so",
      "confidence": 0.96,
      "emoji": "❌",
      "animation": "shake"
    },
    "help": {
      "translation": "Can you help me?",
      "confidence": 0.90,
      "emoji": "🆘",
      "animation": "help"
    }
  },
  "speech_to_sign": {
    "hello": ["HELLO", "WAVE"],
    "thank you": ["THANK", "YOU"],
    "how are you": ["HOW", "YOU", "QUESTION"],
    "goodbye": ["GOODBYE", "WAVE"],
    "please": ["PLEASE", "CIRCLE"]
  }
}
EOL

# Create test script
cat > test-backend.sh << 'EOL'
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
EOL

chmod +x test-backend.sh

# Create a sample test file
cat > tests/test_health.py << EOL
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_root():
    response = client.get("/")
    assert response.status_code == 200
EOL

# Install test dependencies
pip install pytest pytest-asyncio httpx

echo -e "\n${GREEN}✅ Backend setup complete!${NC}"
echo "Virtual environment created and activated"
echo "All dependencies installed"
echo "Directory structure created"
echo -e "\nRun ${YELLOW}source venv/bin/activate${NC} to activate the virtual environment"